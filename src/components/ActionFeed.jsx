import { useEffect, useRef, useState } from "react";
import { aiFetch } from "../lib/aiFetch";
import { AlertTriangle, BarChart3, CheckCircle2, ClipboardCheck, FileText, RotateCcw, ShieldCheck, Sparkles, Users } from "../shared";
import { feedCounts } from "../lib/actionFeed";

const ICONS = { AlertTriangle, BarChart3, ClipboardCheck, FileText, ShieldCheck, Sparkles, Users };

// The single prioritized "Do this now" feed. Items are produced deterministically by
// buildActionFeed(); this component only renders + executes them (via onExecute, which reuses
// the existing copilot event plumbing). The AI line is decorative — it never reorders the list.
export default function ActionFeed({ isDark, items = [], onExecute, aiSummary = true }) {
  const counts = feedCounts(items);
  const [ai, setAi] = useState(null);
  const aiKeyRef = useRef("");

  // One AI synthesis line per day, grounded in the (deterministic) feed. Reuses /api/watchdog.
  // Gated by the Notifications → "Daily Summary" setting.
  useEffect(() => {
    if (!items.length || !aiSummary) {
      setAi(null);
      return;
    }
    const key = `${new Date().toISOString().slice(0, 10)}-${items.length}-${counts.high}-${items[0].id}`;
    if (aiKeyRef.current === key) return;
    aiKeyRef.current = key;
    const fallback = counts.high
      ? `${counts.high} thing${counts.high > 1 ? "s" : ""} need you now — start with ${items[0].title.toLowerCase()}.`
      : `${items.length} item${items.length > 1 ? "s" : ""} to clear. Top of the list: ${items[0].title.toLowerCase()}.`;
    let cancelled = false;
    (async () => {
      try {
        const cached = JSON.parse(localStorage.getItem("finalMileActionFeedAI") || "null");
        if (cached && cached.key === key && cached.line) {
          if (!cancelled) setAi(cached.line);
          return;
        }
        const anomalies = items.slice(0, 8).map((i) => ({ id: i.id, severity: i.severity, title: i.title, detail: i.detail, kind: i.source }));
        const context = { anomalyCount: items.length, high: counts.high };
        const res = await aiFetch("/api/watchdog", { anomalies, context });
        if (!res.ok) throw new Error("ai down");
        const data = await res.json().catch(() => ({}));
        const line = data?.headline || fallback;
        if (!cancelled) setAi(line);
        try { localStorage.setItem("finalMileActionFeedAI", JSON.stringify({ key, line })); } catch { /* quota */ }
      } catch {
        if (!cancelled) setAi(fallback);
      }
    })();
    return () => { cancelled = true; };
  }, [items, counts.high, aiSummary]);

  const card = isDark ? "rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-5 shadow-card" : "rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/40 p-5 shadow-sm";
  const title = isDark ? "text-white" : "text-slate-950";
  const muted = isDark ? "text-slate-400" : "text-slate-500";
  const sevChip = (s) => (s === "high" ? "bg-red-500/15 text-red-500" : s === "medium" ? "bg-amber-500/15 text-amber-600" : "bg-slate-500/15 text-slate-400");
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, 5);

  return (
    <div data-tour="dashboard-needs-attention" className={card}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-600"><Sparkles className="h-5 w-5" /></span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-black ${title}`}>Do this now</h2>
              <span className="rounded-full bg-blue-600/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-600">AI</span>
              {counts.high > 0 && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-red-500">{counts.high} urgent</span>}
            </div>
            <p className={`text-xs font-semibold ${muted}`}>Your whole workspace, ranked into one to-do list.</p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className={`mt-4 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-8 text-center ${isDark ? "border-white/10" : "border-slate-200"}`}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></span>
          <p className={`text-sm font-black ${title}`}>All clear</p>
          <p className={`text-xs font-semibold ${muted}`}>Nothing needs you right now — log today's route to keep the picture current.</p>
        </div>
      ) : (
        <>
          {ai && <p className={`mt-3 text-sm font-bold leading-6 ${title}`}>{ai}</p>}
          <div className="mt-3 space-y-2">
            {shown.map((item) => {
              const Icon = ICONS[item.icon] || AlertTriangle;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onExecute?.(item)}
                  className={isDark ? "flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10" : "flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50"}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${sevChip(item.severity)}`}><Icon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-black ${title}`}>{item.title}</p>
                    {item.detail && <p className={`truncate text-xs ${muted}`}>{item.detail}</p>}
                  </div>
                  <span className="shrink-0 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-black text-white">{item.action?.label || "Do it"}</span>
                </button>
              );
            })}
          </div>
          {items.length > 5 && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className={`mt-2 flex items-center gap-1 text-xs font-bold ${isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}>
              <RotateCcw className="h-3 w-3" /> {expanded ? "Show less" : `+${items.length - 5} more`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
