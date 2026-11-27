const test = require('node:test');
const assert = require('node:assert');
const { readSite } = require('./helpers');
const { submitRequest, MAX, planFor, applyPlan, FIELDS } = require('../public/js/main.js');

const html = readSite('index.html');
const good = (over = {}) => {
  const fd = new FormData();
  const base = { name: 'Ana', venue: 'Club', email: 'a@b.co', phone: '555', venue_type: 'Nightclub', capacity: '500-and-under', plan: 'hosted', website: '' };
  for (const [k, v] of Object.entries({ ...base, ...over })) fd.set(k, v);
  return fd;
};
const tag = (name) => (html.match(new RegExp(`<(?:input|select)[^>]*name="${name}"[^>]*>`)) || [''])[0];

test('form posts without JavaScript', () => {
  const form = html.match(/<form id="request-form"[^>]*>/)[0];
  assert.match(form, /method="post"/); assert.match(form, /action="https:\/\//);
  for (const name of ['name', 'venue', 'email', 'venue_type', 'capacity']) assert.match(tag(name), /required/, name);
  assert.match(tag('plan'), /type="hidden"/); assert.match(tag('plan'), /value="hosted"/);
  assert.doesNotMatch(tag('phone'), /required/, 'phone only required for Dedicated');
  for (const old of ['role', 'events_per_month', 'current_ticketing']) assert.strictEqual(tag(old), '', old);
});

test('venue types', () => {
  const sel = html.match(/<select[^>]*name="venue_type"[\s\S]*?<\/select>/)[0];
  for (const v of ['Nightclub', 'Concert venue', 'Lounge or bar', 'Comedy club', 'Festival', 'School or league sports', 'Other']) assert.ok(sel.includes(`>${v}<`), v);
});

test('planFor maps capacity to a plan', () => {
  assert.strictEqual(planFor('500-and-under'), 'hosted');
  assert.strictEqual(planFor('over-500'), 'dedicated');
  assert.strictEqual(planFor('nonsense'), 'hosted');
});

test('applyPlan toggles back and forth', () => {
  const button = { textContent: '' }, phone = { required: false }, plan = { value: '' };
  const form = { dataset: {}, querySelector: (s) => ({ 'button[type="submit"]': button, '[name="phone"]': phone, '[name="plan"]': plan })[s] };
  applyPlan(form, 'dedicated');
  assert.strictEqual(button.textContent, 'Request Dedicated'); assert.strictEqual(phone.required, true); assert.strictEqual(plan.value, 'dedicated');
  applyPlan(form, 'hosted');
  assert.strictEqual(button.textContent, 'Get your account'); assert.strictEqual(phone.required, false); assert.strictEqual(plan.value, 'hosted');
});

test('sends the plan and venue type fields', async () => {
  assert.deepStrictEqual(FIELDS, ['name', 'venue', 'email', 'phone', 'venue_type', 'capacity', 'plan']);
  let sent;
  await submitRequest(good({ capacity: 'over-500', plan: 'dedicated' }), async (_u, o) => { sent = new URLSearchParams(o.body); return { ok: true }; }, 'https://x');
  assert.strictEqual(sent.get('plan'), 'dedicated'); assert.strictEqual(sent.get('venue_type'), 'Nightclub');
});

test('success copy per plan, no time promise for Hosted', () => {
  const js = readSite('js/main.js');
  assert.ok(js.includes("You're in. Check your email for your sign-in link."));
  assert.ok(js.includes("Thanks. We'll call you within the next business day."));
  assert.doesNotMatch(js, /24 hours|one business day\./);
});

test('thanks page covers both plans', () => {
  const t = readSite('thanks.html');
  assert.ok(t.includes("You're in. Check your email for your sign-in link."));
  assert.ok(t.includes("Thanks. We'll call you within the next business day."));
  assert.match(t, /src="\/js\/thanks\.js"/);
  assert.doesNotMatch(t, /Request access|#request"/);
  const js = readSite('js/thanks.js');
  assert.match(js, /plan/);
});

test('honeypot is dropped and nothing is sent', async () => {
  let calls = 0;
  const r = await submitRequest(good({ website: 'http://spam' }), async () => { calls++; return { ok: true }; }, 'https://x');
  assert.deepStrictEqual(r, { ok: true }); assert.strictEqual(calls, 0);
});

test('trims and caps values at 200', async () => {
  let sent;
  await submitRequest(good({ venue: '  ' + 'é'.repeat(300) + '  ', name: '  Zoë 🎉  ' }), async (_u, o) => { sent = new URLSearchParams(o.body); return { ok: true }; }, 'https://x');
  assert.strictEqual(sent.get('venue').length, MAX);
  assert.strictEqual(sent.get('name'), 'Zoë 🎉');
});

test('a down webhook returns ok:false and does not throw', async () => {
  assert.deepStrictEqual(await submitRequest(good(), async () => { throw new Error('offline'); }, 'https://x'), { ok: false });
  assert.deepStrictEqual(await submitRequest(good(), async () => ({ ok: false, status: 500 }), 'https://x'), { ok: false });
});

test('the page shows the email and phone when sending fails', () => {
  const js = readSite('js/main.js');
  assert.ok(js.includes('gabriel@getrevenuecopilot.com') && js.includes('775-313-0714'));
});
