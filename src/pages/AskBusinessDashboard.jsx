import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  CheckCircle2,
  currency,
  FileText,
  MessageCircle,
  ReceiptText,
  Skeleton,
  Sparkles,
  Target,
  Users,
} from "../shared";
import DataHealthChecklist from "../components/DataHealthChecklist";
import { getSetupStatus } from "../lib/onboarding";

const analysisModes = [
  {
    id: "attention",
    title: "What Needs Attention",
    prompt: "What should I fix first today?",
    icon: AlertTriangle,
    tab: "Operations",
  },
  {
    id: "money",
    title: "Find Money Leaks",
    prompt: "Why is my profit down and where is money leaking?",
    icon: BarChart3,
    tab: "Profitability",
  },
  {
    id: "claims",
    title: "Review Claims",
    prompt: "Which claims should I dispute and what evidence is missing?",
    icon: FileText,
    tab: "Claims",
  },
  {
    id: "receipts",
    title: "Review Receipts",
    prompt: "What receipt or expense problems should I review?",
    icon: ReceiptText,
    tab: "Receipts",
  },
  {
    id: "team",
    title: "Coach a Team",
    prompt: "Which driver or team is costing me the most?",
    icon: Users,
    tab: "Teams",
  },
  {
    id: "plan",
    title: "Build Action Plan",
    prompt: "Build me a prioritized action plan for today.",
    icon: Target,
    tab: "Dashboard",
  },
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

function EvidenceBox({ isDark, title, items, emptyText = "No data available yet." }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const boxClass = isDark
    ? "rounded-xl border border-white/10 bg-white/5 p-3"
    : "rounded-xl border border-slate-200 bg-slate-50 p-3";
  const labelClass = isDark
    ? "text-xs font-semibold uppercase tracking-wide text-slate-400"
    : "text-xs font-semibold uppercase tracking-wide text-slate-500";
  const itemClass = isDark
    ? "text-xs font-bold leading-5 text-slate-300"
    : "text-xs font-bold leading-5 text-slate-600";
  const emptyClass = isDark
    ? "text-xs font-bold leading-5 text-slate-500"
    : "text-xs font-bold leading-5 text-slate-500";

  return (
    <div className={boxClass}>
      <p className={labelClass}>{title}</p>
      <div className="mt-2 space-y-1.5">
        {safeItems.length ? (
          safeItems.slice(0, 5).map((item) => (
            <p key={item} className={itemClass}>
              {item}
            </p>
          ))
        ) : (
          <p className={emptyClass}>{emptyText}</p>
        )}
      </div>
    </div>
  );
}

const validTabs = new Set([
  "Dashboard",
  "Ask",
  "Intake",
  "Operations",
  "Finance",
  "Profitability",
  "Contracts",
  "Compliance",
  "Claims",
  "Teams",
  "Reports",
  "Settings",
  "Receipts",
]);

const safeArray = (value, fallback = []) => (Array.isArray(value) ? value.filter(Boolean) : fallback);

const normalizeAiAnswer = ({ aiAnswer, fallback, question }) => ({
  ...fallback,
  ...aiAnswer,
  id: Date.now(),
  question,
  title: aiAnswer?.title || fallback.title,
  summary: aiAnswer?.summary || fallback.summary,
  actions: safeArray(aiAnswer?.actions, fallback.actions),
  details: safeArray(aiAnswer?.details, fallback.details),
  evidence: safeArray(aiAnswer?.evidence, fallback.evidence),
  missingInfo: safeArray(aiAnswer?.missingInfo, fallback.missingInfo),
  confidence: ["High", "Medium", "Low"].includes(aiAnswer?.confidence) ? aiAnswer.confidence : fallback.confidence,
  priority: ["High", "Normal", "Low"].includes(aiAnswer?.priority) ? aiAnswer.priority : fallback.priority,
  tab: validTabs.has(aiAnswer?.tab) ? aiAnswer.tab : fallback.tab,
  source: "OpenAI",
});

function AskBusinessDashboard({ claims, teams, results, form, savedDays, appSettings, isDark, navigateToTab, isBlankDemo = false, isDemoMode = false }) {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const [aiStatus, setAiStatus] = useState("");

  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const softCard = isDark
    ? "rounded-2xl border border-white/10 bg-slate-950/60 p-4"
    : "rounded-2xl border border-slate-200 bg-slate-50/80 p-4";
  const inputClass = isDark
    ? "w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500"
    : "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-blue-500";
  const setupStatus = useMemo(
    () => getSetupStatus({ teams, claims, savedDays, appSettings, isBlankDemo, isDemoMode }),
    [teams, claims, savedDays, appSettings, isBlankDemo, isDemoMode]
  );

  const businessContext = useMemo(() => {
    const loadStoredRows = (key) => {
      try {
        const saved = localStorage.getItem(key);
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };
    const storedContracts = [
      ...loadStoredRows("finalMileRollupRows"),
      ...loadStoredRows("finalMileBlankDemoRollupRows"),
      ...(isDemoMode ? loadStoredRows("finalMileDemoRollupRows") : []),
    ];
    const storedImports = [
      ...loadStoredRows("finalMileOnboardingImports"),
      ...loadStoredRows("finalMileBlankDemoOnboardingImports"),
      ...(isDemoMode ? loadStoredRows("finalMileDemoOnboardingImports") : []),
    ];
    const hasContractData = storedContracts.length > 0 || Number(results?.totalRevenue || 0) > 0;
    const hasExpenseData =
      storedContracts.some((row) =>
        Number(row.labor || 0) +
        Number(row.fuel || 0) +
        Number(row.truckInsurance || 0) +
        Number(row.maintenance || 0) +
        Number(row.other || 0) > 0
      ) ||
      Number(results?.totalCost || 0) > 0;
    const setupGaps = [
      hasContractData ? "" : "No contract has been added yet.",
      teams.length ? "" : "No team or driver has been added yet.",
      hasExpenseData ? "" : "No route expense setup has been entered yet.",
      storedImports.length || claims.length ? "" : "No starting receipt, claim, or document has been imported yet.",
    ].filter(Boolean);
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
    const latestSavedDay = Array.isArray(savedDays) ? savedDays[0] : null;
    const dataSources = [
      `${storedContracts.length} setup contract${storedContracts.length === 1 ? "" : "s"}`,
      `${openClaims.length} open claim${openClaims.length === 1 ? "" : "s"}`,
      `${teams.length} team${teams.length === 1 ? "" : "s"}`,
      `${savedDays?.length || 0} saved day${savedDays?.length === 1 ? "" : "s"}`,
      `${costDrivers.length} active cost driver${costDrivers.length === 1 ? "" : "s"}`,
    ];

    return {
      teams,
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
      storedContracts,
      storedImports,
      setupGaps,
      hasContractData,
      hasExpenseData,
      targetProfit: Number(form?.targetProfit || 0),
      stops,
      miles,
      routeHours,
      routeName: form?.scenarioName || "Current route",
      savedDayCount: savedDays?.length || 0,
      latestSavedDay,
      dataSources,
    };
  }, [appSettings?.dashboardWidgets, claims, form, isDemoMode, results, savedDays?.length, teams]);

  const suggestedModes = useMemo(() => {
    if (isDemoMode) {
      return [
        {
          id: "demo-profit",
          title: "Most Profitable Route",
          prompt: "Which route is most profitable?",
          icon: BarChart3,
          tab: "Profitability",
        },
        {
          id: "demo-claim",
          title: "Claim Attention",
          prompt: "Which claim needs attention?",
          icon: FileText,
          tab: "Claims",
        },
        {
          id: "demo-team",
          title: "Team Performance",
          prompt: "Which team is underperforming?",
          icon: Users,
          tab: "Teams",
        },
        {
          id: "demo-expenses",
          title: "Expense Leaks",
          prompt: "What expenses are reducing margin?",
          icon: ReceiptText,
          tab: "Receipts",
        },
      ];
    }

    const setupQuestion = {
      id: "setup",
      title: "Setup First",
      prompt: "What should I enter first to calculate margin?",
      icon: Sparkles,
      tab: "Dashboard",
    };

    if (!setupStatus.checks.contract) {
      return [setupQuestion, analysisModes.find((mode) => mode.id === "plan"), analysisModes.find((mode) => mode.id === "money")].filter(Boolean);
    }

    const modes = [analysisModes.find((mode) => mode.id === "money")];
    if (setupStatus.checks.claims) modes.push(analysisModes.find((mode) => mode.id === "claims"));
    if (setupStatus.checks.team) modes.push(analysisModes.find((mode) => mode.id === "team"));
    if (setupStatus.checks.receipts) modes.push(analysisModes.find((mode) => mode.id === "receipts"));
    modes.push(analysisModes.find((mode) => mode.id === "plan"));
    return modes.filter(Boolean).slice(0, 6);
  }, [isDemoMode, setupStatus]);

  const dailyBriefing = useMemo(() => {
    const ctx = businessContext;
    const topClaim = ctx.rankedClaims[0];
    const topCost = ctx.costDrivers[0];
    const blockers = [
      ctx.highClaims.length ? `${ctx.highClaims.length} high-risk claim${ctx.highClaims.length === 1 ? "" : "s"}` : "",
      ctx.missingPhotoTeams.length ? `${ctx.missingPhotoTeams.length} missing team photo${ctx.missingPhotoTeams.length === 1 ? "" : "s"}` : "",
      ctx.netProfit < ctx.targetProfit ? `${currency.format(Math.max(ctx.targetProfit - ctx.netProfit, 0))} below target profit` : "",
    ].filter(Boolean);

    return {
      title: blockers.length ? "Today needs owner attention" : "Today looks clear so far",
      summary: blockers.length
        ? `${formatList(blockers)}. Start with ${topClaim ? `${topClaim.id} (${currency.format(topClaim.amountValue)})` : topCost ? topCost.label : "route pricing"}.`
        : `Profit is ${currency.format(ctx.netProfit)} with ${ctx.openClaims.length} open claim${ctx.openClaims.length === 1 ? "" : "s"}. Keep receipts and evidence current.`,
      tab: topClaim ? "Claims" : ctx.netProfit < ctx.targetProfit ? "Profitability" : "Operations",
    };
  }, [businessContext]);

  const getAnswer = (rawQuestion) => {
    const ask = rawQuestion.toLowerCase();
    const ctx = businessContext;
    const actions = [];
    const details = [];
    const evidence = [];
    const missingInfo = [];
    let title = "Here is what I see";
    let summary = "";
    let tab = "Dashboard";
    let confidence = "Medium";
    let priority = "Normal";

    evidence.push(...ctx.dataSources);
    if (!ctx.openClaims.length) missingInfo.push("No open claims are entered.");
    if (!ctx.teams.length) missingInfo.push("No teams are entered.");
    if (!ctx.savedDayCount) missingInfo.push("No saved daily history yet.");
    if (!ctx.costDrivers.length) missingInfo.push("No route cost drivers are entered.");
    missingInfo.push(...ctx.setupGaps);

    const asksForMoneyMath = ask.includes("profit") || ask.includes("margin") || ask.includes("break even") || ask.includes("breakeven") || ask.includes("break-even") || ask.includes("bread even") || ask.includes("rate") || ask.includes("price") || ask.includes("charge") || ask.includes("contract");
    if (!ctx.hasContractData && asksForMoneyMath) {
      return {
        id: Date.now(),
        question: rawQuestion,
        title: "Add a contract before I calculate margin",
        summary: "I know what you are asking, but this workspace does not have a saved contract or route revenue yet. If I answered with numbers right now, it would be generic instead of your business.",
        actions: [
          "Go to Dashboard and finish Step 1: Add your first contract.",
          "Enter route pay, routes per week, stops per route, and the basic cost estimates.",
          "After that, ask this again and I can calculate break-even, target price, margin, and money leaks from your actual setup.",
        ],
        details: ctx.setupGaps,
        evidence,
        missingInfo,
        confidence: "High",
        priority: "High",
        tab: "Dashboard",
      };
    }

    if (!ctx.teams.length && (ask.includes("driver") || ask.includes("team") || ask.includes("who"))) {
      return {
        id: Date.now(),
        question: rawQuestion,
        title: "Add a team before I rank drivers",
        summary: "There are no drivers, helpers, or teams saved yet, so I cannot honestly tell you who is costing the business money.",
        actions: [
          "Go to Dashboard and finish Step 2: Add your first team.",
          "Add the driver, helper, truck, and assigned contract or route.",
          "Once claims and receipts are tied to that team, Ask can rank exposure and coaching priorities.",
        ],
        details: ctx.setupGaps,
        evidence,
        missingInfo,
        confidence: "High",
        priority: "Normal",
        tab: "Dashboard",
      };
    }

    if (ask.includes("most profitable") || (ask.includes("which route") && ask.includes("profit"))) {
      const rankedRoutes = ctx.storedContracts
        .map((row) => {
          const cost =
            Number(row.labor || 0) +
            Number(row.fuel || 0) +
            Number(row.truckInsurance || 0) +
            Number(row.maintenance || 0) +
            Number(row.claims || 0) +
            Number(row.other || 0);
          const revenue = Number(row.revenue || 0);
          const profit = revenue - cost;
          const margin = revenue > 0 ? profit / revenue : 0;
          return { ...row, cost, revenue, profit, margin };
        })
        .sort((a, b) => b.profit - a.profit);
      const winner = rankedRoutes[0];
      title = winner ? `${winner.contract} is the most profitable route` : "Add contract rows before I rank route profitability";
      summary = winner
        ? `${winner.contract} keeps about ${currency.format(winner.profit)} after entered costs, with a ${(winner.margin * 100).toFixed(1)}% margin. It beats the other demo route because revenue is stronger while claims and other costs stay controlled.`
        : "I need saved contract or route rows before I can compare routes.";
      rankedRoutes.slice(0, 3).forEach((route, index) => {
        details.push(`${index + 1}. ${route.contract}: ${currency.format(route.profit)} profit, ${(route.margin * 100).toFixed(1)}% margin.`);
      });
      actions.push("Open Finance > Profitability to compare route math side by side.");
      actions.push("Check whether the lower-margin route needs accessorials, labor control, or a rate review.");
      actions.push("Use saved snapshots to confirm whether the route stays profitable over multiple days.");
      tab = "Profitability";
      confidence = winner ? "High" : "Low";
      priority = "Normal";
    } else if (ask.includes("break even") || ask.includes("breakeven") || ask.includes("break-even") || ask.includes("bread even") || (ask.includes("make") && ask.includes("even"))) {
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
      confidence = ctx.totalCost > 0 ? "High" : "Low";
      priority = gapToBreakEven > 0 ? "High" : "Normal";
    } else if (ask.includes("charge") || ask.includes("per stop") || ask.includes("rate") || ask.includes("price")) {
      title = `Target rate is ${currency.format(ctx.targetPerStop)} per stop`;
      summary = `${ctx.routeName} has ${ctx.stops} stops. You are making ${currency.format(ctx.revenuePerStop)} per stop right now, break even is ${currency.format(ctx.breakEvenPerStop)}, and target-profit pricing is ${currency.format(ctx.targetPerStop)}.`;
      actions.push(ctx.revenueGap > 0 ? `Add about ${currency.format(ctx.revenueGap)} total revenue to hit your target profit.` : `Current revenue already covers the target profit math.`);
      actions.push(`If this is negotiated as route pay, ask for about ${currency.format(ctx.requiredRoutePay)} route pay.`);
      actions.push(`Do not quote below ${currency.format(ctx.breakEvenPerStop)} per stop unless another charge covers the gap.`);
      details.push(`Cost per stop: ${currency.format(ctx.costPerStop)}.`);
      details.push(`Profit per stop: ${currency.format(ctx.profitPerStop)}.`);
      tab = "Profitability";
      confidence = ctx.stops && ctx.totalCost ? "High" : "Low";
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
      confidence = topClaim ? "High" : "Medium";
      priority = topClaim || ctx.netProfit < ctx.targetProfit ? "High" : "Normal";
    } else if (ask.includes("receipt") || ask.includes("expense")) {
      title = "Receipt review should live in Finance";
      summary = `Ask can see route cost pressure, but receipt-level rows are reviewed in Finance > Receipts. Right now route costs show ${currency.format(ctx.totalCost)} total cost, with ${ctx.costDrivers[0] ? `${ctx.costDrivers[0].label} as the biggest entered cost` : "no entered cost drivers"}.`;
      actions.push("Open Finance > Receipts and review mobile-uploaded gas, tools, maintenance, parking, and toll receipts.");
      actions.push(ctx.costDrivers[0] ? `Compare uploaded receipts against ${ctx.costDrivers[0].label}, currently ${currency.format(ctx.costDrivers[0].value)}.` : "Upload at least one receipt from mobile so Ask can compare entered costs against evidence.");
      actions.push("Flag any receipt without a vendor, amount, route, or reason for expense.");
      details.push("Mobile receipts save under the Supabase documents table as Expense Receipts.");
      details.push(`Current entered route cost total: ${currency.format(ctx.totalCost)}.`);
      tab = "Receipts";
      confidence = "Medium";
      priority = ctx.totalCost > ctx.totalRevenue && ctx.totalCost > 0 ? "High" : "Normal";
    } else if (ask.includes("action plan") || ask.includes("prioritized") || ask.includes("plan")) {
      const topClaim = ctx.rankedClaims[0];
      const topCost = ctx.costDrivers[0];
      title = "Today’s prioritized action plan";
      summary = `Start with the highest dollar/risk issue, then close proof gaps, then tune pricing. Current profit is ${currency.format(ctx.netProfit)} against a ${currency.format(ctx.targetProfit)} target.`;
      if (topClaim) actions.push(`1. Review ${topClaim.id}: ${currency.format(topClaim.amountValue)} ${topClaim.risk} claim. Missing: ${formatList(topClaim.missingEvidence)}.`);
      if (ctx.missingPhotoTeams.length) actions.push(`2. Get daily photos from ${formatList(ctx.missingPhotoTeams.slice(0, 2).map((team) => team.name))}.`);
      if (topCost) actions.push(`3. Review ${topCost.label}, currently ${currency.format(topCost.value)}.`);
      actions.push(`4. Open Finance if revenue is below ${currency.format(ctx.requiredRevenue)} target revenue.`);
      details.push(`${ctx.openClaims.length} open claims.`);
      details.push(`${ctx.missingPhotoTeams.length} photo gaps.`);
      details.push(`${ctx.costDrivers.length} entered cost drivers.`);
      tab = topClaim ? "Claims" : "Operations";
      confidence = ctx.openClaims.length || ctx.costDrivers.length ? "High" : "Low";
      priority = topClaim || ctx.netProfit < ctx.targetProfit ? "High" : "Normal";
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
      confidence = ctx.teamExposure.length ? "High" : "Low";
      priority = ctx.riskiestTeam.exposure > 0 ? "High" : "Normal";
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
      confidence = topClaim ? "High" : "Low";
      priority = topClaim?.risk === "High" ? "High" : "Normal";
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
      confidence = ctx.totalRevenue || ctx.totalCost ? "High" : "Low";
      priority = ctx.netProfit < ctx.targetProfit ? "High" : "Normal";
    } else if (ask.includes("contract") || ask.includes("rate") || ask.includes("renewal")) {
      title = "Review contracts that cannot cover target route math";
      summary = `${ctx.routeName} needs ${currency.format(ctx.requiredRevenue)} total revenue, or about ${currency.format(ctx.targetPerStop)} per stop, to cover costs and target profit. Any contract below that is risky unless accessorials make up the gap.`;
      actions.push(`Use ${currency.format(ctx.requiredRoutePay)} as the route-pay target if stops and accessorials stay the same.`);
      actions.push(ctx.typeExposure[0] ? `Bring up ${ctx.typeExposure[0].type}: ${currency.format(ctx.typeExposure[0].exposure)} in claim exposure.` : "Bring claim exposure into the renewal conversation.");
      actions.push("Check fuel surcharge, install pay, reattempt pay, and accessorial coverage before accepting the rate.");
      details.push(`Current route pay: ${currency.format(Number(form?.routePay || 0))}.`);
      details.push(`Revenue gap to target: ${currency.format(ctx.revenueGap)}.`);
      tab = "Contracts";
      confidence = ctx.requiredRevenue || ctx.totalCost ? "Medium" : "Low";
    } else if (ask.includes("dashboard") || ask.includes("layout") || ask.includes("show")) {
      title = "Put action items above passive reports";
      summary = `${ctx.visibleDashboardWidgets} dashboard sections are currently turned on. For daily operations, put Needs Attention, Recent Claims, Today's Profit, and Route Health near the top.`;
      actions.push("Use Settings > Dashboard Layout.");
      actions.push("Try the Operations preset for daily dispatch/review.");
      actions.push("Use Finance when reviewing contracts or margin.");
      tab = "Settings";
      confidence = "Medium";
    } else {
      title = "Business snapshot with next move";
      summary = `${ctx.openClaims.length} open claims, ${currency.format(ctx.totalExposure)} open exposure, ${currency.format(ctx.netProfit)} current route profit, and ${ctx.savedDayCount} saved daily snapshot${ctx.savedDayCount === 1 ? "" : "s"}.`;
      actions.push(ctx.rankedClaims[0] ? `First move: review ${ctx.rankedClaims[0].id} for ${currency.format(ctx.rankedClaims[0].amountValue)}.` : "First move: review route pricing because claims are clean.");
      actions.push(ctx.netProfit < ctx.targetProfit ? `Profit is under target by ${currency.format(ctx.targetProfit - ctx.netProfit)}.` : "Profit is above target right now.");
      actions.push("Ask a sharper question like: what should I charge, who is costing me, or which claim should I dispute?");
      details.push(`Top team exposure: ${ctx.riskiestTeam.team} at ${currency.format(ctx.riskiestTeam.exposure)}.`);
      tab = "Dashboard";
      confidence = ctx.openClaims.length || ctx.totalRevenue || ctx.teams.length ? "Medium" : "Low";
    }

    return { id: Date.now(), question: rawQuestion, title, summary, actions, details, evidence, missingInfo, confidence, priority, tab };
  };

  const askBusiness = async (nextQuestion = question) => {
    const trimmed = nextQuestion.trim();
    if (!trimmed) return;
    setIsAnswering(true);
    setAiStatus("Asking OpenAI with your live business data...");

    const fallback = { ...getAnswer(trimmed), source: "Business data" };
    const shouldStayWithSetupAnswer = fallback.title === "Add a contract before I calculate margin" || fallback.title === "Add a team before I rank drivers";

    if (shouldStayWithSetupAnswer) {
      setConversation((current) => [fallback, ...current].slice(0, 6));
      setAiStatus("Answered from setup status. Add the missing setup data before OpenAI analysis is useful.");
      setQuestion("");
      setIsAnswering(false);
      return;
    }

    try {
      const response = await fetch("/api/ask-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          businessContext,
          history: conversation.slice(0, 5).map((item) => ({
            question: item.question,
            title: item.title,
            summary: item.summary,
          })),
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "OpenAI answer unavailable.");
      }

      const result = await response.json();
      const answer = normalizeAiAnswer({ aiAnswer: result, fallback, question: trimmed });
      setConversation((current) => [answer, ...current].slice(0, 6));
      setAiStatus("Answered with OpenAI using your live app data.");
    } catch (error) {
      setConversation((current) => [fallback, ...current].slice(0, 6));
      const message = error.message || "OpenAI unavailable.";
      setAiStatus(
        message.includes("OPENAI_API_KEY")
          ? "OpenAI is not connected yet. Add the OpenAI API key in Vercel to turn on conversational answers. Showing local fallback for now."
          : message.includes("quota") || message.includes("429")
            ? "OpenAI is connected, but the OpenAI account needs billing or more API credits. Showing local fallback for now."
          : `${message} Showing local business fallback.`
      );
    } finally {
      setQuestion("");
      setIsAnswering(false);
    }
  };

  const latest = conversation[0] || getAnswer("What should I fix first today?");

  return (
    <div className={isDark ? "space-y-5 text-white" : "space-y-5 text-slate-950"}>
      <div data-tour="ask-header" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">AI Assistant</span>
            <span className={isDark ? "rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"}>
              Claims, teams, profit, receipts, contracts
            </span>
          </div>
          <h1 className={`text-3xl font-black leading-tight tracking-tight sm:text-4xl ${titleText}`}>Ask My Business</h1>
          <p className={`mt-2 max-w-3xl text-sm font-semibold sm:text-base ${mutedText}`}>AI action center for owner decisions, claim reviews, team coaching, receipts, and margin fixes.</p>
        </div>
      </div>

      <div data-tour="ask-briefing" className={isDark ? "rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5" : "rounded-2xl border border-blue-100 bg-blue-50 p-5"}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className={isDark ? "text-xs font-semibold uppercase tracking-wide text-blue-200" : "text-xs font-semibold uppercase tracking-wide text-blue-700"}>Daily AI Briefing</p>
              <h2 className={`mt-1 text-xl font-bold ${titleText}`}>{dailyBriefing.title}</h2>
              <p className={`mt-1 text-sm font-semibold leading-6 ${mutedText}`}>{dailyBriefing.summary}</p>
            </div>
          </div>
          <button onClick={() => navigateToTab(dailyBriefing.tab)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">
            Open {dailyBriefing.tab}
          </button>
        </div>
      </div>

      <div data-tour="ask-suggested-prompts" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {suggestedModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => askBusiness(mode.prompt)}
              className={`${softCard} text-left transition hover:border-blue-500/50 hover:bg-blue-500/5`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <span className={isDark ? "rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase text-slate-300" : "rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase text-slate-500"}>
                  Analyze
                </span>
              </div>
              <p className={`mt-3 font-black ${titleText}`}>{mode.title}</p>
              <p className={`mt-1 text-xs font-semibold leading-5 ${mutedText}`}>{mode.prompt}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div data-tour="ask-answer-panel" className={cardClass}>
          {isAnswering ? (
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <Brain className="h-6 w-6 animate-pulse" />
              </span>
              <div className="min-w-0 flex-1">
                <Skeleton className="h-6 w-1/2 rounded-lg" />
                <div className="mt-3 flex gap-2">
                  <Skeleton className="h-6 w-28 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="mt-5 space-y-2.5">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-11/12 rounded" />
                  <Skeleton className="h-4 w-4/5 rounded" />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              </div>
            </div>
          ) : (
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Brain className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className={`text-xl font-bold ${titleText}`}>{latest.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700">
                      {latest.source || "Business data"}
                    </span>
                    <span className={latest.priority === "High" ? "inline-flex rounded-full bg-red-500/10 px-3 py-1 text-xs font-black text-red-700" : "inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-700"}>
                      {latest.priority} Priority
                    </span>
                    <span className={latest.confidence === "High" ? "inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700" : latest.confidence === "Low" ? "inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-700" : "inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-700"}>
                      {latest.confidence} Confidence
                    </span>
                  </div>
                </div>
              </div>
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
                  <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Why this answer</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {latest.details.map((detail) => (
                      <p key={detail} className={`text-xs font-bold leading-5 ${mutedText}`}>{detail}</p>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <EvidenceBox isDark={isDark} title="Data Used" items={latest.evidence || []} />
                <EvidenceBox isDark={isDark} title="Missing Info" items={latest.missingInfo || []} emptyText="No major data gaps detected." />
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
          )}
        </div>

        <div data-tour="ask-question-box" className={cardClass}>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <h2 className={`text-lg font-bold ${titleText}`}>Ask a Question</h2>
          </div>
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
          <p className={`mt-3 text-xs font-semibold ${mutedText}`}>Or pick a suggested analysis above.</p>
        </div>
      </div>

      {conversation.length > 0 && (
        <div data-tour="ask-recent-questions" className={cardClass}>
          <h2 className={`text-lg font-bold ${titleText}`}>Recent Questions</h2>
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

      <div data-tour="ask-disclaimer" className={isDark ? "rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4" : "rounded-2xl border border-amber-200 bg-amber-50 p-4"}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <p className={isDark ? "text-sm font-semibold leading-6 text-amber-100" : "text-sm font-semibold leading-6 text-amber-900"}>
            Ask My Business answers from the app data currently loaded in Last Mile Margin. Add new claims, routes, teams, and contract numbers to make the answers sharper.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AskBusinessDashboard;
