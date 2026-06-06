import React from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck } from "../shared";

export default function LaunchQAChecklist({ isDark, checks = [] }) {
  const completeCount = checks.filter((item) => item.done).length;
  const percent = Math.round((completeCount / Math.max(checks.length, 1)) * 100);
  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

  return (
    <section data-tour="launch-qa-checklist" className={cardClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-600">Launch QA</p>
            <h2 className={`mt-1 text-xl font-black ${titleText}`}>{completeCount} of {checks.length} production checks ready</h2>
            <p className={`mt-2 max-w-3xl text-sm font-semibold leading-6 ${mutedText}`}>
              Use this as the SaaS hardening board before relying on the workspace for real operations.
            </p>
          </div>
        </div>
        <div className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-4 lg:w-72" : "rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:w-72"}>
          <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Readiness</p>
          <p className={`mt-1 text-3xl font-black ${titleText}`}>{percent}%</p>
          <div className={isDark ? "mt-3 h-2 overflow-hidden rounded-full bg-slate-950/70" : "mt-3 h-2 overflow-hidden rounded-full bg-slate-200"}>
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {checks.map((item) => (
          <div key={item.label} className={item.done ? isDark ? "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4" : "rounded-2xl border border-emerald-200 bg-emerald-50 p-4" : isDark ? "rounded-2xl border border-white/10 bg-white/5 p-4" : "rounded-2xl border border-slate-200 bg-slate-50 p-4"}>
            <div className="flex items-start gap-3">
              <span className={item.done ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white" : "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700"}>
                {item.done ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </span>
              <div>
                <p className={`text-sm font-black ${titleText}`}>{item.label}</p>
                <p className={`mt-1 text-xs font-semibold leading-5 ${mutedText}`}>{item.detail}</p>
                <p className={item.done ? "mt-2 text-xs font-black text-emerald-700" : "mt-2 text-xs font-black text-amber-700"}>
                  {item.done ? "Ready" : item.next}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
