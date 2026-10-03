// Cloudflare Pages Function -- LinkedIn OAuth callback RELAY for the owner's local KAI.
//
// LinkedIn requires an absolute HTTPS redirect URL. This endpoint is that URL:
//   https://projectkai.dev/oauth/linkedin/callback
// It does NOT exchange codes, hold secrets, set cookies, store or log anything.
// It forwards only `code`, `state`, `error` and `error_description` -- validated and
// length-bounded -- with a 302 to the one-shot listener that KAI runs on the owner's
// own machine (127.0.0.1:47615) while `python -m global_revenue.linkedin connect` is
// waiting. The code is single-use, expires in 30 minutes and is useless without the
// client secret, which never leaves the owner's local .env. KAI checks `state`
// (CSRF) before using the code. No HTML is served, so no analytics script runs here.

export const LOOPBACK = "http://127.0.0.1:47615/oauth/linkedin/callback";
const LIMITS = { code: 2048, state: 128, error: 64, error_description: 500 };
const PATTERNS = {
  code: /^[A-Za-z0-9_\-.~]+$/,
  state: /^[A-Za-z0-9_\-]+$/,
  error: /^[a-z_]+$/,
  error_description: /^[\x20-\x7E]*$/,
};
const HEADERS = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};

function reject(status) {
  return new Response("LinkedIn sign-in could not be relayed. Close this tab and run the KAI connect command again.\n", {
    status,
    headers: { ...HEADERS, "Content-Type": "text/plain; charset=utf-8" },
  });
}

export function relay(requestUrl) {
  const url = new URL(requestUrl);
  if (url.search.length > 4096) return reject(414);
  const out = new URLSearchParams();
  for (const key of url.searchParams.keys()) {
    if (!(key in LIMITS)) return reject(400);
  }
  for (const key of Object.keys(LIMITS)) {
    const values = url.searchParams.getAll(key);
    if (values.length > 1) return reject(400);
    if (values.length === 1) {
      const v = values[0];
      if (v.length === 0 || v.length > LIMITS[key] || !PATTERNS[key].test(v)) return reject(400);
      out.set(key, v);
    }
  }
  const hasCode = out.has("code");
  const hasError = out.has("error");
  if (!out.has("state") || hasCode === hasError) return reject(400);
  return new Response(null, { status: 302, headers: { ...HEADERS, Location: `${LOOPBACK}?${out.toString()}` } });
}

export function onRequestGet({ request }) {
  return relay(request.url);
}

export function onRequest({ request }) {
  if (request.method === "GET" || request.method === "HEAD") return relay(request.url);
  return new Response(null, { status: 405, headers: { ...HEADERS, Allow: "GET" } });
}
