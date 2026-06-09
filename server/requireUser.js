// Auth gate for the AI endpoints.
//
// These endpoints call Claude, which costs money per request. Left open, anyone
// could hit them in a loop and run up the bill. This verifies the caller's
// Supabase session (the same token the client already holds) before any AI work.
//
// Fail policy: when Supabase auth is CONFIGURED (URL + anon key present, as on
// Vercel prod), a missing/invalid token is rejected with 401. When it is NOT
// configured (e.g. local dev with no Supabase env on the server), the gate
// allows the request through so the dev fallback loop still works — the AI key
// is typically absent in dev anyway, so those calls degrade to 503 → fallback.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const getAuthHeader = (req) =>
  req?.headers?.authorization ||
  req?.headers?.Authorization ||
  (typeof req?.headers?.get === "function" ? req.headers.get("authorization") : null);

/**
 * Returns { ok:true, user } when the request carries a valid Supabase session,
 * or { ok:false, status, error } to send back. See fail policy above.
 */
export async function requireUser(req) {
  if (!isConfigured) {
    // Auth not wired on this server (local dev) — don't block the fallback loop.
    return { ok: true, user: null };
  }

  const authHeader = getAuthHeader(req);
  if (!authHeader) return { ok: false, status: 401, error: "Sign in required." };

  const token = String(authHeader).replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false, status: 401, error: "Sign in required." };

  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return { ok: false, status: 401, error: "Sign in required." };
    return { ok: true, user };
  } catch {
    return { ok: false, status: 401, error: "Sign in required." };
  }
}
