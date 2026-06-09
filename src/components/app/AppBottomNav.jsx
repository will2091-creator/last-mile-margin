import React from "react";

export default function AppBottomNav({ isDark, activeAccent, visibleNavItems, activeTab, navigateToTab }) {
  return (
    <nav className={isDark ? "fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl shadow-black/40 backdrop-blur lg:hidden" : "fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl shadow-slate-950/15 backdrop-blur lg:hidden"}>
      <div className="grid grid-cols-4 gap-1">
        {visibleNavItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              type="button"
              data-tour={item.name === "Ask" ? "ask-assistant" : item.name === "Reports" ? "reports" : item.name === "Dashboard" ? "dashboard-nav" : undefined}
              data-tour-nav={item.name.toLowerCase()}
              onClick={() => navigateToTab(item.name)}
              className={
                isActive
                  ? `${activeAccent.button} flex min-h-14 flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] font-bold text-white`
                  : isDark
                    ? "flex min-h-14 flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] font-bold text-slate-400 hover:bg-white/5 hover:text-white"
                    : "flex min-h-14 flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }
            >
              <Icon className="mb-1 h-4 w-4" />
              <span className="max-w-full truncate">{item.name === "Operations" ? "Ops" : item.name}</span>
            </button>
          );
        })}
      </div>
      {visibleNavItems.length > 4 && (
        <div className={`mt-1 grid gap-1 ${["grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4"][Math.min(visibleNavItems.length - 4, 4) - 1]}`}>
          {visibleNavItems.slice(4).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                type="button"
                data-tour={item.name === "Ask" ? "ask-assistant" : item.name === "Reports" ? "reports" : item.name === "Dashboard" ? "dashboard-nav" : undefined}
                data-tour-nav={item.name.toLowerCase()}
                onClick={() => navigateToTab(item.name)}
                className={
                  isActive
                    ? `${activeAccent.button} flex min-h-14 flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] font-bold text-white`
                    : isDark
                      ? "flex min-h-14 flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] font-bold text-slate-400 hover:bg-white/5 hover:text-white"
                      : "flex min-h-14 flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }
              >
                <Icon className="mb-1 h-4 w-4 shrink-0" />
                <span className="max-w-full truncate">{item.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
