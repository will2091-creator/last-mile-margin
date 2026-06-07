import React, { useEffect, useMemo, useState } from "react";
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
  currency,
  defaultSettings,
  DollarSign,
  FileDown,
  FileText,
  number,
  ResponsiveContainer,
  Save,
  Settings,
  ShieldCheck,
  Tooltip,
  Upload,
  UserPlus,
  Users,
  XAxis,
  YAxis,
} from "../shared";
import TakeTourButton from "../components/TakeTourButton";
import NextActionCard from "../components/NextActionCard";
import { getNextBestSetupAction, getSetupStatus } from "../lib/onboarding";
import ContractModal from "../components/dashboard/ContractModal";
import TeamModal from "../components/dashboard/TeamModal";
import ExpenseModal from "../components/dashboard/ExpenseModal";
import ImportModal from "../components/dashboard/ImportModal";
import SetupWizard from "../components/dashboard/SetupWizard";

function DashboardHome({ teams, claims, setTeams, setClaims, setActiveTab, isDark, appSettings, savedDaySnapshot, savedDays = [], isBlankDemo = false, isDemoMode = false, onStartTour, onStartGuidedDemo, onLaunchDemo, onSaveSnapshot, productTourStatus, ownerName = "" }) {
  const defaultDashboardOrder = defaultSettings.dashboardWidgetOrder || Object.keys(defaultSettings.dashboardWidgets);
  const dashboardWidgetOrder = [
    ...new Set([...(appSettings?.dashboardWidgetOrder || []), ...defaultDashboardOrder]),
  ].filter((key) => Object.prototype.hasOwnProperty.call(defaultSettings.dashboardWidgets, key));
  const activeTeams = teams.length;
  const photosUploaded = teams.filter((team) => team.photoStatus === "Uploaded").length;
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
  const hasProfitTrend = profitTrendData.length >= 2;

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

  useEffect(() => {
    if (productTourStatus?.hasCompletedTour) return;
    if (!onStartTour || !isCleanBlankWorkspace || isDemoMode || hasAutoStartedBlankTour) return;
    setHasAutoStartedBlankTour(true);
    window.setTimeout(onStartTour, 650);
  }, [hasAutoStartedBlankTour, isCleanBlankWorkspace, isDemoMode, onStartTour, productTourStatus?.hasCompletedTour]);

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






  const pageClass = isDark ? "space-y-6 text-white" : "space-y-6 text-slate-950";
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
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
  const showDemoActions = !productTourStatus?.hasCompletedTour && Boolean(onStartTour || onStartGuidedDemo);
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
          <p className={`mt-2 text-sm font-semibold sm:text-base ${mutedText}`}>
            Here's how your business is performing today.
          </p>
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
            data-tour="dashboard-open-operations"
            onClick={() => setActiveTab("Operations")}
            className="w-full rounded-xl border border-blue-500/40 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-500/10 sm:w-auto"
          >
            Open Operations
          </button>
        </div>
      </div>



      {/* PRIMARY ROW — net profit with trend, and what needs attention today */}
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <button
          type="button"
          data-tour="dashboard-net-profit"
          onClick={() => goToSource("Profitability")}
          className={isDark ? "rounded-2xl border border-blue-400/20 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 p-6 text-left shadow-xl shadow-black/20 transition hover:border-blue-300/40" : "rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-300"}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Net Profit Today</p>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <DollarSign className="h-5 w-5" />
            </span>
          </div>
          <p className={`safe-number mt-3 text-4xl font-black tracking-tight sm:text-5xl ${todayProfit >= 0 ? "text-emerald-700" : "text-red-600"}`} title={currency.format(todayProfit)}>
            {currency.format(todayProfit)}
          </p>
          <p className={`mt-1 text-sm font-bold ${mutedText}`}>{dashboardPeriod} net profit · {number.format(margin)}% margin</p>
          <div className="mt-5 h-44">
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

      {/* SECONDARY ROW — revenue, cost, margin, and team readiness */}
      <div data-tour="dashboard-kpis" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button onClick={() => goToSource("Profitability")} className={`${cardClass} overflow-hidden text-left transition hover:border-blue-500/50`}>
          <span className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneIcon("blue")}`}>
            <DollarSign className="h-6 w-6" />
          </span>
          <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Revenue Today</p>
          <p className="safe-number mt-2 text-3xl font-black text-blue-600" title={currency.format(dashboardRevenue)}>{currency.format(dashboardRevenue)}</p>
        </button>

        <button onClick={() => goToSource("Profitability")} className={`${cardClass} overflow-hidden text-left transition hover:border-blue-500/50`}>
          <span className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneIcon("amber")}`}>
            <Calculator className="h-6 w-6" />
          </span>
          <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Costs Today</p>
          <p className="safe-number mt-2 text-3xl font-black text-amber-700" title={currency.format(dashboardCosts)}>{currency.format(dashboardCosts)}</p>
        </button>

        <button onClick={() => goToSource("Profitability")} className={`${cardClass} overflow-hidden text-left transition hover:border-blue-500/50`}>
          <span className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneIcon(margin >= 0 ? "green" : "red")}`}>
            <BarChart3 className="h-6 w-6" />
          </span>
          <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Margin</p>
          <p className={`safe-number mt-2 text-3xl font-black ${margin >= 0 ? "text-emerald-700" : "text-red-600"}`} title={`${number.format(margin)}%`}>{number.format(margin)}%</p>
        </button>

        <button onClick={() => goToSource("Teams")} className={`${cardClass} overflow-hidden text-left transition hover:border-blue-500/50`}>
          <span className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneIcon("blue")}`}>
            <Users className="h-6 w-6" />
          </span>
          <p className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Team Readiness</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className={`safe-number text-3xl font-black ${titleText}`}>{currentReadiness}%</p>
            {renderTrendChip(readinessTrendDelta, { suffix: " pts", goodIsUp: true })}
          </div>
          <p className={`mt-1 text-xs font-semibold ${mutedText}`}>{photosUploaded} of {activeTeams} teams ready</p>
        </button>
      </div>

      {showDemoActions && (onStartTour || onStartGuidedDemo || (!isDemoMode && onLaunchDemo)) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <span className={`text-sm font-bold ${mutedText}`}>Just exploring?</span>
          {onStartTour && (
            <TakeTourButton onClick={onStartTour} isDark={isDark} className="w-full sm:w-auto" />
          )}
          {onStartGuidedDemo && (
            <button
              data-tour="dashboard-interactive-demo"
              type="button"
              onClick={onStartGuidedDemo}
              className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500 sm:w-auto"
            >
              Interactive Demo
            </button>
          )}
          {!isDemoMode && onLaunchDemo && (
            <button
              data-tour="dashboard-launch-demo"
              type="button"
              onClick={() => onLaunchDemo({ reset: false })}
              className={isDark ? "w-full rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-200 hover:bg-emerald-500/15 sm:w-auto" : "w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 hover:bg-emerald-100 sm:w-auto"}
            >
              Launch Demo Workspace
            </button>
          )}
        </div>
      )}

      <SetupWizard
        isDark={isDark}
        showGuidedSetup={showGuidedSetup}
        isDemoMode={isDemoMode}
        onLaunchDemo={onLaunchDemo}
        onStartGuidedDemo={onStartGuidedDemo}
        showDemoActions={showDemoActions}
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
                      <th className="py-3">Contract</th>
                      <th className="py-3 text-right">Revenue</th>
                      <th className="py-3 text-right">Profit</th>
                      <th className="py-3 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quickContractCards.map((contract) => (
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
              <p className={`rounded-xl border border-dashed p-5 text-center text-sm font-semibold ${mutedText} ${isDark ? "border-white/10" : "border-slate-200"}`}>
                No claims yet. New claims will show up here.
              </p>
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
