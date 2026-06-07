import React, { useState } from "react";
import { CheckCircle2 } from "../shared";
import {
  businessWorkflowSteps,
  getWorkflowActiveStep,
  getWorkflowStepStatus,
} from "../lib/businessWorkflow";

export default function BusinessWorkflowRail({
  isDark,
  setupStatus,
  activeTab,
  activeOperationsTab,
  activeFinanceTab,
  onNavigate,
  collapsible = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const showFull = !collapsible || expanded;
  const activeStepId = getWorkflowActiveStep({ activeTab, activeOperationsTab, activeFinanceTab });
  const activeStep = businessWorkflowSteps.find((step) => step.id === activeStepId) || businessWorkflowSteps[0];
  const completeCount = businessWorkflowSteps.filter((step) => getWorkflowStepStatus(step.id, setupStatus)).length;
  // Once every step is connected the workflow rail is just clutter — retire it.
  if (completeCount >= businessWorkflowSteps.length) return null;
  const shellClass = isDark
    ? "mx-auto mb-5 max-w-[1600px] rounded-2xl border border-white/10 bg-slate-900/80 p-3 shadow-card sm:p-4"
    : "mx-auto mb-5 max-w-[1600px] rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";

  if (!showFull) {
    return (
      <section data-tour="business-workflow" className={shellClass}>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span className={isDark ? "rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-200" : "rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700"}>
              Core Workflow
            </span>
            <span className={isDark ? "rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"}>
              {completeCount} of {businessWorkflowSteps.length} connected
            </span>
            <span className={`hidden truncate text-sm font-bold sm:inline ${mutedText}`}>
              Current step: {activeStep.label}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-sm font-black text-blue-600">
            Show steps
            <span aria-hidden="true">▾</span>
          </span>
        </button>
      </section>
    );
  }

  return (
    <section data-tour="business-workflow" className={shellClass}>
      {collapsible && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="flex items-center gap-1 text-xs font-black text-blue-600 hover:underline"
          >
            Hide steps
            <span aria-hidden="true">▴</span>
          </button>
        </div>
      )}
      <div className="mb-3 flex flex-col gap-3 sm:mb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Core Workflow
            </span>
            <span className={isDark ? "rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"}>
              {completeCount} of {businessWorkflowSteps.length} connected
            </span>
          </div>
          <h2 className={isDark ? "mt-2 text-base font-black text-white sm:text-xl" : "mt-2 text-base font-black text-slate-950 sm:text-xl"}>
            Run the business in order, then let the app connect the money.
          </h2>
          <p className={`mt-1 hidden max-w-4xl text-sm font-semibold leading-6 sm:block ${mutedText}`}>
            Contracts define revenue, teams perform the work, operations expose issues, claims and receipts adjust cost, profitability calculates margin, reports review history, and Ask explains what to fix.
          </p>
        </div>
        <div className={isDark ? "rounded-xl bg-slate-950/60 px-4 py-3" : "rounded-xl bg-slate-50 px-4 py-3"}>
          <p className={isDark ? "text-xs font-semibold uppercase tracking-wide text-slate-400" : "text-xs font-semibold uppercase tracking-wide text-slate-500"}>
            Current step
          </p>
          <p className={isDark ? "mt-1 text-sm font-black text-white" : "mt-1 text-sm font-black text-slate-950"}>
            {activeStep.label}
          </p>
          <p className={`mt-1 hidden max-w-sm text-xs font-semibold leading-5 sm:block ${mutedText}`}>
            Decision: {activeStep.decision}
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-4">
        {businessWorkflowSteps.map((step, index) => {
          const Icon = step.Icon;
          const isActive = step.id === activeStepId;
          const isComplete = getWorkflowStepStatus(step.id, setupStatus);

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onNavigate?.(step.tab)}
              className={
                isActive
                  ? "w-52 shrink-0 rounded-xl bg-blue-600 p-3 text-left text-white shadow-sm shadow-blue-600/20 transition hover:-translate-y-0.5 md:w-auto"
                  : isDark
                    ? "w-52 shrink-0 rounded-xl border border-white/10 bg-white/5 p-3 text-left text-slate-300 transition hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-card-hover md:w-auto"
                    : "w-52 shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md md:w-auto"
              }
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={isActive ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white" : isDark ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-blue-200" : "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600"}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className={isActive ? "block text-[10px] font-semibold uppercase tracking-wide text-blue-100" : isDark ? "block text-[10px] font-semibold uppercase tracking-wide text-slate-500" : "block text-[10px] font-semibold uppercase tracking-wide text-slate-400"}>
                      {index + 1}. {index === 0 ? "Starting point" : `After ${step.dependsOn}`}
                    </span>
                    <span className="block truncate text-sm font-black">{step.label}</span>
                    {step.parentTab && (
                      <span className={isActive ? "mt-0.5 block text-[10px] font-bold text-blue-200" : isDark ? "mt-0.5 block text-[10px] font-bold text-slate-600" : "mt-0.5 block text-[10px] font-bold text-slate-400"}>
                        Opens {step.parentTab} tab
                      </span>
                    )}
                  </span>
                </span>
                {isComplete && (
                  <CheckCircle2 className={isActive ? "h-4 w-4 shrink-0 text-white" : "h-4 w-4 shrink-0 text-emerald-600"} />
                )}
              </div>
              <p className={isActive ? "mt-2 hidden min-h-10 text-xs font-bold leading-5 text-blue-50 sm:block" : isDark ? "mt-2 hidden min-h-10 text-xs font-bold leading-5 text-slate-500 sm:block" : "mt-2 hidden min-h-10 text-xs font-bold leading-5 text-slate-500 sm:block"}>
                {step.purpose}
              </p>
              <p className={isActive ? "mt-2 hidden rounded-lg bg-white/10 px-2 py-1.5 text-[11px] font-bold leading-4 text-blue-50 lg:block" : isDark ? "mt-2 hidden rounded-lg bg-slate-950/70 px-2 py-1.5 text-[11px] font-bold leading-4 text-slate-400 lg:block" : "mt-2 hidden rounded-lg bg-white px-2 py-1.5 text-[11px] font-bold leading-4 text-slate-500 lg:block"}>
                Enter: {step.data}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
