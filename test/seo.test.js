const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { readSite } = require('./helpers');

const html = readSite('index.html');
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"');

test('structured data parses and the FAQ schema matches the visible FAQ word for word', () => {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(m, 'JSON-LD block present');
  const graph = JSON.parse(m[1])['@graph'];
  for (const t of ['Organization', 'WebSite', 'SoftwareApplication', 'FAQPage']) assert.ok(graph.some((n) => n['@type'] === t), t);
  const faq = graph.find((n) => n['@type'] === 'FAQPage').mainEntity;
  const visible = [...html.matchAll(/<details><summary>(.*?)<\/summary><p>(.*?)<\/p><\/details>/g)];
  assert.strictEqual(faq.length, visible.length);
  visible.forEach(([, q, a], i) => { assert.strictEqual(faq[i].name, strip(q)); assert.strictEqual(faq[i].acceptedAnswer.text, strip(a)); });
});

test('search and social tags present', () => {
  for (const re of [/<title>[^<]{30,65}<\/title>/, /<meta name="description" content="[^"]{70,165}">/, /<link rel="canonical" href="https:\/\/doorpass\.vip\/">/, /og:image" content="https:\/\/doorpass\.vip\/assets\/og-image\.jpg"/, /twitter:card" content="summary_large_image"/]) assert.match(html, re);
  assert.ok(fs.existsSync(path.join(__dirname, '../public/assets/og-image.jpg')));
  assert.ok(fs.existsSync(path.join(__dirname, '../public/assets/logo-512.png')));
});

test('robots, sitemap and llms.txt are ready for search engines and AI assistants', () => {
  const robots = readSite('robots.txt');
  assert.match(robots, /Sitemap: https:\/\/doorpass\.vip\/sitemap\.xml/);
  for (const bot of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Bingbot']) assert.ok(robots.includes(`User-agent: ${bot}`), bot);
  assert.ok(!/Disallow: \/\s*$/m.test(robots), 'nothing blocks the whole site');
  assert.ok(!readSite('sitemap.xml').includes('thanks'));
  assert.match(readSite('llms.txt'), /^# DoorPass/);
});

const HUBBED = ['tixr-alternative', 'shotgun-alternative', 'etix-alternative', 'ticketleap-alternative', 'simpletix-alternative', 'luma-alternative', 'axs-alternative', 'showclix-alternative'];
const PAGES = ['small-venue-ticketing', 'ticketmaster-alternative', 'eventbrite-alternative', 'posh-alternative', 'dice-alternative', 'ticket-tailor-alternative', 'universe-alternative', 'ticketing-alternatives', ...HUBBED, 'how-to-check-in-members-with-photos', 'how-to-sell-group-tickets-and-tables', 'how-to-redeem-drink-perks-at-the-bar', 'how-to-print-name-badges-for-guests', 'how-to-create-promo-and-comp-codes', 'how-to-run-a-ticket-waitlist', 'how-to-add-ticketing-to-your-website', 'nightclub-ticketing-software', 'ticketing-for-member-clubs', 'ticketing-for-event-promoters', 'ticketing-for-bars-with-live-music', 'how-to-check-in-guests-with-qr-codes', 'how-to-run-a-door-list-offline', 'how-to-stop-ticket-sharing-at-the-door'];
test('comparison pages are complete, linked and in the sitemap', () => {
  const sitemap = readSite('sitemap.xml');
  for (const p of PAGES) {
    const page = readSite(`${p}/index.html`);
    assert.match(page, new RegExp(`<link rel="canonical" href="https://doorpass\\.vip/${p}/">`), p);
    assert.match(page, /<meta name="viewport" content="width=device-width, initial-scale=1">/, p);
    assert.strictEqual((page.match(/<h1[\s>]/g) || []).length, 1, `${p} has one h1`);
    assert.match(page, /<title>[^<]{30,70}<\/title>/, p);
    assert.match(page, /<meta name="description" content="[^"]{70,165}">/, p);
    const graph = JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
    const faq = graph.find((n) => n['@type'] === 'FAQPage').mainEntity;
    const visible = [...page.matchAll(/<details><summary>(.*?)<\/summary><p>(.*?)<\/p><\/details>/g)];
    assert.strictEqual(faq.length, visible.length, `${p} FAQ schema matches`);
    visible.forEach(([, q, a], i) => { assert.strictEqual(faq[i].name, strip(q)); assert.strictEqual(faq[i].acceptedAnswer.text, strip(a)); });
    for (const m of page.matchAll(/card payments?/gi)) assert.ok(page.slice(m.index - 120, m.index + 120).toLowerCase().includes('coming soon'), `${p}: payment claim without "coming soon"`);
    assert.ok(sitemap.includes(`https://doorpass.vip/${p}/`), `${p} in sitemap`);
    assert.ok((HUBBED.includes(p) ? readSite('ticketing-alternatives/index.html') : html).includes(`href="/${p}/"`), `${p} linked from the home page or the hub`);
  }
});
