// Supabase Edge Function: delete-account
// Permanently deletes the signed-in user's account and all of their data
// (GDPR/CCPA "right to erasure"). Verifies the caller's session, best-effort
// cancels any Stripe subscription, deletes the user's rows across all tables
// and storage folders with the service-role key, then removes the auth user.
//
// Deploy:
//   supabase functions deploy delete-account
// Secrets needed: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//   (all already set). STRIPE_SECRET_KEY is optional — used only to cancel an
//   active subscription so the user isn't billed after deletion.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { corsHeadersFor } from "../_shared/cors.ts";

// Per-user tables and the column scoped to the user id. Deleted best-effort —
// a table missing from this deployment is skipped without failing the request.
const USER_TABLES: Array<{ table: string; column: string }> = [
  { table: "claims", column: "owner_id" },
  { table: "app_state", column: "owner_id" },
  { table: "documents", column: "owner_id" },
  { table: "contracts", column: "owner_id" },
  { table: "rate_cards", column: "owner_id" },
  { table: "claim_evidence", column: "owner_id" },
  { table: "team_photos", column: "owner_id" },
  { table: "route_checkins", column: "owner_id" },
  { table: "settlement_lines", column: "owner_id" },
  { table: "financial_events", column: "owner_id" },
  { table: "driver_settlements", column: "owner_id" },
  { table: "receivables", column: "owner_id" },
  { table: "financing_config", column: "owner_id" },
  { table: "team_memberships", column: "owner_id" },
  { table: "subscriptions", column: "user_id" },
  { table: "profiles", column: "id" },
];

const STORAGE_BUCKETS = ["documents", "claim-evidence", "team-photos", "contracts"];

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller's session with the anon client.
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Best-effort: cancel any Stripe subscription so the user isn't billed.
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey) {
      try {
        const { data: sub } = await admin
          .from("subscriptions")
          .select("stripe_subscription_id, stripe_customer_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (sub?.stripe_subscription_id) {
          const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
          await stripe.subscriptions.cancel(sub.stripe_subscription_id).catch(() => {});
        }
      } catch (_e) {
        /* non-fatal — proceed with deletion */
      }
    }

    // 2) Delete storage objects under the user's folder in each bucket.
    for (const bucket of STORAGE_BUCKETS) {
      try {
        const { data: files } = await admin.storage.from(bucket).list(user.id, { limit: 1000 });
        if (files && files.length) {
          const paths = files.map((f) => `${user.id}/${f.name}`);
          await admin.storage.from(bucket).remove(paths);
        }
      } catch (_e) {
        /* bucket may not exist — skip */
      }
    }

    // 3) Delete the user's rows across all per-user tables.
    for (const { table, column } of USER_TABLES) {
      try {
        await admin.from(table).delete().eq(column, user.id);
      } catch (_e) {
        /* table may not exist — skip */
      }
    }

    // 4) Remove the auth user itself. This is the irreversible step.
    const { error: delError } = await admin.auth.admin.deleteUser(user.id);
    if (delError) {
      return new Response(JSON.stringify({ error: `Could not delete account: ${delError.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("delete-account error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
