import React from "react";
import lastMileMarginLogo from "../../assets/last-mile-margin-logo-transparent.svg";
import lastMileMarginLogoDark from "../../assets/last-mile-margin-logo-transparent-dark.svg";
import { navPreviewContent } from "../guidedDemoContent";
import { Moon, Sun } from "../../shared";

export default function AppSidebar({
  isDark,
  activeAccent,
  visibleNavItems,
  activeTab,
  appSettings,
  isDemoMode,
  isDemoWorkspace,
  authUser,
  currentUserRole,
  roleLabel,
  toggleThemeMode,
  navigateToTab,
  signOut,
}) {
  return (
    <aside className={isDark ? "sticky top-0 hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-white/10 bg-slate-950 p-5 lg:block" : "sticky top-0 hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-5 lg:block"}>
      <div className="mb-6 flex justify-center">
        <img
          src={isDark ? lastMileMarginLogoDark : lastMileMarginLogo}
          alt="Last Mile Margin"
          className="h-24 w-40 object-contain"
        />
      </div>

      <button
        onClick={toggleThemeMode}
        className={
          isDark
            ? "mb-6 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
            : "mb-6 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
        }
      >
        <span className="flex items-center gap-3">
          {isDark ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-blue-600" />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
        <span className={isDark ? "rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white" : "rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600"}>
          {isDark ? "On" : "Off"}
        </span>
      </button>

      <nav className="space-y-2">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const preview = navPreviewContent[item.name];
          return (
            <button
              key={item.name}
              data-tour={item.name === "Ask" ? "ask-assistant" : item.name === "Reports" ? "reports" : item.name === "Dashboard" ? "dashboard-nav" : undefined}
              data-tour-nav={item.name.toLowerCase()}
              onClick={() => {
                navigateToTab(item.name);
              }}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${
                activeTab === item.name
                  ? `${activeAccent.button} text-white`
                  : isDark
                  ? "text-slate-400 hover:bg-white/5 hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.name}
              {preview && (
                <span
                  role="tooltip"
                  className={
                    isDark
                      ? "pointer-events-none absolute left-[calc(100%+14px)] top-1/2 z-[120] hidden w-80 -translate-y-1/2 rounded-2xl border border-white/10 bg-slate-950 p-4 text-left text-white opacity-0 shadow-2xl shadow-black/40 group-hover:block group-hover:opacity-100"
                      : "pointer-events-none absolute left-[calc(100%+14px)] top-1/2 z-[120] hidden w-80 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-4 text-left text-slate-950 opacity-0 shadow-2xl shadow-slate-950/20 group-hover:block group-hover:opacity-100"
                  }
                >
                  <span className="block text-sm font-black">{preview.title}</span>
                  <span className={isDark ? "mt-2 block text-xs font-semibold leading-5 text-slate-300" : "mt-2 block text-xs font-semibold leading-5 text-slate-600"}>
                    {preview.description}
                  </span>
                  <span className={isDark ? "mt-3 block rounded-xl bg-white/5 px-3 py-2 text-xs font-bold leading-5 text-slate-300" : "mt-3 block rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-600"}>
                    Why it matters: {preview.matters}
                  </span>
                  <span className="mt-3 flex flex-wrap gap-1.5">
                    {preview.metrics.map((metric) => (
                      <span key={metric} className={isDark ? "rounded-full bg-blue-500/15 px-2 py-1 text-[10px] font-black text-blue-100" : "rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700"}>
                        {metric}
                      </span>
                    ))}
                  </span>
                  <span className={isDark ? "mt-3 block text-xs font-black text-emerald-200" : "mt-3 block text-xs font-black text-emerald-700"}>
                    Outcome: {preview.outcome}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-10 text-sm text-slate-500">
        <p>{appSettings.companyName}</p>
        <p>{isDemoMode ? "Demo Workspace" : isDemoWorkspace ? "demo123" : authUser?.email || "Owner Account"}</p>
        <p className="mt-1 text-xs font-black uppercase tracking-wide">{roleLabel || currentUserRole}</p>
          <button onClick={signOut} className="mt-3 rounded-lg px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-500/10">Sign Out</button>
      </div>
    </aside>
  );
}
