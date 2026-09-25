// Real, honest page-view tracking (Website Intelligence + Media
// Network Activation Sprint, Phase 15). Two real layers, never a
// fabricated one:
//
//   1. "This Device" -- always real, always works: a per-path
//      localStorage counter. No cookies, no cross-device identity, no
//      IP logging. Shown on /analytics labeled exactly as what it is.
//   2. Site-wide aggregate -- real only when a backend is configured:
//      an insert-only `page_views` row per load (see
//      supabase/schema.sql), readable in aggregate by admins via
//      /admin. Never shown as a public global counter, to avoid
//      implying a live, unauthenticated "views" number the way a
//      social platform would.
//
// CEO "YouTube -> Project KAI Attribution Foundation" (Phase 16): adds a
// THIRD, still local-only layer -- captured UTM attribution parameters
// (utm_source/utm_medium/utm_campaign) from the visit URL, stored the
// same device-local way as layer 1. The Supabase page_views insert
// (layer 2) also persists these same already-parsed, already-bounded
// values (supabase/schema.sql's page_views has nullable utm_* columns
// and the matching least-privilege grants) -- a normal visit with no
// UTM parameters simply omits them, same as it always has for `path`
// alone.
import { isBackendConfigured, getClient, safeCall } from "./supabase.js";

const STORAGE_KEY = "kai-page-views-v1";
const UTM_STORAGE_KEY = "kai-utm-attribution-v1";

// Query parameters are untrusted input: bounded length, allowlisted
// character set, never trusted to be well-formed. A value that fails
// this check is treated as absent, not silently truncated/corrected --
// truncating could still produce a plausible-looking but wrong
// attribution value, which is worse than recording nothing.
const MAX_UTM_VALUE_LENGTH = 100;
const SAFE_UTM_VALUE_PATTERN = /^[A-Za-z0-9_-]+$/;

function _sanitizeUtmValue(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_UTM_VALUE_LENGTH) return null;
  if (!SAFE_UTM_VALUE_PATTERN.test(trimmed)) return null;
  return trimmed;
}

/**
 * Parses utm_source/utm_medium/utm_campaign from a URL search string
 * (e.g. window.location.search). Pure function, no I/O -- returns an
 * object with only the keys that were present AND passed sanitization;
 * an empty object means no valid UTM attribution was present on this
 * visit, which is the normal case for most traffic and must never be
 * treated as an error.
 */
export function parseUtmParams(search) {
  const result = {};
  if (!search) return result;
  let params;
  try {
    params = new URLSearchParams(search);
  } catch {
    return result;
  }
  for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
    const value = _sanitizeUtmValue(params.get(key));
    if (value) result[key] = value;
  }
  return result;
}

export function trackPageView(path, search) {
  try {
    const counts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    counts[path] = (counts[path] || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  } catch {
    // localStorage unavailable -- device-local tracking simply won't record.
  }

  const utm = parseUtmParams(search);
  if (Object.keys(utm).length > 0) {
    try {
      const attributions = JSON.parse(localStorage.getItem(UTM_STORAGE_KEY) || "[]");
      attributions.push({ path, ...utm, created_at: new Date().toISOString() });
      // Bounded growth -- keep the most recent 200 attributed visits only,
      // this is a lightweight local record, not an unbounded log.
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(attributions.slice(-200)));
    } catch {
      // localStorage unavailable -- attribution simply won't be recorded locally.
    }
  }

  if (isBackendConfigured) {
    const client = getClient();
    safeCall(() => client.from("page_views").insert({ path, ...utm }));
  }
}

export function getLocalPageViews() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getLocalUtmAttributions() {
  try {
    return JSON.parse(localStorage.getItem(UTM_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
