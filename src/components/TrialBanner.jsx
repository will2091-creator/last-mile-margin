import { useState } from "react";
import { AlertCircle, ArrowRight, X } from "lucide-react";
import { openCustomerPortal, trialDaysLeft } from "../lib/subscription";

/**
 * Slim banner shown at the top of the authed app during the trial period.
 * Dismissible for the session (does not persist).
 */
export default function TrialBanner({ subscription, isDark }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const days = trialDaysLeft(subscription);
  if (subscription?.status !== "trialing") return null;

  const urgent = days <= 1;

  return (
    <div
      className={`relative z-40 flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold ${
        urgent
          ? "bg-red-600 text-white"
          : isDark
            ? "bg-amber-500/20 text-amber-200 border-b border-amber-500/20"
            : "bg-amber-50 text-amber-800 border-b border-amber-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>
          {days === 0
            ? "Your trial ends today."
            : days === 1
              ? "Your trial ends tomorrow."
              : `${days} days left in your free trial.`}
          {" "}Your card will be charged $99/mo when it ends — locked in for 12 months.
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={openCustomerPortal}
          className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-black transition ${
            urgent
              ? "bg-white/20 hover:bg-white/30 text-white"
              : isDark
                ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-100"
                : "bg-amber-200 hover:bg-amber-300 text-amber-900"
          }`}
        >
          Manage billing <ArrowRight className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
          className="opacity-60 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
