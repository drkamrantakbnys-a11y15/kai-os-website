// Bookmarks (Live Website Master Implementation, Phase 23). Anonymous
// bookmarks are always real and always work via localStorage -- no
// backend required. When a backend is configured AND the visitor is
// signed in, bookmarks also mirror to the `bookmarks` table (see
// supabase/schema.sql) so they survive across devices; signed-out
// visitors on a configured site still get the localStorage behavior,
// never a fake "saved to your account" claim.
import { isBackendConfigured, getClient, safeCall } from "./supabase.js";

const STORAGE_KEY = "kai-bookmarks-v1";

export function getLocalBookmarks() {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalBookmarks(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Unavailable (private browsing) -- bookmark simply won't persist.
  }
}

export function isLocalBookmarked(itemId) {
  return getLocalBookmarks().some((b) => b.id === itemId);
}

export async function toggleBookmark(item) {
  const list = getLocalBookmarks();
  const idx = list.findIndex((b) => b.id === item.id);
  const nowBookmarked = idx === -1;

  if (nowBookmarked) {
    list.push(item);
  } else {
    list.splice(idx, 1);
  }
  saveLocalBookmarks(list);

  if (isBackendConfigured) {
    const client = getClient();
    let user = null;
    try {
      const authResult = await client.auth.getUser();
      user = authResult?.data?.user || null;
    } catch {
      // Not signed in -- localStorage-only, same as an unconfigured site.
    }
    if (user) {
      if (nowBookmarked) {
        await safeCall(() => client.from("bookmarks").insert({ user_id: user.id, item_id: item.id, item_type: item.type }));
      } else {
        await safeCall(() => client.from("bookmarks").delete().eq("user_id", user.id).eq("item_id", item.id));
      }
    }
  }

  return nowBookmarked;
}
