import React from "react";
import lastMileMarginLogo from "../../assets/last-mile-margin-logo-transparent.svg";
import lastMileMarginLogoDark from "../../assets/last-mile-margin-logo-transparent-dark.svg";
import { Moon, Sun } from "../../shared";

export default function AppSidebar({
  isDark,
  activeAccent,
  visibleNavItems,
  activeTab,
  appSettings,
  authUser,
  currentUserRole,
  roleLabel,
  toggleThemeMode,
  navigateToTab,
  onStartTour,
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
            </button>
          );
        })}
      </nav>

      {onStartTour && (
        <button
          onClick={onStartTour}
          className={
            isDark
              ? "mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/10"
              : "mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
          }
        >
          Take the tour
        </button>
      )}

      <div className="mt-6 text-sm text-slate-500">
        <p>{appSettings.companyName}</p>
        <p>{authUser?.email || "Owner Account"}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide">{roleLabel || currentUserRole}</p>
          <button onClick={signOut} className="mt-3 rounded-lg px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-500/10">Sign Out</button>
      </div>
    </aside>
  );
}
