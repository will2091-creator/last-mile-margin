// Supabase Edge Function: create-checkout-session
// Creates a Stripe Checkout Session for the FMM subscription.
// Pricing: 3-day trial → $99/mo for 12 months → $199/mo ongoing (Subscription Schedule).
//
// Deploy:
//   supabase functions deploy create-checkout-session
// Secrets needed (supabase secrets set):
//   STRIPE_SECRET_KEY        your Stripe secret key (sk_live_... or sk_test_...)
//   STRIPE_PRICE_ID_99       Stripe Price ID for $99/mo
//   STRIPE_PRICE_ID_199      Stripe Price ID for $199/mo
//   SITE_URL                 your deployed site URL (e.g. https://yourdomain.com)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { corsHeadersFor } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
    const price99  = Deno.env.get("STRIPE_PRICE_ID_99")!;
    const price199 = Deno.env.get("STRIPE_PRICE_ID_199")!;
    const siteUrl  = Deno.env.get("SITE_URL") || "http://localhost:5173";

    // Verify the caller is a logged-in Supabase user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    // Re-use existing Stripe customer or create one
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId: string;
    if (existing?.stripe_customer_id) {
      customerId = existing.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    // Checkout session: collects card, starts 3-day trial on $99/mo.
    // After checkout we create a Subscription Schedule (in the webhook) to
    // auto-upgrade to $199/mo after 12 billing cycles.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: price99, quantity: 1 }],
      subscription_data: {
        trial_period_days: 3,
        metadata: {
          supabase_user_id: user.id,
          price_id_199: price199,   // stored so the webhook can set up the schedule
        },
      },
      payment_method_collection: "always", // card required even during trial
      allow_promotion_codes: true,
      success_url: `${siteUrl}/#/dashboard?checkout=success`,
      cancel_url:  `${siteUrl}/#/dashboard?checkout=canceled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
