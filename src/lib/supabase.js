// Project KAI website — Supabase client (Live Website Intelligence &
// Community Sprint, Phase 2/6).
//
// This is the ONLY place the website creates a Supabase client. Every
// backend-dependent component imports `getClient()` and
// `isBackendConfigured` from here rather than calling
// `createClient()` itself, so there is exactly one place to audit for
// "does this ever use a service-role key" (it never does -- only the
// public anon key, safe to ship in browser code, is used, matching
// supabase/schema.sql's RLS design).
//
// DEMO MODE: when PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY are
// unset (the default -- see .env.example), `isBackendConfigured` is
// false and `getClient()` returns null. Every caller must check
// `isBackendConfigured` before touching the client and fall back to
// the same honest, non-persisting UI this site has always used --
// never a fabricated "success" state.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const isBackendConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let _client = null;

export function getClient() {
  if (!isBackendConfigured) return null;
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return _client;
}

// Standard honest-failure wrapper (Phase 35: "Backend Failure
// Behavior"). Every backend call in this codebase should go through
// this so a network/RLS/database failure always degrades to a real
// error message, never a fake success.
export async function safeCall(fn) {
  try {
    const { data, error } = await fn();
    if (error) {
      console.error("[Project KAI backend]", error.message);
      return { ok: false, data: null, message: "Community services temporarily unavailable." };
    }
    return { ok: true, data, message: null };
  } catch (err) {
    console.error("[Project KAI backend]", err);
    return { ok: false, data: null, message: "Community services temporarily unavailable." };
  }
}
