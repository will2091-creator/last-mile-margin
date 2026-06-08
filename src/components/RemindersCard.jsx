import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardCheck } from "../shared";
import { loadReminders, addReminder, removeReminder, REMINDERS_EVENT } from "../lib/reminders";

const fmtDue = (due) => {
  if (!due) return null;
  const d = new Date(`${due}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function RemindersCard({ isDark }) {
  const [list, setList] = useState(() => loadReminders());
  const [text, setText] = useState("");
  const [due, setDue] = useState("");

  useEffect(() => {
    const refresh = () => setList(loadReminders());
    window.addEventListener(REMINDERS_EVENT, refresh);
    return () => window.removeEventListener(REMINDERS_EVENT, refresh);
  }, []);

  const submit = () => {
    if (!text.trim()) return;
    addReminder({ text, due }); // fires REMINDERS_EVENT → refresh
    setText("");
    setDue("");
  };

  const today = new Date().toISOString().slice(0, 10);
  const card = isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const title = isDark ? "text-white" : "text-slate-950";
  const muted = isDark ? "text-slate-400" : "text-slate-500";
  const inputClass = isDark
    ? "rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
    : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500";

  const dueTone = (d) => {
    if (!d) return isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500";
    if (d < today) return "bg-red-500/15 text-red-500";
    if (d === today) return "bg-amber-500/15 text-amber-600";
    return isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600";
  };

  return (
    <div data-tour="dashboard-reminders" className={card}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-600"><ClipboardCheck className="h-5 w-5" /></span>
        <div>
          <h2 className={`text-base font-black ${title}`}>Reminders & follow-ups</h2>
          <p className={`text-xs font-semibold ${muted}`}>Your running list — or ask the AI to set one.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="e.g. Follow up on the Lowe's claim"
          className={`flex-1 ${inputClass}`}
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="Due date (optional)"
          className={`${inputClass} sm:w-40`}
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {list.length === 0 ? (
        <p className={`mt-4 text-sm font-semibold ${muted}`}>No reminders yet. Add a follow-up above, or ask the Copilot to remind you.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {list.map((r) => {
            const dueLabel = fmtDue(r.due);
            return (
              <li key={r.id} className={isDark ? "flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3" : "flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"}>
                <button
                  onClick={() => removeReminder(r.id)}
                  aria-label="Mark done"
                  title="Mark done"
                  className={`shrink-0 rounded-full text-slate-400 transition hover:text-emerald-500 ${isDark ? "" : ""}`}
                >
                  <CheckCircle2 className="h-5 w-5" />
                </button>
                <span className={`min-w-0 flex-1 text-sm font-semibold ${title}`}>{r.text}</span>
                {dueLabel && (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black ${dueTone(r.due)}`}>
                    {r.due < today ? "Overdue · " : r.due === today ? "Today · " : ""}{dueLabel}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
