import test from 'node:test';
import assert from 'node:assert/strict';
import {PK018_SALES, validatePaymentUrl, resolveSalesState} from '../src/config/pk018-sales.mjs';

const base = {...PK018_SALES, SALES_ENABLED: true, TAX_PRESENTATION_CONFIRMED: true};
const SAMPLE = 'https://rzp.io/rzp/SAMPLEONLY0';

test('committed configuration resolves to a coherent state for offer PK018-INR-199-V1 / ₹199', () => {
  assert.equal(PK018_SALES.OFFER_ID, 'PK018-INR-199-V1');
  assert.equal(PK018_SALES.PRICE_INR, 199);
  const state = resolveSalesState();
  if (PK018_SALES.SALES_ENABLED === true) assert.deepEqual(state, {mode: 'sales', paymentUrl: PK018_SALES.PAYMENT_URL});
  else assert.deepEqual(state, {mode: 'inquiry'});
});

test('sales off never exposes a payment URL, even if one is configured', () => {
  assert.deepEqual(resolveSalesState({...base, SALES_ENABLED: false, PAYMENT_URL: SAMPLE}), {mode: 'inquiry'});
});

test('valid Razorpay-hosted checkout URLs are accepted', () => {
  for (const url of [SAMPLE, 'https://rzp.io/l/AbC123', 'https://pages.razorpay.com/pk018-kit', 'https://pages.razorpay.com/pk018-kit/']) assert.ok(validatePaymentUrl(url).ok, url);
  assert.deepEqual(resolveSalesState({...base, PAYMENT_URL: SAMPLE}), {mode: 'sales', paymentUrl: SAMPLE});
});

test('unsafe or unapproved URLs are rejected', () => {
  for (const url of ['', '   ', 'http://rzp.io/rzp/AbC123', 'https://evil.example/rzp/AbC123', 'https://rzp.io.evil.example/rzp/AbC123',
    'https://user:pw@rzp.io/rzp/AbC123', 'https://rzp.io/rzp/AbC123?key=secret', 'https://rzp.io/rzp/AbC123#x', 'https://rzp.io:8443/rzp/AbC123',
    'https://projectkai.dev/api/pay?to=https://rzp.io/rzp/AbC123', 'https://razorpay.me/@projectkai', 'https://api.razorpay.com/v1/payment_links',
    'https://rzp.io/', 'https://rzp.io/rzp/../../x', 'javascript:alert(1)', ' https://rzp.io/rzp/AbC123', 'https://pages.razorpay.com/a/b/c', null, undefined, 42]) {
    assert.equal(validatePaymentUrl(url).ok, false, String(url));
  }
});

test('sales on fails closed without a valid URL, without GST confirmation, or with a wrong offer', () => {
  assert.throws(() => resolveSalesState({...base, PAYMENT_URL: ''}), /FAILED CLOSED: payment URL is empty/);
  assert.throws(() => resolveSalesState({...base, PAYMENT_URL: 'https://evil.example/rzp/AbC123'}), /FAILED CLOSED/);
  assert.throws(() => resolveSalesState({...base, PAYMENT_URL: SAMPLE, TAX_PRESENTATION_CONFIRMED: false}), /GST\/tax presentation not confirmed/);
  assert.throws(() => resolveSalesState({...base, PAYMENT_URL: SAMPLE, PRICE_INR: 99}), /offer\/price/);
});

test('malformed configuration fails closed', () => {
  assert.throws(() => resolveSalesState({SALES_ENABLED: true}), /FAILED CLOSED/);
  assert.throws(() => resolveSalesState({SALES_ENABLED: true, TAX_PRESENTATION_CONFIRMED: true, PAYMENT_URL: 42, OFFER_ID: 'PK018-INR-199-V1', PRICE_INR: 199}), /FAILED CLOSED/);
  assert.throws(() => resolveSalesState({...base, PAYMENT_URL: SAMPLE, OFFER_ID: undefined}), /offer\/price/);
  assert.throws(() => resolveSalesState({...base, PAYMENT_URL: SAMPLE, PRICE_INR: '199'}), /offer\/price/);
});

test('only the literal boolean true opens sales', () => {
  for (const flag of ['true', 1, 'yes', null, undefined]) assert.deepEqual(resolveSalesState({...base, PAYMENT_URL: SAMPLE, SALES_ENABLED: flag}), {mode: 'inquiry'}, String(flag));
});
