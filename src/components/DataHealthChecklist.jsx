import React from "react";
import { CheckCircle2, AlertTriangle } from "../shared";

const healthLabels = {
  contract: ["Contracts", "Customer terms and route pay"],
  team: ["Teams", "Drivers, helpers, trucks, and routes"],
  expenses: ["Expenses", "Labor, fuel, truck, maintenance, and other costs"],
  claims: ["Claims", "Loss exposure and dispute readiness"],
  receipts: ["Receipts", "Expense proof from mobile uploads"],
  reports: ["Snapshots", "Daily history for reports and trends"],
};

export default function DataHealthChecklist({ isDark, status, onAction, compact = false }) {
  if (!status) return null;
  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const keys = compact ? ["contract", "team", "expenses", "claims"] : Object.keys(healthLabels);

  return (
    <section className={cardClass}>
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-wide text-blue-600">Data readiness</p>
        <h2 className={`mt-1 text-xl font-black ${titleText}`}>What Ask, Reports, and Dashboard can see</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {keys.map((key) => {
          const [label, detail] = healthLabels[key];
          const complete = Boolean(status.checks[key]);
          const item = status.items.find((entry) => entry.id === key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => !complete && onAction?.(item)}
              className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-blue-500/50" : "rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-white"}
            >
              <div className="flex items-start gap-3">
                <span className={complete ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700" : "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700"}>
                  {complete ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </span>
                <div>
                  <p className={`font-black ${titleText}`}>{label}</p>
                  <p className={`mt-1 text-xs font-semibold leading-5 ${mutedText}`}>{detail}</p>
                  <p className={complete ? "mt-2 text-xs font-black text-emerald-700" : "mt-2 text-xs font-black text-amber-700"}>
                    {complete ? "Ready" : "Missing"}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

