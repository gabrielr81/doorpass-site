const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { readSite, root } = require('./helpers');

test('viewport meta present on every page', () => {
  for (const f of ['index.html', 'terms.html', 'privacy.html', 'thanks.html']) assert.match(readSite(f), /<meta name="viewport" content="width=device-width, initial-scale=1">/, f);
});

test('fonts are self-hosted and no third-party scripts or styles load', () => {
  const all = ['index.html', 'terms.html', 'privacy.html', 'thanks.html', 'css/styles.css'].map(readSite).join('\n');
  assert.ok(!/fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.|unpkg|jsdelivr/i.test(all));
  for (const f of ['poppins-400.woff2', 'poppins-700.woff2']) assert.ok(fs.existsSync(path.join(root, 'public/assets/fonts', f)));
});

test('no fixed pixel widths above 1200 outside media queries', () => {
  const css = readSite('css/styles.css');
  for (const m of css.matchAll(/(?<![-\w])(?:width|min-width)\s*:\s*(\d+)px/g)) assert.ok(Number(m[1]) <= 1200, m[0]);
});

test('reduced motion is respected', () => assert.match(readSite('css/styles.css'), /prefers-reduced-motion: reduce/));

test('every in-page link has a target', () => {
  const html = readSite('index.html');
  for (const m of html.matchAll(/href="#([a-z-]+)"/g)) assert.ok(html.includes(`id="${m[1]}"`), `#${m[1]}`);
});

test('every local asset referenced by index.html exists', () => {
  const html = readSite('index.html');
  for (const m of html.matchAll(/(?:src|href)="(\/[^"#?]+)"/g)) {
    if (m[1] === '/') continue;
    assert.ok(fs.existsSync(path.join(root, 'public', m[1])), m[1]);
  }
});

test('hero images are versioned: /assets is cached for a year, so a changed image needs a new file name', () => {
  const html = readSite('index.html');
  for (const m of html.matchAll(/\/assets\/hero\/(front[^" ]*?)\.webp/g)) assert.match(m[1], /-v\d+$/, `${m[1]} should carry a -vN suffix`);
});
