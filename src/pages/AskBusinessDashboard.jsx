import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  currency,
  FileText,
  MessageCircle,
  ShieldCheck,
  Users,
} from "../shared";

const quickQuestions = [
  "What should I fix first today?",
  "Which driver or team is costing me the most?",
  "Which claims should I dispute?",
  "How much should I make to break even?",
  "Why is my profit down?",
  "Which contract looks risky?",
  "What should my dashboard show first?",
];

function AskBusinessDashboard({ claims, teams, results, form, savedDays, appSettings, isDark, navigateToTab }) {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [aiStatus, setAiStatus] = useState("");

  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const softCard = isDark
    ? "rounded-2xl border border-white/10 bg-slate-950/60 p-4"
    : "rounded-2xl border border-slate-200 bg-slate-50/80 p-4";
  const inputClass = isDark
    ? "w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500"
    : "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-blue-500";

  const businessContext = useMemo(() => {
    const openClaims = claims.filter((claim) => claim.status !== "Closed");
    const totalExposure = openClaims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
    const highClaims = openClaims.filter((claim) => claim.risk === "High");
    const preventableClaims = openClaims.filter((claim) => claim.preventable === "Yes");
    const missingPhotoTeams = teams.filter((team) => team.photoStatus !== "Uploaded");
    const teamExposure = teams.map((team) => ({
      team: team.name,
      driver: team.lead,
      exposure: openClaims
        .filter((claim) => claim.team === team.name || claim.driver === team.lead || claim.driver === team.helper)
        .reduce((sum, claim) => sum + Number(claim.amount || 0), 0),
      claims: openClaims.filter((claim) => claim.team === team.name || claim.driver === team.lead || claim.driver === team.helper).length,
    }));
    const riskiestTeam = teamExposure.slice().sort((a, b) => b.exposure - a.exposure)[0] || { team: "No team", exposure: 0, claims: 0 };
    const worstClaim = openClaims.slice().sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))[0];
    const dashboardWidgets = appSettings?.dashboardWidgets || {};
    const visibleDashboardWidgets = Object.values(dashboardWidgets).filter(Boolean).length;

    return {
      openClaims,
      totalExposure,
      highClaims,
      preventableClaims,
      missingPhotoTeams,
      riskiestTeam,
      worstClaim,
      visibleDashboardWidgets,
      netProfit: Number(results?.netProfit || 0),
      marginPercent: Number(results?.profitMargin || 0) * 100,
      totalCost: Number(results?.totalCost || 0),
      totalRevenue: Number(results?.totalRevenue || 0),
      requiredRevenue: Number(results?.requiredRevenue || 0),
      requiredRoutePay: Number(results?.requiredRoutePay || 0),
      targetProfit: Number(form?.targetProfit || 0),
      routeName: form?.scenarioName || "Current route",
      savedDayCount: savedDays?.length || 0,
    };
  }, [appSettings?.dashboardWidgets, claims, form?.scenarioName, results, savedDays?.length, teams]);

  const getAnswer = (rawQuestion) => {
    const ask = rawQuestion.toLowerCase();
    const ctx = businessContext;
    const actions = [];
    let title = "Here is what I see";
    let summary = "";
    let tab = "Dashboard";

    if (ask.includes("break even") || ask.includes("breakeven") || ask.includes("break-even") || ask.includes("bread even") || (ask.includes("make") && ask.includes("even"))) {
      const breakEvenRevenue = ctx.totalCost;
      const gapToBreakEven = Math.max(ctx.totalCost - ctx.totalRevenue, 0);
      const surplusAfterBreakEven = Math.max(ctx.totalRevenue - ctx.totalCost, 0);
      title = `Break even is ${currency.format(breakEvenRevenue)}`;
      summary =
        gapToBreakEven > 0
          ? `${ctx.routeName} needs ${currency.format(breakEvenRevenue)} in revenue to break even. Current revenue is ${currency.format(ctx.totalRevenue)}, so you are short by ${currency.format(gapToBreakEven)}.`
          : `${ctx.routeName} needs ${currency.format(breakEvenRevenue)} in revenue to break even. Current revenue is ${currency.format(ctx.totalRevenue)}, so you are above break even by ${currency.format(surplusAfterBreakEven)}.`;
      actions.push(`${currency.format(ctx.totalCost)} covers today’s labor, fuel, truck, insurance, maintenance, claims, and other costs.`);
      actions.push(`To hit your target profit of ${currency.format(ctx.targetProfit)}, revenue should be about ${currency.format(ctx.requiredRevenue)}.`);
      actions.push(`If only route pay changes, route pay should be about ${currency.format(ctx.requiredRoutePay)} to hit that target.`);
      tab = "Profitability";
    } else if (ask.includes("fix") || ask.includes("first") || ask.includes("today")) {
      title = "Fix claims and proof gaps first";
      summary = `${ctx.openClaims.length} open claims are carrying ${currency.format(ctx.totalExposure)} in exposure. ${ctx.highClaims.length} are high risk, and ${ctx.missingPhotoTeams.length} team${ctx.missingPhotoTeams.length === 1 ? "" : "s"} still have photo/compliance gaps.`;
      actions.push("Review high-value claims before accepting losses.");
      actions.push("Start with missing photos because weak evidence hurts disputes.");
      actions.push("Check route margin after claim exposure is updated.");
      tab = "Claims";
    } else if (ask.includes("driver") || ask.includes("team") || ask.includes("costing")) {
      title = `${ctx.riskiestTeam.team} needs the closest review`;
      summary = `${ctx.riskiestTeam.team} is tied to ${currency.format(ctx.riskiestTeam.exposure)} across ${ctx.riskiestTeam.claims} open claim${ctx.riskiestTeam.claims === 1 ? "" : "s"}.`;
      actions.push("Open the Teams page and review readiness/photo status.");
      actions.push("Compare driver notes against claim history.");
      actions.push("Coach before the next similar route.");
      tab = "Teams";
    } else if (ask.includes("dispute") || ask.includes("claim")) {
      title = "Dispute the highest-value claims with evidence gaps";
      summary = ctx.worstClaim
        ? `${ctx.worstClaim.id} (${ctx.worstClaim.type}) is the largest open claim at ${currency.format(ctx.worstClaim.amount)}. High-risk and preventable claims should get packet review before they become accepted losses.`
        : "There are no open claims to dispute right now.";
      actions.push("Generate a dispute packet for the largest claim.");
      actions.push("Collect photos, POD, call logs, and driver notes.");
      actions.push("Move claims to In Progress once someone owns the packet.");
      tab = "Claims";
    } else if (ask.includes("profit") || ask.includes("margin") || ask.includes("down")) {
      title = ctx.netProfit < 0 ? "The current route is losing money" : "Profit is positive, but watch cost pressure";
      summary = `${ctx.routeName} is showing ${currency.format(ctx.netProfit)} net profit at ${ctx.marginPercent.toFixed(1)}% margin. Total cost is ${currency.format(ctx.totalCost)} against ${currency.format(ctx.totalRevenue)} revenue.`;
      actions.push("Review route pay, stops, miles, fuel, and labor.");
      actions.push("Add accessorial revenue where the contract allows it.");
      actions.push("Use claim reserve as a real cost, not an afterthought.");
      tab = "Profitability";
    } else if (ask.includes("contract") || ask.includes("rate") || ask.includes("renewal")) {
      title = "Review contract rates against claims and route cost";
      summary = "Contracts with low route pay, missing accessorials, or high claim exposure should be reviewed before renewal.";
      actions.push("Open Contracts and compare rate cards against the current route math.");
      actions.push("Flag contracts missing fuel surcharge or accessorial coverage.");
      actions.push("Use Claims exposure as leverage in renewal conversations.");
      tab = "Contracts";
    } else if (ask.includes("dashboard") || ask.includes("layout") || ask.includes("show")) {
      title = "Put action items above passive reports";
      summary = `${ctx.visibleDashboardWidgets} dashboard sections are currently turned on. For daily operations, put Needs Attention, Recent Claims, Today's Profit, and Route Health near the top.`;
      actions.push("Use Settings > Dashboard Layout.");
      actions.push("Try the Operations preset for daily dispatch/review.");
      actions.push("Use Finance when reviewing contracts or margin.");
      tab = "Settings";
    } else {
      title = "Business snapshot";
      summary = `${ctx.openClaims.length} open claims, ${currency.format(ctx.totalExposure)} claim exposure, ${currency.format(ctx.netProfit)} current route profit, and ${ctx.savedDayCount} saved daily snapshot${ctx.savedDayCount === 1 ? "" : "s"}.`;
      actions.push("Ask about claims, profit, teams, contracts, or dashboard layout.");
      actions.push("Start with the highest exposure claim if you are unsure.");
      tab = "Dashboard";
    }

    return { id: Date.now(), question: rawQuestion, title, summary, actions, tab };
  };

  const askBusiness = async (nextQuestion = question) => {
    const trimmed = nextQuestion.trim();
    if (!trimmed) return;
    setIsAskingAi(true);
    setAiStatus("");

    let answer = null;
    try {
      const response = await fetch("/api/ask-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          businessContext,
        }),
      });

      if (response.ok) {
        const aiAnswer = await response.json();
        answer = {
          id: Date.now(),
          question: trimmed,
          title: aiAnswer.title || "AI answer",
          summary: aiAnswer.summary || "The AI returned an answer without a summary.",
          actions: Array.isArray(aiAnswer.actions) && aiAnswer.actions.length ? aiAnswer.actions : ["Review the related page for details."],
          tab: aiAnswer.tab || "Dashboard",
          source: "AI",
        };
        setAiStatus("Answered by OpenAI.");
      } else {
        const error = await response.json().catch(() => ({}));
        setAiStatus(error.error || "AI is unavailable, using local fallback.");
      }
    } catch {
      setAiStatus("AI is unavailable, using local fallback.");
    }

    if (!answer) {
      answer = { ...getAnswer(trimmed), source: "Local fallback" };
    }

    setConversation((current) => [answer, ...current].slice(0, 6));
    setQuestion("");
    setIsAskingAi(false);
  };

  const latest = conversation[0] || getAnswer("What should I fix first today?");

  return (
    <div className={isDark ? "space-y-5 text-white" : "space-y-5 text-slate-950"}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">Ask My Business</span>
            <span className={isDark ? "rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"}>
              Claims, teams, profit, contracts, settings
            </span>
          </div>
          <h1 className={`text-4xl font-black tracking-tight sm:text-5xl ${titleText}`}>Ask My Business</h1>
          <p className={`mt-2 max-w-3xl text-base font-semibold ${mutedText}`}>Ask plain-English questions and get an action-focused answer from the data already in the app.</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className={cardClass}>
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Bot className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className={`text-xl font-black ${titleText}`}>{latest.title}</h2>
              {latest.source && (
                <span className={latest.source === "AI" ? "mt-2 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700" : "mt-2 inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-700"}>
                  {latest.source}
                </span>
              )}
              <p className={`mt-3 text-sm leading-6 ${mutedText}`}>{latest.summary}</p>
              <div className="mt-4 space-y-2">
                {latest.actions.map((action) => (
                  <div key={action} className="flex items-start gap-2 text-sm font-bold">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span className={titleText}>{action}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigateToTab(latest.tab)}
                className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
              >
                Open {latest.tab}
              </button>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <h2 className={`text-lg font-black ${titleText}`}>Ask a Question</h2>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className={`${inputClass} mt-4 min-h-28 resize-none leading-6`}
            placeholder="Ask: Which claims should I dispute? Why is profit down? What should I fix first?"
          />
          <button
            type="button"
            onClick={() => askBusiness()}
            disabled={isAskingAi}
            className={isAskingAi ? "mt-3 w-full rounded-xl bg-blue-400 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20" : "mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"}
          >
            {isAskingAi ? "Asking AI..." : "Ask"}
          </button>
          {aiStatus && <p className={`mt-2 text-xs font-bold ${mutedText}`}>{aiStatus}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {quickQuestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => askBusiness(item)}
                className={isDark ? "rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-slate-200 hover:bg-white/15" : "rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-200"}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Open Claims", businessContext.openClaims.length, currency.format(businessContext.totalExposure), FileText, "Claims"],
          ["Risk Team", businessContext.riskiestTeam.team, currency.format(businessContext.riskiestTeam.exposure), Users, "Teams"],
          ["Route Profit", currency.format(businessContext.netProfit), `${businessContext.marginPercent.toFixed(1)}% margin`, BarChart3, "Profitability"],
          ["Daily History", businessContext.savedDayCount, "Saved daily snapshots", ShieldCheck, "Dashboard"],
        ].map(([title, value, note, Icon, tab]) => (
          <button key={title} onClick={() => navigateToTab(tab)} className={`${softCard} text-left transition hover:border-blue-500/50`}>
            <Icon className="h-5 w-5 text-blue-600" />
            <p className={`mt-3 text-xs font-black uppercase tracking-wide ${mutedText}`}>{title}</p>
            <p className={`mt-1 text-2xl font-black ${titleText}`}>{value}</p>
            <p className={`mt-1 text-sm ${mutedText}`}>{note}</p>
          </button>
        ))}
      </div>

      {conversation.length > 0 && (
        <div className={cardClass}>
          <h2 className={`text-lg font-black ${titleText}`}>Recent Questions</h2>
          <div className="mt-4 space-y-3">
            {conversation.map((item) => (
              <button
                key={item.id}
                onClick={() => setQuestion(item.question)}
                className={isDark ? "flex w-full items-start gap-3 rounded-xl bg-white/5 p-3 text-left hover:bg-white/10" : "flex w-full items-start gap-3 rounded-xl bg-slate-50 p-3 text-left hover:bg-slate-100"}
              >
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span>
                  <span className={`block text-sm font-black ${titleText}`}>{item.question}</span>
                  <span className={`mt-1 block text-xs ${mutedText}`}>{item.title}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={isDark ? "rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4" : "rounded-2xl border border-amber-200 bg-amber-50 p-4"}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <p className={isDark ? "text-sm font-semibold leading-6 text-amber-100" : "text-sm font-semibold leading-6 text-amber-900"}>
            Ask My Business now tries the OpenAI backend first when an API key is configured. If AI is unavailable, it keeps working with the local app-data fallback.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AskBusinessDashboard;
