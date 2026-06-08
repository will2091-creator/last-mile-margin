import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Area,
  AreaChart,
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  Camera,
  CartesianGrid,
  CheckCircle2,
  ClipboardCheck,
  currency,
  defaultSettings,
  DollarSign,
  FileDown,
  FileText,
  number,
  ResponsiveContainer,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Tooltip,
  Upload,
  UserPlus,
  Users,
  XAxis,
  YAxis,
} from "../shared";
import NextActionCard from "../components/NextActionCard";
import WatchdogPanel from "../components/WatchdogPanel";
import { InlineEmpty } from "../components/EmptyState";
import { getNextBestSetupAction, getSetupStatus } from "../lib/onboarding";
import { useCountUp } from "../hooks/useCountUp";
import ContractModal from "../components/dashboard/ContractModal";
import TeamModal from "../components/dashboard/TeamModal";
import ExpenseModal from "../components/dashboard/ExpenseModal";
import ImportModal from "../components/dashboard/ImportModal";
import SetupWizard from "../components/dashboard/SetupWizard";

function DashboardHome({ teams, claims, setTeams, setClaims, setActiveTab, isDark, appSettings, savedDaySnapshot, savedDays = [], isBlankDemo = false, isDemoMode = false, onSaveSnapshot, onApplyDayLog, ownerName = "" }) {
  const defaultDashboardOrder = defaultSettings.dashboardWidgetOrder || Object.keys(defaultSettings.dashboardWidgets);
  const dashboardWidgetOrder = [
    ...new Set([...(appSettings?.dashboardWidgetOrder || []), ...defaultDashboardOrder]),
  ].filter((key) => Object.prototype.hasOwnProperty.call(defaultSettings.dashboardWidgets, key));
  const activeTeams = teams.length;
  const photosUploaded = teams.filter((team) => team.photoStatus === "Uploaded").length;
  const openClaims = claims.filter((claim) => claim.status !== "Closed").length;
  const claimsExposure = claims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);

  const [dashboardPeriod, setDashboardPeriod] = useState("Day");
  const [setupExpanded, setSetupExpanded] = useState(false);
  const [contractSort, setContractSort] = useState({ key: "netProfit", dir: "desc" });
  const contractStorageKey = isDemoMode ? "finalMileDemoRollupRows" : isBlankDemo ? "finalMileBlankDemoRollupRows" : "finalMileRollupRows";
  const importStorageKey = isDemoMode ? "finalMileDemoOnboardingImports" : isBlankDemo ? "finalMileBlankDemoOnboardingImports" : "finalMileOnboardingImports";
  const emptyContractDraft = {
    contract: "",
    routePay: "",
    routes: "1",
    stops: "",
    labor: "",
    fuel: "",
    truckInsurance: "",
    maintenance: "",
    claims: "",
    other: "",
  };
  const emptyTeamDraft = {
    name: "",
    lead: "",
    helper: "",
    truck: "",
    route: "",
  };
  const emptyImportDraft = {
    type: "Contract Document",
    title: "",
    amount: "",
    notes: "",
  };
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [contractDraft, setContractDraft] = useState(emptyContractDraft);
  const [teamDraft, setTeamDraft] = useState(emptyTeamDraft);
  const [importDraft, setImportDraft] = useState(emptyImportDraft);
  const [expenseDraft, setExpenseDraft] = useState({
    labor: "",
    fuel: "",
    truckInsurance: "",
    maintenance: "",
    other: "",
  });
  const [contractSaveStatus, setContractSaveStatus] = useState("");
  const [teamSaveStatus, setTeamSaveStatus] = useState("");
  const [importSaveStatus, setImportSaveStatus] = useState("");
  const [expenseSaveStatus, setExpenseSaveStatus] = useState("");
  const [activeSetupStep, setActiveSetupStep] = useState("contract");
  const setupStorageKey = isDemoMode ? "finalMileDemoSetupWizard" : isBlankDemo ? "finalMileBlankDemoSetupWizard" : "finalMileSetupWizard";
  const [setupWizard, setSetupWizard] = useState(() => {
    try {
      const saved = localStorage.getItem(setupStorageKey);
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        skipped: parsed.skipped || {},
        previewed: Boolean(parsed.previewed),
      };
    } catch {
      return { skipped: {}, previewed: false };
    }
  });
  const [quickImports, setQuickImports] = useState(() => {
    try {
      const saved = localStorage.getItem(importStorageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [quickContracts, setQuickContracts] = useState(() => {
    try {
      const saved = localStorage.getItem(contractStorageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(contractStorageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      setQuickContracts(Array.isArray(parsed) ? parsed : []);
    } catch {
      setQuickContracts([]);
    }
  }, [contractStorageKey]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(importStorageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      setQuickImports(Array.isArray(parsed) ? parsed : []);
    } catch {
      setQuickImports([]);
    }
  }, [importStorageKey]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(setupStorageKey);
      const parsed = saved ? JSON.parse(saved) : { skipped: {}, previewed: false };
      setSetupWizard({
        skipped: parsed.skipped && typeof parsed.skipped === "object" ? parsed.skipped : {},
        previewed: Boolean(parsed.previewed),
      });
    } catch {
      setSetupWizard({ skipped: {}, previewed: false });
    }
  }, [setupStorageKey]);

  useEffect(() => {
    localStorage.setItem(setupStorageKey, JSON.stringify(setupWizard));
  }, [setupStorageKey, setupWizard]);

  const periodMultipliers = {
    Day: 1,
    Week: 7,
    Month: 30,
    Qtr: 90,
    Year: 365,
  };

  const periodMultiplier = periodMultipliers[dashboardPeriod] || 1;
  const rollupPeriodMultipliers = {
    Day: 1 / 7,
    Week: 1,
    Month: 4.33,
    Qtr: 13,
    Year: 52,
  };
  const rollupPeriodMultiplier = rollupPeriodMultipliers[dashboardPeriod] || 1;
  const quickContractTotals = useMemo(() => {
    return quickContracts.reduce(
      (acc, row) => {
        const revenue = Number(row.revenue || 0);
        const labor = Number(row.labor || 0);
        const fuel = Number(row.fuel || 0);
        const truckInsurance = Number(row.truckInsurance || 0);
        const maintenance = Number(row.maintenance || 0);
        const claimsTotal = Number(row.claims || 0);
        const other = Number(row.other || 0);
        const totalCosts = labor + fuel + truckInsurance + maintenance + claimsTotal + other;

        acc.revenue += revenue;
        acc.totalCosts += totalCosts;
        acc.claims += claimsTotal;
        acc.netProfit += revenue - totalCosts;
        return acc;
      },
      { revenue: 0, totalCosts: 0, claims: 0, netProfit: 0 }
    );
  }, [quickContracts]);
  const hasQuickContracts = quickContracts.length > 0;

  const baseTodayProfit = hasQuickContracts ? quickContractTotals.netProfit * rollupPeriodMultiplier : 0;
  const todayProfit = savedDaySnapshot?.profit ?? baseTodayProfit;
  const dashboardRevenue = savedDaySnapshot?.revenue ?? (hasQuickContracts ? quickContractTotals.revenue * rollupPeriodMultiplier : 0);
  const dashboardCosts = savedDaySnapshot?.costs ?? (hasQuickContracts ? quickContractTotals.totalCosts * rollupPeriodMultiplier : 0);
  const margin = savedDaySnapshot ? savedDaySnapshot.margin * 100 : dashboardRevenue > 0 ? (todayProfit / dashboardRevenue) * 100 : 0;
  // Animate the headline figures counting up on load / period change.
  const animatedProfit = useCountUp(todayProfit);
  const animatedMargin = useCountUp(margin);
  const animatedRevenue = useCountUp(dashboardRevenue);
  const animatedCosts = useCountUp(dashboardCosts);
  const periodClaimsExposure = savedDaySnapshot?.claimsExposure ?? (hasQuickContracts ? quickContractTotals.claims * rollupPeriodMultiplier : claimsExposure * Math.min(periodMultiplier, 12));
  const escrowBalance = savedDaySnapshot?.escrow ?? (periodClaimsExposure > 0 ? Math.max(periodClaimsExposure * 0.35, 0) : 0);



  const recentClaims = claims.slice(0, 4);

  // Real period-over-period trend from saved snapshots (honest, not synthetic).
  const chronologicalSavedDays = Array.isArray(savedDays)
    ? [...savedDays]
      .filter((day) => day && Number.isFinite(Number(day.profit)))
      .sort((a, b) => new Date(a.savedAt || 0) - new Date(b.savedAt || 0))
    : [];
  // Compare to the most recent saved snapshot (or the one before the snapshot being viewed).
  // Only metrics that share a data source with snapshots get a delta, so the numbers stay honest:
  // open claims and team readiness are point-in-time counts; profit/margin trend lives in the chart below.
  const comparisonSnapshot = (() => {
    if (!chronologicalSavedDays.length) return null;
    if (savedDaySnapshot) {
      const index = chronologicalSavedDays.findIndex((day) => day.id === savedDaySnapshot.id);
      return index > 0 ? chronologicalSavedDays[index - 1] : null;
    }
    return chronologicalSavedDays[chronologicalSavedDays.length - 1];
  })();
  const currentReadiness = Math.round((photosUploaded / Math.max(activeTeams, 1)) * 100);
  const previousReadiness = comparisonSnapshot && Number(comparisonSnapshot.teamsCount) > 0
    ? Math.round((Number(comparisonSnapshot.photosUploaded || 0) / Math.max(Number(comparisonSnapshot.teamsCount), 1)) * 100)
    : null;
  const pointChange = (current, previous) =>
    previous === null || previous === undefined || !Number.isFinite(previous) ? null : current - previous;
  const readinessTrendDelta = previousReadiness !== null ? pointChange(currentReadiness, previousReadiness) : null;
  const comparisonLabel = comparisonSnapshot ? `vs ${comparisonSnapshot.label || "last snapshot"}` : "";

  // Profit trend chart series (chronological, most recent 8 snapshots).
  const profitTrendData = chronologicalSavedDays.slice(-8).map((day, index) => ({
    label: day.label || day.date || `#${index + 1}`,
    profit: Number(day.profit || 0),
  }));
  // Only show the trend chart once there are a few days of history — a 2-point
  // near-flat line reads as empty.
  const hasProfitTrend = profitTrendData.length >= 3;

  // Claims grouped by status (for the Risk section detail).

  const renderTrendChip = (delta, { suffix = "%", goodIsUp = true } = {}) => {
    if (delta === null || delta === undefined || !Number.isFinite(delta)) return null;
    const flat = Math.abs(delta) < 0.05;
    const isUp = delta > 0;
    const good = flat ? null : goodIsUp ? isUp : !isUp;
    const arrow = flat ? "→" : isUp ? "↑" : "↓";
    const toneClass = flat
      ? isDark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600"
      : good
        ? isDark ? "bg-emerald-500/15 text-emerald-200" : "bg-emerald-500/10 text-emerald-700"
        : isDark ? "bg-red-500/15 text-red-200" : "bg-red-500/10 text-red-600";
    return (
      <span title={comparisonLabel} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black ${toneClass}`}>
        {arrow} {number.format(Math.abs(flat ? 0 : delta))}{suffix}
      </span>
    );
  };

  const hasQuickImports = quickImports.length > 0;
  const hasExpenseSetup = quickContracts.some((row) =>
    Number(row.labor || 0) +
    Number(row.fuel || 0) +
    Number(row.truckInsurance || 0) +
    Number(row.maintenance || 0) +
    Number(row.other || 0) > 0
  );
  const hasStartedWorkspace = hasQuickContracts || hasQuickImports || claims.length > 0 || teams.length > 0 || savedDays.length > 0;
  const isCleanBlankWorkspace = !hasStartedWorkspace;

  const quickContractCards = quickContracts.map((row) => {
    const revenue = Number(row.revenue || 0);
    const totalCosts = Number(row.labor || 0) + Number(row.fuel || 0) + Number(row.truckInsurance || 0) + Number(row.maintenance || 0) + Number(row.claims || 0) + Number(row.other || 0);
    const netProfit = revenue - totalCosts;

    return {
      id: row.id,
      name: row.contract,
      routes: Number(row.routes || 0),
      revenue,
      netProfit,
      margin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
    };
  });

  const toggleContractSort = (key) =>
    setContractSort((current) => (current.key === key ? { key, dir: current.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }));
  const sortedContractCards = [...quickContractCards]
    .sort((a, b) => {
      const av = a[contractSort.key];
      const bv = b[contractSort.key];
      if (typeof av === "string") return contractSort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return contractSort.dir === "asc" ? av - bv : bv - av;
    })
    .slice(0, 6);

  const missingPhotoTeams = teams.filter((team) => team.photoStatus === "Missing");
  const needsAttention = [
    missingPhotoTeams.length > 0 && {
      title: `${missingPhotoTeams[0].name} missing photo`,
      detail: `${missingPhotoTeams.length} team${missingPhotoTeams.length === 1 ? "" : "s"} still need daily photo proof.`,
      icon: Camera,
      tab: "Operations",
      tone: "red",
    },
    openClaims > 0 && {
      title: "Claims review needed",
      detail: `${openClaims} open claim${openClaims === 1 ? "" : "s"} require review.`,
      icon: FileText,
      tab: "Operations",
      tone: "amber",
    },
    hasQuickContracts && dashboardRevenue > 0 && dashboardCosts / dashboardRevenue > 0.75 && {
      title: "Cost above target",
      detail: "Route costs are eating more than 75% of revenue.",
      icon: AlertTriangle,
      tab: "Finance",
      tone: "amber",
    },
    periodClaimsExposure > 0 && escrowBalance < periodClaimsExposure * 0.5 && {
      title: "Reserve under exposure",
      detail: "Open claim exposure is higher than the current reserve target.",
      icon: ShieldCheck,
      tab: "Finance",
      tone: "red",
    },
  ].filter(Boolean);






  const pageClass = isDark ? "space-y-6 text-white" : "space-y-6 text-slate-950";
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const rowBorder = isDark ? "border-white/10" : "border-slate-200";
  const modalInputClass = isDark
    ? "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
    : "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500";

  const toneIcon = (tone) => {
    if (tone === "red") return "bg-red-500/10 text-red-600";
    if (tone === "amber") return "bg-amber-500/10 text-amber-700";
    if (tone === "green") return "bg-emerald-500/10 text-emerald-700";
    return "bg-blue-500/10 text-blue-600";
  };


  const goToSource = (tabName) => setActiveTab(tabName);

  // ---- AI Margin Brief (Pillar 2) ----
  const marginBriefContext = useMemo(() => {
    const profit = Number(todayProfit || 0);
    const revenue = Number(dashboardRevenue || 0);
    const costs = Number(dashboardCosts || 0);
    const marginPct = Number(margin || 0);
    const normMargin = (m) => (Math.abs(Number(m || 0)) <= 1 ? Number(m || 0) * 100 : Number(m || 0));
    const history = (Array.isArray(savedDays) ? savedDays : []).slice(0, 7);
    const avgProfit = history.length ? history.reduce((sum, day) => sum + Number(day.profit || 0), 0) / history.length : null;
    const avgMargin = history.length ? history.reduce((sum, day) => sum + normMargin(day.margin), 0) / history.length : null;
    const contractRows = (quickContracts || [])
      .map((row) => {
        const rev = Number(row.revenue || 0);
        const cost =
          Number(row.labor || 0) + Number(row.fuel || 0) + Number(row.truckInsurance || 0) +
          Number(row.maintenance || 0) + Number(row.claims || 0) + Number(row.other || 0);
        const prof = rev - cost;
        return { name: row.contract || "Unnamed route", revenue: rev, profit: prof, margin: rev ? Math.round((prof / rev) * 100) : 0 };
      })
      .filter((row) => row.revenue > 0);
    const byMargin = [...contractRows].sort((a, b) => a.margin - b.margin);
    const openClaimsList = (claims || []).filter((claim) => claim.status !== "Closed");
    const openExposure = openClaimsList.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
    const highRisk = openClaimsList.filter((claim) => claim.risk === "High").length;
    const topClaim = openClaimsList.slice().sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))[0];
    return {
      period: dashboardPeriod,
      revenue,
      costs,
      profit,
      margin: Math.round(marginPct * 10) / 10,
      trend: avgProfit === null ? null : {
        avgProfit: Math.round(avgProfit),
        avgMargin: Math.round(avgMargin * 10) / 10,
        deltaProfit: Math.round(profit - avgProfit),
        deltaMargin: Math.round((marginPct - avgMargin) * 10) / 10,
        daysCompared: history.length,
      },
      worstContract: byMargin[0] || null,
      bestContract: byMargin[byMargin.length - 1] || null,
      claims: {
        open: openClaimsList.length,
        exposure: openExposure,
        highRisk,
        topClaim: topClaim ? { type: topClaim.type, amount: Number(topClaim.amount || 0) } : null,
      },
      teams: {
        total: (teams || []).length,
        atRisk: (teams || []).filter((team) => team.status === "At Risk").length,
        missingPhotos: (teams || []).filter((team) => team.photoStatus !== "Uploaded").length,
      },
      companyName: appSettings?.companyName || "your business",
      hasData: revenue > 0 || profit !== 0 || contractRows.length > 0,
    };
  }, [todayProfit, dashboardRevenue, dashboardCosts, margin, savedDays, quickContracts, claims, teams, dashboardPeriod, appSettings]);

  const buildFallbackBrief = (ctx) => {
    const money = (value) => currency.format(Math.round(Number(value || 0)));
    const dir = ctx.trend ? (ctx.trend.deltaProfit >= 0 ? "up" : "down") : null;
    const sentiment = ctx.trend ? (ctx.trend.deltaProfit >= 0 ? "positive" : "negative") : "neutral";
    const trendLabel = ctx.trend ? (ctx.trend.daysCompared === 1 ? "vs yesterday" : `vs your ${ctx.trend.daysCompared}-day average`) : "";
    const headline = ctx.trend
      ? `Net profit ${dir} ${money(Math.abs(ctx.trend.deltaProfit))} ${trendLabel}`
      : `${money(ctx.profit)} net profit at ${ctx.margin}% margin`;
    const parts = [`You're at ${money(ctx.profit)} net profit on ${money(ctx.revenue)} revenue (${ctx.margin}% margin) this ${ctx.period.toLowerCase()}.`];
    if (ctx.trend) parts.push(`That's ${dir} ${money(Math.abs(ctx.trend.deltaProfit))} versus your recent ${ctx.trend.daysCompared}-day average of ${money(ctx.trend.avgProfit)}.`);
    if (ctx.worstContract && ctx.bestContract && ctx.worstContract.name !== ctx.bestContract.name) {
      parts.push(`${ctx.worstContract.name} is your thinnest route at ${ctx.worstContract.margin}% margin; ${ctx.bestContract.name} leads at ${ctx.bestContract.margin}%.`);
    } else if (ctx.worstContract) {
      parts.push(`${ctx.worstContract.name} is running at ${ctx.worstContract.margin}% margin.`);
    }
    let topMove;
    if (ctx.claims.highRisk > 0 && ctx.claims.topClaim) {
      topMove = `Review the ${ctx.claims.topClaim.type} claim (${money(ctx.claims.topClaim.amount)}) — you have ${ctx.claims.highRisk} high-risk claim${ctx.claims.highRisk > 1 ? "s" : ""} and ${money(ctx.claims.exposure)} open exposure. Generate a dispute letter if it's contestable.`;
    } else if (ctx.worstContract && ctx.worstContract.margin < 20) {
      topMove = `Dig into ${ctx.worstContract.name}'s costs — at ${ctx.worstContract.margin}% margin it's dragging your blended profit. Check fuel and labor per stop.`;
    } else if (ctx.teams.missingPhotos > 0) {
      topMove = `Chase the ${ctx.teams.missingPhotos} team${ctx.teams.missingPhotos > 1 ? "s" : ""} missing today's photo check-in before they roll — missing proof is how claims turn into losses.`;
    } else if (!ctx.trend) {
      topMove = `Save a few days of snapshots so I can spot trends and tell you what's moving your margin.`;
    } else {
      topMove = `Hold the line — log today's numbers and keep claims current. Nothing is bleeding margin right now.`;
    }
    const signals = [`${money(ctx.profit)} profit · ${ctx.margin}% margin`];
    if (ctx.claims.open) signals.push(`${ctx.claims.open} open claim${ctx.claims.open > 1 ? "s" : ""} · ${money(ctx.claims.exposure)} exposure`);
    if (ctx.worstContract) signals.push(`Thinnest: ${ctx.worstContract.name} (${ctx.worstContract.margin}%)`);
    if (ctx.teams.atRisk) signals.push(`${ctx.teams.atRisk} team${ctx.teams.atRisk > 1 ? "s" : ""} at risk`);
    return { headline, summary: parts.join(" "), topMove, signals: signals.slice(0, 4), sentiment, confidence: "Medium", source: "Computed (offline)" };
  };

  const [marginBrief, setMarginBrief] = useState(null);
  const [marginBriefStatus, setMarginBriefStatus] = useState("idle"); // idle | loading | ready
  const briefCacheKeyRef = useRef("");

  const generateMarginBrief = async (force = false) => {
    const ctx = marginBriefContext;
    if (!ctx.hasData) {
      setMarginBrief(null);
      setMarginBriefStatus("idle");
      return;
    }
    const cacheKey = `${new Date().toISOString().slice(0, 10)}-${ctx.period}`;
    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem("finalMileMarginBrief") || "null");
        // Only trust a cached brief that came from real AI — never pin a stale offline
        // fallback for the day (e.g. cached before the API key went live). Retry otherwise.
        if (cached && cached.key === cacheKey && cached.brief && cached.brief.source === "AI generated") {
          setMarginBrief(cached.brief);
          setMarginBriefStatus("ready");
          briefCacheKeyRef.current = cacheKey;
          return;
        }
      } catch {
        /* ignore cache parse errors */
      }
    }
    setMarginBriefStatus("loading");
    const fallback = buildFallbackBrief(ctx);
    let brief;
    try {
      const response = await fetch("/api/margin-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: ctx }),
      });
      if (!response.ok) throw new Error("AI unavailable");
      const result = await response.json().catch(() => ({}));
      if (!result || !result.summary) throw new Error("No brief returned");
      brief = {
        headline: result.headline || fallback.headline,
        summary: result.summary,
        topMove: result.topMove || fallback.topMove,
        signals: Array.isArray(result.signals) ? result.signals.slice(0, 4) : fallback.signals,
        sentiment: ["positive", "neutral", "negative"].includes(result.sentiment) ? result.sentiment : "neutral",
        confidence: ["High", "Medium", "Low"].includes(result.confidence) ? result.confidence : "Medium",
        source: "AI generated",
      };
    } catch {
      brief = fallback;
    }
    setMarginBrief(brief);
    setMarginBriefStatus("ready");
    briefCacheKeyRef.current = cacheKey;
    try {
      localStorage.setItem("finalMileMarginBrief", JSON.stringify({ key: cacheKey, brief }));
    } catch {
      /* ignore quota errors */
    }
  };

  // Proactively generate once per day + period (cached), so the brief feels live without spamming the API.
  useEffect(() => {
    if (!marginBriefContext.hasData) return;
    const cacheKey = `${new Date().toISOString().slice(0, 10)}-${marginBriefContext.period}`;
    if (briefCacheKeyRef.current === cacheKey) return;
    generateMarginBrief(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marginBriefContext.period, marginBriefContext.hasData]);

  // ---- AI Day Log (Pillar 3): natural-language note -> daily numbers + claims ----
  const parseDayLogFallback = (text) => {
    const note = text || "";
    const form = {};
    const grab = (regex) => {
      const match = note.match(regex);
      return match ? Number(match[1].replace(/,/g, "")) : undefined;
    };
    const stops = grab(/(\d+)\s*stops?\b/i);
    if (stops !== undefined) form.stops = stops;
    const miles = grab(/(\d[\d,]*)\s*mi(?:les)?\b/i);
    if (miles !== undefined) form.miles = miles;
    const hours = note.match(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours)\b/i);
    if (hours) form.routeHours = Number(hours[1]);
    const fuel = note.match(/\$?(\d\.\d{2})\s*(?:\/?\s*gal|per gal|a gallon|gas|diesel|fuel)/i);
    if (fuel) form.fuelPrice = Number(fuel[1]);
    const driver = note.match(/driver(?:'s)?(?:\s*pay)?\s*\$?(\d[\d,]*)/i);
    if (driver) form.driverPay = Number(driver[1].replace(/,/g, ""));
    const helper = note.match(/helper(?:'s)?(?:\s*pay)?\s*\$?(\d[\d,]*)/i);
    if (helper) form.helperPay = Number(helper[1].replace(/,/g, ""));
    const tolls = note.match(/tolls?(?:\s*(?:and|&)?\s*parking)?\s*\$?(\d[\d,]*)/i);
    if (tolls) form.tollsParking = Number(tolls[1].replace(/,/g, ""));
    const pay = note.match(/(?:route\s*pay|paid|got paid|made|gross|pay(?:out)?|earned)\D{0,8}\$?(\d[\d,]{2,})/i);
    if (pay) form.routePay = Number(pay[1].replace(/,/g, ""));
    const claims = [];
    if (/(damage|damaged|broke|broken|scratch|scratched|dent|dented|chargeback|charge-back|deduction|claim|missed delivery|late delivery)/i.test(note)) {
      const amountMatch =
        note.match(/(?:damage|chargeback|charge-back|deduction|claim|charged)\D{0,12}\$?(\d[\d,]+)/i) ||
        note.match(/\$?(\d[\d,]+)\D{0,12}(?:damage|chargeback|deduction|claim)/i) ||
        note.match(/(?:about|around|~|approx\.?|says?|worth|estimat\w*|roughly|maybe)\s*\$?(\d[\d,]+)/i) ||
        note.match(/(?:scratch|dent|broke|broken|wall|floor|door)\D{0,24}\$?(\d[\d,]+)/i);
      const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, "")) : 0;
      const category = /scratch|dent|wall|floor|door|property/i.test(note) ? "Property" : /missed|late|window|penalty/i.test(note) ? "Penalty" : "Cargo";
      const type = /scratch/i.test(note) ? "Surface scratch" : /wall/i.test(note) ? "Wall damage" : /floor/i.test(note) ? "Floor damage" : /missed|late|window/i.test(note) ? "Missed delivery window" : "Reported damage";
      claims.push({
        category,
        type,
        amount,
        preventable: /(not our fault|pre-existing|already damaged|wasn'?t us)/i.test(note) ? "No" : "Maybe",
        risk: amount >= 500 ? "High" : amount >= 200 ? "Medium" : "Low",
        date: "Today",
      });
    }
    return { summary: "Parsed from your note (offline).", form, claims, confidence: Object.keys(form).length ? "Medium" : "Low", source: "Parsed (offline)" };
  };

  const emptyDayLog = { summary: "", form: {}, claims: [], confidence: "", source: "" };
  const [showDayLog, setShowDayLog] = useState(false);
  const [dayLogText, setDayLogText] = useState("");
  const [dayLogStatus, setDayLogStatus] = useState("idle"); // idle | parsing | review
  const [dayLogResult, setDayLogResult] = useState(emptyDayLog);

  const openDayLog = () => {
    setShowDayLog(true);
    setDayLogText("");
    setDayLogStatus("idle");
    setDayLogResult(emptyDayLog);
  };

  const parseDayLog = async () => {
    const text = dayLogText.trim();
    if (!text) return;
    setDayLogStatus("parsing");
    const fallback = parseDayLogFallback(text);
    let parsed;
    try {
      const response = await fetch("/api/parse-daylog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error("AI unavailable");
      const result = await response.json().catch(() => ({}));
      if (!result || (!result.form && !result.claims)) throw new Error("No parse returned");
      parsed = {
        summary: result.summary || "Captured from your note.",
        form: result.form && typeof result.form === "object" ? result.form : {},
        claims: Array.isArray(result.claims) ? result.claims : [],
        confidence: ["High", "Medium", "Low"].includes(result.confidence) ? result.confidence : "Medium",
        source: "AI parsed",
      };
    } catch {
      parsed = fallback;
    }
    setDayLogResult(parsed);
    setDayLogStatus("review");
  };

  const applyDayLogResult = () => {
    onApplyDayLog?.({ formPatch: dayLogResult.form, claims: dayLogResult.claims });
    setShowDayLog(false);
  };

  const dayLogFieldLabels = {
    scenarioName: "Route name",
    routePay: "Route pay",
    stops: "Stops",
    miles: "Miles",
    fuelPrice: "Fuel $/gal",
    routeHours: "Route hours",
    driverPay: "Driver pay",
    helperPay: "Helper pay",
    tollsParking: "Tolls / parking",
    perStopPay: "Per-stop pay",
    installPay: "Install pay",
    otherCosts: "Other costs",
  };
  const moneyFields = ["routePay", "driverPay", "helperPay", "tollsParking", "perStopPay", "installPay", "otherCosts"];
  const formatDayLogValue = (key, value) =>
    moneyFields.includes(key) ? currency.format(Number(value || 0)) : key === "fuelPrice" ? `$${Number(value || 0).toFixed(2)}` : String(value);
  const dayLogFieldEntries = Object.entries(dayLogResult.form || {}).filter(([key]) => Object.prototype.hasOwnProperty.call(dayLogFieldLabels, key));

  const setupStepOrder = ["contract", "team", "expenses", "data", "preview"];
  const updateContractDraft = (key, value) => {
    setContractDraft((current) => ({ ...current, [key]: value }));
    setContractSaveStatus("");
  };
  const updateTeamDraft = (key, value) => {
    setTeamDraft((current) => ({ ...current, [key]: value }));
    setTeamSaveStatus("");
  };
  const updateImportDraft = (key, value) => {
    setImportDraft((current) => ({ ...current, [key]: value }));
    setImportSaveStatus("");
  };
  const updateExpenseDraft = (key, value) => {
    setExpenseDraft((current) => ({ ...current, [key]: value }));
    setExpenseSaveStatus("");
  };
  const getExpenseDraftFromContract = (contract = quickContracts[0]) => ({
    labor: contract?.labor ? String(contract.labor / Math.max(Number(contract.routes || 1), 1)) : "",
    fuel: contract?.fuel ? String(contract.fuel / Math.max(Number(contract.routes || 1), 1)) : "",
    truckInsurance: contract?.truckInsurance ? String(contract.truckInsurance / Math.max(Number(contract.routes || 1), 1)) : "",
    maintenance: contract?.maintenance ? String(contract.maintenance / Math.max(Number(contract.routes || 1), 1)) : "",
    other: contract?.other ? String(contract.other / Math.max(Number(contract.routes || 1), 1)) : "",
  });
  const openContractModal = (setupStep = "") => {
    if (setupStep) setActiveSetupStep(setupStep);
    setContractSaveStatus("");
    setIsContractModalOpen(true);
  };
  const openTeamModal = (setupStep = "") => {
    if (setupStep) setActiveSetupStep(setupStep);
    setTeamSaveStatus("");
    setIsTeamModalOpen(true);
  };
  const openImportModal = (setupStep = "") => {
    if (setupStep) setActiveSetupStep(setupStep);
    setImportSaveStatus("");
    setIsImportModalOpen(true);
  };
  const openExpenseModal = (setupStep = "expenses") => {
    if (setupStep) setActiveSetupStep(setupStep);
    if (!hasQuickContracts) {
      setActiveSetupStep("contract");
      setContractSaveStatus("Add a contract first, then expenses can be attached to it.");
      setIsContractModalOpen(true);
      return;
    }
    setExpenseDraft(getExpenseDraftFromContract());
    setExpenseSaveStatus("");
    setIsExpenseModalOpen(true);
  };
  const openPreviewModal = (setupStep = "preview") => {
    if (setupStep) setActiveSetupStep(setupStep);
    setIsPreviewModalOpen(true);
  };
  const openSetupStep = (stepId) => {
    if (stepId === "contract") return openContractModal("contract");
    if (stepId === "team") return openTeamModal("team");
    if (stepId === "expenses") return openExpenseModal("expenses");
    if (stepId === "data") return openImportModal("data");
    return openPreviewModal("preview");
  };
  const skipSetupStep = (stepId) => {
    setSetupWizard((current) => ({
      ...current,
      skipped: {
        ...current.skipped,
        [stepId]: true,
      },
    }));
    const nextStep = setupStepOrder[setupStepOrder.indexOf(stepId) + 1] || "preview";
    setActiveSetupStep(nextStep);
  };
  const markPreviewComplete = () => {
    setSetupWizard((current) => ({ ...current, previewed: true }));
    setIsPreviewModalOpen(false);
  };
  const openNextSetupStep = (currentStep) => {
    const nextStep = setupStepOrder[setupStepOrder.indexOf(currentStep) + 1] || "preview";
    setIsContractModalOpen(false);
    setIsTeamModalOpen(false);
    setIsImportModalOpen(false);
    setIsExpenseModalOpen(false);
    openSetupStep(nextStep);
  };
  const saveQuickContract = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const submittedDraft = {
      ...emptyContractDraft,
      contract: String(formData.get("contract") || contractDraft.contract || ""),
      routes: String(formData.get("routes") || contractDraft.routes || "1"),
      routePay: String(formData.get("routePay") || contractDraft.routePay || ""),
      stops: String(formData.get("stops") || contractDraft.stops || ""),
      labor: String(formData.get("labor") || contractDraft.labor || ""),
      fuel: String(formData.get("fuel") || contractDraft.fuel || ""),
      truckInsurance: String(formData.get("truckInsurance") || contractDraft.truckInsurance || ""),
      maintenance: String(formData.get("maintenance") || contractDraft.maintenance || ""),
      claims: String(formData.get("claims") || contractDraft.claims || ""),
      other: String(formData.get("other") || contractDraft.other || ""),
    };
    setContractDraft(submittedDraft);

    const contractName = submittedDraft.contract.trim();
    if (!contractName) {
      setContractSaveStatus("Enter a contract name first.");
      return;
    }

    const routes = Math.max(Number(submittedDraft.routes || 0), 1);
    const revenue = Number(submittedDraft.routePay || 0) * routes;
    const savedRow = {
      id: `contract-${Date.now()}`,
      logo: contractName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "NEW",
      logoClass: "bg-slate-700 text-white",
      contract: contractName,
      routes,
      stops: Number(submittedDraft.stops || 0) * routes,
      revenue,
      labor: Number(submittedDraft.labor || 0) * routes,
      fuel: Number(submittedDraft.fuel || 0) * routes,
      truckInsurance: Number(submittedDraft.truckInsurance || 0) * routes,
      maintenance: Number(submittedDraft.maintenance || 0) * routes,
      claims: Number(submittedDraft.claims || 0),
      other: Number(submittedDraft.other || 0) * routes,
    };

    setQuickContracts((current) => {
      const next = [savedRow, ...current];
      localStorage.setItem(contractStorageKey, JSON.stringify(next));
      return next;
    });
    setContractDraft(submittedDraft);
    setContractSaveStatus(
      activeSetupStep === "contract"
        ? `${contractName} saved. Next: add your first team.`
        : `${contractName} saved.`
    );
    setSetupWizard((current) => ({
      ...current,
      skipped: {
        ...current.skipped,
        contract: false,
      },
    }));
    window.dispatchEvent(new CustomEvent("final-mile-contracts-updated", { detail: { contract: savedRow } }));
  };
  const saveQuickTeam = (event) => {
    event.preventDefault();

    const teamName = teamDraft.name.trim();
    if (!teamName) {
      setTeamSaveStatus("Enter a team name first.");
      return;
    }

    const newTeam = {
      id: `TEAM-${Date.now()}`,
      name: teamName,
      lead: teamDraft.lead.trim() || "Unassigned",
      helper: teamDraft.helper.trim() || "Unassigned",
      truck: teamDraft.truck.trim() || "Unassigned",
      route: teamDraft.route.trim() || "Not assigned",
      complianceScore: 100,
      surveyAvg: 0,
      routesCompleted: 0,
      status: "Good",
      photoUrl: "",
      photoUploadedAt: "Missing",
      photoStatus: "Missing",
    };

    setTeams?.((current) => [newTeam, ...current]);
    setTeamDraft(emptyTeamDraft);
    setTeamSaveStatus(
      activeSetupStep === "team"
        ? `${teamName} saved. Next: set up basic expenses.`
        : `${teamName} saved.`
    );
    setSetupWizard((current) => ({
      ...current,
      skipped: {
        ...current.skipped,
        team: false,
      },
    }));
  };
  const saveExpenseSetup = (event) => {
    event.preventDefault();

    if (!hasQuickContracts) {
      setExpenseSaveStatus("Add a contract first so these expenses have somewhere to save.");
      return;
    }

    const activeContract = quickContracts[0];
    const routes = Math.max(Number(activeContract.routes || 1), 1);
    const nextRow = {
      ...activeContract,
      labor: Number(expenseDraft.labor || 0) * routes,
      fuel: Number(expenseDraft.fuel || 0) * routes,
      truckInsurance: Number(expenseDraft.truckInsurance || 0) * routes,
      maintenance: Number(expenseDraft.maintenance || 0) * routes,
      other: Number(expenseDraft.other || 0) * routes,
    };

    setQuickContracts((current) => {
      const next = current.map((row, index) => index === 0 ? nextRow : row);
      localStorage.setItem(contractStorageKey, JSON.stringify(next));
      return next;
    });
    setExpenseSaveStatus("Expenses saved. Next: upload or import starting data.");
    setSetupWizard((current) => ({
      ...current,
      skipped: {
        ...current.skipped,
        expenses: false,
      },
    }));
  };
  const saveQuickImport = (event) => {
    event.preventDefault();

    const title = importDraft.title.trim();
    if (!title) {
      setImportSaveStatus("Enter a document, claim, or receipt name first.");
      return;
    }

    if (importDraft.type === "Claim Email") {
      const amount = Number(importDraft.amount || 0);
      const claim = {
        id: `CLM-${Date.now()}`,
        category: "Imported",
        type: title,
        team: teams[0]?.name || "Unassigned",
        driver: teams[0]?.lead || "Unassigned",
        route: "Imported intake",
        amount,
        status: "Under Review",
        preventable: "Maybe",
        date: "Today",
        risk: amount >= 500 ? "High" : amount >= 200 ? "Medium" : "Low",
      };
      setClaims?.((current) => [claim, ...current]);
    }

    const newImport = {
      id: `IMPORT-${Date.now()}`,
      type: importDraft.type,
      title,
      amount: Number(importDraft.amount || 0),
      notes: importDraft.notes.trim(),
      createdAt: new Date().toLocaleString(),
    };

    setQuickImports((current) => {
      const next = [newImport, ...current];
      localStorage.setItem(importStorageKey, JSON.stringify(next));
      return next;
    });
    setImportDraft({ ...emptyImportDraft, type: importDraft.type });
    setImportSaveStatus(
      activeSetupStep === "data"
        ? `${title} saved. Next: save your first snapshot.`
        : `${title} saved.`
    );
    setSetupWizard((current) => ({
      ...current,
      skipped: {
        ...current.skipped,
        data: false,
      },
    }));
  };

  const setupSteps = [
    {
      id: "profile",
      shortLabel: "Profile",
      title: "Confirm company profile",
      detail: "Set the company name, owner targets, and dashboard preferences so the workspace feels like your business.",
      cta: "Open Settings",
      Icon: Settings,
      onClick: () => setActiveTab("Settings"),
      complete: Boolean(appSettings?.companyName),
      skipped: false,
      tone: "blue",
    },
    {
      id: "contract",
      shortLabel: "Contract",
      title: "Add your first contract",
      detail: "Enter the contract name, route pay, routes per week, and route costs so the dashboard can calculate real profit.",
      cta: "Add Contract",
      Icon: BriefcaseBusiness,
      onClick: () => openSetupStep("contract"),
      complete: hasQuickContracts,
      skipped: Boolean(setupWizard.skipped.contract),
      tone: "blue",
    },
    {
      id: "team",
      shortLabel: "Team",
      title: "Add a team",
      detail: "Create the first driver or crew so operations can track readiness, route ownership, and daily uploads.",
      cta: "Add Team",
      Icon: UserPlus,
      onClick: () => openSetupStep("team"),
      complete: teams.length > 0,
      skipped: Boolean(setupWizard.skipped.team),
      tone: "green",
    },
    {
      id: "expenses",
      shortLabel: "Expenses",
      title: "Set up expense basics",
      detail: "Confirm gas, labor, truck, maintenance, and other route costs so profit math is based on reality.",
      cta: "Set Expenses",
      Icon: Calculator,
      onClick: () => openSetupStep("expenses"),
      complete: hasExpenseSetup,
      skipped: Boolean(setupWizard.skipped.expenses),
      tone: "amber",
    },
    {
      id: "data",
      shortLabel: "Data",
      title: "Import starting data",
      detail: "Drop in a claim email, receipt, or contract note when you already have business information to load.",
      cta: "Import Data",
      Icon: Upload,
      onClick: () => openSetupStep("data"),
      complete: hasQuickImports || claims.length > 0,
      skipped: Boolean(setupWizard.skipped.data),
      tone: "amber",
    },
    {
      id: "snapshot",
      shortLabel: "Snapshot",
      title: "Save first snapshot",
      detail: "Save today’s baseline so Reports can show history, trends, and owner-ready exports.",
      cta: "Save Snapshot",
      Icon: Save,
      onClick: () => onSaveSnapshot?.(),
      complete: savedDays.length > 0,
      skipped: false,
      tone: "green",
    },
  ];
  const setupCompleteCount = setupSteps.filter((step) => step.complete).length;
  const setupSkippedCount = setupSteps.filter((step) => step.skipped && !step.complete).length;
  const setupPercent = Math.round((setupCompleteCount / setupSteps.length) * 100);
  const setupIsComplete = setupCompleteCount === setupSteps.length;
  const setupNextStep = setupSteps.find((step) => !step.complete && !step.skipped) || setupSteps.find((step) => !step.complete) || setupSteps[setupSteps.length - 1];
  const showGuidedSetup = !setupIsComplete && (isBlankDemo || !hasStartedWorkspace || setupCompleteCount > 0 || setupSkippedCount > 0);
  // Once the contractor has started setup, demote the full launch center to a
  // compact progress strip so the dashboard leads with business numbers, not a
  // wizard. Brand-new/empty workspaces still get the full guided experience.
  const showFullWizard = showGuidedSetup && (setupCompleteCount === 0 || setupExpanded);
  const showCompactSetup = showGuidedSetup && !showFullWizard;
  const setupTourTargets = {
    profile: "settings",
    contract: "contracts",
    team: "teams",
    expenses: "expenses",
    data: "setup-progress",
    snapshot: "dashboard-save-snapshot",
  };
  const setupStatus = useMemo(
    () =>
      getSetupStatus({
        teams,
        claims,
        quickContracts,
        quickImports,
        savedDays,
        appSettings,
        isBlankDemo,
        isDemoMode,
      }),
    [teams, claims, quickContracts, quickImports, savedDays, appSettings, isBlankDemo, isDemoMode]
  );
  const sharedNextAction = getNextBestSetupAction(setupStatus);
  const handleSetupStatusAction = (action = sharedNextAction) => {
    if (action.id === "profile") {
      setActiveTab("Settings");
      return;
    }
    if (action.id === "snapshot") {
      onSaveSnapshot?.();
      return;
    }
    if (["contract", "team", "expenses", "data", "preview"].includes(action.id)) {
      openSetupStep(action.id);
      return;
    }
    if (action.tab) setActiveTab(action.tab);
  };

  const setupPreviewCards = [
    {
      title: "Profit command center",
      detail: "Revenue, route costs, margin, and loss exposure will fill in after your first contract is saved.",
      Icon: DollarSign,
      status: hasQuickContracts ? "Contract saved" : "Waiting on contract",
      tone: "green",
    },
    {
      title: "Claims control",
      detail: "New claims will show review status, evidence gaps, exposure, and dispute readiness.",
      Icon: ShieldCheck,
      status: claims.length ? `${claims.length} claim${claims.length === 1 ? "" : "s"}` : "No claims yet",
      tone: "red",
    },
    {
      title: "Team readiness",
      detail: "Drivers, daily photo proof, and route assignments will appear once teams are added.",
      Icon: Users,
      status: teams.length ? `${teams.length} team${teams.length === 1 ? "" : "s"}` : "No teams yet",
      tone: "blue",
    },
    {
      title: "Owner reports",
      detail: "PDF reports become useful after contracts, route numbers, and claims start building history.",
      Icon: FileDown,
      status: setupIsComplete ? "Setup complete" : "Ready after setup",
      tone: "amber",
    },
  ];
  const setupMissingSteps = setupSteps.filter((step) => !step.complete && step.id !== "preview");
  const previewNextAction =
    setupMissingSteps[0]?.title ||
    (claims.length ? "Review open claims in Operations." : "Open Finance to refine contract profitability.");


  const greetingHour = new Date().getHours();
  const greetingWord = greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";
  const greetingTitle = ownerName ? `${greetingWord}, ${ownerName}` : greetingWord;

  return (
    <div className={pageClass}>
      <div data-tour="dashboard-overview" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className={`text-3xl font-black leading-tight tracking-tight sm:text-4xl ${titleText}`}>
            {greetingTitle} <span aria-hidden="true">👋</span>
          </h1>
          {savedDaySnapshot && (
            <p className={isDark ? "mt-3 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-200" : "mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"}>
              Viewing daily history: {savedDaySnapshot.label}
            </p>
          )}
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
          <div data-tour="dashboard-period-tabs" className={isDark ? "flex w-full overflow-x-auto rounded-2xl bg-white/5 p-1 sm:w-auto" : "flex w-full overflow-x-auto rounded-2xl bg-slate-100 p-1 sm:w-auto"}>
            {["Day", "Week", "Month", "Qtr", "Year"].map((period) => (
              <button
                key={period}
                onClick={() => setDashboardPeriod(period)}
                className={`min-w-14 flex-1 rounded-xl px-3 py-2 text-sm font-black transition sm:flex-none sm:px-4 ${dashboardPeriod === period
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : isDark
                      ? "text-slate-300 hover:bg-white/10"
                      : "text-slate-600 hover:bg-white"
                  }`}
              >
                {period}
              </button>
            ))}
          </div>

          <button
            onClick={openDayLog}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 sm:w-auto"
          >
            <Sparkles className="h-4 w-4" /> AI Day Log
          </button>

          <button
            data-tour="dashboard-open-operations"
            onClick={() => setActiveTab("Operations")}
            className="w-full rounded-xl border border-blue-500/40 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-500/10 sm:w-auto"
          >
            Open Operations
          </button>
        </div>
      </div>



      {showDayLog && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={() => setShowDayLog(false)}>
          <div onClick={(event) => event.stopPropagation()} className={isDark ? "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl" : "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-600"><Sparkles className="h-5 w-5" /></span>
                <div>
                  <h2 className={`text-xl font-black ${titleText}`}>AI Day Log</h2>
                  <p className={`text-xs font-semibold ${mutedText}`}>Type your day in plain English — I'll fill the numbers.</p>
                </div>
              </div>
              <button onClick={() => setShowDayLog(false)} className={isDark ? "rounded-lg border border-white/10 px-2.5 py-1 text-sm text-slate-300 hover:bg-white/5" : "rounded-lg border border-slate-200 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50"}>Close</button>
            </div>

            {dayLogStatus !== "review" && (
              <div className="mt-4 space-y-3">
                <textarea
                  value={dayLogText}
                  onChange={(event) => setDayLogText(event.target.value)}
                  rows={6}
                  placeholder="e.g. Lowe's route today, got paid $1,240 for 22 stops, ran 130 miles, diesel $3.95/gal, paid the driver $230 and helper $170, $30 in tolls. One wall scratch at the last stop, customer says about $300."
                  className={isDark ? "w-full rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm leading-6 text-slate-100 outline-none transition focus:border-blue-500" : "w-full rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-blue-500"}
                />
                <div className="flex justify-end">
                  <button
                    onClick={parseDayLog}
                    disabled={!dayLogText.trim() || dayLogStatus === "parsing"}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    {dayLogStatus === "parsing" ? "Reading…" : "Parse with AI"}
                  </button>
                </div>
              </div>
            )}

            {dayLogStatus === "review" && (
              <div className="mt-4 space-y-4">
                <p className={`text-sm ${mutedText}`}>{dayLogResult.summary}</p>

                {dayLogFieldEntries.length > 0 ? (
                  <div>
                    <p className={`mb-2 text-[11px] font-black uppercase tracking-wide ${mutedText}`}>Today's numbers</p>
                    <div className="grid grid-cols-2 gap-2">
                      {dayLogFieldEntries.map(([key, value]) => (
                        <div key={key} className={isDark ? "rounded-xl border border-white/10 bg-white/5 p-3" : "rounded-xl border border-slate-200 bg-slate-50 p-3"}>
                          <p className={`text-[11px] font-semibold uppercase tracking-wide ${mutedText}`}>{dayLogFieldLabels[key]}</p>
                          <p className={`mt-0.5 text-sm font-black ${titleText}`}>{formatDayLogValue(key, value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className={`text-sm ${mutedText}`}>No route numbers detected — try including pay, stops, and miles.</p>
                )}

                {dayLogResult.claims?.length > 0 && (
                  <div>
                    <p className={`mb-2 text-[11px] font-black uppercase tracking-wide ${mutedText}`}>Claims to log ({dayLogResult.claims.length})</p>
                    <div className="space-y-2">
                      {dayLogResult.claims.map((claim, index) => (
                        <div key={index} className={isDark ? "flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3" : "flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3"}>
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-black ${titleText}`}>{claim.type}</p>
                            <p className={`truncate text-xs ${mutedText}`}>{claim.category} · {claim.preventable} preventable · {claim.risk} risk</p>
                          </div>
                          <span className="shrink-0 text-sm font-black text-red-500">{currency.format(Number(claim.amount || 0))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className={`text-[11px] font-semibold ${mutedText}`}>{dayLogResult.source} · confidence {dayLogResult.confidence}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setDayLogStatus("idle")} className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/5" : "rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"}>Back</button>
                    <button
                      onClick={applyDayLogResult}
                      disabled={dayLogFieldEntries.length === 0 && (!dayLogResult.claims || dayLogResult.claims.length === 0)}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      Apply to today
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRIMARY ROW — net profit with trend, and what needs attention today */}
      <div className="grid items-start gap-4 xl:grid-cols-[1.5fr_1fr]">
        <button
          type="button"
          data-tour="dashboard-net-profit"
          onClick={() => goToSource("Profitability")}
          className={isDark ? "rounded-2xl border border-blue-400/20 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 p-6 text-left shadow-card transition hover:-translate-y-0.5 hover:border-blue-300/40 hover:shadow-card-hover" : "rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Net Profit Today</p>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <DollarSign className="h-5 w-5" />
            </span>
          </div>
          <p className={`safe-number mt-3 text-4xl font-black tracking-tight sm:text-5xl ${todayProfit >= 0 ? "text-emerald-700" : "text-red-600"}`} title={currency.format(todayProfit)}>
            {currency.format(animatedProfit)}
          </p>
          <p className={`mt-1 text-sm font-bold ${mutedText}`}>{dashboardPeriod} net profit · {number.format(animatedMargin)}% margin</p>
          <div className="mt-5 h-36">
            {hasProfitTrend ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profitTrendData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashNetProfitTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.06)" : "#eef2f7"} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 700, fill: isDark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: isDark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} width={64} tickFormatter={(value) => currency.format(value)} />
                  <Tooltip formatter={(value) => [currency.format(value), "Profit"]} contentStyle={{ borderRadius: 12, border: "none", fontWeight: 700, color: "#0f172a" }} />
                  <Area type="monotone" dataKey="profit" stroke="#2563EB" strokeWidth={3} fill="url(#dashNetProfitTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className={`flex h-full items-center justify-center rounded-2xl border border-dashed text-center ${isDark ? "border-white/10" : "border-slate-200"}`}>
                <p className={`max-w-xs text-sm font-semibold ${mutedText}`}>Save daily snapshots to build your profit trend here.</p>
              </div>
            )}
          </div>
        </button>

        <div data-tour="dashboard-needs-attention" className={cardClass}>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Needs Attention</p>
            {needsAttention.length > 0 && (
              <button onClick={() => setActiveTab("Operations")} className="text-sm font-bold text-blue-600">View all</button>
            )}
          </div>
          {needsAttention.length === 0 ? (
            <div className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-10 text-center ${isDark ? "border-white/10" : "border-slate-200"}`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <p className={`text-sm font-black ${titleText}`}>All clear</p>
              <p className={`text-xs font-semibold ${mutedText}`}>No issues need attention right now.</p>
            </div>
          ) : (
            <div className={`divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
              {needsAttention.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.title} onClick={() => goToSource(item.tab)} className={`flex w-full items-center gap-3 py-3 text-left transition ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneIcon(item.tone)}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-black ${titleText}`}>{item.title}</p>
                      <p className={`truncate text-xs font-semibold ${mutedText}`}>{item.detail}</p>
                    </div>
                    <span className="text-lg text-slate-400">›</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {marginBriefContext.hasData && (
        <div data-tour="dashboard-ai-brief" className={isDark ? "rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-5 shadow-card" : "rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/40 p-5 shadow-sm"}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-600">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-base font-black ${titleText}`}>AI Margin Brief</h2>
                  <span className="rounded-full bg-blue-600/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-600">AI</span>
                </div>
                <p className={`text-xs font-semibold ${mutedText}`}>Your daily read on what's moving the numbers.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => generateMarginBrief(true)}
              disabled={marginBriefStatus === "loading"}
              className={isDark ? "flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/5 disabled:opacity-50" : "flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-50"}
            >
              <RotateCcw className={`h-3.5 w-3.5 ${marginBriefStatus === "loading" ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          {marginBriefStatus === "loading" && !marginBrief && (
            <div className="mt-4 space-y-2">
              <div className="skeleton h-5 w-2/3 rounded"></div>
              <div className="skeleton h-4 w-full rounded"></div>
              <div className="skeleton h-4 w-5/6 rounded"></div>
              <div className="skeleton mt-1 h-14 w-full rounded-xl"></div>
            </div>
          )}

          {marginBrief && (
            <div className="mt-4 space-y-3">
              <p className={`text-lg font-black leading-snug ${titleText}`}>{marginBrief.headline}</p>

              <div className={isDark ? "rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5" : "rounded-xl border border-blue-200 bg-white/70 p-3.5"}>
                <p className="text-[11px] font-black uppercase tracking-wide text-blue-600">Your next move</p>
                <p className={`mt-1 text-sm font-bold leading-6 ${titleText}`}>{marginBrief.topMove}</p>
              </div>

              {marginBrief.signals?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {marginBrief.signals.map((signal) => (
                    <span key={signal} className={isDark ? "rounded-full bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300" : "rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm"}>{signal}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-0.5 text-[11px] font-semibold text-slate-500">
                <span className={marginBrief.sentiment === "positive" ? "inline-block h-2 w-2 rounded-full bg-emerald-500" : marginBrief.sentiment === "negative" ? "inline-block h-2 w-2 rounded-full bg-red-500" : "inline-block h-2 w-2 rounded-full bg-amber-500"}></span>
                <span>{marginBrief.source} · confidence {marginBrief.confidence}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {marginBriefContext.hasData && (
        <WatchdogPanel
          isDark={isDark}
          navigateToTab={setActiveTab}
          savedDays={savedDays}
          claims={claims}
          teams={teams}
          contracts={quickContracts}
          today={{ profit: todayProfit, revenue: dashboardRevenue, margin }}
          appSettings={appSettings}
        />
      )}

      {/* SECONDARY ROW — revenue, cost, margin, and team readiness */}
      <div data-tour="dashboard-kpis" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button onClick={() => goToSource("Profitability")} className={`${cardClass} overflow-hidden text-left transition hover:border-blue-500/50`}>
          <span className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneIcon("blue")}`}>
            <DollarSign className="h-6 w-6" />
          </span>
          <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Revenue Today</p>
          <p className="safe-number mt-2 text-3xl font-black text-blue-600" title={currency.format(dashboardRevenue)}>{currency.format(animatedRevenue)}</p>
        </button>

        <button onClick={() => goToSource("Profitability")} className={`${cardClass} overflow-hidden text-left transition hover:border-blue-500/50`}>
          <span className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneIcon("amber")}`}>
            <Calculator className="h-6 w-6" />
          </span>
          <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Costs Today</p>
          <p className="safe-number mt-2 text-3xl font-black text-amber-700" title={currency.format(dashboardCosts)}>{currency.format(animatedCosts)}</p>
        </button>

        <button onClick={() => goToSource("Profitability")} className={`${cardClass} overflow-hidden text-left transition hover:border-blue-500/50`}>
          <span className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneIcon(margin >= 0 ? "green" : "red")}`}>
            <BarChart3 className="h-6 w-6" />
          </span>
          <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Margin</p>
          <p className={`safe-number mt-2 text-3xl font-black ${margin >= 0 ? "text-emerald-700" : "text-red-600"}`} title={`${number.format(margin)}%`}>{number.format(animatedMargin)}%</p>
        </button>

        <button onClick={() => goToSource("Teams")} className={`${cardClass} overflow-hidden text-left transition hover:border-blue-500/50`}>
          <span className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneIcon("blue")}`}>
            <Users className="h-6 w-6" />
          </span>
          <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Team Readiness</p>
          {activeTeams === 0 ? (
            <>
              <p className="safe-number mt-2 text-2xl font-black text-blue-600">Add a team</p>
              <p className={`mt-1 text-xs font-semibold ${mutedText}`}>Set up a team to track readiness.</p>
            </>
          ) : (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className={`safe-number text-3xl font-black ${titleText}`}>{currentReadiness}%</p>
                {renderTrendChip(readinessTrendDelta, { suffix: " pts", goodIsUp: true })}
              </div>
              <p className={`mt-1 text-xs font-semibold ${mutedText}`}>{photosUploaded} of {activeTeams} teams ready</p>
            </>
          )}
        </button>
      </div>

      {showCompactSetup && (
        <div className={`${cardClass} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ClipboardCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-black ${titleText}`}>Finish setting up your workspace</p>
              <p className={`mt-0.5 text-xs font-bold ${mutedText}`}>
                {setupCompleteCount} of {setupSteps.length} steps done · Next: {setupNextStep?.title || "Review setup"}
              </p>
              <div className={isDark ? "mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-white/10" : "mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-slate-200"}>
                <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${setupPercent}%` }} />
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setSetupExpanded(true)}
              className={isDark ? "rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-slate-200 hover:bg-white/5" : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"}
            >
              View all steps
            </button>
            <button
              onClick={setupNextStep?.onClick}
              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {showFullWizard && setupExpanded && setupCompleteCount > 0 && (
        <button
          onClick={() => setSetupExpanded(false)}
          className={isDark ? "text-xs font-black text-blue-300 hover:underline" : "text-xs font-black text-blue-600 hover:underline"}
        >
          ← Collapse setup
        </button>
      )}

      <SetupWizard
        isDark={isDark}
        showGuidedSetup={showFullWizard}
        isDemoMode={isDemoMode}
        setupNextStep={setupNextStep}
        sharedNextAction={sharedNextAction}
        setupCompleteCount={setupCompleteCount}
        setupSteps={setupSteps}
        setupSkippedCount={setupSkippedCount}
        setupPercent={setupPercent}
        setupTourTargets={setupTourTargets}
        setupPreviewCards={setupPreviewCards}
        handleSetupStatusAction={handleSetupStatusAction}
        setupStatus={setupStatus}
        skipSetupStep={skipSetupStep}
        openPreviewModal={openPreviewModal}
        toneIcon={toneIcon}
        titleText={titleText}
        mutedText={mutedText}
        cardClass={cardClass}
      />



      {/* DETAIL ROW — contract performance and recent claims */}
      {!isCleanBlankWorkspace && (
        <div className="grid gap-4 xl:grid-cols-2">
          <div data-tour="dashboard-contract-performance" className={cardClass}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className={`text-lg font-bold ${titleText}`}>Contract Performance</h2>
              <button onClick={() => setActiveTab("Finance")} className="text-sm font-bold text-blue-600">View all</button>
            </div>
            {quickContractCards.length === 0 ? (
              <p className={`rounded-xl border border-dashed p-5 text-center text-sm font-semibold ${mutedText} ${isDark ? "border-white/10" : "border-slate-200"}`}>
                Save a contract to see its revenue, profit, and margin here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[460px] text-left text-sm">
                  <thead className={`border-b ${rowBorder}`}>
                    <tr className={`text-xs uppercase tracking-wide ${mutedText}`}>
                      {[
                        ["name", "Contract", "left"],
                        ["revenue", "Revenue", "right"],
                        ["netProfit", "Profit", "right"],
                        ["margin", "Margin", "right"],
                      ].map(([key, label, align]) => (
                        <th key={key} className={`py-3 ${align === "right" ? "text-right" : ""}`}>
                          <button
                            type="button"
                            onClick={() => toggleContractSort(key)}
                            className={`inline-flex items-center gap-1 uppercase tracking-wide transition hover:text-blue-600 ${align === "right" ? "flex-row-reverse" : ""} ${contractSort.key === key ? "text-blue-600" : ""}`}
                          >
                            {label}
                            <span className="text-[9px]">{contractSort.key === key ? (contractSort.dir === "desc" ? "▼" : "▲") : "↕"}</span>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedContractCards.map((contract) => (
                      <tr key={contract.id} onClick={() => setActiveTab("Finance")} className={`cursor-pointer border-b transition ${rowBorder} ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                        <td className={`py-3 font-bold ${titleText}`}>{contract.name}</td>
                        <td className={`py-3 text-right font-semibold ${titleText}`}>{currency.format(contract.revenue)}</td>
                        <td className={`py-3 text-right font-black ${contract.netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>{currency.format(contract.netProfit)}</td>
                        <td className={`py-3 text-right font-black ${contract.margin >= 0 ? "text-emerald-700" : "text-red-600"}`}>{number.format(contract.margin)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div data-tour="dashboard-recent-claims" className={cardClass}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className={`text-lg font-bold ${titleText}`}>Recent Claims</h2>
              <button onClick={() => setActiveTab("Claims")} className="text-sm font-bold text-blue-600">View all</button>
            </div>
            {recentClaims.length === 0 ? (
              <InlineEmpty isDark={isDark} Icon={ShieldCheck} title="No claims yet" hint="New claims will show up here as they come in." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead className={`border-b ${rowBorder}`}>
                    <tr className={`text-xs uppercase tracking-wide ${mutedText}`}>
                      <th className="py-3">Type</th>
                      <th className="py-3 text-right">Amount</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentClaims.map((claim) => (
                      <tr key={claim.id} onClick={() => goToSource("Claims")} className={`cursor-pointer border-b transition ${rowBorder} ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                        <td className={`py-3 font-semibold ${titleText}`}>{claim.type}</td>
                        <td className="py-3 text-right font-black text-red-600">{currency.format(claim.amount)}</td>
                        <td className="py-3">
                          <span className={claim.status === "Open" ? "rounded-full bg-red-500/10 px-2 py-1 text-xs font-bold text-red-600" : claim.status === "Closed" ? "rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-700" : "rounded-full bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-700"}>
                            {claim.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}






      <ContractModal
        isDark={isDark}
        isContractModalOpen={isContractModalOpen}
        setIsContractModalOpen={setIsContractModalOpen}
        contractDraft={contractDraft}
        emptyContractDraft={emptyContractDraft}
        setContractDraft={setContractDraft}
        contractSaveStatus={contractSaveStatus}
        setContractSaveStatus={setContractSaveStatus}
        activeSetupStep={activeSetupStep}
        openNextSetupStep={openNextSetupStep}
        skipSetupStep={skipSetupStep}
        saveQuickContract={saveQuickContract}
        updateContractDraft={updateContractDraft}
        titleText={titleText}
        mutedText={mutedText}
        rowBorder={rowBorder}
        modalInputClass={modalInputClass}
        setActiveTab={setActiveTab}
      />
      <TeamModal
        isDark={isDark}
        isTeamModalOpen={isTeamModalOpen}
        setIsTeamModalOpen={setIsTeamModalOpen}
        teamDraft={teamDraft}
        teamSaveStatus={teamSaveStatus}
        activeSetupStep={activeSetupStep}
        openNextSetupStep={openNextSetupStep}
        skipSetupStep={skipSetupStep}
        saveQuickTeam={saveQuickTeam}
        updateTeamDraft={updateTeamDraft}
        titleText={titleText}
        mutedText={mutedText}
        rowBorder={rowBorder}
        modalInputClass={modalInputClass}
        setActiveTab={setActiveTab}
      />
      <ExpenseModal
        isDark={isDark}
        isExpenseModalOpen={isExpenseModalOpen}
        setIsExpenseModalOpen={setIsExpenseModalOpen}
        expenseDraft={expenseDraft}
        expenseSaveStatus={expenseSaveStatus}
        activeSetupStep={activeSetupStep}
        openNextSetupStep={openNextSetupStep}
        skipSetupStep={skipSetupStep}
        saveExpenseSetup={saveExpenseSetup}
        updateExpenseDraft={updateExpenseDraft}
        quickContracts={quickContracts}
        titleText={titleText}
        mutedText={mutedText}
        rowBorder={rowBorder}
        modalInputClass={modalInputClass}
      />
      <ImportModal
        isDark={isDark}
        isImportModalOpen={isImportModalOpen}
        setIsImportModalOpen={setIsImportModalOpen}
        importDraft={importDraft}
        importSaveStatus={importSaveStatus}
        activeSetupStep={activeSetupStep}
        openNextSetupStep={openNextSetupStep}
        skipSetupStep={skipSetupStep}
        saveQuickImport={saveQuickImport}
        updateImportDraft={updateImportDraft}
        titleText={titleText}
        mutedText={mutedText}
        rowBorder={rowBorder}
        modalInputClass={modalInputClass}
        setActiveTab={setActiveTab}
      />

      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className={isDark ? "w-full max-w-5xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40" : "w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20"}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Dashboard preview</p>
                <h2 className={`mt-1 text-2xl font-black ${titleText}`}>Your first command center snapshot</h2>
                <p className={`mt-2 max-w-2xl text-sm leading-6 ${mutedText}`}>
                  This is what the dashboard can now use. Any skipped setup item stays in the checklist so it does not disappear.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className={isDark ? "rounded-xl border border-white/10 px-3 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {[
                ["Net Profit", currency.format(todayProfit), todayProfit >= 0 ? "text-emerald-700" : "text-red-600", DollarSign],
                ["Revenue", currency.format(dashboardRevenue), "text-blue-600", BarChart3],
                ["Costs", currency.format(dashboardCosts), "text-amber-700", Calculator],
                ["Claims", currency.format(periodClaimsExposure), "text-red-600", ShieldCheck],
                ["Team Readiness", `${photosUploaded}/${activeTeams}`, "text-emerald-700", Users],
              ].map(([label, value, tone, Icon]) => (
                <div key={label} className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-4" : "rounded-2xl border border-slate-200 bg-slate-50 p-4"}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>{label}</p>
                  </div>
                  <p className={`safe-number mt-4 text-2xl font-black ${tone}`} title={value}>{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className={isDark ? "rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5" : "rounded-2xl border border-blue-100 bg-blue-50 p-5"}>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Next recommended action</p>
                <h3 className={`mt-2 text-xl font-bold ${titleText}`}>{previewNextAction}</h3>
                <p className={`mt-2 text-sm font-semibold leading-6 ${mutedText}`}>
                  Ask will use these setup gaps when it answers questions, so it will not pretend there is margin data before contracts and costs exist.
                </p>
              </div>

              <div className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-5" : "rounded-2xl border border-slate-200 bg-slate-50 p-5"}>
                <p className={`text-sm font-black ${titleText}`}>Remaining setup</p>
                <div className="mt-3 space-y-2">
                  {setupMissingSteps.length ? setupMissingSteps.map((step) => (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        setIsPreviewModalOpen(false);
                        openSetupStep(step.id);
                      }}
                      className={isDark ? "flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-left text-sm font-bold text-slate-300 hover:bg-white/10" : "flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-blue-50"}
                    >
                      <span>{step.title}</span>
                      <span className={step.skipped ? "text-amber-700" : "text-blue-600"}>{step.skipped ? "Finish" : "Start"}</span>
                    </button>
                  )) : (
                    <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-black text-emerald-700">All setup items are complete.</p>
                  )}
                </div>
              </div>
            </div>

            <div className={`mt-6 flex flex-col gap-3 border-t pt-5 ${rowBorder} sm:flex-row sm:items-center sm:justify-between`}>
              <p className={`text-sm font-semibold ${mutedText}`}>
                Finish marks the preview step complete. Skipped items still stay available above.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={markPreviewComplete}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
                >
                  Finish Setup Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardHome;
