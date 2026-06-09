import { useEffect, useRef, useState } from "react";
import { aiFetch } from "../lib/aiFetch";
import { currency, Sparkles, X } from "../shared";
import { useToast } from "./Toast";
import { addReminder } from "../lib/reminders";

const SUGGESTIONS = {
  Dashboard: ["What should I focus on today?", "Why did my margin change?", "Which route is least profitable?"],
  Operations: ["Which team is most at risk?", "What claims should I dispute?", "Who's missing route photos?"],
  Claims: ["What claims should I dispute?", "Which claim is most contestable?", "What's my open exposure?"],
  Teams: ["Which team is most at risk?", "Who's missing route photos?", "Which driver has the most claims?"],
  Compliance: ["What compliance risks do I have?", "Which teams aren't ready?", "What should I fix before dispatch?"],
  Finance: ["Where am I losing margin?", "Which contract should I renegotiate?", "What's my break-even?"],
  Profitability: ["Where am I losing margin?", "What's my break-even revenue?", "Which route is least profitable?"],
};
const DEFAULT_SUGGESTIONS = ["What should I focus on today?", "What's hurting my margin?", "What claims should I dispute?"];

export default function AskCopilot({ isDark, activeTab, navigateToTab, teams = [], claims = [], savedDays = [], results = {}, appSettings = {} }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, status, open]);

  const buildContext = () => {
    const openClaims = claims.filter((claim) => claim.status !== "Closed");
    const exposure = openClaims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
    const topClaim = openClaims.slice().sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))[0];
    return {
      activeTab,
      profit: Math.round(Number(results?.netProfit || 0)),
      revenue: Math.round(Number(results?.totalRevenue || 0)),
      costs: Math.round(Number(results?.totalCost || 0)),
      marginPct: Math.round(Number(results?.profitMargin || 0) * 1000) / 10,
      openClaims: openClaims.length,
      claimExposure: Math.round(exposure),
      highRiskClaims: openClaims.filter((claim) => claim.risk === "High").length,
      topClaim: topClaim ? { type: topClaim.type, amount: Number(topClaim.amount || 0), preventable: topClaim.preventable, route: topClaim.route } : null,
      openClaimsList: openClaims
        .slice()
        .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
        .slice(0, 5)
        .map((claim) => ({ id: claim.id, type: claim.type, amount: Number(claim.amount || 0), risk: claim.risk, route: claim.route })),
      teams: teams.map((team) => ({ name: team.name, status: team.status, complianceScore: Number(team.complianceScore || 0), photo: team.photoStatus })),
      atRiskTeams: teams.filter((team) => team.status === "At Risk").length,
      missingPhotos: teams.filter((team) => team.photoStatus !== "Uploaded").length,
      savedDaysCount: savedDays.length,
      companyName: appSettings?.companyName || "the business",
    };
  };

  const buildFallback = (ctx) => {
    const money = (value) => currency.format(Math.round(Number(value || 0)));
    if (ctx.highRiskClaims > 0 && ctx.topClaim) {
      return {
        title: "Tackle your biggest claim first",
        summary: `You have ${ctx.highRiskClaims} high-risk open claim${ctx.highRiskClaims > 1 ? "s" : ""} and ${money(ctx.claimExposure)} in exposure. The largest is ${ctx.topClaim.type} at ${money(ctx.topClaim.amount)}${ctx.topClaim.preventable ? ` (${ctx.topClaim.preventable} preventable)` : ""}. I can draft dispute letters for every contestable claim right now.`,
        actions: ["Draft all contestable disputes", "Review the largest claim"],
        tab: "Operations",
        action: { type: "draftDisputes", label: "Draft all disputes" },
        confidence: "Medium",
        source: "offline",
      };
    }
    if (ctx.missingPhotos > 0) {
      return {
        title: "Close the photo gap",
        summary: `${ctx.missingPhotos} team${ctx.missingPhotos > 1 ? "s" : ""} haven't uploaded today's route photo. Missing proof is how claims turn into losses — chase them before dispatch.`,
        actions: ["Open Teams"],
        tab: "Teams",
        confidence: "Medium",
        source: "offline",
      };
    }
    if (ctx.revenue > 0) {
      return {
        title: "Here's where you stand",
        summary: `You're at ${money(ctx.profit)} net profit on ${money(ctx.revenue)} revenue (${ctx.marginPct}% margin). Keep logging days so I can spot what's moving your margin and flag the routes to watch.`,
        actions: ["Open the Margin Brief"],
        tab: "Dashboard",
        confidence: "Low",
        source: "offline",
      };
    }
    return {
      title: "Add your numbers first",
      summary: "I work best with live data. Log today's route in plain English and I'll fill in the numbers — then ask me what's helping or hurting your margin.",
      actions: ["Log today's numbers"],
      tab: "Dashboard",
      action: { type: "logDay", label: "Log today" },
      confidence: "Low",
      source: "offline",
    };
  };

  const ask = async (preset) => {
    const query = (preset ?? question).trim();
    if (!query || status === "loading") return;
    setQuestion("");
    const history = messages.slice(-4).map((message) => ({ role: message.role, content: message.role === "user" ? message.content : message.summary }));
    setMessages((current) => [...current, { role: "user", content: query }]);
    setStatus("loading");
    const ctx = buildContext();
    let answer;
    try {
      const response = await aiFetch("/api/ask-business", { question: query, businessContext: ctx, history });
      if (!response.ok) throw new Error("AI unavailable");
      const data = await response.json().catch(() => ({}));
      if (!data || !data.summary) throw new Error("No answer returned");
      answer = {
        title: data.title || "Here's what I see",
        summary: data.summary,
        actions: Array.isArray(data.actions) ? data.actions.slice(0, 4) : [],
        tab: data.tab,
        action: data.action && typeof data.action === "object" ? data.action : null,
        confidence: ["High", "Medium", "Low"].includes(data.confidence) ? data.confidence : "Medium",
        source: "AI",
      };
    } catch {
      answer = buildFallback(ctx);
    }
    setMessages((current) => [...current, { role: "assistant", ...answer }]);
    setStatus("idle");
  };

  // Pick the claim an "openClaim" action should land on: the AI's choice if valid,
  // else the largest high-risk open claim, else the largest open claim.
  const resolveTargetClaimId = (preferredId) => {
    if (preferredId && claims.some((claim) => claim.id === preferredId)) return preferredId;
    const open = claims.filter((claim) => claim.status !== "Closed");
    const pool = open.filter((claim) => claim.risk === "High");
    const ranked = (pool.length ? pool : open).slice().sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
    return ranked[0]?.id || null;
  };

  const runCopilotAction = (action) => {
    if (!action) return;
    if (action.type === "draftDisputes") {
      navigateToTab?.("Claims");
      window.setTimeout(() => window.dispatchEvent(new CustomEvent("fmm:draft-disputes")), 500);
      setOpen(false);
      return;
    }
    if (action.type === "openClaim") {
      const claimId = resolveTargetClaimId(action.claimId);
      navigateToTab?.("Claims");
      window.setTimeout(() => window.dispatchEvent(new CustomEvent("fmm:open-claim", { detail: { claimId } })), 500);
      setOpen(false);
      return;
    }
    if (action.type === "logDay") {
      navigateToTab?.("Dashboard");
      window.setTimeout(() => window.dispatchEvent(new CustomEvent("fmm:open-daylog")), 500);
      setOpen(false);
      return;
    }
    if (action.type === "addReminder") {
      const created = addReminder({ text: action.text || action.reminder || action.label, due: action.due });
      if (created) {
        toast({ title: "Reminder added", description: created.text, tone: "success" });
        navigateToTab?.("Dashboard");
      }
      setOpen(false);
      return;
    }
    if (action.type === "navigate" && action.tab) {
      navigateToTab?.(action.tab);
      setOpen(false);
    }
  };

  const suggestions = SUGGESTIONS[activeTab] || DEFAULT_SUGGESTIONS;
  const panelClass = isDark
    ? "border-white/10 bg-slate-950 text-white"
    : "border-slate-200 bg-white text-slate-900";
  const bubbleUser = isDark ? "bg-blue-600 text-white" : "bg-blue-600 text-white";
  const cardClass = isDark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-slate-50";
  const muted = isDark ? "text-slate-400" : "text-slate-500";
  const chipClass = isDark
    ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close Ask AI" : "Ask AI"}
        className="fixed bottom-24 right-4 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 transition hover:scale-105 hover:bg-blue-500 sm:bottom-6 sm:right-6"
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>

      {open && (
        <div className={`fixed bottom-40 right-4 z-[80] flex max-h-[68vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border shadow-2xl sm:bottom-24 sm:right-6 ${panelClass}`}>
          <div className={`flex items-center justify-between gap-2 border-b p-4 ${isDark ? "border-white/10" : "border-slate-200"}`}>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/15 text-blue-600"><Sparkles className="h-4 w-4" /></span>
              <div>
                <p className="text-sm font-black leading-tight">Ask AI</p>
                <p className={`text-[11px] font-semibold ${muted}`}>Answers from your live numbers</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className={isDark ? "rounded-lg p-1.5 text-slate-400 hover:bg-white/5" : "rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className={`text-sm ${muted}`}>Ask me anything about your margin, claims, teams, or routes — I read your live workspace.</p>
                <div className="flex flex-col gap-2">
                  {suggestions.map((suggestion) => (
                    <button key={suggestion} onClick={() => ask(suggestion)} className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${chipClass}`}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) =>
              message.role === "user" ? (
                <div key={index} className="flex justify-end">
                  <span className={`max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 text-sm font-semibold ${bubbleUser}`}>{message.content}</span>
                </div>
              ) : (
                <div key={index} className={`rounded-2xl border p-3 ${cardClass}`}>
                  <p className="text-sm font-black">{message.title}</p>
                  <p className={`mt-1 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{message.summary}</p>
                  {message.actions?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {message.actions.map((action, actionIndex) => (
                        <li key={actionIndex} className={`flex gap-2 text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                          <span className="text-blue-500">→</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${muted}`}>{message.source === "AI" ? "AI" : "Offline"} · {message.confidence}</span>
                    {message.action ? (
                      <button
                        onClick={() => runCopilotAction(message.action)}
                        className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-black text-white hover:bg-blue-500"
                      >
                        {message.action.label || "Do it"} →
                      </button>
                    ) : message.tab && message.tab !== activeTab ? (
                      <button
                        onClick={() => { navigateToTab?.(message.tab); setOpen(false); }}
                        className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-black text-white hover:bg-blue-500"
                      >
                        Go to {message.tab} →
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            )}

            {status === "loading" && (
              <div className={`rounded-2xl border p-3 ${cardClass}`}>
                <div className="space-y-2">
                  <div className="skeleton h-3.5 w-2/3 rounded"></div>
                  <div className="skeleton h-3.5 w-full rounded"></div>
                  <div className="skeleton h-3.5 w-5/6 rounded"></div>
                </div>
              </div>
            )}
          </div>

          <div className={`border-t p-3 ${isDark ? "border-white/10" : "border-slate-200"}`}>
            <div className="flex items-center gap-2">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") ask(); }}
                placeholder="Ask about your business…"
                className={isDark ? "w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500" : "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"}
              />
              <button
                onClick={() => ask()}
                disabled={!question.trim() || status === "loading"}
                className="shrink-0 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-50"
              >
                Ask
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
