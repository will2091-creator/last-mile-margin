import React from "react";
import { Sparkles } from "../shared";

export default function PageIntro({
  isDark,
  eyebrow,
  title,
  description,
  Icon = Sparkles,
  chips = [],
  actions = [],
  children,
}) {
  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const shellClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

  return (
    <section className={shellClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className={isDark ? "hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300 sm:flex" : "hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:flex"}>
            <Icon className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {eyebrow && <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">{eyebrow}</span>}
              {chips.map((chip) => (
                <span key={chip} className={isDark ? "rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"}>
                  {chip}
                </span>
              ))}
            </div>
            <h1 className={`text-3xl font-black tracking-tight sm:text-4xl ${titleText}`}>{title}</h1>
            {description && <p className={`mt-2 max-w-3xl text-sm font-semibold leading-6 ${mutedText}`}>{description}</p>}
          </div>
        </div>

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                title={action.helper || action.label}
                className={index === 0
                  ? "rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                  : isDark
                    ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-300 hover:bg-white/5"
                    : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}

