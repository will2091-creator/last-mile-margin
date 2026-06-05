import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Area,
  AreaChart,
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  Camera,
  Card,
  CartesianGrid,
  Cell,
  CheckCircle2,
  claimTypeOptions,
  ClipboardCheck,
  CostPieChart,
  currency,
  defaultForm,
  defaultSettings,
  DollarSign,
  Field,
  FileDown,
  FileText,
  getGrade,
  initialClaims,
  initialTeams,
  LayoutDashboard,
  MetricCard,
  Moon,
  number,
  Pie,
  PieChart,
  ProfitTrendChart,
  ResponsiveContainer,
  RotateCcw,
  Row,
  Save,
  Section,
  SelectField,
  Settings,
  ShieldCheck,
  StatusBadge,
  Sun,
  TextField,
  toNum,
  Tooltip,
  Trash2,
  Truck,
  Upload,
  UserPlus,
  Users,
  XAxis,
  YAxis,
} from "../shared";
import TakeTourButton from "../components/TakeTourButton";
import NextActionCard from "../components/NextActionCard";
import { getNextBestSetupAction, getSetupStatus } from "../lib/onboarding";

function DashboardHome({ teams, claims, setTeams, setClaims, setActiveTab, isDark, appSettings, savedDaySnapshot, savedDays = [], isBlankDemo = false, isDemoMode = false, onStartTour, onStartGuidedDemo, onLaunchDemo, productTourStatus }) {
  const widgets = {
    ...defaultSettings.dashboardWidgets,
    ...(appSettings?.dashboardWidgets || {}),
  };
  const defaultDashboardOrder = defaultSettings.dashboardWidgetOrder || Object.keys(defaultSettings.dashboardWidgets);
  const dashboardWidgetOrder = [
    ...new Set([...(appSettings?.dashboardWidgetOrder || []), ...defaultDashboardOrder]),
  ].filter((key) => Object.prototype.hasOwnProperty.call(defaultSettings.dashboardWidgets, key));
  const activeTeams = teams.length;
  const photosUploaded = teams.filter((team) => team.photoStatus === "Uploaded").length;
  const atRiskTeams = teams.filter((team) => team.status === "At Risk").length;
  const openClaims = claims.filter((claim) => claim.status !== "Closed").length;
  const claimsExposure = claims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);

  const [dashboardPeriod, setDashboardPeriod] = useState("Day");
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
  const [hasAutoStartedBlankTour, setHasAutoStartedBlankTour] = useState(false);
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
  const yesterdayProfit = hasQuickContracts ? Math.max(todayProfit * 0.95, 1) : 0;
  const profitChange = yesterdayProfit > 0 ? ((todayProfit - yesterdayProfit) / yesterdayProfit) * 100 : 0;
  const dashboardRevenue = savedDaySnapshot?.revenue ?? (hasQuickContracts ? quickContractTotals.revenue * rollupPeriodMultiplier : 0);
  const dashboardCosts = savedDaySnapshot?.costs ?? (hasQuickContracts ? quickContractTotals.totalCosts * rollupPeriodMultiplier : 0);
  const margin = savedDaySnapshot ? savedDaySnapshot.margin * 100 : dashboardRevenue > 0 ? (todayProfit / dashboardRevenue) * 100 : 0;
  const periodClaimsExposure = savedDaySnapshot?.claimsExposure ?? (hasQuickContracts ? quickContractTotals.claims * rollupPeriodMultiplier : claimsExposure * Math.min(periodMultiplier, 12));
  const escrowBalance = savedDaySnapshot?.escrow ?? (periodClaimsExposure > 0 ? Math.max(periodClaimsExposure * 0.35, 0) : 0);

  const savedTrendDays = Array.isArray(savedDays)
    ? savedDays
      .filter((day) => Number.isFinite(Number(day?.profit)))
      .slice(-7)
      .map((day, index) => ({
        day: day.label || day.date || `Snapshot ${index + 1}`,
        profit: Number(day.profit || 0),
      }))
    : [];
  const dashboardTrend = savedTrendDays;
  const hasDashboardTrend = dashboardTrend.length >= 2;
  const previousTrendDay = hasDashboardTrend ? dashboardTrend[dashboardTrend.length - 2] : null;
  const trendComparisonLabel = previousTrendDay ? `vs ${previousTrendDay.day}` : "Save snapshots for trend";
  const trendChangeText = hasDashboardTrend
    ? `${profitChange >= 0 ? "↑" : "↓"} ${number.format(Math.abs(profitChange))}%`
    : "No trend yet";

  const readinessScore =
    activeTeams > 0
      ? Math.round((photosUploaded / activeTeams) * 70 + ((activeTeams - atRiskTeams) / activeTeams) * 30)
      : 0;

  const recentClaims = claims.slice(0, 4);

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

  useEffect(() => {
    if (!onStartTour || !isCleanBlankWorkspace || isDemoMode || hasAutoStartedBlankTour) return;
    setHasAutoStartedBlankTour(true);
    window.setTimeout(onStartTour, 650);
  }, [hasAutoStartedBlankTour, isCleanBlankWorkspace, isDemoMode, onStartTour]);

  const savedRoutes = hasQuickContracts ? quickContracts.slice(0, 4).map((row) => {
    const revenue = Number(row.revenue || 0);
    const totalCosts = Number(row.labor || 0) + Number(row.fuel || 0) + Number(row.truckInsurance || 0) + Number(row.maintenance || 0) + Number(row.claims || 0) + Number(row.other || 0);
    const netProfit = revenue - totalCosts;
    return ["Saved", row.contract, netProfit, revenue > 0 ? netProfit / revenue : 0];
  }) : [];
  const quickContractCards = quickContracts.slice(0, 4).map((row) => {
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

  const routeHealth = hasQuickContracts ? [
    ["Revenue Per Route", currency.format(quickContractTotals.revenue / Math.max(quickContracts.length, 1)), "Live"],
    ["Cost Per Route", currency.format(quickContractTotals.totalCosts / Math.max(quickContracts.length, 1)), quickContractTotals.totalCosts <= quickContractTotals.revenue * 0.75 ? "Good" : "Watch"],
    ["Avg Margin", `${number.format(dashboardRevenue > 0 ? margin : 0)}%`, margin >= 25 ? "Good" : "Below Target"],
    ["Claims Exposure", currency.format(periodClaimsExposure), periodClaimsExposure > 0 ? "Watch" : "Good"],
  ] : [];

  const routeEfficiency = activeTeams > 0 ? [
    ["Photo Readiness", `${readinessScore}%`, readinessScore >= 80 ? "good" : "watch"],
    ["Team Utilization", `${Math.round((activeTeams / Math.max(activeTeams, 1)) * 100)}%`, "good"],
    ["At-Risk Teams", String(atRiskTeams), atRiskTeams > 0 ? "watch" : "good"],
    ["Open Claims", String(openClaims), openClaims > 0 ? "watch" : "good"],
  ] : [];

  const activityItems = [
    quickContracts[0] && ["Contract saved", quickContracts[0].contract, "Latest", CheckCircle2, "green"],
    claims[0] && ["Claim entered", `${claims[0].type} · ${currency.format(Number(claims[0].amount || 0))}`, claims[0].date || "Latest", FileText, claims[0].risk === "High" ? "amber" : "blue"],
    teams[0] && ["Team added", teams[0].name, teams[0].status || "Active", Users, "blue"],
    savedDays.at(-1) && ["Snapshot saved", savedDays.at(-1).label || savedDays.at(-1).date || "Latest", "History", FileDown, "green"],
  ].filter(Boolean);

  const contractPerformance = quickContracts.slice(0, 3).map((row) => {
    const revenue = Number(row.revenue || 0);
    const totalCosts = Number(row.labor || 0) + Number(row.fuel || 0) + Number(row.truckInsurance || 0) + Number(row.maintenance || 0) + Number(row.claims || 0) + Number(row.other || 0);
    const profit = revenue - totalCosts;
    const rowMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return [row.contract, currency.format(profit), `${number.format(rowMargin)}%`, rowMargin >= 25 ? "Good" : "Watch"];
  });

  const upcomingRenewals = [];

  const pageClass = isDark ? "space-y-6 text-white" : "space-y-6 text-slate-950";
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const heroClass = isDark
    ? "rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950 via-slate-950 to-emerald-950 p-6 shadow-xl shadow-black/20"
    : "rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6 shadow-sm";
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

  const selectedWidgetCount = dashboardWidgetOrder.filter((key) => widgets[key] !== false).length;
  const dashboardFocusOrder = ["periodMetrics", "needsAttention", "teamReadiness", "recentClaims", "recentActivity"];
  const focusedWidgetOrder = isCleanBlankWorkspace ? [] : dashboardFocusOrder.filter((key) => widgets[key] !== false);
  const focusedWidgetCount = focusedWidgetOrder.length;

  const goToSource = (tabName) => setActiveTab(tabName);
  const setupStepOrder = ["contract", "team", "expenses", "data", "preview"];
  const setupStepTitles = {
    contract: "Add your first contract",
    team: "Add your first team",
    expenses: "Set up expenses",
    data: "Upload or import starting data",
    preview: "Preview your dashboard",
  };
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
        ? `${title} saved. Next: preview your dashboard.`
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
      id: "preview",
      shortLabel: "Preview",
      title: "Preview the dashboard",
      detail: "Review profit, revenue, costs, claims, readiness, and the next recommended action before you move on.",
      cta: "Preview Dashboard",
      Icon: LayoutDashboard,
      onClick: () => openSetupStep("preview"),
      complete: Boolean(setupWizard.previewed),
      skipped: false,
      tone: "blue",
    },
  ];
  const setupCompleteCount = setupSteps.filter((step) => step.complete).length;
  const setupSkippedCount = setupSteps.filter((step) => step.skipped && !step.complete).length;
  const setupPercent = Math.round((setupCompleteCount / setupSteps.length) * 100);
  const setupIsComplete = setupCompleteCount === setupSteps.length;
  const setupNextStep = setupSteps.find((step) => !step.complete && !step.skipped) || setupSteps.find((step) => !step.complete) || setupSteps[setupSteps.length - 1];
  const showGuidedSetup = !setupIsComplete && (isBlankDemo || !hasStartedWorkspace || setupCompleteCount > 0 || setupSkippedCount > 0);
  const showTourPrompt = Boolean(onStartTour) && !productTourStatus?.hasCompletedTour && !productTourStatus?.tourSkippedAt;
  const setupTourTargets = {
    contract: "contracts",
    team: "teams",
    expenses: "expenses",
    data: "setup-progress",
    preview: "dashboard-overview",
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

  const dashboardPeriodCards = [
    ["Net Profit", currency.format(todayProfit), "text-emerald-700", "Profitability", "Route profit calculation"],
    ["Open Claims", openClaims, "text-blue-600", "Claims", "Claims needing action"],
    ["Claim Exposure", currency.format(periodClaimsExposure), "text-red-600", "Claims", "Open claim risk"],
    ["Team Photos", `${photosUploaded}/${activeTeams}`, "text-amber-600", "Teams", "Daily readiness proof"],
  ];

  const widgetSpan = {
    periodMetrics: "xl:col-span-12",
    todaysProfit: "xl:col-span-12",
    financialSummary: "xl:col-span-12",
    recentClaims: "xl:col-span-6",
    savedRoutes: "xl:col-span-6",
    activeContracts: "xl:col-span-4",
    contractPerformance: "xl:col-span-4",
    upcomingRenewals: "xl:col-span-4",
    needsAttention: "xl:col-span-7",
    routeHealth: "xl:col-span-5",
    routeEfficiency: "xl:col-span-7",
    teamReadiness: "xl:col-span-5",
    complianceStatus: "xl:col-span-4",
    fuelCostTracker: "xl:col-span-4",
    documentExpirations: "xl:col-span-4",
    insuranceSummary: "xl:col-span-4",
    recentActivity: "xl:col-span-12",
  };
  const widgetTourTargets = {
    financialSummary: "expenses",
    recentClaims: "claims",
    needsAttention: "claims",
    teamReadiness: "teams",
    activeContracts: "contracts",
    contractPerformance: "contracts",
    savedRoutes: "contracts",
    recentActivity: "reports",
  };

  const wrapWidget = (key, content) => (
    <div key={key} data-tour={widgetTourTargets[key]} className={`min-w-0 ${widgetSpan[key] || "xl:col-span-6"}`}>
      {content}
    </div>
  );
  const renderTrendArea = (gradientId) => {
    if (!hasDashboardTrend) {
      return (
        <div className={isDark ? "flex h-full min-h-44 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/60 p-5 text-center" : "flex h-full min-h-44 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center"}>
          <div>
            <p className={`text-sm font-black ${titleText}`}>Start collecting snapshots to see trend</p>
            <p className={`mt-1 text-xs font-semibold leading-5 ${mutedText}`}>Use Save Snapshot after a workday to build profit history here.</p>
          </div>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dashboardTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.55} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="profit" stroke="#2563EB" strokeWidth={4} fill={`url(#${gradientId})`} />
          <Tooltip formatter={(value) => currency.format(value)} />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const renderDashboardWidget = (key) => {
    if (isCleanBlankWorkspace && ["needsAttention", "recentClaims", "savedRoutes", "recentActivity", "routeHealth", "routeEfficiency", "teamReadiness"].includes(key)) {
      return null;
    }

    if (isBlankDemo && hasQuickContracts && ["recentClaims", "recentActivity", "teamReadiness"].includes(key) && claims.length === 0 && teams.length === 0) {
      return null;
    }

    if (key === "periodMetrics") {
      return wrapWidget(key, (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {dashboardPeriodCards.map(([label, value, tone, tab, source]) => (
            <button
              key={label}
              onClick={() => goToSource(tab)}
              className={`${isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-4 hover:border-blue-500/50 hover:bg-slate-900" : "rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-300 hover:bg-blue-50/40"} overflow-hidden text-left transition`}
            >
              <p className={`truncate text-xs font-black uppercase tracking-wide ${mutedText}`}>{dashboardPeriod} {label}</p>
              <p className={`safe-number mt-2 text-2xl font-black ${tone}`} title={value}>{value}</p>
              <p className={`mt-2 truncate text-[11px] font-bold ${mutedText}`}>{source}</p>
            </button>
          ))}
        </div>
      ));
    }

    if (key === "todaysProfit") {
      return wrapWidget(key, (
        <button onClick={() => goToSource("Profitability")} className={`${heroClass} block w-full text-left transition hover:border-blue-500`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <p className="text-sm font-black uppercase tracking-wide text-blue-600">Today's Profit</p>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700">{hasQuickContracts || savedDaySnapshot ? "Route Data" : "Setup Needed"}</span>
              </div>
              <p className={`safe-number mt-6 text-6xl font-black tracking-tight ${titleText}`} title={currency.format(todayProfit)}>{currency.format(todayProfit)}</p>
              <p className={`mt-2 text-lg ${mutedText}`}>Net Profit Today</p>
              <div className={`mt-6 grid max-w-md grid-cols-2 gap-4 border-t pt-5 ${rowBorder}`}>
                <div>
                  <p className={`safe-number text-3xl font-black ${titleText}`} title={`${number.format(margin)}%`}>{number.format(margin)}%</p>
                  <p className={`text-sm ${mutedText}`}>Margin</p>
                </div>
                <div>
                  <p className={`safe-number text-2xl font-black ${hasDashboardTrend ? "text-emerald-700" : mutedText}`} title={trendChangeText}>{trendChangeText}</p>
                  <p className={`text-sm ${mutedText}`}>{trendComparisonLabel}</p>
                </div>
              </div>
            </div>
            <div className="h-44 min-w-[280px] flex-1">
              {renderTrendArea("dashboardHeroTrendWidget")}
            </div>
          </div>
        </button>
      ));
    }

    if (key === "financialSummary") {
      return wrapWidget(key, (
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Revenue", currency.format(dashboardRevenue), "↑ 8.7%", DollarSign, "green", "Profitability"],
            ["Costs", currency.format(dashboardCosts), "↑ 5.1%", Calculator, "amber", "Profitability"],
            ["Claims", currency.format(periodClaimsExposure), "↓ 18.2%", ShieldCheck, "red", "Claims"],
            ["Escrow", currency.format(escrowBalance), "— 0%", ClipboardCheck, "blue", "Compliance"],
          ].map(([label, value, change, Icon, tone, tab]) => (
            <button key={label} onClick={() => goToSource(tab)} className={`${cardClass} overflow-hidden text-left transition hover:border-blue-500/50`}>
              <span className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneIcon(tone)}`}>
                <Icon className="h-6 w-6" />
              </span>
              <p className={`text-sm ${mutedText}`}>{label}</p>
              <p className={`safe-number mt-2 text-2xl font-black ${titleText}`} title={value}>{value}</p>
              <p className={hasDashboardTrend ? tone === "amber" ? "mt-4 truncate text-sm font-bold text-amber-700" : "mt-4 truncate text-sm font-bold text-emerald-700" : `mt-4 truncate text-sm font-bold ${mutedText}`}>
                {hasDashboardTrend ? change : "Snapshot needed"} <span className={mutedText}>{hasDashboardTrend ? trendComparisonLabel : "save daily history"}</span>
              </p>
            </button>
          ))}
        </div>
      ));
    }

    if (key === "recentClaims") {
      return wrapWidget(key, (
        <div className={cardClass}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className={`text-lg font-black ${titleText}`}>Recent Claims</h2>
            <button onClick={() => setActiveTab("Claims")} className="text-sm font-bold text-blue-600">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className={`border-b ${rowBorder}`}>
                <tr className={`text-xs uppercase tracking-wide ${mutedText}`}>
                  <th className="py-3">Type</th>
                  <th className="py-3">Contract</th>
                  <th className="py-3 text-right">Amount</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentClaims.map((claim) => (
                  <tr key={claim.id} onClick={() => goToSource("Claims")} className={`cursor-pointer border-b transition ${rowBorder} ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                    <td className={`py-3 font-semibold ${titleText}`}>{claim.type}</td>
                    <td className={`py-3 ${mutedText}`}>{claim.route || "Lowe's Appliance Delivery"}</td>
                    <td className="py-3 text-right font-black text-red-600">{currency.format(claim.amount)}</td>
                    <td className="py-3">
                      <span className={claim.status === "Open" ? "rounded-full bg-red-500/10 px-2 py-1 text-xs font-bold text-red-600" : "rounded-full bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-700"}>
                        {claim.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ));
    }

    if (key === "savedRoutes") {
      return wrapWidget(key, (
        <div className={cardClass}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className={`text-lg font-black ${titleText}`}>Saved Route Performance</h2>
            <button onClick={() => setActiveTab("Profitability")} className="text-sm font-bold text-blue-600">View All</button>
          </div>
          <div className="space-y-3">
            {savedRoutes.map((row) => (
              <button key={`${row[0]}-${row[1]}`} onClick={() => goToSource("Profitability")} className={`grid w-full grid-cols-[64px_1fr_80px_70px] items-center gap-3 border-b pb-3 text-left text-sm transition ${rowBorder} ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                <p className={mutedText}>{row[0]}</p>
                <p className={`font-semibold ${titleText}`}>{row[1]}</p>
                <p className={`text-right font-black ${titleText}`}>{currency.format(row[2])}</p>
                <p className="text-right font-black text-emerald-700">{number.format(row[3] * 100)}%</p>
              </button>
            ))}
          </div>
        </div>
      ));
    }

    if (key === "needsAttention") {
      return wrapWidget(key, (
        <div className={cardClass}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-red-600">Needs Attention</p>
              <div className="mt-2 flex items-end gap-3">
                <p className={`text-5xl font-black ${titleText}`}>{needsAttention.length}</p>
                <p className={`pb-2 text-base ${mutedText}`}>Active Issues</p>
              </div>
            </div>
            <button onClick={() => setActiveTab("Compliance")} className={isDark ? "rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15" : "rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"}>
              View All Issues
            </button>
          </div>
          <div className={`divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
            {needsAttention.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.title} onClick={() => goToSource(item.tab)} className={`flex w-full items-center gap-4 py-3 text-left transition ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneIcon(item.tone)}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold ${titleText}`}>{item.title}</p>
                    <p className={`text-sm ${mutedText}`}>{item.detail}</p>
                  </div>
                  <span className="text-xl text-slate-400">›</span>
                </button>
              );
            })}
          </div>
        </div>
      ));
    }

    if (key === "routeHealth") {
      return wrapWidget(key, (
        <div className={cardClass}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className={`text-lg font-black ${titleText}`}>Route Health</h2>
            <button onClick={() => setActiveTab("Profitability")} className="text-sm font-bold text-blue-600">View Details</button>
          </div>
          <div className={`divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
            {routeHealth.map(([label, value, status]) => (
              <button key={label} onClick={() => goToSource("Profitability")} className={`flex w-full items-center justify-between py-3 text-left transition ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                <p className={`text-sm font-semibold ${mutedText}`}>{label}</p>
                <div className="flex items-center gap-3">
                  <p className={status === "Good" ? `font-black ${titleText}` : "font-black text-red-600"}>{value}</p>
                  <span className={status === "Good" ? "h-3 w-3 rounded-full bg-emerald-600" : "h-3 w-3 rounded-full bg-red-600"} />
                </div>
              </button>
            ))}
          </div>
          <div className={`mt-4 flex flex-wrap items-center gap-3 border-t pt-4 ${rowBorder}`}>
            <p className={`font-black ${titleText}`}>Overall Route Health</p>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700">Good</span>
          </div>
        </div>
      ));
    }

    if (key === "routeEfficiency") {
      return wrapWidget(key, (
        <div className={cardClass}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className={`text-lg font-black ${titleText}`}>Route Efficiency</h2>
            <button onClick={() => setActiveTab("Profitability")} className="text-sm font-bold text-blue-600">View Details</button>
          </div>
          <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
            <div className="flex flex-col items-center justify-center">
              <div className="flex h-36 w-36 items-center justify-center rounded-full border-[12px] border-blue-600/80">
                <div className="text-center">
                  <p className={`text-4xl font-black ${titleText}`}>{readinessScore}</p>
                  <p className={`text-xs ${mutedText}`}>Score</p>
                  <p className="mt-1 text-sm font-bold text-emerald-700">Good</p>
                </div>
              </div>
            </div>
            <div className={`divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
              {routeEfficiency.map(([label, value, tone]) => (
                <button key={label} onClick={() => goToSource("Profitability")} className={`flex w-full items-center justify-between py-3 text-left transition ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                  <p className={`text-sm ${mutedText}`}>{label}</p>
                  <div className="flex items-center gap-3">
                    <p className={`font-black ${titleText}`}>{value}</p>
                    <span className={tone === "good" ? "h-2 w-2 rounded-full bg-emerald-600" : "h-2 w-2 rounded-full bg-amber-500"} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ));
    }

    if (key === "teamReadiness") {
      return wrapWidget(key, (
        <button onClick={() => goToSource("Teams")} className={`${cardClass} w-full text-left transition hover:border-blue-500/50`}>
          <h2 className={`text-lg font-black ${titleText}`}>Team Readiness</h2>
          <p className={`mt-1 text-sm ${mutedText}`}>Daily photo and team status.</p>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-4xl font-black text-emerald-700">{Math.round((photosUploaded / Math.max(activeTeams, 1)) * 100)}%</p>
            <p className={`text-sm ${mutedText}`}>{photosUploaded} of {activeTeams} teams uploaded photos</p>
          </div>
        </button>
      ));
    }

    if (key === "activeContracts") {
      return wrapWidget(key, (
        <button onClick={() => goToSource("Contracts")} className={`${cardClass} w-full text-left transition hover:border-blue-500/50`}>
          <h2 className={`text-lg font-black ${titleText}`}>Active Contracts</h2>
          <p className={`mt-1 text-sm ${mutedText}`}>Current contract portfolio.</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div><p className={`text-sm ${mutedText}`}>Active</p><p className={`text-3xl font-black ${titleText}`}>4</p></div>
            <div><p className={`text-sm ${mutedText}`}>Watch</p><p className="text-3xl font-black text-amber-700">1</p></div>
            <div><p className={`text-sm ${mutedText}`}>At Risk</p><p className="text-3xl font-black text-red-600">1</p></div>
          </div>
        </button>
      ));
    }

    if (key === "contractPerformance") {
      return wrapWidget(key, (
        <button onClick={() => goToSource("Contracts")} className={`${cardClass} w-full text-left transition hover:border-blue-500/50`}>
          <h2 className={`text-lg font-black ${titleText}`}>Contract Performance</h2>
          <div className={`mt-4 divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
            {contractPerformance.map(([name, revenue, pct, risk]) => (
              <div key={name} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div><p className={`font-black ${titleText}`}>{name}</p><p className={mutedText}>{revenue}</p></div>
                <div className="text-right"><p className="font-black text-emerald-700">{pct}</p><p className={risk === "At Risk" ? "text-xs font-bold text-red-600" : risk === "Watch" ? "text-xs font-bold text-amber-700" : "text-xs font-bold text-emerald-700"}>{risk}</p></div>
              </div>
            ))}
          </div>
        </button>
      ));
    }

    if (key === "upcomingRenewals") {
      return wrapWidget(key, (
        <button onClick={() => goToSource("Contracts")} className={`${cardClass} w-full text-left transition hover:border-blue-500/50`}>
          <h2 className={`text-lg font-black ${titleText}`}>Upcoming Renewals</h2>
          <div className={`mt-4 divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
            {upcomingRenewals.map(([name, date, days]) => (
              <div key={name} className="flex items-center justify-between gap-3 py-3 text-sm">
                <p className={`font-black ${titleText}`}>{name}</p>
                <div className="text-right"><p className={mutedText}>{date}</p><p className="font-bold text-blue-600">{days}</p></div>
              </div>
            ))}
          </div>
        </button>
      ));
    }

    if (key === "recentActivity") {
      return wrapWidget(key, (
        <div className={cardClass}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className={`text-lg font-black ${titleText}`}>Recent Activity</h2>
            <button onClick={() => setActiveTab("Reports")} className="text-sm font-bold text-blue-600">View All Activity</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {activityItems.map(([title, detail, time, Icon, tone]) => (
              <button key={title} onClick={() => goToSource(title.includes("claim") || title.includes("Claim") ? "Claims" : title.includes("Contract") ? "Contracts" : title.includes("Report") ? "Reports" : "Profitability")} className={`flex items-center gap-4 rounded-xl p-2 text-left transition ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${toneIcon(tone)}`}><Icon className="h-6 w-6" /></span>
                <div><p className={`font-black ${titleText}`}>{title}</p><p className={`text-sm ${mutedText}`}>{detail} · {time}</p></div>
              </button>
            ))}
          </div>
        </div>
      ));
    }

    const simpleWidgets = {
      complianceStatus: ["Compliance", "Compliance Status", "Documents, insurance, and readiness.", "92%", "NAH Compliance", "text-emerald-700"],
      fuelCostTracker: ["Profitability", "Fuel Cost Tracker", "Fuel cost impact this week.", "$450.00", "Estimated weekly fuel cost", "text-amber-700"],
      documentExpirations: ["Compliance", "Document Expirations", "Upcoming document deadlines.", "2", "Items need attention", "text-red-600"],
      insuranceSummary: ["Compliance", "Insurance Summary", "Coverage and risk snapshot.", "Compliant", "1 policy expiring soon", "text-emerald-700"],
    };
    const simple = simpleWidgets[key];
    if (simple) {
      const [tab, title, subtitle, value, note, tone] = simple;
      return wrapWidget(key, (
        <button onClick={() => goToSource(tab)} className={`${cardClass} w-full text-left transition hover:border-blue-500/50`}>
          <h2 className={`text-lg font-black ${titleText}`}>{title}</h2>
          <p className={`mt-1 text-sm ${mutedText}`}>{subtitle}</p>
          <p className={`mt-5 text-3xl font-black ${tone}`}>{value}</p>
          <p className={`text-sm ${mutedText}`}>{note}</p>
        </button>
      ));
    }

    return null;
  };

  return (
    <div className={pageClass}>
      <div data-tour="dashboard-overview" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className={isDark ? "hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300 sm:flex" : "hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:flex"}>
            <LayoutDashboard className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={isDark ? "rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-200" : "rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700"}>
                Daily Command Center
              </span>
              <span className={isDark ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-200" : "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"}>
                {openClaims} open claims
              </span>
            </div>
            <h1 className={`text-3xl font-black leading-none tracking-tight sm:text-4xl ${titleText}`}>Dashboard</h1>
            <p className={`mt-3 max-w-2xl text-sm leading-6 sm:text-base ${mutedText}`}>
              Today’s action list only. Use Operations for field work, Finance for money detail, and Reports for history.
            </p>
            {savedDaySnapshot && (
              <p className={isDark ? "mt-3 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-200" : "mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"}>
                Viewing daily history: {savedDaySnapshot.label}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onStartTour && (
            <TakeTourButton onClick={onStartTour} isDark={isDark} />
          )}

          {onStartGuidedDemo && (
            <button
              type="button"
              onClick={onStartGuidedDemo}
              className={isDark ? "rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500" : "rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500"}
            >
              Interactive Demo
            </button>
          )}

          {!isDemoMode && onLaunchDemo && (
            <button
              type="button"
              onClick={() => onLaunchDemo({ reset: false })}
              className={isDark ? "rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-200 hover:bg-emerald-500/15" : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 hover:bg-emerald-100"}
            >
              Launch Demo Workspace
            </button>
          )}

          <div className={isDark ? "rounded-2xl bg-white/5 p-1" : "rounded-2xl bg-slate-100 p-1"}>
            {["Day", "Week", "Month", "Qtr", "Year"].map((period) => (
              <button
                key={period}
                onClick={() => setDashboardPeriod(period)}
                className={`rounded-xl px-4 py-2 text-sm font-black transition ${dashboardPeriod === period
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
            onClick={() => setActiveTab("Operations")}
            className="rounded-xl border border-blue-500/40 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-500/10"
          >
            Open Operations
          </button>
        </div>
      </div>

      {showTourPrompt && (
        <section className={isDark ? "rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4 shadow-xl shadow-black/20" : "rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={isDark ? "text-xs font-black uppercase tracking-wide text-blue-200" : "text-xs font-black uppercase tracking-wide text-blue-700"}>New here?</p>
              <p className={`mt-1 text-lg font-black ${titleText}`}>Take a 60-second tour before you start adding data.</p>
              <p className={`mt-1 text-sm font-semibold ${mutedText}`}>It shows where contracts, teams, expenses, claims, reports, and Ask live.</p>
            </div>
            <TakeTourButton onClick={onStartTour} isDark={isDark} variant="primary" />
          </div>
        </section>
      )}

      {showGuidedSetup && (
        <div className="space-y-5">
          <section data-tour="setup-progress" className={isDark ? "rounded-2xl border border-blue-400/20 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6 shadow-xl shadow-black/20" : "rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6 shadow-sm"}>
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="flex min-w-0 items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <BriefcaseBusiness className="h-7 w-7" />
                </span>
                <div className="min-w-0">
                  <p className={isDark ? "text-xs font-black uppercase tracking-wide text-blue-200" : "text-xs font-black uppercase tracking-wide text-blue-700"}>Business Launch Center</p>
                  <h2 className={`mt-1 max-w-3xl text-3xl font-black leading-tight ${titleText}`}>Build your first margin command center</h2>
                  <p className={`mt-3 max-w-3xl text-sm font-semibold leading-6 ${mutedText}`}>
                    Start with the business facts that make the app useful: contracts, teams, costs, claims, receipts, and history. Every saved step feeds the Dashboard, Operations, Finance, Reports, and Ask.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <button onClick={() => openSetupStep(setupNextStep.id)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500">
                      Continue Setup
                    </button>
                    {!isDemoMode && onLaunchDemo && (
                      <button onClick={() => onLaunchDemo({ reset: false })} className={isDark ? "rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-black text-emerald-200 hover:bg-emerald-500/20" : "rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-500"}>
                        Launch Demo Workspace
                      </button>
                    )}
                    {onStartGuidedDemo && (
                      <button onClick={onStartGuidedDemo} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500">
                        Interactive Demo
                      </button>
                    )}
                    <button onClick={() => openPreviewModal("preview")} className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/5" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}>
                      Preview Dashboard
                    </button>
                    <span className={isDark ? "rounded-full bg-white/5 px-3 py-1 text-xs font-black text-slate-300" : "rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500"}>
                      Next: {sharedNextAction.title}
                    </span>
                  </div>
                </div>
              </div>

              <div className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-4" : "rounded-2xl border border-blue-100 bg-white/80 p-4 shadow-sm"}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className={isDark ? "text-xs font-black uppercase tracking-wide text-slate-300" : "text-xs font-black uppercase tracking-wide text-slate-500"}>Setup progress</p>
                    <p className={`mt-1 text-2xl font-black ${titleText}`}>{setupCompleteCount} of {setupSteps.length} complete</p>
                    {setupSkippedCount > 0 && (
                      <p className="mt-1 text-xs font-black text-amber-700">{setupSkippedCount} skipped item{setupSkippedCount === 1 ? "" : "s"} still in the checklist</p>
                    )}
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
                    <ClipboardCheck className="h-6 w-6" />
                  </span>
                </div>
                <div className={isDark ? "mt-4 h-3 overflow-hidden rounded-full bg-slate-950/70" : "mt-4 h-3 overflow-hidden rounded-full bg-slate-100"}>
                  <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${setupPercent}%` }} />
                </div>
                <div className="mt-4 grid gap-2">
                  {setupSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={step.complete ? "flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white" : step.skipped ? "flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-amber-700" : isDark ? "flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-400" : "flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400"}>
                          {step.complete ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-black">{index + 1}</span>}
                        </span>
                        <p className={`truncate text-sm font-black ${titleText}`}>{step.shortLabel}</p>
                      </div>
                      <p className={step.complete ? "text-xs font-black text-emerald-700" : step.skipped ? "text-xs font-black text-amber-700" : `text-xs font-black ${mutedText}`}>
                        {step.complete ? "Done" : step.skipped ? "Skipped" : "Needed"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <NextActionCard
            isDark={isDark}
            status={setupStatus}
            action={sharedNextAction}
            onAction={handleSetupStatusAction}
          />

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {setupSteps.map(({ id, title, detail, cta, Icon, onClick, tone, complete, skipped }, index) => (
              <div
                key={id}
                data-tour={setupTourTargets[id]}
                className={
                  complete
                    ? isDark
                      ? "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-xl shadow-black/20"
                      : "rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm"
                    : skipped
                      ? isDark
                        ? "rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 shadow-xl shadow-black/20"
                        : "rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"
                      : isDark
                        ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
                        : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${toneIcon(tone)}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className={complete ? "rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-black text-white" : skipped ? "rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-black text-amber-700" : isDark ? "rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-black text-slate-300" : "rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500"}>
                    {complete ? "Done" : skipped ? "Skipped" : `Step ${index + 1}`}
                  </span>
                </div>
                <h3 className={`mt-5 text-lg font-black ${titleText}`}>{title}</h3>
                <p className={`mt-2 min-h-[96px] text-sm font-semibold leading-6 ${mutedText}`}>{detail}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onClick}
                    className={complete ? "rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50" : "rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500"}
                  >
                    {complete ? "Review" : skipped ? "Finish" : cta}
                  </button>
                  {!complete && id !== "preview" && (
                    <button
                      type="button"
                      onClick={() => skipSetupStep(id)}
                      className={isDark ? "rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-slate-300 hover:bg-white/5" : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"}
                    >
                      Skip
                    </button>
                  )}
                </div>
              </div>
            ))}
          </section>

          <section className={cardClass}>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-600">Finish setup checklist</p>
                <h2 className={`mt-1 text-2xl font-black ${titleText}`}>Skipped items stay visible until they are finished</h2>
              </div>
              <p className={`max-w-xl text-sm font-semibold leading-6 ${mutedText}`}>
                The dashboard can start working before every step is done, but Ask and Reports get smarter as each item is completed.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {setupPreviewCards.map(({ title, detail, Icon, status, tone }) => (
                <div key={title} className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-4" : "rounded-2xl border border-slate-200 bg-slate-50 p-4"}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneIcon(tone)}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className={isDark ? "rounded-full bg-white/5 px-3 py-1 text-[11px] font-black text-slate-300" : "rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-500"}>
                      {status}
                    </span>
                  </div>
                  <h3 className={`mt-4 text-base font-black ${titleText}`}>{title}</h3>
                  <p className={`mt-2 text-sm font-semibold leading-6 ${mutedText}`}>{detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {hasQuickContracts && (
        <section data-tour="contracts" className={cardClass}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-600">Saved contracts</p>
              <h2 className={`mt-1 text-2xl font-black ${titleText}`}>Your contract is on the dashboard</h2>
              <p className={`mt-2 text-sm font-semibold ${mutedText}`}>
                These are saved from the setup popup and feed Finance &gt; Profitability.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("Finance")}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500"
            >
              Open Profitability
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {quickContractCards.map((contract) => (
              <button
                key={contract.id}
                onClick={() => setActiveTab("Finance")}
                className={isDark ? "rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-blue-500/50" : "rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-white"}
              >
                <p className={`truncate text-lg font-black ${titleText}`}>{contract.name}</p>
                <p className={`mt-1 text-xs font-black uppercase tracking-wide ${mutedText}`}>{contract.routes || 0} routes / week</p>
                <div className={`mt-4 grid grid-cols-2 gap-3 border-t pt-4 ${rowBorder}`}>
                  <div>
                    <p className={`text-[11px] font-black uppercase tracking-wide ${mutedText}`}>Revenue</p>
                    <p className={`safe-number mt-1 text-lg font-black ${titleText}`} title={currency.format(contract.revenue)}>{currency.format(contract.revenue)}</p>
                  </div>
                  <div>
                    <p className={`text-[11px] font-black uppercase tracking-wide ${mutedText}`}>Profit</p>
                    <p className={`safe-number mt-1 text-lg font-black ${contract.netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`} title={currency.format(contract.netProfit)}>{currency.format(contract.netProfit)}</p>
                  </div>
                </div>
                <p className={`mt-3 text-sm font-black ${contract.margin >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {number.format(contract.margin)}% margin
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {focusedWidgetCount === 0 && !isBlankDemo && (
        <div className={cardClass}>
          <p className={`text-center text-sm ${mutedText}`}>
            The focused dashboard widgets are turned off. Use Operations, Finance, or Reports for the full detail.
          </p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-12">
        {focusedWidgetOrder.map((key) => renderDashboardWidget(key))}
      </div>

      {false && (
        <>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {dashboardPeriodCards.map(([label, value, tone, tab, source]) => (
          <button
            key={label}
            onClick={() => goToSource(tab)}
            className={`${isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-4 hover:border-blue-500/50 hover:bg-slate-900" : "rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-300 hover:bg-blue-50/40"} overflow-hidden text-left transition`}
          >
            <p className={`truncate text-xs font-black uppercase tracking-wide ${mutedText}`}>{dashboardPeriod} {label}</p>
            <p className={`safe-number mt-2 text-2xl font-black ${tone}`} title={value}>{value}</p>
            <p className={`mt-2 truncate text-[11px] font-bold ${mutedText}`}>{source}</p>
          </button>
        ))}
      </div>

      {selectedWidgetCount === 0 && (
        <div className={cardClass}>
          <p className={`text-center text-sm ${mutedText}`}>
            No dashboard widgets are turned on. Go to Settings and select the widgets you want. Even a dashboard needs a job, apparently.
          </p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          {widgets.todaysProfit && (
            <button onClick={() => goToSource("Profitability")} className={`${heroClass} block w-full text-left transition hover:border-blue-500`}>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-black uppercase tracking-wide text-blue-600">Today's Profit</p>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700">
                      {hasQuickContracts || savedDaySnapshot ? "Route Data" : "Setup Needed"}
                    </span>
                  </div>

                  <p className={`safe-number mt-6 text-6xl font-black tracking-tight ${titleText}`} title={currency.format(todayProfit)}>{currency.format(todayProfit)}</p>
                  <p className={`mt-2 text-lg ${mutedText}`}>Net Profit Today</p>

                  <div className={`mt-6 grid max-w-md grid-cols-2 gap-4 border-t pt-5 ${rowBorder}`}>
                    <div>
                      <p className={`safe-number text-3xl font-black ${titleText}`} title={`${number.format(margin)}%`}>{number.format(margin)}%</p>
                      <p className={`text-sm ${mutedText}`}>Margin</p>
                    </div>
                    <div>
                      <p className={`safe-number text-2xl font-black ${hasDashboardTrend ? "text-emerald-700" : mutedText}`} title={trendChangeText}>{trendChangeText}</p>
                      <p className={`text-sm ${mutedText}`}>{trendComparisonLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="h-44 min-w-[280px] flex-1">
                  {renderTrendArea("dashboardHeroTrendMain")}
                </div>
              </div>
            </button>
          )}

          {widgets.financialSummary && (
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ["Revenue", currency.format(dashboardRevenue), "↑ 8.7%", DollarSign, "green", "Profitability"],
                ["Costs", currency.format(dashboardCosts), "↑ 5.1%", Calculator, "amber", "Profitability"],
                ["Claims", currency.format(periodClaimsExposure), "↓ 18.2%", ShieldCheck, "red", "Claims"],
                ["Escrow", currency.format(escrowBalance), "— 0%", ClipboardCheck, "blue", "Compliance"],
              ].map(([label, value, change, Icon, tone, tab]) => (
                <button key={label} onClick={() => goToSource(tab)} className={`${cardClass} overflow-hidden text-left transition hover:border-blue-500/50`}>
                  <span className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneIcon(tone)}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className={`text-sm ${mutedText}`}>{label}</p>
                  <p className={`safe-number mt-2 text-2xl font-black ${titleText}`} title={value}>{value}</p>
                  <p className={hasDashboardTrend ? tone === "amber" ? "mt-4 truncate text-sm font-bold text-amber-700" : "mt-4 truncate text-sm font-bold text-emerald-700" : `mt-4 truncate text-sm font-bold ${mutedText}`}>
                    {hasDashboardTrend ? change : "Snapshot needed"} <span className={mutedText}>{hasDashboardTrend ? trendComparisonLabel : "save daily history"}</span>
                  </p>
                </button>
              ))}
            </div>
          )}

          {(widgets.recentClaims || widgets.savedRoutes) && (
            <div className="grid gap-6 xl:grid-cols-2">
              {widgets.recentClaims && (
                <div className={cardClass}>
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className={`text-lg font-black ${titleText}`}>Recent Claims</h2>
                    <button onClick={() => setActiveTab("Claims")} className="text-sm font-bold text-blue-600">View All</button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className={`border-b ${rowBorder}`}>
                        <tr className={`text-xs uppercase tracking-wide ${mutedText}`}>
                          <th className="py-3">Type</th>
                          <th className="py-3">Contract</th>
                          <th className="py-3 text-right">Amount</th>
                          <th className="py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentClaims.map((claim) => (
                          <tr
                            key={claim.id}
                            onClick={() => goToSource("Claims")}
                            className={`cursor-pointer border-b transition ${rowBorder} ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}
                          >
                            <td className={`py-3 font-semibold ${titleText}`}>{claim.type}</td>
                            <td className={`py-3 ${mutedText}`}>{claim.route || "Lowe's Appliance Delivery"}</td>
                            <td className="py-3 text-right font-black text-red-600">{currency.format(claim.amount)}</td>
                            <td className="py-3">
                              <span className={claim.status === "Open" ? "rounded-full bg-red-500/10 px-2 py-1 text-xs font-bold text-red-600" : "rounded-full bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-700"}>
                                {claim.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {widgets.savedRoutes && (
                <div className={cardClass}>
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className={`text-lg font-black ${titleText}`}>Saved Route Performance</h2>
                    <button onClick={() => setActiveTab("Profitability")} className="text-sm font-bold text-blue-600">View All</button>
                  </div>

                  <div className="space-y-3">
                    {savedRoutes.map((row) => (
                      <button
                        key={`${row[0]}-${row[1]}`}
                        onClick={() => goToSource("Profitability")}
                        className={`grid w-full grid-cols-[64px_1fr_80px_70px] items-center gap-3 border-b pb-3 text-left text-sm transition ${rowBorder} ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}
                      >
                        <p className={mutedText}>{row[0]}</p>
                        <p className={`font-semibold ${titleText}`}>{row[1]}</p>
                        <p className={`text-right font-black ${titleText}`}>{currency.format(row[2])}</p>
                        <p className="text-right font-black text-emerald-700">{number.format(row[3] * 100)}%</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {(widgets.activeContracts || widgets.contractPerformance || widgets.upcomingRenewals) && (
            <div className="grid gap-6 xl:grid-cols-2">
              {widgets.activeContracts && (
                <button onClick={() => goToSource("Contracts")} className={`${cardClass} text-left transition hover:border-blue-500/50`}>
                  <h2 className={`text-lg font-black ${titleText}`}>Active Contracts</h2>
                  <p className={`mt-1 text-sm ${mutedText}`}>Current contract portfolio.</p>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div>
                      <p className={`text-sm ${mutedText}`}>Active</p>
                      <p className={`text-3xl font-black ${titleText}`}>4</p>
                    </div>
                    <div>
                      <p className={`text-sm ${mutedText}`}>Watch</p>
                      <p className="text-3xl font-black text-amber-700">1</p>
                    </div>
                    <div>
                      <p className={`text-sm ${mutedText}`}>At Risk</p>
                      <p className="text-3xl font-black text-red-600">1</p>
                    </div>
                  </div>
                </button>
              )}

              {widgets.contractPerformance && (
                <button onClick={() => goToSource("Contracts")} className={`${cardClass} text-left transition hover:border-blue-500/50`}>
                  <h2 className={`text-lg font-black ${titleText}`}>Contract Performance</h2>
                  <div className={`mt-4 divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
                    {contractPerformance.map(([name, revenue, pct, risk]) => (
                      <div key={name} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <div>
                          <p className={`font-black ${titleText}`}>{name}</p>
                          <p className={mutedText}>{revenue}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-emerald-700">{pct}</p>
                          <p className={risk === "At Risk" ? "text-xs font-bold text-red-600" : risk === "Watch" ? "text-xs font-bold text-amber-700" : "text-xs font-bold text-emerald-700"}>{risk}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </button>
              )}

              {widgets.upcomingRenewals && (
                <button onClick={() => goToSource("Contracts")} className={`${cardClass} text-left transition hover:border-blue-500/50`}>
                  <h2 className={`text-lg font-black ${titleText}`}>Upcoming Renewals</h2>
                  <div className={`mt-4 divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
                    {upcomingRenewals.map(([name, date, days]) => (
                      <div key={name} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <p className={`font-black ${titleText}`}>{name}</p>
                        <div className="text-right">
                          <p className={mutedText}>{date}</p>
                          <p className="font-bold text-blue-600">{days}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6 xl:col-span-5">
          {widgets.needsAttention && (
            <div className={cardClass}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-red-600">Needs Attention</p>
                  <div className="mt-2 flex items-end gap-3">
                    <p className={`text-5xl font-black ${titleText}`}>{needsAttention.length}</p>
                    <p className={`pb-2 text-base ${mutedText}`}>Active Issues</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("Compliance")}
                  className={isDark ? "rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15" : "rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"}
                >
                  View All Issues
                </button>
              </div>

              <div className={`divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
                {needsAttention.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.title} onClick={() => goToSource(item.tab)} className={`flex w-full items-center gap-4 py-3 text-left transition ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneIcon(item.tone)}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`font-bold ${titleText}`}>{item.title}</p>
                        <p className={`text-sm ${mutedText}`}>{item.detail}</p>
                      </div>
                      <span className="text-xl text-slate-400">›</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {widgets.routeHealth && (
            <div className={cardClass}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className={`text-lg font-black ${titleText}`}>Route Health</h2>
                <button onClick={() => setActiveTab("Profitability")} className="text-sm font-bold text-blue-600">View Details</button>
              </div>

              <div className={`divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
                {routeHealth.map(([label, value, status]) => (
                  <button key={label} onClick={() => goToSource("Profitability")} className={`flex w-full items-center justify-between py-3 text-left transition ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                    <p className={`text-sm font-semibold ${mutedText}`}>{label}</p>
                    <div className="flex items-center gap-3">
                      <p className={status === "Good" ? `font-black ${titleText}` : "font-black text-red-600"}>{value}</p>
                      <span className={status === "Good" ? "h-3 w-3 rounded-full bg-emerald-600" : "h-3 w-3 rounded-full bg-red-600"} />
                    </div>
                  </button>
                ))}
              </div>

              <div className={`mt-4 flex flex-wrap items-center gap-3 border-t pt-4 ${rowBorder}`}>
                <p className={`font-black ${titleText}`}>Overall Route Health</p>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700">Good</span>
                <p className={`text-sm ${mutedText}`}>You're performing well. Keep it up.</p>
              </div>
            </div>
          )}

          {widgets.routeEfficiency && (
            <div className={cardClass}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className={`text-lg font-black ${titleText}`}>Route Efficiency</h2>
                <button onClick={() => setActiveTab("Profitability")} className="text-sm font-bold text-blue-600">View Details</button>
              </div>

              <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
                <div className="flex flex-col items-center justify-center">
                  <div className="flex h-36 w-36 items-center justify-center rounded-full border-[12px] border-blue-600/80">
                    <div className="text-center">
                      <p className={`text-4xl font-black ${titleText}`}>{readinessScore}</p>
                      <p className={`text-xs ${mutedText}`}>Score</p>
                      <p className="mt-1 text-sm font-bold text-emerald-700">Good</p>
                    </div>
                  </div>
                </div>

                <div className={`divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
                  {routeEfficiency.map(([label, value, tone]) => (
                    <button key={label} onClick={() => goToSource("Profitability")} className={`flex w-full items-center justify-between py-3 text-left transition ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}>
                      <p className={`text-sm ${mutedText}`}>{label}</p>
                      <div className="flex items-center gap-3">
                        <p className={`font-black ${titleText}`}>{value}</p>
                        <span className={tone === "good" ? "h-2 w-2 rounded-full bg-emerald-600" : "h-2 w-2 rounded-full bg-amber-500"} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <p className={`mt-4 text-sm ${mutedText}`}>Keep optimizing your route to improve efficiency.</p>
            </div>
          )}

          {widgets.teamReadiness && (
            <button onClick={() => goToSource("Teams")} className={`${cardClass} text-left transition hover:border-blue-500/50`}>
              <h2 className={`text-lg font-black ${titleText}`}>Team Readiness</h2>
              <p className={`mt-1 text-sm ${mutedText}`}>Daily photo and team status.</p>
              <div className="mt-5 flex items-center justify-between">
                <p className="text-4xl font-black text-emerald-700">{Math.round((photosUploaded / Math.max(activeTeams, 1)) * 100)}%</p>
                <p className={`text-sm ${mutedText}`}>{photosUploaded} of {activeTeams} teams uploaded photos</p>
              </div>
            </button>
          )}

          {widgets.complianceStatus && (
            <button onClick={() => goToSource("Compliance")} className={`${cardClass} text-left transition hover:border-blue-500/50`}>
              <h2 className={`text-lg font-black ${titleText}`}>Compliance Status</h2>
              <p className={`mt-1 text-sm ${mutedText}`}>Documents, insurance, and readiness.</p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${mutedText}`}>NAH Compliance</p>
                  <p className="text-3xl font-black text-emerald-700">92%</p>
                </div>
                <div>
                  <p className={`text-sm ${mutedText}`}>Open Issues</p>
                  <p className="text-3xl font-black text-amber-700">3</p>
                </div>
              </div>
            </button>
          )}

          {widgets.fuelCostTracker && (
            <button onClick={() => goToSource("Profitability")} className={`${cardClass} text-left transition hover:border-blue-500/50`}>
              <h2 className={`text-lg font-black ${titleText}`}>Fuel Cost Tracker</h2>
              <p className={`mt-1 text-sm ${mutedText}`}>Fuel cost impact this week.</p>
              <p className="mt-5 text-3xl font-black text-amber-700">$450.00</p>
              <p className={`text-sm ${mutedText}`}>Estimated weekly fuel cost</p>
            </button>
          )}

          {widgets.documentExpirations && (
            <button onClick={() => goToSource("Compliance")} className={`${cardClass} text-left transition hover:border-blue-500/50`}>
              <h2 className={`text-lg font-black ${titleText}`}>Document Expirations</h2>
              <p className={`mt-1 text-sm ${mutedText}`}>Upcoming document deadlines.</p>
              <div className={`mt-4 divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
                <p className="py-3 text-sm font-bold text-amber-700">Cargo insurance expires soon</p>
                <p className="py-3 text-sm font-bold text-red-600">Team C photo missing</p>
              </div>
            </button>
          )}

          {widgets.insuranceSummary && (
            <button onClick={() => goToSource("Compliance")} className={`${cardClass} text-left transition hover:border-blue-500/50`}>
              <h2 className={`text-lg font-black ${titleText}`}>Insurance Summary</h2>
              <p className={`mt-1 text-sm ${mutedText}`}>Coverage and risk snapshot.</p>
              <p className="mt-5 text-3xl font-black text-emerald-700">Compliant</p>
              <p className={`text-sm ${mutedText}`}>1 policy expiring soon</p>
            </button>
          )}
        </div>
      </div>

      {widgets.recentActivity && (
        <div className={cardClass}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className={`text-lg font-black ${titleText}`}>Recent Activity</h2>
            <button onClick={() => setActiveTab("Reports")} className="text-sm font-bold text-blue-600">View All Activity</button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {activityItems.map(([title, detail, time, Icon, tone]) => (
              <button
                key={title}
                onClick={() => goToSource(title.includes("claim") || title.includes("Claim") ? "Claims" : title.includes("Contract") ? "Contracts" : title.includes("Report") ? "Reports" : "Profitability")}
                className={`flex items-center gap-4 rounded-xl p-2 text-left transition ${isDark ? "hover:bg-white/5" : "hover:bg-blue-50/60"}`}
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${toneIcon(tone)}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <p className={`font-black ${titleText}`}>{title}</p>
                  <p className={`text-sm ${mutedText}`}>{detail} · {time}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
        </>
      )}

      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={saveQuickContract}
            className={isDark ? "w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40" : "w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20"}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-600">New contract</p>
                <h2 className={`mt-1 text-2xl font-black ${titleText}`}>Add contract info</h2>
                <p className={`mt-2 max-w-xl text-sm leading-6 ${mutedText}`}>
                  Start with the basics. These numbers save into Finance &gt; Profitability so your dashboard can stop being empty.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsContractModalOpen(false)}
                className={isDark ? "rounded-xl border border-white/10 px-3 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label>
                <span className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Contract Name</span>
                <input
                  name="contract"
                  value={contractDraft.contract}
                  onChange={(event) => updateContractDraft("contract", event.target.value)}
                  placeholder="Example: Will's Delivery"
                  className={modalInputClass}
                  autoFocus
                />
              </label>

              <label>
                <span className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Routes / Week</span>
                <input
                  name="routes"
                  type="number"
                  min="1"
                  value={contractDraft.routes}
                  onChange={(event) => updateContractDraft("routes", event.target.value)}
                  className={modalInputClass}
                />
              </label>

              {[
                ["Route Pay", "routePay", "Revenue per route", "$"],
                ["Stops / Route", "stops", "Expected stops per route", ""],
                ["Labor / Route", "labor", "Driver and helper cost", "$"],
                ["Fuel / Route", "fuel", "Fuel estimate", "$"],
                ["Truck + Insurance / Route", "truckInsurance", "Truck, insurance, software", "$"],
                ["Maintenance / Route", "maintenance", "Maintenance reserve", "$"],
                ["Claims Reserve / Week", "claims", "Weekly claim reserve", "$"],
                ["Other Costs / Route", "other", "Tolls, parking, misc.", "$"],
              ].map(([label, key, placeholder, prefix]) => (
                <label key={key}>
                  <span className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>{label}</span>
                  <div className="relative">
                    {prefix && <span className={`absolute left-3 top-2.5 text-sm font-black ${mutedText}`}>{prefix}</span>}
                    <input
                      name={key}
                      type="number"
                      min="0"
                      step="0.01"
                      value={contractDraft[key]}
                      onChange={(event) => updateContractDraft(key, event.target.value)}
                      placeholder={placeholder}
                      className={`${modalInputClass} ${prefix ? "pl-7" : ""}`}
                    />
                  </div>
                </label>
              ))}
            </div>

            <div className={`mt-6 flex flex-col gap-3 border-t pt-5 ${rowBorder} sm:flex-row sm:items-center sm:justify-between`}>
              <div>
                {contractSaveStatus ? (
                  <p className={contractSaveStatus.includes("saved") ? "text-sm font-black text-emerald-700" : "text-sm font-black text-red-600"}>{contractSaveStatus}</p>
                ) : (
                  <p className={`text-sm font-semibold ${mutedText}`}>Save this contract here, then add another or open Profitability.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {contractSaveStatus.includes("saved") && (
                  <>
                    {activeSetupStep === "contract" && (
                      <button
                        type="button"
                        onClick={() => openNextSetupStep("contract")}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
                      >
                        Next: Add Team
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setContractDraft(emptyContractDraft);
                        setContractSaveStatus("");
                      }}
                      className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
                    >
                      Clear for Another
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsContractModalOpen(false);
                        setActiveTab("Finance");
                      }}
                      className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
                    >
                      Open Profitability
                    </button>
                  </>
                )}
                {activeSetupStep === "contract" && !contractSaveStatus.includes("saved") && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsContractModalOpen(false);
                      skipSetupStep("contract");
                    }}
                    className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
                  >
                    Skip For Now
                  </button>
                )}
                <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500">
                  Save Contract
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={saveQuickTeam}
            className={isDark ? "w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40" : "w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20"}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-600">New team</p>
                <h2 className={`mt-1 text-2xl font-black ${titleText}`}>Add team info</h2>
                <p className={`mt-2 max-w-xl text-sm leading-6 ${mutedText}`}>
                  Add the first crew, truck, and route assignment. This updates the dashboard and Operations team readiness.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className={isDark ? "rounded-xl border border-white/10 px-3 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["Team Name", "name", "Team A"],
                ["Driver / Lead", "lead", "Driver name"],
                ["Helper", "helper", "Helper name"],
                ["Truck", "truck", "Truck number"],
                ["Route", "route", "Route or contract"],
              ].map(([label, key, placeholder]) => (
                <label key={key} className={key === "route" ? "md:col-span-2" : ""}>
                  <span className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>{label}</span>
                  <input
                    value={teamDraft[key]}
                    onChange={(event) => updateTeamDraft(key, event.target.value)}
                    placeholder={placeholder}
                    className={modalInputClass}
                    autoFocus={key === "name"}
                  />
                </label>
              ))}
            </div>

            <div className={`mt-6 flex flex-col gap-3 border-t pt-5 ${rowBorder} sm:flex-row sm:items-center sm:justify-between`}>
              <div>
                {teamSaveStatus ? (
                  <p className={teamSaveStatus.includes("saved") ? "text-sm font-black text-emerald-700" : "text-sm font-black text-red-600"}>{teamSaveStatus}</p>
                ) : (
                  <p className={`text-sm font-semibold ${mutedText}`}>Teams start with missing photo proof until they upload from the field app.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {teamSaveStatus.includes("saved") && (
                  <>
                    {activeSetupStep === "team" && (
                      <button
                        type="button"
                        onClick={() => openNextSetupStep("team")}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
                      >
                        Next: Set Expenses
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsTeamModalOpen(false);
                        setActiveTab("Operations");
                      }}
                      className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
                    >
                      Open Operations
                    </button>
                  </>
                )}
                {activeSetupStep === "team" && !teamSaveStatus.includes("saved") && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsTeamModalOpen(false);
                      skipSetupStep("team");
                    }}
                    className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
                  >
                    Skip For Now
                  </button>
                )}
                <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500">
                  Save Team
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={saveExpenseSetup}
            className={isDark ? "w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40" : "w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20"}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-600">Expense setup</p>
                <h2 className={`mt-1 text-2xl font-black ${titleText}`}>Set basic route costs</h2>
                <p className={`mt-2 max-w-xl text-sm leading-6 ${mutedText}`}>
                  These estimates attach to {quickContracts[0]?.contract || "your first contract"} so the dashboard can calculate real margin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className={isDark ? "rounded-xl border border-white/10 px-3 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
              >
                Close
              </button>
            </div>

            <div className={isDark ? "mt-5 rounded-2xl border border-white/10 bg-white/5 p-4" : "mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4"}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`text-sm font-black ${titleText}`}>{quickContracts[0]?.contract || "First contract"}</p>
                  <p className={`text-xs font-bold ${mutedText}`}>{quickContracts[0]?.routes || 1} route{Number(quickContracts[0]?.routes || 1) === 1 ? "" : "s"} per week</p>
                </div>
                <p className="text-sm font-black text-emerald-700">
                  Revenue: {currency.format(Number(quickContracts[0]?.revenue || 0))}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["Labor / Route", "labor", "Driver and helper cost"],
                ["Fuel / Route", "fuel", "Fuel estimate"],
                ["Truck + Insurance / Route", "truckInsurance", "Truck, insurance, software"],
                ["Maintenance / Route", "maintenance", "Maintenance reserve"],
                ["Other Costs / Route", "other", "Tolls, parking, misc."],
              ].map(([label, key, placeholder]) => (
                <label key={key} className={key === "other" ? "md:col-span-2" : ""}>
                  <span className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>{label}</span>
                  <div className="relative">
                    <span className={`absolute left-3 top-2.5 text-sm font-black ${mutedText}`}>$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={expenseDraft[key]}
                      onChange={(event) => updateExpenseDraft(key, event.target.value)}
                      placeholder={placeholder}
                      className={`${modalInputClass} pl-7`}
                    />
                  </div>
                </label>
              ))}
            </div>

            <div className={`mt-6 flex flex-col gap-3 border-t pt-5 ${rowBorder} sm:flex-row sm:items-center sm:justify-between`}>
              <div>
                {expenseSaveStatus ? (
                  <p className={expenseSaveStatus.includes("saved") ? "text-sm font-black text-emerald-700" : "text-sm font-black text-red-600"}>{expenseSaveStatus}</p>
                ) : (
                  <p className={`text-sm font-semibold ${mutedText}`}>You can refine these later in Finance. This just gets the first dashboard numbers moving.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {expenseSaveStatus.includes("saved") && activeSetupStep === "expenses" && (
                  <button
                    type="button"
                    onClick={() => openNextSetupStep("expenses")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
                  >
                    Next: Import Data
                  </button>
                )}
                {activeSetupStep === "expenses" && !expenseSaveStatus.includes("saved") && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpenseModalOpen(false);
                      skipSetupStep("expenses");
                    }}
                    className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
                  >
                    Skip For Now
                  </button>
                )}
                <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500">
                  Save Expenses
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={saveQuickImport}
            className={isDark ? "w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40" : "w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20"}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-600">Import data</p>
                <h2 className={`mt-1 text-2xl font-black ${titleText}`}>What are you importing?</h2>
                <p className={`mt-2 max-w-xl text-sm leading-6 ${mutedText}`}>
                  Start a contract document, claim email, or receipt intake from the dashboard. Claims saved here immediately update open-claim metrics.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className={isDark ? "rounded-xl border border-white/10 px-3 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                ["Contract Document", FileText, "Rates, terms, or retailer docs"],
                ["Claim Email", ShieldCheck, "Damage, penalty, or dispute email"],
                ["Receipt", Upload, "Gas, tools, parking, or maintenance"],
              ].map(([type, Icon, note]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateImportDraft("type", type)}
                  className={importDraft.type === type
                    ? "rounded-2xl border border-blue-500 bg-blue-600 p-4 text-left text-white shadow-lg shadow-blue-600/20"
                    : isDark
                      ? "rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-slate-200 hover:bg-white/10"
                      : "rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-slate-700 hover:bg-white"}
                >
                  <Icon className="h-6 w-6" />
                  <p className="mt-3 text-sm font-black">{type}</p>
                  <p className={importDraft.type === type ? "mt-1 text-xs font-semibold text-blue-100" : `mt-1 text-xs font-semibold ${mutedText}`}>{note}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label>
                <span className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>
                  {importDraft.type === "Receipt" ? "Vendor / Receipt Name" : importDraft.type === "Claim Email" ? "Claim Summary" : "Document Name"}
                </span>
                <input
                  value={importDraft.title}
                  onChange={(event) => updateImportDraft("title", event.target.value)}
                  placeholder={importDraft.type === "Receipt" ? "Shell, Home Depot, Lowe's..." : importDraft.type === "Claim Email" ? "Wall damage claim email" : "Retailer rate card"}
                  className={modalInputClass}
                  autoFocus
                />
              </label>

              <label>
                <span className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>
                  {importDraft.type === "Claim Email" ? "Claim Amount" : importDraft.type === "Receipt" ? "Receipt Amount" : "Estimated Value"}
                </span>
                <div className="relative">
                  <span className={`absolute left-3 top-2.5 text-sm font-black ${mutedText}`}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={importDraft.amount}
                    onChange={(event) => updateImportDraft("amount", event.target.value)}
                    placeholder="0.00"
                    className={`${modalInputClass} pl-7`}
                  />
                </div>
              </label>

              <label className="md:col-span-2">
                <span className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Notes</span>
                <textarea
                  value={importDraft.notes}
                  onChange={(event) => updateImportDraft("notes", event.target.value)}
                  placeholder="Paste details, email text, receipt notes, or what needs to be reviewed."
                  className={`${modalInputClass} min-h-28 resize-none`}
                />
              </label>
            </div>

            <div className={`mt-6 flex flex-col gap-3 border-t pt-5 ${rowBorder} sm:flex-row sm:items-center sm:justify-between`}>
              <div>
                {importSaveStatus ? (
                  <p className={importSaveStatus.includes("saved") ? "text-sm font-black text-emerald-700" : "text-sm font-black text-red-600"}>{importSaveStatus}</p>
                ) : (
                  <p className={`text-sm font-semibold ${mutedText}`}>Use this for quick setup. Full AI intake still lives in Intake.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {importSaveStatus.includes("saved") && (
                  <>
                    {activeSetupStep === "data" && (
                      <button
                        type="button"
                        onClick={() => openNextSetupStep("data")}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
                      >
                        Next: Preview
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsImportModalOpen(false);
                        setActiveTab(importDraft.type === "Claim Email" ? "Operations" : importDraft.type === "Receipt" ? "Finance" : "Intake");
                      }}
                      className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
                    >
                      Open Full Intake
                    </button>
                  </>
                )}
                {activeSetupStep === "data" && !importSaveStatus.includes("saved") && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsImportModalOpen(false);
                      skipSetupStep("data");
                    }}
                    className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
                  >
                    Skip For Now
                  </button>
                )}
                <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500">
                  Save Import
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className={isDark ? "w-full max-w-5xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40" : "w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20"}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-600">Dashboard preview</p>
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
                    <p className={`text-xs font-black uppercase tracking-wide ${mutedText}`}>{label}</p>
                  </div>
                  <p className={`safe-number mt-4 text-2xl font-black ${tone}`} title={value}>{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className={isDark ? "rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5" : "rounded-2xl border border-blue-100 bg-blue-50 p-5"}>
                <p className="text-xs font-black uppercase tracking-wide text-blue-600">Next recommended action</p>
                <h3 className={`mt-2 text-xl font-black ${titleText}`}>{previewNextAction}</h3>
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
