import { useEffect, useMemo, useState } from "react";
import { currency, Sparkles } from "../shared";

// Deterministic pre-dispatch claim-risk score (0-100) from a team's own signals.
function scoreTeam(team, teamClaims) {
  const compliance = Number(team.complianceScore || 0);
  const survey = Number(team.surveyAvg || 0);
  const photoMissing = team.photoStatus !== "Uploaded";
  const atRisk = team.status === "At Risk";
  const openClaims = teamClaims.filter((claim) => claim.status !== "Closed");
  const openExposure = openClaims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const factors = [
    { label: "Low compliance", value: (100 - compliance) * 0.45 },
    { label: "Missing route photo", value: photoMissing ? 20 : 0 },
    { label: "Flagged at risk", value: atRisk ? 15 : 0 },
    { label: "Claim history", value: Math.min(teamClaims.length * 6, 18) },
    { label: "Open exposure", value: Math.min(openExposure / 100, 15) },
    { label: "Low survey scores", value: survey && survey < 8 ? (8 - survey) * 3 : 0 },
  ];
  const score = Math.max(0, Math.min(100, Math.round(factors.reduce((sum, factor) => sum + factor.value, 0))));
  const tier = score >= 60 ? "High" : score >= 35 ? "Elevated" : "Low";
  const top = [...factors].sort((a, b) => b.value - a.value)[0];
  const topDriver = top.value > 0 ? top.label : "Stable signals";
  const action = photoMissing
    ? "Get today's route photo before dispatch."
    : atRisk
    ? "Review this team before sending them out."
    : compliance < 80
    ? "Coach on the compliance gap."
    : "Cleared to dispatch.";
  return { score, tier, topDriver, action, openExposure };
}

export default function RiskForecast({ isDark, teams = [], claims = [] }) {
  const getClaimDriver = (claim) => claim.driver || teams.find((team) => team.name === claim.team)?.lead || "";
  const getTeamClaims = (team) =>
    claims.filter((claim) => [team.lead, team.helper].filter(Boolean).includes(getClaimDriver(claim)) || claim.team === team.name);

  const ranked = useMemo(
    () => teams.map((team) => ({ team, ...scoreTeam(team, getTeamClaims(team)) })).sort((a, b) => b.score - a.score),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teams, claims]
  );

  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    if (!ranked.length) {
      setForecast(null);
      return undefined;
    }
    let cancelled = false;
    const top = ranked[0];
    const fallback =
      !top || top.tier === "Low"
        ? { headline: "All teams cleared for dispatch", summary: "No team is showing elevated claim risk right now. Keep photos and compliance current.", watchTeam: "", source: "Computed" }
        : { headline: `${top.team.name} is today's top claim risk`, summary: `${top.team.name} scores ${top.score}/100 — driven by ${top.topDriver.toLowerCase()}. ${top.action}`, watchTeam: top.team.name, source: "Computed" };

    const run = async () => {
      try {
        const context = ranked.map((row) => ({
          team: row.team.name,
          score: row.score,
          tier: row.tier,
          compliance: Number(row.team.complianceScore || 0),
          photo: row.team.photoStatus,
          atRisk: row.team.status === "At Risk",
          openExposure: row.openExposure,
          survey: Number(row.team.surveyAvg || 0),
        }));
        const response = await fetch("/api/risk-forecast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context }),
        });
        if (!response.ok) throw new Error("unavailable");
        const data = await response.json().catch(() => ({}));
        if (!data || !data.summary) throw new Error("no forecast");
        if (!cancelled) setForecast({ headline: data.headline || fallback.headline, summary: data.summary, watchTeam: data.watchTeam || fallback.watchTeam, source: "AI" });
      } catch {
        if (!cancelled) setForecast(fallback);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [ranked]);

  if (!teams.length) return null;

  const tierChip = (tier) => (tier === "High" ? "bg-red-500/15 text-red-500" : tier === "Elevated" ? "bg-amber-500/15 text-amber-500" : "bg-emerald-500/15 text-emerald-500");
  const barColor = (tier) => (tier === "High" ? "bg-red-500" : tier === "Elevated" ? "bg-amber-500" : "bg-emerald-500");
  const card = isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const title = isDark ? "text-white" : "text-slate-950";
  const muted = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className={card}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-600"><Sparkles className="h-4 w-4" /></span>
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-base font-black ${title}`}>Claim Risk Forecast</h2>
            <span className="rounded-full bg-blue-600/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-600">AI</span>
          </div>
          <p className={`text-xs font-semibold ${muted}`}>Who's most likely to generate a claim today — before you dispatch.</p>
        </div>
      </div>

      {forecast && (
        <div className={isDark ? "mb-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3" : "mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3"}>
          <p className={`text-sm font-black ${title}`}>{forecast.headline}</p>
          <p className={`mt-0.5 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{forecast.summary}</p>
        </div>
      )}

      <div className="space-y-2">
        {ranked.map((row) => (
          <div key={row.team.id || row.team.name} className={isDark ? "rounded-xl border border-white/10 bg-white/5 p-3" : "rounded-xl border border-slate-200 bg-slate-50 p-3"}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className={`truncate text-sm font-black ${title}`}>{row.team.name}</p>
                <p className={`truncate text-xs ${muted}`}>{row.topDriver}{row.openExposure > 0 ? ` · ${currency.format(row.openExposure)} open` : ""}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`text-sm font-black ${title}`}>{row.score}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${tierChip(row.tier)}`}>{row.tier}</span>
              </div>
            </div>
            <div className={isDark ? "mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10" : "mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"}>
              <div className={`h-full rounded-full ${barColor(row.tier)}`} style={{ width: `${row.score}%` }}></div>
            </div>
            <p className={`mt-2 text-xs font-semibold ${muted}`}>→ {row.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
