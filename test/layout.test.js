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
  for (const m of html.matchAll(/\/assets\/hero\/((?:front|back)[^" ]*?)\.webp/g)) assert.match(m[1], /-v\d+$/, `${m[1]} should carry a -vN suffix`);
});

test('every page uses the shared header and footer', () => {
  const pub = path.join(root, 'public');
  const pages = fs.readdirSync(pub, { recursive: true }).map(String).filter((f) => f.endsWith('.html') && !f.startsWith('assets/') && !f.startsWith('partials/'));
  assert.strictEqual(pages.length, 43);
  for (const f of pages) {
    const raw = fs.readFileSync(path.join(pub, f), 'utf8');
    assert.match(raw, /<!--#include virtual="\/partials\/header.html" -->/, f);
    assert.match(raw, /<!--#include virtual="\/partials\/footer.html" -->/, f);
    assert.doesNotMatch(raw, /<header class="site-header">/, f);
  }
  const header = fs.readFileSync(path.join(pub, 'partials/header.html'), 'utf8');
  assert.match(header, /href="\/#control">Features<\/a>/);
  assert.match(header, /href="\/#built-for">Who it's for<\/a>/);
  assert.match(header, /href="\/#pricing">Pricing<\/a>/);
  assert.match(header, /href="\/#faq">FAQ<\/a>/);
  assert.match(header, /href="\/#signup">Get started<\/a>/);
  const footer = fs.readFileSync(path.join(pub, 'partials/footer.html'), 'utf8');
  assert.match(footer, /aria-label="Brand and contact"/);
  for (const label of ['Product', "Who it's for", 'Guides', 'Compare']) assert.match(footer, new RegExp(`<h2[^>]*>${label}</h2>`), label);
  assert.strictEqual((footer.match(/<nav\b/g) || []).length, 6);
  assert.match(footer, /© 2026 DoorPass/);
  assert.match(footer, /class="foot-bottom"/);
  const home = readSite('index.html');
  assert.match(home, /href="\/#signup">Get started<\/a>/);
  assert.match(home, /href="\/terms.html"/);
  assert.match(home, /href="\/privacy.html"/);
});

test('chrome links are not underlined and body links keep a faint one', () => {
  const css = readSite('css/styles.css');
  assert.match(css, /(?:^|\n)a \{[^}]*text-decoration:\s*none/);
  assert.match(css, /a:hover,\s*a:focus-visible \{[^}]*color:\s*var\(--orange\)/);
  assert.doesNotMatch(css, /\.nav a:not\(\.btn\):hover\s*\{[^}]*underline/);
  assert.doesNotMatch(css, /\.card h3 a:hover\s*\{[^}]*underline/);
  assert.match(css, /text-decoration-color:\s*rgb\(255 255 255 \/ \.3\)/);
  assert.match(css, /text-decoration-color:\s*rgb\(255 255 255 \/ \.85\)/);
  assert.match(css, /\.site-footer a:hover,\s*\.site-footer a:focus-visible \{[^}]*color:\s*var\(--white\)/);
  assert.match(css, /min-height:\s*28px/);
  assert.match(css, /@media \(min-width: 48rem\) \{ \.foot \{ grid-template-columns: repeat\(4, 1fr\); \} \}/);
  assert.match(css, /@media \(min-width: 66rem\) \{ \.foot \{ grid-template-columns: minmax\(14rem, 1\.35fr\) repeat\(4, 1fr\); \}/);
});

test('hero is capped and centered on wide screens', () => {
  const css = require('./helpers').readSite('css/styles.css');
  const rules = [...css.matchAll(/\.hero-art\s*\{([^}]*)\}/g)].map((m) => m[1]).join(';');
  assert.match(rules, /max-width:\s*(1440px|90rem)/);
  assert.match(rules, /margin-inline:\s*auto/);
  assert.doesNotMatch(css, /object-position:\s*right/);
});
