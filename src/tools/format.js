// Formatting + parsing helpers for the public tools.

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fin = (n) => (Number.isFinite(n) ? n : 0);

// Whole dollars, never "-$0".
export function money(n) {
  const rounded = Math.round(fin(n));
  return usd0.format(rounded === 0 ? 0 : rounded);
}

export function money2(n) {
  const value = fin(n);
  return usd2.format(Math.abs(value) < 0.005 ? 0 : value);
}

export function pct(ratio, digits = 1) {
  return `${(fin(ratio) * 100).toFixed(digits)}%`;
}

// "1,200", "$95.50", " 20 " → number. Anything unparseable → 0.
export function cleanNum(value) {
  const parsed = Number(String(value ?? "").replace(/[$,%\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isBadNumber(value) {
  const text = String(value ?? "").replace(/[$,%\s]/g, "");
  return text !== "" && !Number.isFinite(Number(text));
}

// Turn a form of strings into numbers (non-strings pass through).
export function cleanForm(form) {
  return Object.fromEntries(Object.entries(form).map(([key, value]) => [key, typeof value === "string" ? cleanNum(value) : value]));
}

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, fin(n)));
