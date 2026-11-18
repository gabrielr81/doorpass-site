const test = require('node:test');
const assert = require('node:assert');
const { readSite } = require('./helpers');

const css = readSite('css/styles.css');
// Brand colors and tints, plus the DoorPass scanner's own status colors (Admitted, Check ID, Denied) used on the hero phone
const ALLOWED = ['#F2553F', '#0A1128', '#FFFFFF', '#131C3A', '#1D2750', '#E9ECF4', '#5A6382', '#B9C0D8', '#16A34A', '#F59E0B', '#DC2626'];

test('site uses only brand colors and declared tints', () => {
  const found = [...new Set((css.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []).map((c) => c.toUpperCase()))];
  const bad = found.filter((c) => !ALLOWED.includes(c));
  assert.deepStrictEqual(bad, [], `colors outside the brand: ${bad}`);
});

test('no rounded corners except the logo', () => {
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  for (const [, selector, body] of rules) {
    for (const m of body.matchAll(/border-radius\s*:\s*([^;]+)/g)) {
      const value = m[1].trim();
      assert.ok(value === '0' || selector.includes('.logo'), `rounded corner "${value}" on ${selector.trim()}`);
    }
  }
});

test('orange text is never used on white', () => {
  // orange (#F2553F) on white is 3.4:1; it may only be a fill, border or marker, never a text color on white
  const textOrange = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, , body]) => /(^|;)\s*color\s*:\s*var\(--orange\)/.test(body));
  const allowed = ['.steps li::before', 'summary::after'];
  for (const [, selector] of textOrange) assert.ok(allowed.some((a) => selector.includes(a)), `orange text on ${selector.trim()}`);
});

test('logo files are the real DoorPass brand files', () => {
  for (const f of ['assets/logo.svg', 'assets/logo-dark.svg', 'assets/icon.svg']) {
    const svg = readSite(f);
    assert.match(svg, /f2553f/i, `${f} has the brand orange`);
  }
});
