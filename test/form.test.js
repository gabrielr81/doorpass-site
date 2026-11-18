const test = require('node:test');
const assert = require('node:assert');
const { readSite } = require('./helpers');
const { submitRequest, MAX } = require('../public/js/main.js');

const html = readSite('index.html');
const good = (over = {}) => {
  const fd = new FormData();
  const base = { name: 'Ana', venue: 'Club', role: 'Owner', capacity: 'Under 500', events_per_month: '4', current_ticketing: 'Eventbrite', email: 'a@b.co', phone: '555', website: '' };
  for (const [k, v] of Object.entries({ ...base, ...over })) fd.set(k, v);
  return fd;
};

test('form posts without JavaScript', () => {
  const form = html.match(/<form id="request-form"[^>]*>/)[0];
  assert.match(form, /method="post"/); assert.match(form, /action="https:\/\//);
  for (const name of ['name', 'venue', 'role', 'capacity', 'events_per_month', 'current_ticketing', 'email', 'phone']) {
    const tag = html.match(new RegExp(`<(?:input|select)[^>]*name="${name}"[^>]*>`))[0];
    assert.match(tag, /required/, name);
  }
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
