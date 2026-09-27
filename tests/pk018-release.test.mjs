import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const article = readFileSync(new URL('../dist/blog/freelancer-time-to-invoice-checklist/index.html', import.meta.url), 'utf8');
const listing = readFileSync(new URL('../dist/blog/index.html', import.meta.url), 'utf8');
const decoded = article.replaceAll('&amp;', '&').replaceAll('&#39;', "'");
const mailLink = decoded.match(/href="(mailto:[^"]+)"/)[1];
const mail = new URL(mailLink);
const body = mail.searchParams.get('body');

test('rendered article has one working email CTA and the established recipient', () => {
  assert.equal((article.match(/id="pk018-interest"/g)||[]).length, 1);
  assert.equal(mail.pathname, 'drkamrantakbnys@gmail.com');
  assert.match(mail.searchParams.get('subject'), /\[PK-018\]/);
  assert.match(decoded, /clicking alone sends nothing/i);
});
test('inquiry preserves opportunity, asset, offer, channel and source without JavaScript', () => {
  for (const value of ['opportunity_id: PK-018', 'asset_id: PK-018-ARTICLE-V1', 'offer_id: PK018-KIT-V1', 'channel: website', 'source: https://projectkai.dev/blog/freelancer-time-to-invoice-checklist']) assert.ok(body.includes(value));
  assert.ok(!/[\r\n]/.test(mail.searchParams.get('subject')));
});
test('price and payment status are explicit with no purchasing controls', () => {
  assert.match(decoded, /Price has not been decided/);
  assert.match(decoded, /Purchasing and payments are not enabled/);
  assert.match(decoded, /Paid delivery has not been activated/);
  const main = article.match(/<main\b[\s\S]*?<\/main>/)[0];
  assert.ok(!/<(?:form|input|video|iframe)\b/i.test(main));
});
test('sensitive-data warning and professional limitations are visible', () => {
  for (const word of ['real invoices', 'bank details', 'payment-card information', 'passwords', 'tax identifiers', 'highly sensitive financial documents', 'unnecessary personal financial information']) assert.ok(decoded.includes(word));
  assert.match(decoded, /not professional accounting, tax, legal or financial advice/);
  assert.match(decoded, /All examples are fictional/);
});
test('article can be discovered from the existing blog', () => {
  assert.match(listing, /href="\/blog\/freelancer-time-to-invoice-checklist"/);
  assert.match(article, /name="viewport"/);
});
test('article does not depend on the backend proxy or expose blocked assets', () => {
  assert.ok(!article.includes('/api/kai/'));
  assert.ok(!/href="[^"]+\.zip|pk_018\/|final_video\.mp4|APPROVAL\.json/i.test(article));
});
test('built assets contain no common secret patterns or private product archive', () => {
  function walk(dir) {return readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(join(dir,e.name)) : [join(dir,e.name)]);}
  for (const file of walk(fileURLToPath(new URL('../dist', import.meta.url)))) {
    assert.ok(!/PK018.*\.zip$/i.test(file));
    if (/\.(html|js|json|css|txt)$/.test(file)) {
      const text = readFileSync(file, 'utf8');
      assert.ok(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}|\bsk-[A-Za-z0-9_-]{30,}|\bAIza[A-Za-z0-9_-]{30,}/.test(text), file);
    }
  }
});
