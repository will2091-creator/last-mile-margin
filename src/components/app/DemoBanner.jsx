import React from "react";
import { LayoutDashboard } from "../../shared";

export default function DemoBanner({ isDark, isDemoBannerDismissed, setIsDemoBannerDismissed }) {
  if (isDemoBannerDismissed) return null;

  return (
    <div className="mx-auto mb-4 max-w-[1600px]">
      <div className={isDark ? "flex items-center gap-3 rounded-xl border border-blue-400/30 bg-blue-500/10 px-3 py-2" : "flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2"}>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <LayoutDashboard className="h-3.5 w-3.5" />
        </span>
        <p className={isDark ? "min-w-0 flex-1 text-xs font-bold text-blue-200" : "min-w-0 flex-1 text-xs font-bold text-blue-800"}>
          <span className="font-black uppercase tracking-wide">Demo Workspace</span> — sample data is isolated from your real workspace
        </p>
        <button type="button" onClick={() => setIsDemoBannerDismissed(true)} className={isDark ? "shrink-0 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white" : "shrink-0 rounded-lg p-1 text-slate-400 hover:bg-blue-100 hover:text-slate-700"} aria-label="Dismiss demo banner">
          ✕
        </button>
      </div>
    </div>
  );
}
