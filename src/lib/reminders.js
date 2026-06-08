// Owner reminders / follow-ups — a small localStorage-backed store, mirroring the
// other leaf features (compliance docs). The Ask Copilot can create reminders agentically
// ("remind me to follow up on the Lowe's claim"), and they surface on the dashboard.

const KEY = "finalMileReminders";
export const REMINDERS_EVENT = "fmm:reminders-changed";

export function loadReminders() {
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
  // Let any mounted RemindersCard refresh, regardless of where the write came from.
  try {
    window.dispatchEvent(new CustomEvent(REMINDERS_EVENT));
  } catch {
    /* non-browser */
  }
  return list;
}

// addReminder({ text, due }) -> the created reminder. `due` is an optional YYYY-MM-DD.
export function addReminder({ text, due } = {}) {
  const clean = `${text || ""}`.trim();
  if (!clean) return null;
  const reminder = {
    id: `R-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
    text: clean.slice(0, 200),
    due: due && /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : "",
    createdAt: new Date().toISOString(),
  };
  const list = loadReminders();
  persist([reminder, ...list]);
  return reminder;
}

export function removeReminder(id) {
  return persist(loadReminders().filter((r) => r.id !== id));
}

export function reminderCount() {
  return loadReminders().length;
}
