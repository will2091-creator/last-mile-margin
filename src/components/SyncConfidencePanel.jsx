import React from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "../shared";

const getTone = (status = "") => {
  const text = String(status).toLowerCase();
  if (text.includes("failed") || text.includes("unavailable") || text.includes("local")) return "amber";
  if (text.includes("demo") || text.includes("blank")) return "blue";
  if (text.includes("synced") || text.includes("loaded") || text.includes("connected") || text.includes("ready")) return "green";
  return "blue";
};

export default function SyncConfidencePanel({
  isDark,
  appStateStatus,
  claimsStatus,
  teamStatus,
  isDemoMode = false,
  isDemoWorkspace = false,
}) {
  const statuses = [
    ["Workspace", isDemoMode ? "Demo workspace. Sync is intentionally off." : appStateStatus || "Workspace sync pending."],
    ["Claims", isDemoMode ? "Demo claims are isolated." : claimsStatus || "Claims sync pending."],
    ["Team Access", isDemoWorkspace ? "Team access is demo-only." : teamStatus || "Team access pending."],
  ];
  const overallTone = statuses.some(([, status]) => getTone(status) === "amber") ? "amber" : isDemoMode || isDemoWorkspace ? "blue" : "green";
  const Icon = overallTone === "amber" ? AlertTriangle : overallTone === "blue" ? ShieldCheck : CheckCircle2;
  const shellClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-3 shadow-xl shadow-black/20"
    : "rounded-2xl border border-slate-200 bg-white p-3 shadow-sm";
  const iconClass =
    overallTone === "amber"
      ? "bg-amber-500/10 text-amber-700"
      : overallTone === "blue"
        ? "bg-blue-500/10 text-blue-700"
        : "bg-emerald-500/10 text-emerald-700";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const titleText = isDark ? "text-white" : "text-slate-950";

  return (
    <section data-tour="sync-confidence" className={shellClass}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${iconClass}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className={isDark ? "text-xs font-semibold uppercase tracking-wide text-blue-200" : "text-xs font-semibold uppercase tracking-wide text-blue-700"}>Save and Sync Confidence</p>
            <h2 className={`mt-0.5 text-sm font-black ${titleText}`}>
              {overallTone === "amber" ? "Some data is local-only right now" : isDemoMode || isDemoWorkspace ? "Demo data is isolated" : "Workspace changes are trackable"}
            </h2>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[720px]">
          {statuses.map(([label, status]) => {
            const tone = getTone(status);
            return (
              <div key={label} className={isDark ? "rounded-xl bg-slate-950/60 px-3 py-2" : "rounded-xl bg-slate-50 px-3 py-2"}>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-[10px] font-semibold uppercase tracking-wide ${mutedText}`}>{label}</p>
                  <span className={tone === "amber" ? "text-[10px] font-bold text-amber-700" : tone === "green" ? "text-[10px] font-bold text-emerald-700" : "text-[10px] font-bold text-blue-600"}>
                    {tone === "amber" ? "Local" : tone === "green" ? "Ready" : "Info"}
                  </span>
                </div>
                <p className={`mt-1 truncate text-xs font-bold ${mutedText}`} title={status}>
                  {status}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
