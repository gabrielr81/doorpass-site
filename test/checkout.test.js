const test = require('node:test');
const assert = require('node:assert');
const { readSite, read } = require('./helpers');
const { startCheckout, HOSTED_ENDPOINT } = require('../public/js/main.js');

const fd = (over = {}) => {
  const f = new FormData();
  const base = { name: 'Ana', venue: 'Club', email: 'a@b.co', phone: '', venue_type: 'Nightclub', capacity: '500-and-under', plan: 'hosted', website: '' };
  for (const [k, v] of Object.entries({ ...base, ...over })) f.set(k, v);
  return f;
};
const reply = (status, body) => async () => ({ ok: status < 400, status, json: async () => body });

test('Hosted goes to the n8n checkout webhook and asks for JSON', async () => {
  assert.strictEqual(HOSTED_ENDPOINT, 'https://n8n-k7si.srv2090917.hstgr.cloud/webhook/doorpass-hosted-checkout');
  let url, opts;
  const r = await startCheckout(fd(), async (u, o) => { url = u; opts = o; return { ok: true, status: 200, json: async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_test_1' }) }; });
  assert.strictEqual(url, HOSTED_ENDPOINT);
  assert.strictEqual(opts.headers.Accept, 'application/json');
  const sent = new URLSearchParams(opts.body);
  assert.strictEqual(sent.get('plan'), 'hosted'); assert.strictEqual(sent.get('source'), 'doorpass.vip'); assert.strictEqual(sent.get('website'), null);
  assert.deepStrictEqual(r, { ok: true, url: 'https://checkout.stripe.com/c/pay/cs_test_1' });
});

test('only a Stripe Checkout address is followed', async () => {
  assert.strictEqual((await startCheckout(fd(), reply(200, { url: 'https://evil.example/pay' }))).ok, false);
  assert.strictEqual((await startCheckout(fd(), reply(200, {}))).ok, false);
});

test('the webhook\'s own message is shown (for example, over 500 capacity)', async () => {
  const r = await startCheckout(fd(), reply(400, { error: 'Over 500 capacity is Dedicated.' }));
  assert.deepStrictEqual(r, { ok: false, error: 'Over 500 capacity is Dedicated.' });
});

test('network failure and honeypot never throw', async () => {
  assert.deepStrictEqual(await startCheckout(fd(), async () => { throw new Error('down'); }), { ok: false });
  let calls = 0;
  assert.deepStrictEqual(await startCheckout(fd({ website: 'x' }), async () => { calls++; }), { ok: true, url: '/thanks.html' });
  assert.strictEqual(calls, 0);
});

test('welcome page after payment', () => {
  const w = readSite('welcome.html');
  assert.ok(w.includes("You're in. Check your email for your sign-in link."));
  assert.ok(w.includes('Payment received. Your sign-in link arrives by email in about 2 minutes.'));
  assert.match(w, /<meta name="robots" content="noindex">/);
  assert.match(w, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.doesNotMatch(w, /<script(?![^>]*src=)|style="/, 'no inline script or style (CSP)');
  assert.match(w, /href="\/billing"/);
  assert.ok(!readSite('sitemap.xml').includes('welcome'));
});

test('/billing goes to the Stripe customer portal login', () => {
  assert.match(read('nginx.conf'), /location ~\* \^\/billing\/\?\$ \{ return 302 https:\/\/billing\.stripe\.com\/p\/login\/[A-Za-z0-9_]+; \}/);
});

test('without JavaScript a Hosted request is not told it is signed up', () => {
  const t = readSite('thanks.html');
  assert.ok(!t.includes("You're in."), 'no "You\'re in" before payment');
  assert.ok(t.includes("We'll email you a link to pay and finish your sign-up."));
});
