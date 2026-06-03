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
  "What should I charge per stop?",
  "Why is my profit down?",
  "Which contract looks risky?",
  "What should my dashboard show first?",
];

const riskWeight = { High: 3, Medium: 2, Low: 1 };

const getClaimDriver = (claim, teams) => {
  if (claim.driver) return claim.driver;
  const team = teams.find((item) => item.name === claim.team);
  return team?.lead || "Unassigned";
};

const getClaimTeam = (claim, teams) => {
  if (claim.team) return claim.team;
  const driver = getClaimDriver(claim, teams);
  const team = teams.find((item) => item.lead === driver || item.helper === driver);
  return team?.name || "Unassigned";
};

const getMissingEvidence = (claim, teams) => {
  const assignedTeam = teams.find((team) => team.name === getClaimTeam(claim, teams));
  const amount = Number(claim.amount || 0);
  const isHighValue = amount >= 500 || claim.risk === "High";
  const gaps = [];

  if (!assignedTeam || assignedTeam.photoStatus !== "Uploaded") gaps.push("daily route photo");
  if (isHighValue) gaps.push("damage photos");
  if (claim.preventable !== "No") gaps.push("driver statement");
  if (claim.status === "Open") gaps.push("packet owner");

  return gaps;
};

const getDisputeScore = (claim, teams) => {
  const amount = Number(claim.amount || 0);
  const gaps = getMissingEvidence(claim, teams).length;
  const preventablePenalty = claim.preventable === "Yes" ? -10 : claim.preventable === "Maybe" ? 12 : 18;
  return Math.max(0, Math.round(amount / 25 + (riskWeight[claim.risk] || 1) * 14 + gaps * 8 + preventablePenalty));
};

const formatList = (items) => {
  if (!items.length) return "none";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
};

function AskBusinessDashboard({ claims, teams, results, form, savedDays, appSettings, isDark, navigateToTab }) {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isAnswering, setIsAnswering] = useState(false);
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
    const totalClaimExposure = claims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
    const preventableExposure = openClaims
      .filter((claim) => claim.preventable === "Yes")
      .reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
    const rankedClaims = openClaims
      .map((claim) => ({
        ...claim,
        amountValue: Number(claim.amount || 0),
        driver: getClaimDriver(claim, teams),
        team: getClaimTeam(claim, teams),
        missingEvidence: getMissingEvidence(claim, teams),
        disputeScore: getDisputeScore(claim, teams),
      }))
      .sort((a, b) => b.disputeScore - a.disputeScore || b.amountValue - a.amountValue);
    const teamExposure = teams.map((team) => ({
      team: team.name,
      driver: team.lead,
      helper: team.helper,
      status: team.status,
      complianceScore: Number(team.complianceScore || 0),
      photoStatus: team.photoStatus,
      exposure: openClaims
        .filter((claim) => claim.team === team.name || claim.driver === team.lead || claim.driver === team.helper)
        .reduce((sum, claim) => sum + Number(claim.amount || 0), 0),
      claims: openClaims.filter((claim) => claim.team === team.name || claim.driver === team.lead || claim.driver === team.helper).length,
      highClaims: openClaims.filter((claim) => (claim.team === team.name || claim.driver === team.lead || claim.driver === team.helper) && claim.risk === "High").length,
    })).sort((a, b) => b.exposure - a.exposure || a.complianceScore - b.complianceScore);
    const typeExposure = Object.values(
      openClaims.reduce((acc, claim) => {
        const key = claim.type || "Unknown";
        acc[key] ||= { type: key, exposure: 0, claims: 0 };
        acc[key].exposure += Number(claim.amount || 0);
        acc[key].claims += 1;
        return acc;
      }, {})
    ).sort((a, b) => b.exposure - a.exposure);
    const riskiestTeam = teamExposure[0] || { team: "No team", exposure: 0, claims: 0, driver: "None", complianceScore: 0 };
    const worstClaim = openClaims.slice().sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))[0];
    const dashboardWidgets = appSettings?.dashboardWidgets || {};
    const visibleDashboardWidgets = Object.values(dashboardWidgets).filter(Boolean).length;
    const stops = Math.max(Number(form?.stops || 0), 0);
    const miles = Math.max(Number(form?.miles || 0), 0);
    const routeHours = Math.max(Number(form?.routeHours || 0), 0);
    const revenueGap = Math.max(Number(results?.requiredRevenue || 0) - Number(results?.totalRevenue || 0), 0);
    const breakEvenPerStop = stops ? Number(results?.totalCost || 0) / stops : 0;
    const targetPerStop = stops ? Number(results?.requiredRevenue || 0) / stops : 0;
    const revenuePerStop = stops ? Number(results?.totalRevenue || 0) / stops : 0;
    const costPerStop = stops ? Number(results?.totalCost || 0) / stops : 0;
    const laborCosts = Number(form?.driverPay || 0) + Number(form?.helperPay || 0);
    const fuelCost = miles && form?.mpg ? (miles / Math.max(Number(form.mpg || 0), 0.01)) * Number(form?.fuelPrice || 0) : 0;
    const maintenanceCost = miles * Number(form?.maintenancePerMile || 0);
    const fixedCosts = Number(form?.dailyTruckPayment || 0) + Number(form?.dailyInsurance || 0) + Number(form?.phoneSoftware || 0);
    const costDrivers = [
      { label: "Labor", value: laborCosts },
      { label: "Fuel", value: fuelCost },
      { label: "Maintenance", value: maintenanceCost },
      { label: "Claims reserve", value: Number(form?.claimsChargebacks || 0) },
      { label: "Truck / insurance / software", value: fixedCosts },
      { label: "Tolls / parking", value: Number(form?.tollsParking || 0) },
      { label: "Other costs", value: Number(form?.otherCosts || 0) },
    ].filter((item) => item.value > 0).sort((a, b) => b.value - a.value);

    return {
      openClaims,
      totalClaimExposure,
      totalExposure,
      highClaims,
      preventableClaims,
      preventableExposure,
      missingPhotoTeams,
      rankedClaims,
      riskiestTeam,
      teamExposure,
      typeExposure,
      worstClaim,
      visibleDashboardWidgets,
      netProfit: Number(results?.netProfit || 0),
      marginPercent: Number(results?.profitMargin || 0) * 100,
      profitPerStop: Number(results?.profitPerStop || 0),
      profitPerMile: Number(results?.profitPerMile || 0),
      profitPerHour: Number(results?.profitPerHour || 0),
      totalCost: Number(results?.totalCost || 0),
      totalRevenue: Number(results?.totalRevenue || 0),
      requiredRevenue: Number(results?.requiredRevenue || 0),
      requiredRoutePay: Number(results?.requiredRoutePay || 0),
      revenueGap,
      breakEvenPerStop,
      targetPerStop,
      revenuePerStop,
      costPerStop,
      costDrivers,
      targetProfit: Number(form?.targetProfit || 0),
      stops,
      miles,
      routeHours,
      routeName: form?.scenarioName || "Current route",
      savedDayCount: savedDays?.length || 0,
    };
  }, [appSettings?.dashboardWidgets, claims, form, results, savedDays?.length, teams]);

  const getAnswer = (rawQuestion) => {
    const ask = rawQuestion.toLowerCase();
    const ctx = businessContext;
    const actions = [];
    const details = [];
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
      details.push(`Break-even per stop: ${currency.format(ctx.breakEvenPerStop)}.`);
      details.push(`Target-profit per stop: ${currency.format(ctx.targetPerStop)}.`);
      tab = "Profitability";
    } else if (ask.includes("charge") || ask.includes("per stop") || ask.includes("rate") || ask.includes("price")) {
      title = `Target rate is ${currency.format(ctx.targetPerStop)} per stop`;
      summary = `${ctx.routeName} has ${ctx.stops} stops. You are making ${currency.format(ctx.revenuePerStop)} per stop right now, break even is ${currency.format(ctx.breakEvenPerStop)}, and target-profit pricing is ${currency.format(ctx.targetPerStop)}.`;
      actions.push(ctx.revenueGap > 0 ? `Add about ${currency.format(ctx.revenueGap)} total revenue to hit your target profit.` : `Current revenue already covers the target profit math.`);
      actions.push(`If this is negotiated as route pay, ask for about ${currency.format(ctx.requiredRoutePay)} route pay.`);
      actions.push(`Do not quote below ${currency.format(ctx.breakEvenPerStop)} per stop unless another charge covers the gap.`);
      details.push(`Cost per stop: ${currency.format(ctx.costPerStop)}.`);
      details.push(`Profit per stop: ${currency.format(ctx.profitPerStop)}.`);
      tab = "Profitability";
    } else if (ask.includes("fix") || ask.includes("first") || ask.includes("today")) {
      const topClaim = ctx.rankedClaims[0];
      title = topClaim ? `Start with ${topClaim.id}: ${topClaim.type}` : "Start with route margin";
      summary = topClaim
        ? `${topClaim.id} is ${currency.format(topClaim.amountValue)} with a ${topClaim.risk} risk rating, assigned to ${topClaim.team} / ${topClaim.driver}. It is the strongest first move because it combines dollars, risk, and missing evidence.`
        : `${ctx.routeName} is at ${currency.format(ctx.netProfit)} profit and ${ctx.marginPercent.toFixed(1)}% margin. There are no open claims, so start with route cost and pricing.`;
      if (topClaim) actions.push(`Collect ${formatList(topClaim.missingEvidence)} before accepting or disputing it.`);
      actions.push(ctx.riskiestTeam?.team ? `Review ${ctx.riskiestTeam.team}; it carries ${currency.format(ctx.riskiestTeam.exposure)} in open exposure.` : "Review team readiness.");
      actions.push(ctx.netProfit < ctx.targetProfit ? `Route profit is ${currency.format(ctx.netProfit)}, below the ${currency.format(ctx.targetProfit)} target.` : `Route profit is above target; protect it by closing evidence gaps.`);
      details.push(`${ctx.openClaims.length} open claims total ${currency.format(ctx.totalExposure)}.`);
      details.push(`${ctx.highClaims.length} high-risk claims and ${ctx.missingPhotoTeams.length} team photo gaps.`);
      tab = "Claims";
    } else if (ask.includes("driver") || ask.includes("team") || ask.includes("costing")) {
      title = `${ctx.riskiestTeam.team} needs the closest review`;
      summary = `${ctx.riskiestTeam.team} is tied to ${currency.format(ctx.riskiestTeam.exposure)} across ${ctx.riskiestTeam.claims} open claim${ctx.riskiestTeam.claims === 1 ? "" : "s"}. Lead driver: ${ctx.riskiestTeam.driver}. Compliance score: ${ctx.riskiestTeam.complianceScore || "N/A"}.`;
      actions.push(`Pull the claim list for ${ctx.riskiestTeam.driver} and separate preventable vs disputed claims.`);
      actions.push(ctx.riskiestTeam.photoStatus !== "Uploaded" ? "Fix the missing daily photo process before the next route." : "Daily photo is uploaded; compare it against customer damage language.");
      actions.push("Coach around the claim type that repeats most, not just the total dollar amount.");
      ctx.teamExposure.slice(0, 3).forEach((team, index) => {
        details.push(`${index + 1}. ${team.team}: ${currency.format(team.exposure)} exposure, ${team.claims} claim${team.claims === 1 ? "" : "s"}.`);
      });
      tab = "Teams";
    } else if (ask.includes("dispute") || ask.includes("claim")) {
      const topClaim = ctx.rankedClaims[0];
      title = topClaim ? `Dispute review: ${topClaim.id}` : "No open claims need dispute review";
      summary = topClaim
        ? `${topClaim.id} (${topClaim.type}) should be reviewed first. Amount: ${currency.format(topClaim.amountValue)}. Team/driver: ${topClaim.team} / ${topClaim.driver}. Missing: ${formatList(topClaim.missingEvidence)}.`
        : "There are no open claims to dispute right now.";
      if (topClaim) {
        actions.push(`Build the packet around ${formatList(topClaim.missingEvidence)}.`);
        actions.push(topClaim.preventable === "Yes" ? "Because it is marked preventable, check if coaching and settlement is smarter than a weak dispute." : "Because preventability is not confirmed, dispute until the retailer proves responsibility.");
        actions.push("Move it to In Progress only after one person owns the packet.");
      }
      ctx.rankedClaims.slice(0, 3).forEach((claim, index) => {
        details.push(`${index + 1}. ${claim.id}: ${currency.format(claim.amountValue)}, ${claim.risk}, score ${claim.disputeScore}.`);
      });
      tab = "Claims";
    } else if (ask.includes("profit") || ask.includes("margin") || ask.includes("down")) {
      const biggestCost = ctx.costDrivers[0];
      title = ctx.netProfit < 0 ? "This route is losing money" : `${currency.format(ctx.netProfit)} profit, ${ctx.marginPercent.toFixed(1)}% margin`;
      summary = `${ctx.routeName} has ${currency.format(ctx.totalRevenue)} revenue against ${currency.format(ctx.totalCost)} cost. Biggest cost driver: ${biggestCost ? `${biggestCost.label} at ${currency.format(biggestCost.value)}` : "no cost driver entered"}.`;
      actions.push(ctx.revenueGap > 0 ? `You need about ${currency.format(ctx.revenueGap)} more revenue to hit target profit.` : `You are at or above the target-profit revenue requirement.`);
      actions.push(`Protect ${currency.format(ctx.profitPerStop)} profit per stop and ${currency.format(ctx.profitPerMile)} profit per mile.`);
      actions.push("Use accessorials first when the contract allows it; then renegotiate route pay.");
      ctx.costDrivers.slice(0, 4).forEach((item, index) => {
        details.push(`${index + 1}. ${item.label}: ${currency.format(item.value)}.`);
      });
      tab = "Profitability";
    } else if (ask.includes("contract") || ask.includes("rate") || ask.includes("renewal")) {
      title = "Review contracts that cannot cover target route math";
      summary = `${ctx.routeName} needs ${currency.format(ctx.requiredRevenue)} total revenue, or about ${currency.format(ctx.targetPerStop)} per stop, to cover costs and target profit. Any contract below that is risky unless accessorials make up the gap.`;
      actions.push(`Use ${currency.format(ctx.requiredRoutePay)} as the route-pay target if stops and accessorials stay the same.`);
      actions.push(ctx.typeExposure[0] ? `Bring up ${ctx.typeExposure[0].type}: ${currency.format(ctx.typeExposure[0].exposure)} in claim exposure.` : "Bring claim exposure into the renewal conversation.");
      actions.push("Check fuel surcharge, install pay, reattempt pay, and accessorial coverage before accepting the rate.");
      details.push(`Current route pay: ${currency.format(Number(form?.routePay || 0))}.`);
      details.push(`Revenue gap to target: ${currency.format(ctx.revenueGap)}.`);
      tab = "Contracts";
    } else if (ask.includes("dashboard") || ask.includes("layout") || ask.includes("show")) {
      title = "Put action items above passive reports";
      summary = `${ctx.visibleDashboardWidgets} dashboard sections are currently turned on. For daily operations, put Needs Attention, Recent Claims, Today's Profit, and Route Health near the top.`;
      actions.push("Use Settings > Dashboard Layout.");
      actions.push("Try the Operations preset for daily dispatch/review.");
      actions.push("Use Finance when reviewing contracts or margin.");
      tab = "Settings";
    } else {
      title = "Business snapshot with next move";
      summary = `${ctx.openClaims.length} open claims, ${currency.format(ctx.totalExposure)} open exposure, ${currency.format(ctx.netProfit)} current route profit, and ${ctx.savedDayCount} saved daily snapshot${ctx.savedDayCount === 1 ? "" : "s"}.`;
      actions.push(ctx.rankedClaims[0] ? `First move: review ${ctx.rankedClaims[0].id} for ${currency.format(ctx.rankedClaims[0].amountValue)}.` : "First move: review route pricing because claims are clean.");
      actions.push(ctx.netProfit < ctx.targetProfit ? `Profit is under target by ${currency.format(ctx.targetProfit - ctx.netProfit)}.` : "Profit is above target right now.");
      actions.push("Ask a sharper question like: what should I charge, who is costing me, or which claim should I dispute?");
      details.push(`Top team exposure: ${ctx.riskiestTeam.team} at ${currency.format(ctx.riskiestTeam.exposure)}.`);
      tab = "Dashboard";
    }

    return { id: Date.now(), question: rawQuestion, title, summary, actions, details, tab };
  };

  const askBusiness = async (nextQuestion = question) => {
    const trimmed = nextQuestion.trim();
    if (!trimmed) return;
    setIsAnswering(true);
    setAiStatus("Answered from live app data.");

    const answer = { ...getAnswer(trimmed), source: "Business data" };

    setConversation((current) => [answer, ...current].slice(0, 6));
    setQuestion("");
    window.setTimeout(() => setIsAnswering(false), 150);
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
              {latest.details?.length > 0 && (
                <div className={isDark ? "mt-4 rounded-xl border border-white/10 bg-white/5 p-3" : "mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3"}>
                  <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>Why this answer</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {latest.details.map((detail) => (
                      <p key={detail} className={`text-xs font-bold leading-5 ${mutedText}`}>{detail}</p>
                    ))}
                  </div>
                </div>
              )}
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
            disabled={isAnswering}
            className={isAnswering ? "mt-3 w-full rounded-xl bg-blue-400 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20" : "mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"}
          >
            {isAnswering ? "Answering..." : "Ask"}
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
            Ask My Business answers from the app data currently loaded in Final Mile Margin. Add new claims, routes, teams, and contract numbers to make the answers sharper.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AskBusinessDashboard;
