import React from "react";
import { ChevronDown } from "lucide-react";
import lastMileMarginLogo from "../../assets/last-mile-margin-logo.png";
import lastMileMarginLogoDark from "../../assets/last-mile-margin-logo-darkmode.png";
import { Moon, Sun } from "../../shared";

export default function AppSidebar({
  isDark,
  activeAccent,
  visibleNavItems,
  activeTab,
  activeOperationsTab,
  activeFinanceTab,
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
    <aside className={isDark ? "sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-slate-950 p-4 lg:flex" : "sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white p-4 lg:flex"}>
      {/* Brand + theme — pinned at the top */}
      <div className="shrink-0">
        <div data-tour="nav-brand" className="mb-4 flex justify-center">
          <img
            src={isDark ? lastMileMarginLogoDark : lastMileMarginLogo}
            alt="Last Mile Margin"
            className="h-16 w-32 object-contain"
          />
        </div>

        <button
          data-tour="nav-theme"
          onClick={toggleThemeMode}
          className={
            isDark
              ? "mb-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10"
              : "mb-3 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
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
      </div>

      {/* Nav — the only region that scrolls, and only if it must */}
      <nav className="-mr-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-2">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActiveParent = activeTab === item.name;
          // Which child is "current" when this parent is open (Operations/Finance only).
          const activeChild = item.name === "Operations" ? activeOperationsTab : item.name === "Finance" ? activeFinanceTab : null;
          return (
            <div key={item.name}>
              <button
                data-tour={item.name === "Ask" ? "ask-assistant" : item.name === "Reports" ? "reports" : item.name === "Dashboard" ? "dashboard-nav" : undefined}
                data-tour-nav={item.name.toLowerCase()}
                onClick={() => {
                  navigateToTab(item.name);
                }}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold ${
                  isActiveParent
                    ? `${activeAccent.button} text-white`
                    : isDark
                    ? "text-slate-400 hover:bg-white/5 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.name}</span>
                {item.children && (
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isActiveParent ? "" : "-rotate-90"} ${isActiveParent ? "opacity-90" : "opacity-50"}`} />
                )}
              </button>

              {item.children && isActiveParent && (
                <div className="mt-1 space-y-0.5">
                  {item.children.map((child) => {
                    const childActive = isActiveParent && activeChild === child.name;
                    return (
                      <button
                        key={child.name}
                        data-tour-nav={child.name.toLowerCase()}
                        onClick={() => navigateToTab(child.tab)}
                        className={`flex w-full items-center gap-2 rounded-lg py-1.5 pl-11 pr-3 text-left text-xs font-bold ${
                          childActive
                            ? isDark
                              ? "bg-white/10 text-white"
                              : "bg-blue-50 text-blue-700"
                            : isDark
                            ? "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${childActive ? "bg-blue-500" : isDark ? "bg-slate-600" : "bg-slate-300"}`} />
                        {child.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Tour + account — pinned at the bottom, always visible */}
      <div className="shrink-0 pt-3">
        {onStartTour && (
          <button
            data-tour="nav-take-tour"
            onClick={onStartTour}
            className={
              isDark
                ? "flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/10"
                : "flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
            }
          >
            Take the tour
          </button>
        )}

        <div className="mt-3 text-sm text-slate-500">
          <p className="truncate">{appSettings.companyName}</p>
          <p className="truncate">{authUser?.email || "Owner Account"}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide">{roleLabel || currentUserRole}</p>
          <button onClick={signOut} className="mt-2 rounded-lg px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-500/10">Sign Out</button>
          <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
            <a href="#/terms" className="hover:underline">Terms</a>
            <span aria-hidden="true">·</span>
            <a href="#/privacy" className="hover:underline">Privacy</a>
          </p>
        </div>
      </div>
    </aside>
  );
}
