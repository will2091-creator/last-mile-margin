import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw, ShieldCheck, Sparkles } from "../shared";
import { detectAnomalies, anomalyCounts } from "../lib/watchdog";

function loadDocs() {
  try {
    const raw = localStorage.getItem("finalMileComplianceDocs");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function WatchdogPanel({ isDark, navigateToTab, savedDays = [], claims = [], teams = [], contracts = [], today = null, appSettings = {} }) {
  const anomalies = useMemo(
    () => detectAnomalies({ savedDays, claims, teams, contracts, docs: loadDocs(), appSettings, today }),
    [savedDays, claims, teams, contracts, today, appSettings]
  );
  const counts = anomalyCounts(anomalies);

  const [brief, setBrief] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ready
  const cacheKeyRef = useRef("");

  const buildFallback = () => {
    if (!anomalies.length) {
      return { headline: "All clear — nothing flagged", summary: "No anomalies across margin, claims, teams, or compliance right now.", weeklyDigest: "A steady stretch. Keep logging daily snapshots and route photos so the Watchdog can spot shifts early.", topMove: "Keep your data current.", sentiment: "positive", source: "Computed" };
    }
    const top = anomalies[0];
    const high = anomalies.filter((a) => a.severity === "high");
    return {
      headline: `${anomalies.length} thing${anomalies.length > 1 ? "s" : ""} need attention${high.length ? ` — ${high.length} high` : ""}`,
      summary: `${top.title}. ${top.detail}`,
      weeklyDigest: `${anomalies.length} open signal${anomalies.length > 1 ? "s" : ""} this week (${counts.high} high, ${counts.medium} medium). Tackle the high-severity items first and keep claims and route photos current.`,
      topMove: `${top.title} — ${top.detail}`,
      sentiment: high.length ? "negative" : "neutral",
      source: "Computed",
    };
  };

  const generate = async (force = false) => {
    const cacheKey = `${new Date().toISOString().slice(0, 10)}-${anomalies.length}-${counts.high}`;
    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem("finalMileWatchdog") || "null");
        if (cached && cached.key === cacheKey && cached.brief) {
          setBrief(cached.brief);
          setStatus("ready");
          cacheKeyRef.current = cacheKey;
          return;
        }
      } catch {
        /* ignore */
      }
    }
    setStatus("loading");
    const fallback = buildFallback();
    let result;
    try {
      const context = {
        anomalyCount: anomalies.length,
        high: counts.high,
        medium: counts.medium,
        today,
        savedDaysCount: (savedDays || []).length,
        openClaims: (claims || []).filter((c) => c.status !== "Closed").length,
        teams: (teams || []).length,
      };
      const response = await fetch("/api/watchdog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anomalies: anomalies.map(({ id, severity, title, detail, kind }) => ({ id, severity, title, detail, kind })), context }),
      });
      if (!response.ok) throw new Error("AI unavailable");
      const data = await response.json().catch(() => ({}));
      if (!data || !data.summary) throw new Error("No briefing");
      result = {
        headline: data.headline || fallback.headline,
        summary: data.summary,
        weeklyDigest: data.weeklyDigest || fallback.weeklyDigest,
        topMove: data.topMove || fallback.topMove,
        sentiment: ["positive", "neutral", "negative"].includes(data.sentiment) ? data.sentiment : fallback.sentiment,
        source: "AI",
      };
    } catch {
      result = fallback;
    }
    setBrief(result);
    setStatus("ready");
    cacheKeyRef.current = cacheKey;
    try {
      localStorage.setItem("finalMileWatchdog", JSON.stringify({ key: cacheKey, brief: result }));
    } catch {
      /* ignore quota */
    }
  };

  useEffect(() => {
    const cacheKey = `${new Date().toISOString().slice(0, 10)}-${anomalies.length}-${counts.high}`;
    if (cacheKeyRef.current === cacheKey) return;
    generate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anomalies.length, counts.high]);

  const card = isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const title = isDark ? "text-white" : "text-slate-950";
  const muted = isDark ? "text-slate-400" : "text-slate-500";
  const sevChip = (s) => (s === "high" ? "bg-red-500/15 text-red-500" : s === "medium" ? "bg-amber-500/15 text-amber-500" : "bg-slate-500/15 text-slate-400");
  const sentimentDot = brief?.sentiment === "negative" ? "bg-red-500" : brief?.sentiment === "positive" ? "bg-emerald-500" : "bg-amber-500";

  return (
    <div data-tour="dashboard-watchdog" className={card}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-600"><ShieldCheck className="h-5 w-5" /></span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-black ${title}`}>AI Watchdog</h2>
              <span className="rounded-full bg-blue-600/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-600">AI</span>
              {counts.high > 0 && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-red-500">{counts.high} high</span>}
            </div>
            <p className={`text-xs font-semibold ${muted}`}>What changed and what needs attention — watched for you.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => generate(true)}
          disabled={status === "loading"}
          className={isDark ? "flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/5 disabled:opacity-50" : "flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-50"}
        >
          <RotateCcw className={`h-3.5 w-3.5 ${status === "loading" ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {status === "loading" && !brief && (
        <div className="mt-4 space-y-2">
          <div className="skeleton h-5 w-2/3 rounded"></div>
          <div className="skeleton h-4 w-full rounded"></div>
          <div className="skeleton h-12 w-full rounded-xl"></div>
        </div>
      )}

      {brief && (
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-2">
            {anomalies.length === 0 ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />}
            <div>
              <p className={`text-lg font-black leading-snug ${title}`}>{brief.headline}</p>
              <p className={`mt-1 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{brief.summary}</p>
            </div>
          </div>

          {anomalies.length > 0 && (
            <div className="space-y-2">
              {anomalies.slice(0, 5).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => navigateToTab?.(a.tab)}
                  className={isDark ? "flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10" : "flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100"}
                >
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${sevChip(a.severity)}`}>{a.severity}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-black ${title}`}>{a.title}</p>
                    <p className={`truncate text-xs ${muted}`}>{a.detail}</p>
                  </div>
                  <span className="shrink-0 text-lg text-slate-400">›</span>
                </button>
              ))}
              {anomalies.length > 5 && <p className={`text-xs font-semibold ${muted}`}>+{anomalies.length - 5} more</p>}
            </div>
          )}

          <div className={isDark ? "rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5" : "rounded-xl border border-blue-200 bg-blue-50 p-3.5"}>
            <p className="text-[11px] font-black uppercase tracking-wide text-blue-600">This week</p>
            <p className={`mt-1 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{brief.weeklyDigest}</p>
          </div>

          <div className="flex items-center gap-2 pt-0.5 text-[11px] font-semibold text-slate-500">
            <span className={`inline-block h-2 w-2 rounded-full ${sentimentDot}`}></span>
            <span>{brief.source === "AI" ? "AI watchdog" : "Computed"} · {anomalies.length} signal{anomalies.length === 1 ? "" : "s"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
