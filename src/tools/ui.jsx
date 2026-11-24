// Small UI kit for the public tool pages. Light theme, matches the landing page.
import { useId, useState } from "react";
import { isBadNumber } from "./format";

export function Panel({ title, description, aside, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {(title || aside) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-base font-extrabold text-slate-950">{title}</h3>}
            {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function FieldGrid({ children, cols = 2 }) {
  return <div className={`grid gap-4 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>{children}</div>;
}

const inputBase =
  "block w-full rounded-xl border bg-white py-2.5 text-[0.95rem] font-semibold text-slate-950 shadow-xs outline-none transition placeholder:font-medium placeholder:text-slate-300 focus:ring-4";

export function NumberField({ label, value, onChange, prefix, suffix, hint, placeholder = "0", wide = false }) {
  const id = useId();
  const bad = isBadNumber(value);
  const describedBy = [hint ? `${id}-hint` : null, bad ? `${id}-err` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="block text-sm font-bold text-slate-700">
        {label}
      </label>
      <div className="relative mt-1.5">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-slate-400">{prefix}</span>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={bad || undefined}
          aria-describedby={describedBy}
          className={`${inputBase} tabular-nums ${prefix ? "pl-7" : "pl-3"} ${suffix ? (suffix.length > 4 ? "pr-20" : "pr-12") : "pr-3"} ${
            bad ? "border-red-400 focus:border-red-500 focus:ring-red-500/15" : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/15"
          }`}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">{suffix}</span>
        )}
      </div>
      {bad && (
        <p id={`${id}-err`} className="mt-1 text-xs font-semibold text-red-600">
          Enter a number, like 1200 or 3.75.
        </p>
      )}
      {hint && !bad && (
        <p id={`${id}-hint`} className="mt-1 text-xs leading-5 text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

export function TextField({ label, value, onChange, type = "text", placeholder, hint, wide = false, autoComplete = "off", maxLength = 120 }) {
  const id = useId();
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="block text-sm font-bold text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={`${inputBase} mt-1.5 border-slate-300 px-3 focus:border-blue-500 focus:ring-blue-500/15`}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs leading-5 text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

export function SelectField({ label, value, onChange, options, wide = false }) {
  const id = useId();
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="block text-sm font-bold text-slate-700">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputBase} mt-1.5 border-slate-300 pl-3 pr-8 focus:border-blue-500 focus:ring-blue-500/15`}
      >
        {options.map((option) => {
          const opt = typeof option === "string" ? { value: option, label: option } : option;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export function Segmented({ label, value, onChange, options, hint }) {
  const name = useId();
  return (
    <fieldset>
      <legend className="block text-sm font-bold text-slate-700">{label}</legend>
      <div className="mt-1.5 inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="block rounded-lg px-3 py-1.5 text-sm font-bold text-slate-600 transition hover:text-slate-900 peer-checked:bg-white peer-checked:text-slate-950 peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500">
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {hint && <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>}
    </fieldset>
  );
}

export function CheckRow({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 transition hover:border-slate-300 has-[:checked]:border-blue-300 has-[:checked]:bg-blue-50/60">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
      />
      <span>
        <span className="block text-sm font-bold leading-5 text-slate-800">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-5 text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

const TONE_TEXT = {
  default: "text-slate-950",
  good: "text-emerald-600",
  bad: "text-red-600",
  warn: "text-amber-600",
};

export function Stat({ label, value, sub, tone = "default" }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-100">
      <p className="text-[0.7rem] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-extrabold tabular-nums ${TONE_TEXT[tone]}`}>{value}</p>
      {sub && <p className="text-xs font-medium text-slate-500">{sub}</p>}
    </div>
  );
}

const BADGE_TONE = {
  good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warn: "bg-amber-50 text-amber-800 ring-amber-200",
  bad: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
};

export function Badge({ tone = "info", children }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-black ring-1 ${BADGE_TONE[tone]}`}>{children}</span>;
}

// Horizontal bars, each as a share of `total`.
export function BarList({ items, total, formatValue }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const share = total > 0 ? Math.max(0, item.value) / total : 0;
        return (
          <li key={item.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold text-slate-700">{item.label}</span>
              <span className="font-bold tabular-nums text-slate-950">
                {formatValue(item.value)} <span className="font-semibold text-slate-400">· {Math.round(share * 100)}%</span>
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${item.className}`} style={{ width: `${Math.min(100, share * 100)}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Notes({ items, tone = "warn" }) {
  const dot = { warn: "bg-amber-500", good: "bg-emerald-500", bad: "bg-red-500", info: "bg-blue-500" }[tone];
  return (
    <ul className="space-y-2">
      {items.map((text) => (
        <li key={text} className="flex gap-2.5 text-sm leading-6 text-slate-700">
          <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

// "Copy link with these numbers" + "Reset". The link is only built on click.
export function ToolActions({ getShareUrl, onReset, shareLabel = "Copy link with these numbers" }) {
  const [status, setStatus] = useState("");

  const copy = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied. Anyone who opens it sees these numbers.");
    } catch {
      window.prompt("Copy this link:", url);
    }
    window.setTimeout(() => setStatus(""), 3500);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {getShareUrl && (
        <button
          type="button"
          onClick={copy}
          className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
        >
          {shareLabel}
        </button>
      )}
      {onReset && (
        <button type="button" onClick={onReset} className="rounded-xl px-3.5 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
          Reset to example
        </button>
      )}
      <p className="w-full text-xs font-semibold text-emerald-700" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}

// Slim bar pinned to the bottom of small screens while results are off screen.
export function MobileSummary({ show, label, value, tone = "default", targetId = "results" }) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-5 py-3 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.25)] backdrop-blur transition-transform duration-200 lg:hidden ${
        show ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
      aria-hidden={!show}
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className={`text-lg font-extrabold tabular-nums ${TONE_TEXT[tone]}`}>{value}</p>
        </div>
        <a href={`#${targetId}`} tabIndex={show ? 0 : -1} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">
          See results
        </a>
      </div>
    </div>
  );
}
