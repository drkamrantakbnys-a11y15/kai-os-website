import test from 'node:test';
import assert from 'node:assert/strict';
import {relay, onRequest, LOOPBACK} from '../functions/oauth/linkedin/callback.js';

const BASE = 'https://projectkai.dev/oauth/linkedin/callback';
const CODE = 'AQTQmah11lalyH65DAIivsjsAQV5P-1VTVVebnLl_SCiyMXo';
const STATE = 'Zk3n0q_1-abcDEFghiJKLmnoPQRstuVWXyz0123456789';

test('valid code+state is relayed only to the fixed loopback listener', () => {
  const res = relay(`${BASE}?code=${CODE}&state=${STATE}`);
  assert.equal(res.status, 302);
  const loc = new URL(res.headers.get('Location'));
  assert.equal(`${loc.origin}${loc.pathname}`, LOOPBACK);
  assert.equal(loc.hostname, '127.0.0.1');
  assert.equal(loc.searchParams.get('code'), CODE);
  assert.equal(loc.searchParams.get('state'), STATE);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.equal(res.headers.get('Referrer-Policy'), 'no-referrer');
});

test('provider error with state is relayed without a code', () => {
  const res = relay(`${BASE}?error=user_cancelled_authorize&error_description=The+user+cancelled&state=${STATE}`);
  assert.equal(res.status, 302);
  const loc = new URL(res.headers.get('Location'));
  assert.equal(loc.searchParams.get('error'), 'user_cancelled_authorize');
  assert.equal(loc.searchParams.has('code'), false);
});

test('malformed, duplicated, unknown or oversize parameters are rejected and never echoed', async () => {
  const bad = [
    `${BASE}`, `${BASE}?code=${CODE}`, `${BASE}?state=${STATE}`,
    `${BASE}?code=${CODE}&error=access_denied&state=${STATE}`,
    `${BASE}?code=${CODE}&code=${CODE}&state=${STATE}`,
    `${BASE}?code=${CODE}&state=${STATE}&redirect=https://evil.example`,
    `${BASE}?code=${'a'.repeat(2049)}&state=${STATE}`,
    `${BASE}?code=bad%20code&state=${STATE}`,
    `${BASE}?code=${CODE}&state=bad<script>`,
    `${BASE}?code=&state=${STATE}`,
  ];
  for (const url of bad) {
    const res = relay(url);
    assert.ok(res.status >= 400, url);
    assert.equal(res.headers.get('Location'), null, url);
    const body = await res.text();
    assert.ok(!body.includes(CODE) && !body.includes(STATE) && !body.includes('evil'), url);
  }
});

test('non-GET methods are refused', () => {
  const res = onRequest({request: new Request(`${BASE}?code=${CODE}&state=${STATE}`, {method: 'POST'})});
  assert.equal(res.status, 405);
});
