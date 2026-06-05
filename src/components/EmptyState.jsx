import { Sparkles } from "../shared";

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
    ? "rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5 shadow-xl shadow-black/20"
    : "rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm";

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
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <Icon className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className={isDark ? "text-xs font-black uppercase tracking-wide text-blue-200" : "text-xs font-black uppercase tracking-wide text-blue-700"}>{eyebrow}</p>
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
