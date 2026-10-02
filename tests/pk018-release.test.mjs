import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PK018_SALES, validatePaymentUrl} from '../src/config/pk018-sales.mjs';

const read = (p) => readFileSync(new URL('../dist/' + p, import.meta.url), 'utf8');
const article = read('blog/freelancer-time-to-invoice-checklist/index.html');
const listing = read('blog/index.html');
const kitTerms = read('kit-terms/index.html');
const privacy = read('privacy/index.html');
const terms = read('terms/index.html');
const decode = (html) => html.replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&#x27;', "'");
const decoded = decode(article);
const main = article.match(/<main\b[\s\S]*?<\/main>/)[0];
const SALES = PK018_SALES.SALES_ENABLED === true;
const ctaHref = (id) => { const m = decoded.match(new RegExp(`<a[^>]*id="${id}"[^>]*>`)); return m && m[0].match(/href="([^"]+)"/)[1]; };
const RAZORPAY_URL = /https?:\/\/(?:[a-z0-9-]+\.)*(?:rzp\.io|razorpay\.com|razorpay\.me)[^\s"'<)]*/gi;

test('built article matches the configured gate state, with exactly one CTA', () => {
  const buy = (article.match(/id="pk018-buy"/g) || []).length;
  const interest = (article.match(/id="pk018-interest"/g) || []).length;
  assert.equal(buy + interest, 1);
  assert.equal(buy === 1, SALES, 'dist/ does not match src/config/pk018-sales.mjs');
});

test('sales OFF: inquiry page unchanged and no payment endpoint exposed', {skip: SALES}, () => {
  const mail = new URL(ctaHref('pk018-interest'));
  assert.equal(mail.protocol, 'mailto:');
  assert.equal(mail.pathname, 'drkamrantakbnys@gmail.com');
  assert.match(mail.searchParams.get('subject'), /\[PK-018\]/);
  for (const value of ['opportunity_id: PK-018', 'asset_id: PK-018-ARTICLE-V1', 'offer_id: PK018-KIT-V1', 'channel: website']) assert.ok(mail.searchParams.get('body').includes(value));
  for (const text of ['Price has not been decided', 'Purchasing and payments are not enabled', 'Paid delivery has not been activated', 'clicking alone sends nothing']) assert.ok(decoded.includes(text), text);
  assert.ok(!decoded.includes('₹199'));
  assert.deepEqual(decoded.match(RAZORPAY_URL) || [], []);
  assert.ok(!/<(?:form|input)\b/i.test(main));
});

test('sales ON: CTA goes only to the approved Razorpay checkout and the offer is described accurately', {skip: !SALES}, () => {
  const href = ctaHref('pk018-buy');
  assert.equal(href, PK018_SALES.PAYMENT_URL);
  assert.ok(validatePaymentUrl(href).ok);
  assert.deepEqual([...new Set(decoded.match(RAZORPAY_URL))], [href], 'payment URL must appear only as the CTA');
  for (const text of ['Freelancer Invoice Review Kit — ₹199', '₹199 (INR), one-time', 'introductory price', 'digital product', 'delivered by email',
    'email you the kit within 24 hours after verification', 'from the address where you want the kit', 'pay_', 'Checkout may not ask for your email',
    'Pay ₹199 on Razorpay', 'I have read the kit terms', 'charged twice or pay in error', 'materially differs from its description', 'consumer rights are not affected',
    'Support:', '14 days', 'For:', 'Not for:', 'Sold by Kamran Tak, operating under the Project KAI brand']) assert.ok(decoded.includes(text), text);
  assert.match(article, /href="\/kit-terms"/);
  assert.match(article, /href="\/privacy"/);
  assert.ok(!/Price has not been decided|payments are not enabled|validating interest|not useful to you/i.test(decoded));
  assert.ok(!/@/.test(href) && !new URL(href).search, 'no email or query data may be passed to Razorpay');
  const inputs = main.match(/<input\b[^>]*>/gi) || [];
  assert.equal(inputs.length, 1, 'only the acknowledgement checkbox is allowed');
  assert.match(inputs[0], /type="checkbox"/); assert.match(inputs[0], /id="pk018-ack"/);
  assert.ok(!/<form\b|<textarea\b|<select\b/i.test(main));
  const after = new URL(ctaHref('pk018-after-pay'));
  assert.equal(after.protocol, 'mailto:'); assert.equal(after.pathname, 'drkamrantakbnys@gmail.com');
  assert.match(after.searchParams.get('subject'), /PK-018/);
  assert.match(after.searchParams.get('body'), /Do not include card, UPI, bank or OTP details/);
});

test('no forms, keys, secrets or unsupported sales claims on the article', () => {
  assert.ok(!/<(?:form|textarea|select|video|iframe)\b/i.test(main)); // inputs are checked per gate state above
  assert.ok(!/rzp_(?:test|live)_|key_secret|webhook_secret/i.test(article));
  assert.ok(!/limited time|only \d+ left|was ₹|testimonial|customers (?:love|say)|★|\bwe guarantee\b|guaranteed (?:results|income|payment|savings)|get paid faster/i.test(decode(main)));
  assert.ok(!/(?:incl|excl)\w*\.? (?:of )?(?:GST|tax)|GST[- ](?:included|compliant)/i.test(decoded));
  assert.ok(!/KYVERIQ/i.test(article));
});

test('sensitive-data warning and professional limitations are visible', () => {
  for (const word of ['real invoices', 'bank details', 'payment-card information', 'passwords', 'tax identifiers', 'highly sensitive financial documents', 'unnecessary personal financial information']) assert.ok(decoded.includes(word), word);
  assert.match(decoded, /not professional accounting, tax, legal or financial advice/);
  assert.match(decoded, /All examples are fictional/);
});

test('kit terms page carries the final v1.1 customer terms', () => {
  const t = decode(kitTerms).replace(/\s+/g, ' ');
  for (const text of ['Kamran Tak, operating under the Project KAI brand', 'Version 1.1', 'PK018-KIT-V1.1', 'digital product', 'personal-use licence',
    'You may not resell', 'repackage the kit', 'within 24 hours after your payment has been verified as successful', 'email us from the address where you want the kit, with your payment reference', 'duplicate or erroneous payment',
    'materially differs from its description', 'Nothing in these terms excludes or limits any rights you have under applicable consumer law',
    '14 days after delivery', 'not legal, tax, accounting or financial advice', 'limited to the amount you paid',
    'never ask for your passwords, OTP codes, bank credentials or card credentials']) assert.ok(t.includes(text), text);
  assert.ok(!/\[OWNER|DRAFT|proposed|owner review|KYVERIQ|not useful to you|no refunds|non-refundable|waive|(?:incl|excl)\w*\.? (?:of )?GST/i.test(t));
});

test('privacy page is accurate and stands alone; terms page links the kit terms', () => {
  const p = decode(privacy);
  assert.ok(!/No analytics service is connected|does not include accounts, payments/i.test(p));
  for (const text of ['Cloudflare Web Analytics', 'local storage', "Razorpay's hosted checkout", 'never receive your full card number', 'never ask for a password, OTP', 'you email us the address where you want the product delivered']) assert.ok(p.includes(text), text);
  assert.ok(!/email address you enter at checkout/.test(p));
  assert.ok(!/href="\/kit-terms"/.test(privacy), 'privacy must not depend on /kit-terms so it can deploy on its own');
  assert.match(terms, /href="\/kit-terms"/);
});

test('article can be discovered from the existing blog', () => {
  assert.match(listing, /href="\/blog\/freelancer-time-to-invoice-checklist"/);
  assert.match(article, /name="viewport"/);
});

test('article does not depend on the backend proxy or expose blocked assets', () => {
  assert.ok(!article.includes('/api/kai/'));
  assert.ok(!/href="[^"]+\.zip|pk_018\/|final_video\.mp4|APPROVAL\.json/i.test(article));
});

test('built assets contain no secrets, payment keys or product archive', () => {
  function walk(dir) {return readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(join(dir,e.name)) : [join(dir,e.name)]);}
  for (const file of walk(fileURLToPath(new URL('../dist', import.meta.url)))) {
    assert.ok(!/\.zip$/i.test(file), file);
    if (/\.(html|js|json|css|txt)$/.test(file)) {
      const text = readFileSync(file, 'utf8');
      assert.ok(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}|\bsk-[A-Za-z0-9_-]{30,}|\bAIza[A-Za-z0-9_-]{30,}|rzp_(?:test|live)_[A-Za-z0-9]+/.test(text), file);
    }
  }
});
