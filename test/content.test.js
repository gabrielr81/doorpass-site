const test = require('node:test');
const assert = require('node:assert');
const { readSite } = require('./helpers');

const html = readSite('index.html');
const DATA_SENTENCE = "Your data stays yours: your own isolated copy, we don't sell or share it, you can export or send it to your CRM any time, and we delete it when you leave.";

test('has all v2 sections', () => {
  for (const id of ['hero', 'proof', 'cost', 'control', 'built-for', 'how', 'pricing', 'faq', 'signup']) {
    assert.strictEqual((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, `#${id}`);
  }
  for (const old of ['features', 'offers', 'data', 'product', 'request']) assert.ok(!html.includes(`id="${old}"`), `old #${old} removed`);
  assert.strictEqual((html.match(/id="request-form"/g) || []).length, 1);
});

test('contact details present', () => {
  assert.ok(html.includes('gabriel@getrevenuecopilot.com'));
  assert.ok(html.includes('775-313-0714'));
});

test('never claims DoorPass processes payments or takes a cut', () => {
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
  assert.ok(!/we (process|handle|hold) (your )?(payments|money)/i.test(text));
  for (const m of text.matchAll(/per[- ]ticket fees?/gi)) assert.match(text.slice(Math.max(0, m.index - 40), m.index), /\bno\s*$/i, 'per-ticket fee only ever appears as "No per-ticket fees"');
  assert.ok(text.includes('Connect your own Stripe'));
  assert.ok(text.includes('No per-ticket fees'));
});

test('data wording is exact and never says "never hold"', () => {
  assert.ok(html.includes(DATA_SENTENCE.replace(/'/g, "'")));
  assert.ok(!/never hold/i.test(html));
});

test('real prices, no mock marker', () => {
  assert.ok(!html.includes('MOCK PRICES'));
  assert.ok(!html.includes('$29'));
  for (const p of ['$99', '$499', '$1,500', '$199']) assert.ok(html.includes(p), p);
});

test('plan limits are stated in pricing', () => {
  const pricing = html.slice(html.indexOf('id="pricing"'), html.indexOf('id="faq"'));
  assert.ok(pricing.includes('500'), '500 capacity');
  assert.ok(/10 events/.test(pricing), '10 events a month');
  assert.ok(/next business day/.test(pricing), 'Dedicated call promise');
});

test('built for small sports, schools and fundraisers', () => {
  const s = html.slice(html.indexOf('id="built-for"'), html.indexOf('id="how"'));
  for (const w of ['school', 'league', 'fundraiser']) assert.ok(new RegExp(w, 'i').test(s), w);
});

test('demo link', () => assert.ok(html.includes('href="https://demo.doorpass.vip"')));

test('one h1 and every image has alt text', () => {
  assert.strictEqual((html.match(/<h1[\s>]/g) || []).length, 1);
  for (const m of html.matchAll(/<img\b[^>]*>/g)) assert.match(m[0], /alt="[^"]+"/);
});

test('terms and privacy exist, are marked draft, privacy has the data sentence', () => {
  const terms = readSite('terms.html'); const privacy = readSite('privacy.html');
  assert.match(terms, /Draft, pending attorney review/);
  assert.match(privacy, /Draft, pending attorney review/);
  assert.ok(privacy.includes('Your data stays yours: your own isolated copy'));
  assert.ok(html.includes('href="/terms.html"') && html.includes('href="/privacy.html"'));
});

test('hero sound is opt-in: a toggle that starts off, no autoplaying media', () => {
  assert.match(html, /<button class="sound-toggle" id="hero-sound" type="button" aria-pressed="false">/);
  assert.ok(!/<(audio|video)\b[^>]*autoplay/i.test(html));
  assert.ok(html.includes('<script src="/js/hero-sound.js" defer></script>'));
});

test('six venues, including a school or league game', () => {
  const { readSite } = require('./helpers');
  const page = readSite('index.html');
  assert.match(readSite('js/hero-venues.js'), /venues-v2\.html/);
  assert.match(readSite('js/hero-venues.js'), /venues-v2\.css/);
  assert.match(page, /<span class="vs" data-venue="gameday">GAME DAY<\/span>/);
  assert.match(page, /alt="[^"]*(school|league) game[^"]*"/);
  const bundle = readSite('assets/hero/venues-v2.html');
  for (const v of ['live', 'lounge', 'comedy', 'festival', 'gameday']) assert.match(bundle, new RegExp(`data-venue="${v}"`), v);
});
