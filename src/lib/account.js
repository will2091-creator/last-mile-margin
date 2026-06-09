// Account data rights — GDPR/CCPA "export my data" and "delete my account".
//
// Export runs entirely client-side: it queries the user's own rows (RLS scopes
// every table to the signed-in user) plus the local workspace cache, and hands
// back a single JSON blob. Deletion calls the delete-account Edge Function,
// which uses the service-role key to remove the auth user and all their data.

import { supabase } from "./supabaseClient";

// Tables that hold per-user data, with the column scoped to the user id.
// Queried best-effort — a table missing from a given deployment is skipped.
const EXPORT_TABLES = [
  { table: "app_state", column: "owner_id" },
  { table: "claims", column: "owner_id" },
  { table: "documents", column: "owner_id" },
  { table: "contracts", column: "owner_id" },
  { table: "rate_cards", column: "owner_id" },
  { table: "claim_evidence", column: "owner_id" },
  { table: "team_photos", column: "owner_id" },
  { table: "route_checkins", column: "owner_id" },
  { table: "receivables", column: "owner_id" },
  { table: "driver_settlements", column: "owner_id" },
  { table: "settlement_lines", column: "owner_id" },
  { table: "financial_events", column: "owner_id" },
  { table: "financing_config", column: "owner_id" },
  { table: "team_memberships", column: "owner_id" },
  { table: "profiles", column: "id" },
  { table: "subscriptions", column: "user_id" },
];

/** Collect every finalMile* key from localStorage (the offline workspace cache). */
function collectLocalData() {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("finalMile")) continue;
      const raw = localStorage.getItem(key);
      try {
        out[key] = JSON.parse(raw);
      } catch {
        out[key] = raw;
      }
    }
  } catch {
    /* localStorage unavailable — skip */
  }
  return out;
}

/**
 * Gather all of the signed-in user's data into a single object.
 * Returns { ok, data } or { ok:false, error }.
 */
export async function gatherMyData() {
  if (!supabase) return { ok: false, error: "Supabase not configured." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const supabaseData = {};
  for (const { table, column } of EXPORT_TABLES) {
    try {
      const { data, error } = await supabase.from(table).select("*").eq(column, user.id);
      if (error) {
        // Missing table / no access — record nothing rather than failing the whole export.
        continue;
      }
      if (data && data.length) supabaseData[table] = data;
    } catch {
      /* skip this table */
    }
  }

  return {
    ok: true,
    data: {
      exportedAt: new Date().toISOString(),
      account: { id: user.id, email: user.email },
      supabase: supabaseData,
      localWorkspace: collectLocalData(),
    },
  };
}

/**
 * Gather the user's data and trigger a JSON file download in the browser.
 * Returns { ok } or { ok:false, error }.
 */
export async function exportMyData() {
  const result = await gatherMyData();
  if (!result.ok) return result;

  try {
    const stamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `last-mile-margin-data-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || "Could not generate the export file." };
  }
}

/**
 * Permanently delete the signed-in user's account and all their data.
 * Calls the delete-account Edge Function (service-role deletion + auth user
 * removal, plus best-effort Stripe cancellation). The caller should sign out
 * and reload on success.
 */
export async function deleteMyAccount() {
  if (!supabase) return { ok: false, error: "Supabase not configured." };
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: "Not signed in." };

  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) {
      return { ok: false, error: json.error || `Deletion failed (${res.status}).` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || "Could not reach the deletion service." };
  }
}
