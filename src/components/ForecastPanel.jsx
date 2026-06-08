import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  BarChart3,
  CartesianGrid,
  CheckCircle2,
  ResponsiveContainer,
  RotateCcw,
  Target,
  Tooltip,
  XAxis,
  YAxis,
  currency,
} from "../shared";
import { computeForecast, buildForecastNarrative } from "../lib/forecast";

const fmtAxis = (v) => `$${Math.abs(Number(v)) >= 1000 ? `${(Number(v) / 1000).toFixed(1)}k` : Math.round(Number(v))}`;

export default function ForecastPanel({ isDark, savedDays = [], appSettings = {}, navigateToTab }) {
  const forecast = useMemo(
    () => computeForecast({ savedDays, appSettings, horizonDays: 30 }),
    [savedDays, appSettings]
  );

  const [brief, setBrief] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ready
  const cacheKeyRef = useRef("");

  const generate = async (force = false) => {
    if (!forecast.ready) return;
    const p = forecast.projection;
    const cacheKey = `${new Date().toISOString().slice(0, 10)}-${forecast.daysOfHistory}-${p.trend}-${p.projectedProfit}`;
    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem("finalMileForecast") || "null");
        // Only trust a cached forecast that came from real AI — retry if it's an offline fallback.
        if (cached && cached.key === cacheKey && cached.brief && cached.brief.source === "AI") {
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
    const fallback = buildForecastNarrative(forecast, { companyName: appSettings?.companyName });
    let result;
    try {
      const context = {
        horizonDays: forecast.horizonDays,
        daysOfHistory: forecast.daysOfHistory,
        confidence: forecast.confidence,
        ...p,
        targetMargin: forecast.target.targetMargin,
        marginGap: forecast.target.marginGap,
        onPace: forecast.target.onPace,
      };
      const response = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
      });
      if (!response.ok) throw new Error("AI unavailable");
      const data = await response.json().catch(() => ({}));
      if (!data || !data.outlook) throw new Error("No forecast");
      result = {
        headline: data.headline || fallback.headline,
        outlook: data.outlook,
        topMove: data.topMove || fallback.topMove,
        sentiment: ["positive", "neutral", "negative"].includes(data.sentiment) ? data.sentiment : fallback.sentiment,
        confidence: ["High", "Medium", "Low"].includes(data.confidence) ? data.confidence : forecast.confidence,
        source: "AI",
      };
    } catch {
      result = fallback;
    }
    setBrief(result);
    setStatus("ready");
    cacheKeyRef.current = cacheKey;
    try {
      localStorage.setItem("finalMileForecast", JSON.stringify({ key: cacheKey, brief: result }));
    } catch {
      /* ignore quota */
    }
  };

  useEffect(() => {
    if (!forecast.ready) return;
    const p = forecast.projection;
    const cacheKey = `${new Date().toISOString().slice(0, 10)}-${forecast.daysOfHistory}-${p.trend}-${p.projectedProfit}`;
    if (cacheKeyRef.current === cacheKey) return;
    generate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forecast.ready, forecast.daysOfHistory, forecast.projection?.trend, forecast.projection?.projectedProfit]);

  const card = isDark ? "rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-blue-500/5 p-5 shadow-card" : "rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50/40 p-5 shadow-sm";
  const titleText = isDark ? "text-white" : "text-slate-950";
  const muted = isDark ? "text-slate-400" : "text-slate-500";

  // Locked teaser — they've started logging but need a few more days to forecast honestly.
  if (!forecast.ready) {
    if (!forecast.daysOfHistory) return null;
    return (
      <div className={card}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600/15 text-indigo-600"><BarChart3 className="h-5 w-5" /></span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-black ${titleText}`}>Margin Forecast</h2>
              <span className="rounded-full bg-indigo-600/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-indigo-600">AI</span>
            </div>
            <p className={`text-xs font-semibold ${muted}`}>{forecast.reason}</p>
          </div>
        </div>
        <div className={isDark ? "mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3" : "mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 p-3"}>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-500/15">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" style={{ width: `${Math.min(100, Math.round((forecast.daysOfHistory / forecast.needed) * 100))}%` }} />
          </div>
          <span className={`text-xs font-black ${muted}`}>{forecast.daysOfHistory}/{forecast.needed} snapshots</span>
        </div>
      </div>
    );
  }

  const p = forecast.projection;
  const t = forecast.target;
  const trendTone = p.trend === "improving" ? (isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-500/10 text-emerald-700") : p.trend === "declining" ? (isDark ? "bg-red-500/15 text-red-300" : "bg-red-500/10 text-red-600") : (isDark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600");
  const trendArrow = p.trend === "improving" ? "↑" : p.trend === "declining" ? "↓" : "→";
  const sentimentDot = brief?.sentiment === "negative" ? "bg-red-500" : brief?.sentiment === "positive" ? "bg-emerald-500" : "bg-amber-500";
  const money = (n) => currency.format(Math.round(Number(n || 0)));

  return (
    <div data-tour="dashboard-forecast" className={card}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600/15 text-indigo-600"><BarChart3 className="h-5 w-5" /></span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-black ${titleText}`}>Margin Forecast</h2>
              <span className="rounded-full bg-indigo-600/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-indigo-600">AI</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${trendTone}`}>{trendArrow} {p.trend}</span>
            </div>
            <p className={`text-xs font-semibold ${muted}`}>Where profit and margin are heading — projected from your last {forecast.daysOfHistory} snapshots.</p>
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

      {/* Projection stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className={isDark ? "rounded-xl border border-white/10 bg-white/5 p-3" : "rounded-xl border border-slate-200 bg-white/70 p-3"}>
          <p className={`text-[10px] font-black uppercase tracking-wide ${muted}`}>Next {forecast.horizonDays} days</p>
          <p className={`safe-number mt-0.5 text-xl font-black tracking-tight ${p.projectedProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{money(p.projectedProfit)}</p>
          <p className={`text-[11px] font-bold ${muted}`}>projected profit</p>
        </div>
        <div className={isDark ? "rounded-xl border border-white/10 bg-white/5 p-3" : "rounded-xl border border-slate-200 bg-white/70 p-3"}>
          <p className={`text-[10px] font-black uppercase tracking-wide ${muted}`}>Run-rate</p>
          <p className={`safe-number mt-0.5 text-xl font-black tracking-tight ${titleText}`}>{money(p.dailyAvgProfit)}</p>
          <p className={`text-[11px] font-bold ${muted}`}>profit / day</p>
        </div>
        <div className={isDark ? "rounded-xl border border-white/10 bg-white/5 p-3" : "rounded-xl border border-slate-200 bg-white/70 p-3"}>
          <p className={`text-[10px] font-black uppercase tracking-wide ${muted}`}>Proj. margin</p>
          <p className={`safe-number mt-0.5 text-xl font-black tracking-tight ${titleText}`}>{p.marginProjected}%</p>
          <p className={`text-[11px] font-bold ${muted}`}>from {p.marginNow}% now</p>
        </div>
        <div className={isDark ? "rounded-xl border border-white/10 bg-white/5 p-3" : "rounded-xl border border-slate-200 bg-white/70 p-3"}>
          <p className={`text-[10px] font-black uppercase tracking-wide ${muted}`}>vs target</p>
          {t.targetMargin > 0 ? (
            <>
              <p className={`safe-number mt-0.5 flex items-center gap-1 text-xl font-black tracking-tight ${t.onPace ? "text-emerald-600" : "text-amber-600"}`}>
                {t.onPace ? <CheckCircle2 className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                {t.marginGap > 0 ? "+" : ""}{t.marginGap} pt{Math.abs(t.marginGap) === 1 ? "" : "s"}
              </p>
              <p className={`text-[11px] font-bold ${muted}`}>{t.targetMargin}% target</p>
            </>
          ) : (
            <>
              <p className={`mt-0.5 text-sm font-black ${muted}`}>Set a target</p>
              <p className={`text-[11px] font-bold ${muted}`}>in Settings</p>
            </>
          )}
        </div>
      </div>

      {/* Trajectory chart — solid actual, dashed projection */}
      <div className="mt-4 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecast.series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.06)" : "#eef2f7"} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700, fill: isDark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: isDark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} width={52} tickFormatter={fmtAxis} />
            <Tooltip
              formatter={(value, name) => [money(value), name === "projected" ? "Projected" : "Actual"]}
              contentStyle={{ borderRadius: 12, border: "none", fontWeight: 700, color: "#0f172a", boxShadow: "0 16px 32px rgba(0,0,0,0.25)" }}
            />
            <Area type="monotone" dataKey="actual" stroke="#2563EB" strokeWidth={3} fill="url(#forecastActual)" connectNulls={false} dot={false} />
            <Area type="monotone" dataKey="projected" stroke="#6366F1" strokeWidth={2.5} strokeDasharray="5 4" fill="none" connectNulls dot={{ r: 2.5, fill: "#6366F1" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className={`-mt-1 flex items-center justify-end gap-3 text-[10px] font-bold ${muted}`}>
        <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 rounded bg-[#2563EB]" /> Actual</span>
        <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 rounded border-t-2 border-dashed border-[#6366F1]" /> Projected</span>
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
          <p className={`text-lg font-black leading-snug ${titleText}`}>{brief.headline}</p>
          <p className={`text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{brief.outlook}</p>

          <div className={isDark ? "rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3.5" : "rounded-xl border border-indigo-200 bg-white/70 p-3.5"}>
            <p className="text-[11px] font-black uppercase tracking-wide text-indigo-600">Your next move</p>
            <p className={`mt-1 text-sm font-bold leading-6 ${titleText}`}>{brief.topMove}</p>
          </div>

          <div className="flex items-center gap-2 pt-0.5 text-[11px] font-semibold text-slate-500">
            <span className={`inline-block h-2 w-2 rounded-full ${sentimentDot}`}></span>
            <span>{brief.source === "AI" ? "AI forecast" : "Computed"} · confidence {brief.confidence}</span>
            {navigateToTab && (
              <button type="button" onClick={() => navigateToTab("Profitability")} className="ml-auto font-bold text-indigo-600 hover:underline">Open Profitability ›</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
