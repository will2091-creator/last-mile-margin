import React from "react";
import { CheckCircle2, ClipboardCheck } from "../shared";
import { getNextBestSetupAction } from "../lib/onboarding";

export default function SetupProgressPanel({ isDark, status, onAction, onTakeTour, compact = false, title = "Setup progress" }) {
  if (!status) return null;
  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const nextAction = getNextBestSetupAction(status);
  const visibleItems = compact ? status.items.slice(0, 5) : status.items;

  return (
    <section className={cardClass}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <ClipboardCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-600">{title}</p>
              <h2 className={`mt-1 text-xl font-black ${titleText}`}>
                {status.completeCount} of {status.requiredCount} setup items complete
              </h2>
            </div>
          </div>

          <div className={isDark ? "mt-4 h-3 overflow-hidden rounded-full bg-slate-950/70" : "mt-4 h-3 overflow-hidden rounded-full bg-slate-100"}>
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${status.percent}%` }} />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item, index) => (
              <div key={item.id} className={isDark ? "flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2" : "flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"}>
                <div className="flex min-w-0 items-center gap-2">
                  <span className={item.complete ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white" : item.skipped ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-700" : isDark ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 text-slate-400" : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400"}>
                    {item.complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[10px] font-black">{index + 1}</span>}
                  </span>
                  <span className={`truncate text-sm font-black ${titleText}`}>{item.label}</span>
                </div>
                <span className={item.complete ? "text-xs font-black text-emerald-700" : item.skipped ? "text-xs font-black text-amber-700" : `text-xs font-black ${mutedText}`}>
                  {item.complete ? "Done" : item.skipped ? "Skipped" : "Needed"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-4 lg:w-80" : "rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:w-80"}>
          <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Next</p>
          <h3 className={`mt-1 text-lg font-black ${titleText}`}>{status.isComplete ? "Ready for daily operations" : nextAction.title}</h3>
          <p className={`mt-2 text-sm font-semibold leading-6 ${mutedText}`}>
            {status.isComplete ? "Keep receipts, claims, snapshots, and team photos current." : nextAction.detail}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {!status.isComplete && (
              <button type="button" onClick={() => onAction?.(nextAction)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500">
                {nextAction.actionLabel}
              </button>
            )}
            {onTakeTour && (
              <button type="button" onClick={onTakeTour} className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/5" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}>
                Take Tour
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

