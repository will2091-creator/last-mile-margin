import React from "react";
import { currency } from "../../shared";

export default function RouteInputSections({
  isDark,
  routeInputSections,
  routeToneClass,
  openRouteSectionEditor,
  titleText,
  mutedText,
  rowBorder,
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {routeInputSections.map((section) => {
        const Icon = section.icon;
        return (
          <button
            key={section.id}
            type="button"
            data-route-editor-trigger="true"
            onClick={(event) => openRouteSectionEditor(section.id, event)}
            className={isDark ? "group rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-400/50 hover:bg-slate-950/80 hover:shadow-card-hover" : "group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-md"}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${routeToneClass[section.tone]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className={`text-base font-black ${titleText}`}>{section.title}</p>
                  <p className={`mt-1 line-clamp-2 text-xs font-semibold ${mutedText}`}>{section.subtitle}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                Open
              </span>
            </div>
            <div className={`mt-5 border-t pt-4 ${rowBorder}`}>
              <p className={`safe-number text-2xl font-black ${section.value >= 0 ? titleText : "text-red-600"}`}>
                {currency.format(section.value)}
              </p>
              <p className={`mt-1 truncate text-xs font-bold ${mutedText}`}>{section.note}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
