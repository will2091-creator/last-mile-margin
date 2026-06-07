import { Sparkles } from "../shared";

// Lightweight empty state for inline contexts — inside a table cell or a
// section panel — where the full EmptyState card chrome would be too heavy.
export function InlineEmpty({ isDark, Icon = Sparkles, title, hint }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <span className="relative flex h-12 w-12 items-center justify-center">
        <span aria-hidden className={`absolute inset-0 rounded-full ${isDark ? "bg-blue-400/10" : "bg-blue-500/10"}`} />
        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-600/30 ring-1 ring-inset ring-white/25">
          <Icon className="h-4 w-4" />
        </span>
      </span>
      <div>
        <p className={`text-sm font-black ${isDark ? "text-slate-200" : "text-slate-700"}`}>{title}</p>
        {hint && <p className={`mt-1 max-w-md text-xs font-semibold leading-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{hint}</p>}
      </div>
    </div>
  );
}

export default function EmptyState({
  isDark,
  eyebrow = "Getting started",
  title,
  description,
  Icon = Sparkles,
  primaryAction,
  secondaryActions = [],
  children,
  compact = false,
}) {
  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const cardClass = isDark
    ? "rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-transparent p-5 shadow-card"
    : "rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm";

  // Crafted "medallion + halo" treatment so the empty state reads as illustrated
  // rather than a flat icon chip. Scales down for the compact variant.
  const cluster = compact ? "h-14 w-14" : "h-[72px] w-[72px]";
  const medallion = compact ? "h-11 w-11" : "h-14 w-14";
  const iconSize = compact ? "h-5 w-5" : "h-7 w-7";
  const haloOuter = isDark ? "bg-blue-400/5" : "bg-blue-500/5";
  const haloInner = isDark ? "bg-blue-400/10" : "bg-blue-500/10";

  const renderAction = (action, index, primary = false) => {
    if (!action) return null;
    const buttonClass = primary
      ? "rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
      : isDark
        ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:text-slate-500"
        : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400";

    return (
      <button
        key={`${action.label}-${index}`}
        type="button"
        onClick={action.onClick}
        disabled={action.disabled}
        title={action.helper || action.label}
        aria-label={action.ariaLabel || action.label}
        className={buttonClass}
      >
        {action.label}
      </button>
    );
  };

  return (
    <section className={cardClass}>
      <div className={compact ? "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" : "flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"}>
        <div className="flex min-w-0 items-start gap-4">
          <div className={`relative flex ${cluster} shrink-0 items-center justify-center`}>
            <span aria-hidden className={`absolute inset-0 rounded-full ${haloOuter}`} />
            <span aria-hidden className={`absolute inset-[6px] rounded-full ${haloInner}`} />
            <span className={`relative flex ${medallion} items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-inset ring-white/25`}>
              <Icon className={iconSize} />
            </span>
          </div>
          <div className="min-w-0">
            <p className={isDark ? "text-xs font-semibold uppercase tracking-wide text-blue-200" : "text-xs font-semibold uppercase tracking-wide text-blue-700"}>{eyebrow}</p>
            <h2 className={`${compact ? "text-xl" : "text-2xl"} mt-1 font-black leading-tight ${titleText}`}>{title}</h2>
            {description && <p className={`mt-2 max-w-3xl text-sm font-semibold leading-6 ${mutedText}`}>{description}</p>}
            {children && <div className="mt-4">{children}</div>}
          </div>
        </div>

        {(primaryAction || secondaryActions.length > 0) && (
          <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
            {renderAction(primaryAction, 0, true)}
            {secondaryActions.map((action, index) => renderAction(action, index))}
          </div>
        )}
      </div>
    </section>
  );
}
