// Owner expense receipts — a localStorage-backed store with full CRUD (mirrors the
// reminders / compliance-doc leaf features). Web receipts are scanned with AI or added
// manually here; mobile-uploaded receipts are merged in read-only for display.

const KEY = "finalMileReceipts";
export const RECEIPTS_EVENT = "fmm:receipts-changed";

export const RECEIPT_CATEGORIES = ["Fuel", "Maintenance", "Tolls & Parking", "Supplies", "Equipment", "Insurance", "Meals", "Other"];

export function loadReceipts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore quota */
  }
  try {
    window.dispatchEvent(new CustomEvent(RECEIPTS_EVENT));
  } catch {
    /* non-browser */
  }
  return list;
}

const normalizeCategory = (c) => (RECEIPT_CATEGORIES.includes(c) ? c : "Other");

// addReceipt({ vendor, amount, category, date, notes, source }) -> the created receipt.
export function addReceipt({ vendor, amount, category, date, notes, source = "manual" } = {}) {
  const receipt = {
    id: `RC-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
    vendor: `${vendor || "Unknown vendor"}`.trim().slice(0, 120),
    amount: Math.max(0, Number(amount) || 0),
    category: normalizeCategory(category),
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10),
    notes: `${notes || ""}`.trim().slice(0, 200),
    source,
    createdAt: new Date().toISOString(),
  };
  persist([receipt, ...loadReceipts()]);
  return receipt;
}

export function updateReceipt(id, patch = {}) {
  const next = { ...patch };
  if (next.category) next.category = normalizeCategory(next.category);
  if (next.amount != null) next.amount = Math.max(0, Number(next.amount) || 0);
  return persist(loadReceipts().map((r) => (r.id === id ? { ...r, ...next } : r)));
}

export function removeReceipt(id) {
  return persist(loadReceipts().filter((r) => r.id !== id));
}
