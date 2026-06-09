// Supabase Edge Function: stripe-webhook
// Handles Stripe events → keeps the `subscriptions` table in sync.
// Also converts the new subscription into a Schedule so it auto-upgrades
// from $99/mo to $199/mo after 12 billing cycles.
//
// Deploy:
//   supabase functions deploy stripe-webhook
// Secrets needed:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET    from Stripe Dashboard → Webhooks → signing secret
//
// Stripe events to enable in the webhook:
//   checkout.session.completed
//   customer.subscription.created
//   customer.subscription.updated
//   customer.subscription.deleted

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

  const body = await req.text();
  const sig  = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const upsertSubscription = async (sub: Stripe.Subscription) => {
    const userId = sub.metadata?.supabase_user_id
      || (sub.customer as string
        ? await stripe.customers.retrieve(sub.customer as string)
            .then((c) => (c as Stripe.Customer).metadata?.supabase_user_id)
        : null);

    if (!userId) { console.warn("No supabase_user_id for subscription", sub.id); return; }

    await supabase.from("subscriptions").upsert({
      user_id:                  userId,
      stripe_customer_id:       sub.customer as string,
      stripe_subscription_id:   sub.id,
      status:                   sub.status,                         // trialing | active | past_due | canceled …
      trial_end:                sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      current_period_end:       new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end:     sub.cancel_at_period_end,
      updated_at:               new Date().toISOString(),
    }, { onConflict: "user_id" });
  };

  switch (event.type) {

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const subscriptionId = session.subscription as string;
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      await upsertSubscription(sub);

      // Convert to a Subscription Schedule so the price auto-upgrades
      // from $99/mo → $199/mo after 12 billing cycles.
      const price199 = sub.metadata?.price_id_199;
      if (price199) {
        try {
          await stripe.subscriptionSchedules.create({
            from_subscription: subscriptionId,
            end_behavior: "release",
            phases: [
              {
                // Phase 1: current subscription continues for 12 more billing cycles at $99
                items: [{ price: sub.items.data[0].price.id, quantity: 1 }],
                iterations: 12,
                ...(sub.trial_end ? { trial_end: sub.trial_end } : {}),
              },
              {
                // Phase 2: $199/mo ongoing
                items: [{ price: price199, quantity: 1 }],
              },
            ],
          });
        } catch (err) {
          console.error("Could not create subscription schedule:", err.message);
        }
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await upsertSubscription(sub);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", sub.id);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
