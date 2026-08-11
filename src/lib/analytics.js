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
import { isBackendConfigured, getClient, safeCall } from "./supabase.js";

const STORAGE_KEY = "kai-page-views-v1";

export function trackPageView(path) {
  try {
    const counts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    counts[path] = (counts[path] || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  } catch {
    // localStorage unavailable -- device-local tracking simply won't record.
  }

  if (isBackendConfigured) {
    const client = getClient();
    safeCall(() => client.from("page_views").insert({ path }));
  }
}

export function getLocalPageViews() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}
