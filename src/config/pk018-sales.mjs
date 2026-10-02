// PK-018 paid-sales gate. This is the ONLY place to change when opening sales.
//
// Sales open only when ALL of these are true, otherwise the build fails
// (fail closed) and nothing can be deployed in a half-configured state:
//   1. SALES_ENABLED is true (owner has authorized public paid sales);
//   2. TAX_PRESENTATION_CONFIRMED is true (owner/accountant confirmed GST
//      treatment and that "₹199" is the correct customer-facing price wording);
//   3. PAYMENT_URL is the owner's Razorpay-hosted checkout URL for offer
//      PK018-INR-199-V1, copied from the Razorpay Dashboard (https only,
//      rzp.io or pages.razorpay.com, no query string, no credentials).
//
// No API key, secret, webhook secret or provider write call belongs here or
// anywhere in this public website. The buyer goes directly to Razorpay.

export const PK018_SALES = Object.freeze({
  SALES_ENABLED: true,
  // Owner-confirmed 2026-10-02: ₹199 is the total payable price; no separate tax line, no GSTIN shown.
  TAX_PRESENTATION_CONFIRMED: true,
  PAYMENT_URL: "https://rzp.io/rzp/projectkai-pk018", // reusable Razorpay Payment Page (owner-created; cutover 2026-10-02)
  OFFER_ID: "PK018-INR-199-V1",
  PRICE_INR: 199,
});

const ALLOWED = [
  { host: "rzp.io", path: /^\/(?:l|rzp|i)\/[A-Za-z0-9_-]{4,40}$/ },
  { host: "pages.razorpay.com", path: /^\/[A-Za-z0-9_-]{3,60}\/?$/ },
];

export function validatePaymentUrl(value) {
  if (typeof value !== "string" || value.trim() === "") return { ok: false, reason: "payment URL is empty" };
  if (value !== value.trim() || /\s/.test(value)) return { ok: false, reason: "payment URL contains whitespace" };
  let url;
  try { url = new URL(value); } catch { return { ok: false, reason: "payment URL is not a valid URL" }; }
  if (url.protocol !== "https:") return { ok: false, reason: "payment URL must use https" };
  if (url.username || url.password) return { ok: false, reason: "payment URL must not contain credentials" };
  if (url.port) return { ok: false, reason: "payment URL must not specify a port" };
  if (url.search || url.hash || value.includes("?") || value.includes("#")) return { ok: false, reason: "payment URL must not contain a query string or fragment" };
  const rule = ALLOWED.find((r) => r.host === url.hostname);
  if (!rule) return { ok: false, reason: `payment URL host ${url.hostname} is not an approved Razorpay checkout host` };
  if (!rule.path.test(url.pathname)) return { ok: false, reason: "payment URL path is not a recognised Razorpay checkout path" };
  return { ok: true, url: value };
}

export function resolveSalesState(config = PK018_SALES) {
  if (config.SALES_ENABLED !== true) return { mode: "inquiry" };
  const problems = [];
  if (config.TAX_PRESENTATION_CONFIRMED !== true) problems.push("GST/tax presentation not confirmed by owner/accountant");
  const check = validatePaymentUrl(config.PAYMENT_URL);
  if (!check.ok) problems.push(check.reason);
  if (config.OFFER_ID !== "PK018-INR-199-V1" || config.PRICE_INR !== 199) problems.push("offer/price do not match PK018-INR-199-V1 / ₹199");
  if (problems.length) throw new Error("PK-018 SALES GATE FAILED CLOSED: " + problems.join("; "));
  return { mode: "sales", paymentUrl: check.url };
}
