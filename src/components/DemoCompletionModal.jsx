import React from "react";
import { createPortal } from "react-dom";
import { BarChart3, Bot, BriefcaseBusiness, CheckCircle2, FileText, ReceiptText, ShieldCheck, Truck, X } from "lucide-react";

const journey = [
  ["Contract", "Rate terms create revenue.", BriefcaseBusiness],
  ["Team", "Drivers, helpers, and trucks do the work.", Truck],
  ["Operations", "Daily execution creates proof and risk signals.", ShieldCheck],
  ["Claims", "Damage, disputes, and chargebacks affect margin.", FileText],
  ["Receipts", "Expense proof lowers guesswork.", ReceiptText],
  ["Profitability", "Revenue minus costs shows margin.", BarChart3],
  ["Reports", "History turns into review decisions.", FileText],
  ["AI Insights", "Ask explains what needs attention.", Bot],
];

export default function DemoCompletionModal({ isOpen, isDark = false, onClose, onRestart }) {
  if (!isOpen || typeof document === "undefined") return null;

  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-300" : "text-slate-600";
  const panelClass = isDark
    ? "relative max-h-[calc(100vh-32px)] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-5 text-white shadow-2xl shadow-black/60"
    : "relative max-h-[calc(100vh-32px)] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-2xl shadow-slate-950/25";
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-white/5 p-4"
    : "rounded-2xl border border-slate-200 bg-slate-50 p-4";

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/70 p-4">
      <div role="dialog" aria-modal="true" aria-label="Final Mile Margin walkthrough complete" className={panelClass}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close completion screen"
          className={isDark ? "absolute right-4 top-4 rounded-xl p-2 text-slate-300 hover:bg-white/10" : "absolute right-4 top-4 rounded-xl p-2 text-slate-500 hover:bg-slate-100"}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <span className={isDark ? "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-100" : "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700"}>
                Walkthrough Complete
              </span>
            </div>
            <h2 className={`mt-4 max-w-3xl text-3xl font-black leading-tight ${titleText}`}>
              Congratulations, you completed the Final Mile Margin walkthrough.
            </h2>
            <p className={`mt-3 max-w-3xl text-sm font-semibold leading-6 ${mutedText}`}>
              You have seen how contracts, teams, operations, claims, receipts, profitability, reports, and AI connect into one business workflow.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
            >
              Return to Dashboard
            </button>
            <button
              type="button"
              onClick={onRestart}
              className={isDark ? "rounded-xl border border-white/10 px-5 py-2.5 text-sm font-black text-slate-200 hover:bg-white/5" : "rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50"}
            >
              Restart Walkthrough
            </button>
          </div>
        </div>

        <div className={isDark ? "mt-6 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4" : "mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4"}>
          <p className={isDark ? "text-xs font-black uppercase tracking-wide text-blue-100" : "text-xs font-black uppercase tracking-wide text-blue-700"}>Business Journey Map</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {journey.map(([title, detail, Icon], index) => (
              <div key={title} className={cardClass}>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-black ${titleText}`}>{index + 1}. {title}</p>
                    <p className={`mt-1 text-xs font-bold leading-5 ${mutedText}`}>{detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ["Know what every page does", "Each tab now has a clear role in the business workflow."],
            ["Know how money flows", "Contracts create revenue, receipts and claims reduce margin, and reports show history."],
            ["Know what to do next", "Use the Dashboard to decide what needs attention today."],
          ].map(([title, detail]) => (
            <div key={title} className={cardClass}>
              <p className={`text-sm font-black ${titleText}`}>{title}</p>
              <p className={`mt-1 text-xs font-bold leading-5 ${mutedText}`}>{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
