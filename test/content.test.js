const test = require('node:test');
const assert = require('node:assert');
const { readSite } = require('./helpers');

const html = readSite('index.html');
const DATA_SENTENCE = "Your data stays yours: your own isolated copy, we don't sell, share or use it, you can export or send it to your CRM any time, and we delete it when you leave.";

test('has all sections', () => {
  for (const id of ['hero', 'how', 'features', 'offers', 'data', 'pricing', 'faq', 'request']) {
    assert.strictEqual((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, `#${id}`);
  }
  assert.strictEqual((html.match(/id="request-form"/g) || []).length, 1);
});

test('contact details present', () => {
  assert.ok(html.includes('gabriel@getrevenuecopilot.com'));
  assert.ok(html.includes('775-313-0714'));
});

test('no live-payment claims', () => {
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
  for (const phrase of [/accept (card )?payments?/i, /take (card )?payments?/i, /card payments?/i, /sell tickets online/i]) {
    for (const m of text.matchAll(new RegExp(phrase.source, 'gi'))) {
      const start = Math.max(0, m.index - 160);
      const near = text.slice(start, m.index + 200).toLowerCase();
      assert.ok(near.includes('coming soon') || near.includes('today'), `payment claim without "coming soon": ${m[0]}`);
    }
  }
});

test('data wording is exact and never says "never hold"', () => {
  assert.ok(html.includes(DATA_SENTENCE.replace(/'/g, "'")));
  assert.ok(!/never hold/i.test(html));
});

test('mock price marker and prices', () => {
  assert.ok(html.includes('MOCK PRICES'));
  for (const p of ['$99', '$29', '$499', '$1,500']) assert.ok(html.includes(p), p);
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
