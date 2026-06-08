import { useMemo, useState } from "react";
import { AlertTriangle, BriefcaseBusiness, CheckCircle2, currency, RotateCcw } from "../shared";
import { learnCostProfile, evaluateContract, buildEvalNarrative } from "../lib/contractEvaluator";

const VERDICT = {
  go: { label: "GO", chip: "bg-emerald-500/15 text-emerald-500", Icon: CheckCircle2 },
  caution: { label: "CAUTION", chip: "bg-amber-500/15 text-amber-600", Icon: AlertTriangle },
  "no-go": { label: "NO-GO", chip: "bg-red-500/15 text-red-500", Icon: AlertTriangle },
};

export default function ContractEvaluator({ isDark, open, onClose, contracts = [], appSettings = {} }) {
  const [name, setName] = useState("");
  const [revenue, setRevenue] = useState("");
  const [cost, setCost] = useState(""); // "" = predict from history
  const [narrative, setNarrative] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading

  const profile = useMemo(() => learnCostProfile(contracts), [contracts]);
  const benchmarks = appSettings?.profitabilityBenchmarks || {};

  const rev = Number(revenue || 0);
  const result = rev > 0 ? evaluateContract({ revenue: rev, cost, name }, profile, benchmarks) : null;

  const generate = async () => {
    if (!result) return;
    setStatus("loading");
    const fallback = buildEvalNarrative(result);
    let out;
    try {
      const response = await fetch("/api/contract-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: result }),
      });
      if (!response.ok) throw new Error("AI unavailable");
      const data = await response.json().catch(() => ({}));
      if (!data || !data.rationale) throw new Error("No call returned");
      out = {
        headline: data.headline || fallback.headline,
        rationale: data.rationale,
        topMove: data.topMove || fallback.topMove,
        verdict: ["go", "caution", "no-go"].includes(data.verdict) ? data.verdict : result.verdict,
        confidence: ["High", "Medium", "Low"].includes(data.confidence) ? data.confidence : result.confidence,
        source: "AI",
      };
    } catch {
      out = fallback;
    }
    setNarrative(out);
    setStatus("idle");
  };

  if (!open) return null;

  const titleText = isDark ? "text-white" : "text-slate-950";
  const muted = isDark ? "text-slate-400" : "text-slate-500";
  const money = (n) => currency.format(Math.round(Number(n || 0)));
  const inputClass = isDark
    ? "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-500"
    : "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500";
  const statBox = isDark ? "rounded-xl border border-white/10 bg-white/5 p-3" : "rounded-xl border border-slate-200 bg-slate-50 p-3";
  // The narrative shown: AI if fetched, else the deterministic call (so it's useful instantly).
  const shown = narrative || (result ? buildEvalNarrative(result) : null);
  const v = result ? VERDICT[result.verdict] : null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={isDark ? "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl" : "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600/15 text-indigo-600"><BriefcaseBusiness className="h-5 w-5" /></span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-black ${titleText}`}>Contract Go/No-Go</h2>
                <span className="rounded-full bg-indigo-600/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-indigo-600">AI</span>
              </div>
              <p className={`text-xs font-semibold ${muted}`}>Predict a new route's profit from your real cost structure.</p>
            </div>
          </div>
          <button onClick={onClose} className={isDark ? "rounded-lg border border-white/10 px-2.5 py-1 text-sm text-slate-300 hover:bg-white/5" : "rounded-lg border border-slate-200 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50"}>Close</button>
        </div>

        <div className="mt-4 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contract / route name (optional)" className={inputClass} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`mb-1 block text-[11px] font-black uppercase tracking-wide ${muted}`}>Offered revenue</label>
              <input value={revenue} onChange={(e) => setRevenue(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="e.g. 6200" className={inputClass} />
            </div>
            <div>
              <label className={`mb-1 block text-[11px] font-black uppercase tracking-wide ${muted}`}>Expected costs</label>
              <input value={cost} onChange={(e) => setCost(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder={result ? `${Math.round(result.predictedCost)} (predicted)` : "predicted"} className={inputClass} />
            </div>
          </div>
          <p className={`text-[11px] font-semibold ${muted}`}>
            {profile.sampleSize > 0
              ? `Costs predicted from your ${profile.sampleSize} route${profile.sampleSize === 1 ? "" : "s"} (avg ${profile.avgMargin}% margin). Enter expected costs to override.`
              : "No contracts yet — using an industry estimate. Add your routes to personalize this."}
          </p>
        </div>

        {!result ? (
          <p className={`mt-5 text-sm font-semibold ${muted}`}>Enter the offered revenue to see the call.</p>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-black ${v.chip}`}><v.Icon className="h-4 w-4" /> {v.label}</span>
              <p className={`text-sm font-black ${titleText}`}>{shown.headline}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className={statBox}>
                <p className={`text-[10px] font-black uppercase tracking-wide ${muted}`}>Profit</p>
                <p className={`safe-number mt-0.5 text-lg font-black ${result.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{money(result.profit)}</p>
              </div>
              <div className={statBox}>
                <p className={`text-[10px] font-black uppercase tracking-wide ${muted}`}>Margin</p>
                <p className={`safe-number mt-0.5 text-lg font-black ${titleText}`}>{result.margin}%</p>
              </div>
              <div className={statBox}>
                <p className={`text-[10px] font-black uppercase tracking-wide ${muted}`}>vs target</p>
                <p className={`safe-number mt-0.5 text-lg font-black ${result.target > 0 && result.margin >= result.target ? "text-emerald-600" : "text-amber-600"}`}>{result.target > 0 ? `${result.margin - result.target >= 0 ? "+" : ""}${Math.round(result.margin - result.target)} pts` : "—"}</p>
              </div>
              <div className={statBox}>
                <p className={`text-[10px] font-black uppercase tracking-wide ${muted}`}>Hit-target pay</p>
                <p className={`safe-number mt-0.5 text-lg font-black ${titleText}`}>{result.breakEvenForTarget ? money(result.breakEvenForTarget) : "—"}</p>
              </div>
            </div>

            {result.portfolioRank && (
              <p className={`text-xs font-semibold ${muted}`}>Would beat <span className={`font-black ${titleText}`}>{result.portfolioRank.betterThan} of {result.portfolioRank.of}</span> of your current routes (avg {result.avgMargin}% margin).</p>
            )}

            <div className={isDark ? "rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3.5" : "rounded-xl border border-indigo-200 bg-indigo-50 p-3.5"}>
              <p className={`text-sm leading-6 ${isDark ? "text-slate-200" : "text-slate-700"}`}>{shown.rationale}</p>
              <p className="mt-2 text-[11px] font-black uppercase tracking-wide text-indigo-600">Your move</p>
              <p className={`mt-0.5 text-sm font-bold leading-6 ${titleText}`}>{shown.topMove}</p>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] font-semibold ${muted}`}>{shown.source === "AI" ? "AI evaluator" : "Computed"} · confidence {shown.confidence}</span>
              <button
                onClick={generate}
                disabled={status === "loading"}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${status === "loading" ? "animate-spin" : ""}`} /> {narrative ? "Refresh AI call" : "Get the AI call"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
