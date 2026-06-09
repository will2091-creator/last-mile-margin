// POST JSON to an AI endpoint with the user's Supabase session token attached.
//
// The AI serverless functions verify this token before calling Claude (see
// server/requireUser.js) so the paid endpoints aren't open to the world. If
// there's no session, the request goes out without a token, the endpoint
// returns 401, and every caller already degrades to its rule-based fallback.

import { supabase } from "./supabaseClient";

export async function aiFetch(path, payload, options = {}) {
  const headers = { "Content-Type": "application/json" };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  } catch {
    /* no session — endpoint will 401 and the caller falls back */
  }
  return fetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    ...options,
  });
}
