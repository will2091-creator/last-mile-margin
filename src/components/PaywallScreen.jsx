import { useState } from "react";
import { ArrowRight, CheckCircle2, Lock, LogOut, ShieldCheck } from "lucide-react";
import lastMileMarginLogo from "../assets/last-mile-margin-logo.png";
import lastMileMarginLogoDark from "../assets/last-mile-margin-logo-darkmode.png";
import { openCustomerPortal, startCheckout } from "../lib/subscription";

const PERKS = [
  "Profit tracking, claims management, and AI dispute packets",
  "Route Profit Check — know if a route pays before you say yes",
  "AI action feed — ranked by dollar impact every day",
  "Ask the business (Claude-powered) — plain-English answers about your margin",
  "Unlimited snapshots, contracts, and team members",
  "Email dispute letters straight from the app",
];

export default function PaywallScreen({ subscription, onSignOut, isDark }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPastDue  = subscription?.status === "past_due" || subscription?.status === "unpaid";
  const isCanceled = subscription?.status === "canceled" || subscription?.status === "incomplete_expired";
  const hasHadSub  = isPastDue || isCanceled || subscription?.status === "incomplete";

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    const result = await startCheckout();
    if (result?.error) { setError(result.error); setLoading(false); }
    // on success, window.location.href fires → no need to setLoading(false)
  };

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center p-6 ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-950"}`}>
      <div className={`w-full max-w-lg rounded-3xl border p-8 sm:p-10 ${isDark ? "border-white/10 bg-slate-900" : "border-slate-200 bg-white shadow-xl"}`}>

        <div className="text-center">
          <img
            src={isDark ? lastMileMarginLogoDark : lastMileMarginLogo}
            alt="Last Mile Margin"
            className="mx-auto h-16 w-36 object-contain"
          />

          {isPastDue ? (
            <>
              <div className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
                <Lock className="h-6 w-6 text-red-500" />
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-tight">Payment failed</h1>
              <p className={`mt-2 text-sm font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Your last payment didn't go through. Update your card to keep your workspace active.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
                <ShieldCheck className="h-6 w-6 text-blue-500" />
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-tight">
                {isCanceled ? "Reactivate your account" : "Start your free trial"}
              </h1>
              <p className={`mt-2 text-sm font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {isCanceled
                  ? "Your subscription was canceled. Reactivate to get back in."
                  : "3 days free, then $99/month for your first 12 months — locked in. $199/month after that."}
              </p>
            </>
          )}
        </div>

        {/* Pricing callout */}
        {!isPastDue && (
          <div className={`mt-6 rounded-2xl border p-5 ${isDark ? "border-white/10 bg-white/5" : "border-blue-100 bg-blue-50"}`}>
            <div className="flex items-baseline justify-between">
              <div>
                <span className={`text-3xl font-black ${isDark ? "text-white" : "text-slate-950"}`}>$99</span>
                <span className={`ml-1 text-sm font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>/month</span>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? "bg-blue-600/20 text-blue-300" : "bg-blue-600/10 text-blue-700"}`}>
                Early adopter price — locked for 12 months
              </span>
            </div>
            <p className={`mt-1.5 text-xs font-semibold ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              After 12 months: $199/month. Cancel anytime before your trial ends.
            </p>
          </div>
        )}

        {/* Perks */}
        <ul className="mt-6 space-y-2.5">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span className={`text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{perk}</span>
            </li>
          ))}
        </ul>

        {error && (
          <div className={`mt-5 rounded-xl border p-3 text-sm font-bold ${isDark ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-red-200 bg-red-50 text-red-600"}`}>
            {error}
          </div>
        )}

        <div className="mt-7 space-y-3">
          {isPastDue ? (
            <button
              type="button"
              onClick={openCustomerPortal}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white hover:bg-blue-500"
            >
              Update payment method <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white disabled:opacity-60 hover:bg-blue-500"
            >
              {loading ? "Redirecting to checkout…" : isCanceled ? "Reactivate — $99/month" : "Start 3-day free trial →"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={onSignOut}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-bold transition ${isDark ? "border-white/10 text-slate-400 hover:bg-white/5" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

        <p className={`mt-5 text-center text-xs font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          Secured by Stripe. We never store your card details.
        </p>
      </div>
    </div>
  );
}
