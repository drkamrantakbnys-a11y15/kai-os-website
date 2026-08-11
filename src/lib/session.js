// Anonymous session id (Live Website Intelligence & Community Sprint).
//
// A stable, per-browser, client-generated id -- used ONLY for local
// UX (e.g. "you already reacted to this on this device," matching
// ReactionBar's existing localStorage-based dedup). It is NOT a
// security boundary: the database never trusts a client-supplied id
// as proof of identity (see supabase/schema.sql's comments on
// anonymous ownership). Real ownership (deleting your own comment,
// server-side bookmarks) requires real Supabase Auth, not this id.
const KEY = "kai-anon-session-v1";

export function getSessionId() {
  if (typeof localStorage === "undefined") return null;
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}
