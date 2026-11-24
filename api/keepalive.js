// Keep-alive for the Supabase free tier.
//
// Supabase pauses free projects after ~7 days without activity, which takes the
// whole backend (auth, checkout, AI) offline. A Vercel cron (see vercel.json)
// calls this once a day; it runs one tiny read so the project always counts as
// active. Harmless if called by anyone else: it reads nothing back to the caller.
//
// Optional: set CRON_SECRET in Vercel and this endpoint will only accept
// requests carrying it (Vercel crons send it automatically as a Bearer token).

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(request, response) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers?.authorization !== `Bearer ${cronSecret}`) {
    response.status(401).json({ ok: false, error: "Unauthorized." });
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    response.status(500).json({ ok: false, error: "Supabase env not configured." });
    return;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // A real database round-trip. The anonymous role isn't allowed to read this
    // table, so Postgres answers with a permission error — and that answer is
    // proof the request reached the database, which is what counts as activity.
    // Only a missing/unreachable database (no Postgres error code) is a failure.
    const { error } = await supabase.from("subscriptions").select("user_id").limit(1);
    if (error && !error.code) {
      response.status(500).json({ ok: false, error: "Database unreachable." });
      return;
    }
    response.status(200).json({ ok: true, reachedDatabase: true, pingedAt: new Date().toISOString() });
  } catch (error) {
    response.status(500).json({ ok: false, error: error.message || "Keep-alive failed." });
  }
}
