import React from "react";
import { CheckCircle2, Sparkles } from "../shared";
import { getNextBestSetupAction } from "../lib/onboarding";

export default function NextActionCard({ isDark, status, action, onAction, title = "Next best action" }) {
  const currentAction = action || getNextBestSetupAction(status);
  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const cardClass = isDark
    ? "rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4"
    : "rounded-2xl border border-blue-100 bg-blue-50 p-4";

  return (
    <section className={cardClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={status?.isComplete ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white" : "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white"}>
            {status?.isComplete ? <CheckCircle2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          </span>
          <div>
            <p className={isDark ? "text-xs font-black uppercase tracking-wide text-blue-200" : "text-xs font-black uppercase tracking-wide text-blue-700"}>{title}</p>
            <h3 className={`mt-1 text-lg font-black ${titleText}`}>{status?.isComplete ? "Setup is ready for daily use" : currentAction.title}</h3>
            <p className={`mt-1 text-sm font-semibold leading-6 ${mutedText}`}>
              {status?.isComplete ? "Keep saving snapshots and reviewing claims, receipts, and teams as work comes in." : currentAction.detail}
            </p>
          </div>
        </div>
        {!status?.isComplete && (
          <button type="button" onClick={() => onAction?.(currentAction)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500">
            {currentAction.actionLabel}
          </button>
        )}
      </div>
    </section>
  );
}

