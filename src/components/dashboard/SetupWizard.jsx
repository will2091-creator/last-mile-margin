import React from "react";
import { BriefcaseBusiness, CheckCircle2, ClipboardCheck } from "../../shared";
import NextActionCard from "../NextActionCard";

export default function SetupWizard({
  isDark,
  showGuidedSetup,
  isDemoMode,
  setupNextStep,
  sharedNextAction,
  setupCompleteCount,
  setupSteps,
  setupSkippedCount,
  setupPercent,
  setupTourTargets,
  setupPreviewCards,
  handleSetupStatusAction,
  setupStatus,
  skipSetupStep,
  openPreviewModal,
  toneIcon,
  titleText,
  mutedText,
  cardClass,
}) {
  if (!showGuidedSetup) return null;

  return (
    <div className="space-y-5">
      <section data-tour="setup-progress" className={isDark ? "rounded-2xl border border-blue-400/20 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-4 shadow-card sm:p-6" : "rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4 shadow-sm sm:p-6"}>
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="flex min-w-0 items-start gap-4">
            <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 sm:flex">
              <BriefcaseBusiness className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <p className={isDark ? "text-xs font-semibold uppercase tracking-wide text-blue-200" : "text-xs font-semibold uppercase tracking-wide text-blue-700"}>Business Launch Center</p>
              <h2 className={`mt-1 max-w-3xl text-2xl font-black leading-tight sm:text-3xl ${titleText}`}>Build your first margin command center</h2>
              <p className={`mt-3 max-w-3xl text-sm font-semibold leading-6 ${mutedText}`}>
                Start with the business facts that make the app useful: contracts, teams, costs, claims, receipts, and history. Every saved step feeds the Dashboard, Operations, Finance, Reports, and Ask.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <button onClick={setupNextStep.onClick} className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500 sm:w-auto">
                  Continue Setup
                </button>
                <button onClick={() => openPreviewModal("preview")} className={isDark ? "w-full rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/5 sm:w-auto" : "w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 sm:w-auto"}>
                  Preview Dashboard
                </button>
                <span className={isDark ? "rounded-full bg-white/5 px-3 py-1 text-xs font-black text-slate-300" : "rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500"}>
                  Next: {sharedNextAction.title}
                </span>
              </div>
            </div>
          </div>

          <div className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-4" : "rounded-2xl border border-blue-100 bg-white/80 p-4 shadow-sm"}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={isDark ? "text-xs font-semibold uppercase tracking-wide text-slate-300" : "text-xs font-semibold uppercase tracking-wide text-slate-500"}>Setup progress</p>
                <p className={`mt-1 text-2xl font-black ${titleText}`}>{setupCompleteCount} of {setupSteps.length} complete</p>
                {setupSkippedCount > 0 && (
                  <p className="mt-1 text-xs font-black text-amber-700">{setupSkippedCount} skipped item{setupSkippedCount === 1 ? "" : "s"} still in the checklist</p>
                )}
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
                <ClipboardCheck className="h-6 w-6" />
              </span>
            </div>
            <div className={isDark ? "mt-4 h-3 overflow-hidden rounded-full bg-slate-950/70" : "mt-4 h-3 overflow-hidden rounded-full bg-slate-100"}>
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${setupPercent}%` }} />
            </div>
            <div className="mt-4 grid gap-2">
              {setupSteps.map((step, index) => (
                <div key={step.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={step.complete ? "flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white" : step.skipped ? "flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-amber-700" : isDark ? "flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-400" : "flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400"}>
                      {step.complete ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-black">{index + 1}</span>}
                    </span>
                    <p className={`truncate text-sm font-black ${titleText}`}>{step.shortLabel}</p>
                  </div>
                  <p className={step.complete ? "text-xs font-black text-emerald-700" : step.skipped ? "text-xs font-black text-amber-700" : `text-xs font-black ${mutedText}`}>
                    {step.complete ? "Done" : step.skipped ? "Skipped" : "Needed"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <NextActionCard
        isDark={isDark}
        status={setupStatus}
        action={sharedNextAction}
        onAction={handleSetupStatusAction}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {setupSteps.map(({ id, title, detail, cta, Icon, onClick, tone, complete, skipped }, index) => (
          <div
            key={id}
            data-tour={setupTourTargets[id]}
            className={
              complete
                ? isDark
                  ? "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-card"
                  : "rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm"
                : skipped
                  ? isDark
                    ? "rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 shadow-card"
                    : "rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"
                  : isDark
                    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card"
                    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            }
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${toneIcon(tone)}`}>
                <Icon className="h-6 w-6" />
              </span>
              <span className={complete ? "rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white" : skipped ? "rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-700" : isDark ? "rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300" : "rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500"}>
                {complete ? "Done" : skipped ? "Skipped" : `Step ${index + 1}`}
              </span>
            </div>
            <h3 className={`mt-5 text-lg font-bold ${titleText}`}>{title}</h3>
            <p className={`mt-2 text-sm font-semibold leading-6 sm:min-h-[96px] ${mutedText}`}>{detail}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onClick}
                className={complete ? "rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50" : "rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500"}
              >
                {complete ? "Review" : skipped ? "Finish" : cta}
              </button>
              {!complete && ["contract", "team", "expenses", "data"].includes(id) && (
                <button
                  type="button"
                  onClick={() => skipSetupStep(id)}
                  className={isDark ? "rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-slate-300 hover:bg-white/5" : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"}
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className={cardClass}>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Finish setup checklist</p>
            <h2 className={`mt-1 text-2xl font-black ${titleText}`}>Skipped items stay visible until they are finished</h2>
          </div>
          <p className={`max-w-xl text-sm font-semibold leading-6 ${mutedText}`}>
            The dashboard can start working before every step is done, but Ask and Reports get smarter as each item is completed.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {setupPreviewCards.map(({ title, detail, Icon, status, tone }) => (
            <div key={title} className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-4" : "rounded-2xl border border-slate-200 bg-slate-50 p-4"}>
              <div className="flex items-center justify-between gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneIcon(tone)}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className={isDark ? "rounded-full bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-300" : "rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-500"}>
                  {status}
                </span>
              </div>
              <h3 className={`mt-4 text-base font-black ${titleText}`}>{title}</h3>
              <p className={`mt-2 text-sm font-semibold leading-6 ${mutedText}`}>{detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
