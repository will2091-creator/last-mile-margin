// Subscription helpers — used by SubscriptionGate and TrialBanner.

import { supabase } from "./supabaseClient";

/**
 * Fetch the current user's subscription row from Supabase.
 * Returns null if not found or Supabase is unavailable.
 */
export async function fetchSubscription() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, trial_end, current_period_end, cancel_at_period_end")
    .maybeSingle();
  if (error) { console.warn("fetchSubscription:", error.message); return null; }
  return data;
}

/**
 * Call the create-checkout-session Edge Function and redirect to Stripe Checkout.
 */
export async function startCheckout() {
  if (!supabase) return { error: "Supabase not configured." };
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not signed in." };

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  );
  const json = await res.json();
  if (json.error) return { error: json.error };
  window.location.href = json.url;
  return { ok: true };
}

/**
 * Open the Stripe Customer Portal so users can manage their subscription.
 * Requires a separate `create-portal-session` Edge Function (optional upgrade).
 * For now, opens Stripe's direct billing portal URL via your publishable key.
 */
export function openCustomerPortal() {
  // Replace with your Stripe Customer Portal link from:
  // Stripe Dashboard → Billing → Customer portal → Copy link
  const portalUrl = import.meta.env.VITE_STRIPE_PORTAL_URL;
  if (portalUrl) window.open(portalUrl, "_blank", "noopener");
}

/** Returns true if the subscription grants full access. */
export function isAccessGranted(sub) {
  if (!sub) return false;
  return sub.status === "trialing" || sub.status === "active";
}

/** Days remaining in trial (0 if not trialing or expired). */
export function trialDaysLeft(sub) {
  if (!sub || sub.status !== "trialing" || !sub.trial_end) return 0;
  const ms = new Date(sub.trial_end).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
