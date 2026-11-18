const test = require('node:test');
const assert = require('node:assert');
const { read } = require('./helpers');

test('security headers file has the required headers', () => {
  const h = read('security-headers.conf');
  for (const name of ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy']) assert.ok(h.includes(name), name);
  assert.match(h, /form-action 'self' https:\/\/n8n[.-]/);
});

test('every nginx location that sets headers also includes the security headers', () => {
  const conf = read('nginx.conf');
  for (const [, body] of conf.matchAll(/location[^{]*\{([^}]*)\}/g)) {
    if (/add_header/.test(body)) assert.match(body, /include \/etc\/nginx\/security-headers\.conf/);
  }
});

test('/go redirects to the home page (the logo QR opens it)', () => assert.match(read('nginx.conf'), /location = \/go \{ return 302 \/; \}/));

test('compose serves the apex domain and redirects www', () => {
  const c = read('docker-compose.yml');
  assert.match(c, /Host\(`doorpass\.vip`\)/); assert.match(c, /www\.doorpass\.vip/);
});

// Run before deploying: node --test --test-name-pattern "ready to deploy" test/
test('ready to deploy: no placeholder webhook host left', { skip: process.env.PRE_DEPLOY ? false : 'set PRE_DEPLOY=1 before deploying' }, () => {
  for (const f of ['public/index.html', 'security-headers.conf']) assert.ok(!/REPLACE-ME/.test(read(f)), `${f} still has the placeholder webhook host`);
});
