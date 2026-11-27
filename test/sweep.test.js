const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { root } = require('./helpers');

const pub = path.join(root, 'public');
const files = fs.readdirSync(pub, { recursive: true }).filter((f) => f.endsWith('.html')).concat('llms.txt');

test('no stale launch wording anywhere on the site', () => {
  const STALE = [/under 1,000/i, /500 to 1,000/, /free pilot/i, /24 hours/i, /within a day/i, /MOCK PRICES/, /test-mode checkout/i, /\$29/];
  for (const f of files) {
    const t = fs.readFileSync(path.join(pub, f), 'utf8');
    for (const re of STALE) assert.ok(!re.test(t), `${f}: ${re}`);
    for (const m of t.matchAll(/coming soon/gi)) {
      const near = t.slice(Math.max(0, m.index - 80), m.index + 80);
      assert.ok(!/payment|stripe/i.test(near), `${f}: payments "coming soon"`);
    }
  }
});
