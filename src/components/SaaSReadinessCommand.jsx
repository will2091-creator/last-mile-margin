import React from "react";
import {
  Bot,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Users,
} from "../shared";
import { getNextBestSetupAction } from "../lib/onboarding";

export default function SaaSReadinessCommand({
  isDark,
  setupStatus,
  productTourStatus,
  metrics,
  onAction,
  onNavigate,
  onStartDemo,
  onLaunchDemo,
}) {
  if (!setupStatus) return null;

  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const nextAction = getNextBestSetupAction(setupStatus);
  const readyTracks = [
    Boolean(setupStatus.checks.contract && setupStatus.checks.team && setupStatus.checks.expenses),
    Boolean(productTourStatus?.hasCompletedTour),
    true,
    true,
    Boolean(setupStatus.counts.contracts || setupStatus.counts.imports || setupStatus.counts.receipts),
    true,
    Boolean(setupStatus.checks.reports),
    Boolean(setupStatus.checks.ask),
    true,
    Boolean(setupStatus.isMostlyComplete),
  ].filter(Boolean).length;
  const readinessScore = Math.round((readyTracks / 10) * 100);

  const tracks = [
    {
      title: "Core workflow",
      detail: "Contracts, teams, operations, claims, receipts, profitability, reports, and Ask are connected in the owner workflow.",
      ready: setupStatus.checks.contract && setupStatus.checks.team && setupStatus.checks.expenses,
      Icon: Target,
      actionLabel: "Set Up Contracts",
      onClick: () => onAction?.({ id: "contract" }),
    },
    {
      title: "Guided onboarding",
      detail: "The walkthrough teaches the software in business order and can be shut off instantly from the top control.",
      ready: Boolean(productTourStatus?.hasCompletedTour),
      Icon: Sparkles,
      actionLabel: productTourStatus?.hasCompletedTour ? "Review Dashboard" : "Run Demo",
      onClick: () => (productTourStatus?.hasCompletedTour ? onNavigate?.("Dashboard") : onStartDemo?.()),
    },
    {
      title: "Empty-state guidance",
      detail: "Every setup gap points to the next useful owner action instead of leaving a blank screen.",
      ready: true,
      Icon: ClipboardCheck,
      actionLabel: nextAction.actionLabel,
      onClick: () => onAction?.(nextAction),
    },
    {
      title: "Dashboard clarity",
      detail: "The command center shows profit, revenue, costs, margin, claims exposure, readiness, and attention items.",
      ready: true,
      Icon: LayoutDashboard,
      actionLabel: "Open Dashboard",
      onClick: () => onNavigate?.("Dashboard"),
    },
    {
      title: "Fast data entry",
      detail: "Owners can start from contract setup, team setup, expense setup, or AI Intake instead of hunting through tabs.",
      ready: Boolean(setupStatus.counts.contracts || setupStatus.counts.imports || setupStatus.counts.receipts),
      Icon: Upload,
      actionLabel: "Import Documents",
      onClick: () => onAction?.({ id: "data", tab: "Intake" }),
    },
    {
      title: "Account controls",
      detail: "Settings centralizes company profile, targets, team access, dashboard layout, and demo controls.",
      ready: true,
      Icon: Settings,
      actionLabel: "Open Settings",
      onClick: () => onNavigate?.("Settings"),
    },
    {
      title: "Export-ready reports",
      detail: "Saved snapshots turn daily work into weekly, claims, route, team, and financial reporting.",
      ready: Boolean(setupStatus.checks.reports),
      Icon: FileDown,
      actionLabel: "Review Reports",
      onClick: () => onNavigate?.("Reports"),
    },
    {
      title: "Ask AI with context",
      detail: "Ask becomes useful after it can reference contracts, teams, claims, receipts, saved days, and reports.",
      ready: Boolean(setupStatus.checks.ask),
      Icon: Bot,
      actionLabel: "Open Ask",
      onClick: () => onNavigate?.("Ask"),
    },
    {
      title: "Trust and safety",
      detail: "Demo data is isolated, sync status is visible, sample data can be cleared, and exports stay under owner control.",
      ready: true,
      Icon: ShieldCheck,
      actionLabel: "Review Controls",
      onClick: () => onNavigate?.("Settings"),
    },
    {
      title: "Launch QA",
      detail: "A launch-ready account has contracts, teams, expenses, imports, snapshots, reports, and Ask context filled in.",
      ready: Boolean(setupStatus.isMostlyComplete),
      Icon: FileText,
      actionLabel: setupStatus.isMostlyComplete ? "Open Reports" : nextAction.actionLabel,
      onClick: () => (setupStatus.isMostlyComplete ? onNavigate?.("Reports") : onAction?.(nextAction)),
    },
  ];

  const metricCards = [
    ["Profit", metrics?.profitLabel || "$0.00", "Owner outcome"],
    ["Margin", metrics?.marginLabel || "0%", "Pricing health"],
    ["Claims", metrics?.claimsLabel || "0 open", "Money leak risk"],
    ["Team readiness", metrics?.readinessLabel || "0%", "Daily execution"],
  ];

  return (
    <section className={isDark ? "rounded-2xl border border-blue-400/20 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-5 shadow-xl shadow-black/20" : "rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-emerald-50 p-5 shadow-sm"}>
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
              SaaS Command Center
            </span>
            <span className={isDark ? "rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300" : "rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600"}>
              {readinessScore}% ready
            </span>
          </div>
          <h2 className={`mt-3 max-w-2xl text-3xl font-black leading-tight ${titleText}`}>Your operating system is being assembled.</h2>
          <p className={`mt-2 max-w-2xl text-sm font-semibold leading-6 ${mutedText}`}>
            Final Mile Margin is strongest when the owner can capture work fast, see what matters today, prove expenses, control claims, export history, and ask questions against real business data.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {metricCards.map(([label, value, note]) => (
              <div key={label} className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-4" : "rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm"}>
                <p className={isDark ? "text-xs font-black uppercase tracking-wide text-slate-400" : "text-xs font-black uppercase tracking-wide text-slate-500"}>{label}</p>
                <p className={`mt-1 text-2xl font-black ${titleText}`}>{value}</p>
                <p className={`mt-1 text-xs font-bold ${mutedText}`}>{note}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => onAction?.(nextAction)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500">
              {nextAction.actionLabel}
            </button>
            <button type="button" onClick={() => onAction?.({ id: "data", tab: "Intake" })} className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/5" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}>
              Quick Intake
            </button>
            {onLaunchDemo && (
              <button type="button" onClick={() => onLaunchDemo({ reset: true, startGuidedDemo: true, resetTour: true })} className={isDark ? "rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-200 hover:bg-emerald-500/15" : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 hover:bg-emerald-100"}>
                Fresh Demo
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {tracks.map((track) => {
            const Icon = track.Icon;
            return (
              <button
                key={track.title}
                type="button"
                onClick={track.onClick}
                className={track.ready
                  ? isDark
                    ? "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-left hover:bg-emerald-500/15"
                    : "rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left hover:bg-emerald-100"
                  : isDark
                    ? "rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:border-blue-400/40 hover:bg-white/10"
                    : "rounded-2xl border border-slate-200 bg-white/85 p-4 text-left shadow-sm hover:border-blue-200 hover:bg-blue-50"}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={track.ready ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white" : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"}>
                    {track.ready ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </span>
                  <span className={track.ready ? "rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-black text-white" : isDark ? "rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black text-slate-300" : "rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600"}>
                    {track.ready ? "Ready" : "Next"}
                  </span>
                </div>
                <h3 className={`mt-3 text-sm font-black ${titleText}`}>{track.title}</h3>
                <p className={`mt-1 min-h-14 text-xs font-semibold leading-5 ${mutedText}`}>{track.detail}</p>
                <p className={track.ready ? "mt-3 text-xs font-black text-emerald-700" : "mt-3 text-xs font-black text-blue-600"}>
                  {track.ready ? "Operational" : track.actionLabel}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
