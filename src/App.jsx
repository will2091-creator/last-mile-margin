import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import LoginPage from "./pages/LoginPage";
import DashboardHome from "./pages/DashboardHome";
import ClaimsDashboard from "./pages/ClaimsDashboard";
import TeamsDashboard from "./pages/TeamsDashboard";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import SettingsDashboard from "./pages/SettingsDashboard";
import ProfitabilityDashboard from "./pages/ProfitabilityDashboard";
import ContractsDashboard from "./pages/ContractsDashboard";
import ReportsDashboard from "./pages/ReportsDashboard";
import AskBusinessDashboard from "./pages/AskBusinessDashboard";
import AiQuickIntake from "./components/AiQuickIntake";
import { loadAppStateFromSupabase, saveAppStateToSupabase } from "./lib/appStateRepository";
import { loadClaimsFromSupabase, syncClaimsToSupabase } from "./lib/claimsRepository";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient";
import {
  accentThemes,
  Bot,
  BriefcaseBusiness,
  Calculator,
  ClipboardCheck,
  currency,
  defaultForm,
  defaultSettings,
  FileText,
  getGrade,
  initialClaims,
  initialTeams,
  LayoutDashboard,
  Moon,
  number,
  Save,
  Settings,
  ShieldCheck,
  Sun,
  toNum,
  Upload,
  Users,
} from "./shared";

const lastMileMarginLogo = "/assets/last-mile-margin-logo.png";
const lastMileMarginLogoDark = "/assets/last-mile-margin-logo-transparent-dark.svg";
const usernameEmailMap = {
  "william.mckoy": "william.mckoy2@gmail.com",
};

const tabSlugs = {
  Dashboard: "dashboard",
  Intake: "intake",
  Profitability: "profitability",
  Contracts: "contracts",
  Compliance: "compliance",
  Claims: "claims",
  Teams: "teams",
  Reports: "reports",
  Ask: "ask",
  Settings: "settings",
};

const tabBySlug = Object.fromEntries(Object.entries(tabSlugs).map(([tab, slug]) => [slug, tab]));

const getTabFromUrl = () => {
  const slug = window.location.hash.replace(/^#\/?/, "").toLowerCase();
  return tabBySlug[slug] || "Dashboard";
};

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function App() {
  const loadFromLocalStorage = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
      console.warn(`Could not load ${key} from localStorage`, error);
      return fallback;
    }
  };

  const [form, setForm] = useState(defaultForm);
  const [savedScenarios, setSavedScenarios] = useState(() =>
    loadFromLocalStorage("finalMileSavedScenarios", [])
  );
  const [activeTab, setActiveTab] = useState(() => getTabFromUrl());
  const [reportsHomeSignal, setReportsHomeSignal] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSavedDays, setShowSavedDays] = useState(false);
  const [savedDayFlash, setSavedDayFlash] = useState(false);
  const [savedDays, setSavedDays] = useState(() =>
    loadFromLocalStorage("finalMileSavedDays", [])
  );
  const [loadedSavedDay, setLoadedSavedDay] = useState(null);
  const [currentWorkDate, setCurrentWorkDate] = useState(() =>
    localStorage.getItem("finalMileCurrentWorkDate") || getLocalDateKey()
  );
  const [globalDateRange, setGlobalDateRange] = useState(() => {
    const workDate = localStorage.getItem("finalMileCurrentWorkDate") || getLocalDateKey();
    return {
      start: workDate,
      end: workDate,
    };
  });
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const workDate = localStorage.getItem("finalMileCurrentWorkDate") || getLocalDateKey();
    const date = new Date(`${workDate}T00:00:00`);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [claims, setClaims] = useState(() =>
    loadFromLocalStorage("finalMileClaims", initialClaims)
  );
  const [claimsBackendStatus, setClaimsBackendStatus] = useState("Local claims ready.");
  const [hasLoadedRemoteClaims, setHasLoadedRemoteClaims] = useState(false);
  const [appStateBackendStatus, setAppStateBackendStatus] = useState("Local app state ready.");
  const [hasLoadedRemoteAppState, setHasLoadedRemoteAppState] = useState(false);
  const [teams, setTeams] = useState(() =>
    loadFromLocalStorage("finalMileTeams", initialTeams)
  );
  const [appSettings, setAppSettings] = useState(() => {
    const savedSettings = loadFromLocalStorage("finalMileSettings", defaultSettings);

    return {
      ...defaultSettings,
      ...savedSettings,
      dashboardWidgets: {
        ...defaultSettings.dashboardWidgets,
        ...(savedSettings.dashboardWidgets || {}),
      },
      dashboardWidgetOrder: [
        ...new Set([
          ...(savedSettings.dashboardWidgetOrder || []),
          ...(defaultSettings.dashboardWidgetOrder || Object.keys(defaultSettings.dashboardWidgets)),
        ]),
      ].filter((key) => Object.prototype.hasOwnProperty.call(defaultSettings.dashboardWidgets, key)),
      claimRiskThresholds: {
        ...defaultSettings.claimRiskThresholds,
        ...(savedSettings.claimRiskThresholds || {}),
      },
    };
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    localStorage.getItem("finalMileLoggedIn") === "true"
  );
  const [authUser, setAuthUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    localStorage.setItem("finalMileSettings", JSON.stringify(appSettings));
  }, [appSettings]);

  useEffect(() => {
    localStorage.setItem("finalMileLoggedIn", String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsAuthLoading(false);
      return undefined;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      const user = data.session?.user || null;
      setAuthUser(user);
      setIsLoggedIn(Boolean(user));
      setIsAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setAuthUser(user);
      setIsLoggedIn(Boolean(user));
      localStorage.setItem("finalMileLoggedIn", String(Boolean(user)));
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("finalMileTeams", JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem("finalMileClaims", JSON.stringify(claims));
  }, [claims]);

  useEffect(() => {
    let isMounted = true;

    const loadRemoteAppState = async () => {
      const result = await loadAppStateFromSupabase();
      if (!isMounted) return;

      if (result.ok && result.state) {
        const remoteState = result.state;

        if (remoteState.form) setForm({ ...defaultForm, ...remoteState.form });
        if (Array.isArray(remoteState.teams)) setTeams(remoteState.teams);
        if (Array.isArray(remoteState.savedScenarios)) setSavedScenarios(remoteState.savedScenarios);
        if (Array.isArray(remoteState.savedDays)) setSavedDays(remoteState.savedDays);
        if (remoteState.currentWorkDate) setCurrentWorkDate(remoteState.currentWorkDate);
        if (remoteState.globalDateRange?.start && remoteState.globalDateRange?.end) {
          setGlobalDateRange(remoteState.globalDateRange);
        }
        if (remoteState.appSettings) {
          setAppSettings((current) => ({
            ...defaultSettings,
            ...current,
            ...remoteState.appSettings,
            dashboardWidgets: {
              ...defaultSettings.dashboardWidgets,
              ...(remoteState.appSettings.dashboardWidgets || {}),
            },
            dashboardWidgetOrder: [
              ...new Set([
                ...(remoteState.appSettings.dashboardWidgetOrder || []),
                ...(defaultSettings.dashboardWidgetOrder || Object.keys(defaultSettings.dashboardWidgets)),
              ]),
            ].filter((key) => Object.prototype.hasOwnProperty.call(defaultSettings.dashboardWidgets, key)),
            claimRiskThresholds: {
              ...defaultSettings.claimRiskThresholds,
              ...(remoteState.appSettings.claimRiskThresholds || {}),
            },
          }));
        }

        setAppStateBackendStatus("App settings and history loaded from Supabase.");
      } else if (result.ok) {
        setAppStateBackendStatus("Supabase app state ready. Local settings will sync after your next change.");
      } else {
        setAppStateBackendStatus(`Using local app state. Supabase sync unavailable: ${result.error}`);
      }

      setHasLoadedRemoteAppState(true);
    };

    loadRemoteAppState();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadRemoteClaims = async () => {
      const result = await loadClaimsFromSupabase();
      if (!isMounted) return;

      if (result.ok && result.claims.length) {
        setClaims(result.claims);
        setClaimsBackendStatus(`Loaded ${result.claims.length} claim${result.claims.length === 1 ? "" : "s"} from Supabase.`);
      } else if (result.ok) {
        setClaimsBackendStatus("Supabase connected. Local claims will sync after your next claim change.");
      } else {
        setClaimsBackendStatus(`Using local claims. Supabase sync unavailable: ${result.error}`);
      }

      setHasLoadedRemoteClaims(true);
    };

    loadRemoteClaims();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedRemoteClaims) return;

    let isMounted = true;
    const previousClaims = JSON.parse(localStorage.getItem("finalMileLastSyncedClaims") || "[]");

    const syncRemoteClaims = async () => {
      const result = await syncClaimsToSupabase({ previousClaims, nextClaims: claims });
      if (!isMounted) return;

      if (result.ok) {
        localStorage.setItem("finalMileLastSyncedClaims", JSON.stringify(claims));
        setClaimsBackendStatus("Claims synced to Supabase.");
      } else {
        setClaimsBackendStatus(`Using local claims. Supabase sync unavailable: ${result.error}`);
      }
    };

    syncRemoteClaims();
    return () => {
      isMounted = false;
    };
  }, [claims, hasLoadedRemoteClaims]);

  useEffect(() => {
    if (!hasLoadedRemoteAppState) return;

    let isMounted = true;
    const syncTimer = window.setTimeout(async () => {
      const result = await saveAppStateToSupabase({
        version: 1,
        form,
        teams,
        appSettings,
        savedScenarios,
        savedDays,
        currentWorkDate,
        globalDateRange,
      });

      if (!isMounted) return;
      if (result.ok) {
        setAppStateBackendStatus("App settings and history synced to Supabase.");
      } else {
        setAppStateBackendStatus(`Using local app state. Supabase sync unavailable: ${result.error}`);
      }
    }, 650);

    return () => {
      isMounted = false;
      window.clearTimeout(syncTimer);
    };
  }, [appSettings, currentWorkDate, form, globalDateRange, hasLoadedRemoteAppState, savedDays, savedScenarios, teams]);

  useEffect(() => {
    localStorage.setItem("finalMileSavedScenarios", JSON.stringify(savedScenarios));
  }, [savedScenarios]);

  useEffect(() => {
    localStorage.setItem("finalMileSavedDays", JSON.stringify(savedDays));
  }, [savedDays]);

  useEffect(() => {
    localStorage.setItem("finalMileCurrentWorkDate", currentWorkDate);
  }, [currentWorkDate]);

  useEffect(() => {
    const handleHistoryChange = () => {
      const nextTab = getTabFromUrl();
      setActiveTab(nextTab);
      if (nextTab === "Reports") {
        setReportsHomeSignal((current) => current + 1);
      }
    };
    if (!window.location.hash) {
      window.history.replaceState({ tab: "Dashboard" }, "", `#/${tabSlugs.Dashboard}`);
    } else {
      handleHistoryChange();
    }

    window.addEventListener("popstate", handleHistoryChange);
    window.addEventListener("hashchange", handleHistoryChange);

    return () => {
      window.removeEventListener("popstate", handleHistoryChange);
      window.removeEventListener("hashchange", handleHistoryChange);
    };
  }, []);

  const isDark = appSettings.themeMode === "dark";
  const activeAccent = accentThemes[appSettings.accentColor] || accentThemes.blue;

  const toggleThemeMode = () => {
    setAppSettings((current) => ({
      ...current,
      themeMode: current.themeMode === "dark" ? "light" : "dark",
    }));
  };

  const formatDateLabel = (value) => {
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateRangeLabel = (dateRange) =>
    dateRange.start === dateRange.end
      ? formatDateLabel(dateRange.start)
      : `${formatDateLabel(dateRange.start)} - ${formatDateLabel(dateRange.end)}`;

  const globalDateLabel = formatDateRangeLabel(globalDateRange);

  const calendarMonthLabel = calendarMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const lastOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
    const gridEnd = new Date(lastOfMonth);
    gridEnd.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay()));
    const dayCount = Math.round((gridEnd - gridStart) / (1000 * 60 * 60 * 24)) + 1;

    return Array.from({ length: dayCount }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const dateKey = getLocalDateKey(date);
      return {
        date,
        dateKey,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === calendarMonth.getMonth(),
        isToday: dateKey === getLocalDateKey(),
        isSelectedStart: dateKey === globalDateRange.start,
        isSelectedEnd: dateKey === globalDateRange.end,
        isInSelectedRange: dateKey >= globalDateRange.start && dateKey <= globalDateRange.end,
      };
    });
  }, [calendarMonth, globalDateRange.end, globalDateRange.start]);

  const pickCalendarDate = (dateKey) => {
    setLoadedSavedDay(null);
    setGlobalDateRange((current) => {
      if (current.start !== current.end) {
        return { start: dateKey, end: dateKey };
      }

      if (dateKey < current.start) {
        return { start: dateKey, end: current.start };
      }

      return { start: current.start, end: dateKey };
    });
  };

  const moveCalendarMonth = (amount) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const selectToday = () => {
    const today = getLocalDateKey();
    setLoadedSavedDay(null);
    setCalendarMonth(new Date(new Date(`${today}T00:00:00`).getFullYear(), new Date(`${today}T00:00:00`).getMonth(), 1));
    setGlobalDateRange({ start: today, end: today });
  };

  const selectThisWeek = () => {
    const todayDate = new Date();
    const start = new Date(todayDate);
    start.setDate(todayDate.getDate() - todayDate.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    setLoadedSavedDay(null);
    setCalendarMonth(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
    setGlobalDateRange({ start: getLocalDateKey(start), end: getLocalDateKey(end) });
  };


  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const results = useMemo(() => {
    const routePay = toNum(form.routePay);
    const stops = toNum(form.stops);
    const miles = toNum(form.miles);
    const mpg = Math.max(toNum(form.mpg), 0.01);
    const routeHours = Math.max(toNum(form.routeHours), 0.01);

    const totalRevenue =
      routePay +
      toNum(form.perStopPay) * stops +
      toNum(form.installPay) +
      toNum(form.accessorialPay) +
      toNum(form.fuelSurcharge) +
      toNum(form.reattemptPay);

    const fuelCost = (miles / mpg) * toNum(form.fuelPrice);
    const maintenanceCost = miles * toNum(form.maintenancePerMile);
    const laborCosts = toNum(form.driverPay) + toNum(form.helperPay);
    const fixedCosts = toNum(form.dailyTruckPayment) + toNum(form.dailyInsurance) + toNum(form.phoneSoftware);
    const variableCosts = fuelCost + maintenanceCost + laborCosts + toNum(form.tollsParking) + toNum(form.claimsChargebacks) + toNum(form.otherCosts);
    const totalCost = fixedCosts + variableCosts;
    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? netProfit / totalRevenue : 0;
    const profitPerStop = stops > 0 ? netProfit / stops : 0;
    const profitPerMile = miles > 0 ? netProfit / miles : 0;
    const profitPerHour = routeHours > 0 ? netProfit / routeHours : 0;
    const revenuePerMile = miles > 0 ? totalRevenue / miles : 0;
    const costPerMile = miles > 0 ? totalCost / miles : 0;
    const requiredRevenue = totalCost + toNum(form.targetProfit);
    const requiredPerStop = stops > 0 ? requiredRevenue / stops : 0;
    const requiredRoutePay = Math.max(requiredRevenue - (totalRevenue - routePay), 0);

    return {
      totalRevenue,
      fuelCost,
      maintenanceCost,
      laborCosts,
      fixedCosts,
      variableCosts,
      totalCost,
      netProfit,
      profitMargin,
      profitPerStop,
      profitPerMile,
      profitPerHour,
      revenuePerMile,
      costPerMile,
      requiredRevenue,
      requiredPerStop,
      requiredRoutePay,
    };
  }, [form]);

  const grade = useMemo(() => getGrade(results), [results]);

  const risks = useMemo(() => {
    const list = [];
    if (results.netProfit < 200) list.push("Net profit is low for a full route.");
    if (results.profitMargin < 0.15) list.push("Profit margin is thin. One claim or repair could wipe out the day.");
    if (results.laborCosts > results.totalRevenue * 0.35) list.push("Labor is taking more than 35% of revenue.");
    if (toNum(form.claimsChargebacks) > 100) list.push("Claims and chargebacks are eating too much margin.");
    if (results.profitPerStop < 10) list.push("Profit per stop is weak. Busy truck, sad wallet.");
    if (!list.length) list.push("Route looks healthy based on the numbers entered.");
    return list;
  }, [form, results]);

  const saveScenario = () => {
    const scenario = {
      id: crypto.randomUUID(),
      name: form.scenarioName || "Untitled Scenario",
      form: { ...form },
      results,
      grade,
      createdAt: new Date().toLocaleString(),
    };
    setSavedScenarios((current) => [scenario, ...current]);
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Ask", icon: Bot },
    { name: "Intake", icon: Upload },
    { name: "Profitability", icon: Calculator },
    { name: "Contracts", icon: BriefcaseBusiness },
    { name: "Compliance", icon: ShieldCheck },
    { name: "Claims", icon: FileText },
    { name: "Teams", icon: Users },
    { name: "Reports", icon: ClipboardCheck },
    { name: "Settings", icon: Settings },
  ];

  const navigateToTab = (tabName, options = {}) => {
    if (!tabSlugs[tabName]) return;

    setShowSavedDays(false);
    setShowDatePicker(false);

    const nextUrl = `#/${tabSlugs[tabName]}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const targetUrl = `${window.location.pathname}${window.location.search}${nextUrl}`;

    if (options.replace) {
      window.history.replaceState({ tab: tabName }, "", nextUrl);
    } else if (currentUrl !== targetUrl) {
      window.history.pushState({ tab: tabName }, "", nextUrl);
    }

    if (tabName === "Reports") {
      setReportsHomeSignal((current) => current + 1);
    }
    setActiveTab(tabName);
  };

  const getDaySnapshot = (dateRange = globalDateRange, options = {}) => {
    const claimsExposure = claims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
    const openClaims = claims.filter((claim) => claim.status !== "Closed").length;
    const photosUploaded = teams.filter((team) => team.photoStatus === "Uploaded").length;
    const teamsCount = teams.length;
    const label = formatDateRangeLabel(dateRange);
    const status =
      claimsExposure > 1000 || results.profitMargin < 0.2
        ? "Review"
        : results.profitMargin < 0.25 || openClaims > 2
          ? "Watch"
          : "Good";

    return {
      id: `${dateRange.start}-${dateRange.end}`,
      label,
      savedAt: new Date().toISOString(),
      savedBy: options.savedBy || "manual",
      dateRange: { ...dateRange },
      profit: results.netProfit,
      revenue: results.totalRevenue,
      costs: results.totalCost,
      margin: results.profitMargin,
      claimsExposure,
      openClaims,
      photosUploaded,
      teamsCount,
      escrow: 4250 + claimsExposure * 0.35,
      status,
    };
  };

  const saveCurrentDay = () => {
    const snapshot = getDaySnapshot(globalDateRange, { savedBy: "manual" });
    setSavedDays((current) => [snapshot, ...current.filter((day) => day.id !== snapshot.id)].slice(0, 12));
    setLoadedSavedDay(snapshot);
    setSavedDayFlash(true);
    window.setTimeout(() => setSavedDayFlash(false), 1600);
  };

  const saveIntakeToDay = (intakeDraft) => {
    const snapshot = {
      ...getDaySnapshot(globalDateRange, { savedBy: "intake" }),
      intake: {
        type: intakeDraft?.type || "intake",
        title: intakeDraft?.title || "Intake draft",
        summary: intakeDraft?.summary || "Saved from Intake",
        source: intakeDraft?.source || "Intake",
        savedAt: new Date().toISOString(),
      },
    };
    setSavedDays((current) => [snapshot, ...current.filter((day) => day.id !== snapshot.id)].slice(0, 12));
    setLoadedSavedDay(snapshot);
    setSavedDayFlash(true);
    window.setTimeout(() => setSavedDayFlash(false), 1600);
    return snapshot;
  };

  const rollToFreshDay = (nextDate) => {
    const nextRange = { start: nextDate, end: nextDate };
    setCurrentWorkDate(nextDate);
    setGlobalDateRange(nextRange);
    setLoadedSavedDay(null);
    setForm(defaultForm);
    setShowSavedDays(false);
    setShowDatePicker(false);
  };

  const autoSaveAndStartFreshDay = () => {
    const today = getLocalDateKey();
    if (today === currentWorkDate) return;

    const previousRange = { start: currentWorkDate, end: currentWorkDate };
    const snapshot = getDaySnapshot(previousRange, { savedBy: "auto-midnight" });
    setSavedDays((current) => [snapshot, ...current.filter((day) => day.id !== snapshot.id)].slice(0, 12));
    rollToFreshDay(today);
  };

  useEffect(() => {
    autoSaveAndStartFreshDay();
    const interval = window.setInterval(autoSaveAndStartFreshDay, 30000);
    return () => window.clearInterval(interval);
  }, [currentWorkDate, claims, teams, results]);

  const loadSavedDay = (day) => {
    setGlobalDateRange(day.dateRange);
    setLoadedSavedDay(day);
    setShowSavedDays(false);
    setShowDatePicker(false);
    navigateToTab("Dashboard");
  };

  const statusPillClass = (status) => {
    if (status === "Review") return "bg-red-500/10 text-red-600";
    if (status === "Watch") return "bg-amber-500/10 text-amber-700";
    return "bg-emerald-500/10 text-emerald-700";
  };

  const loadScenario = (scenario) => {
    setForm(scenario.form);
    navigateToTab("Profitability");
  };

  const deleteScenario = (id) => {
    const scenario = savedScenarios.find((item) => item.id === id);
    const confirmed = window.confirm(
      `Are you sure you want to delete ${scenario?.name || "this saved scenario"}? This cannot be undone.`
    );

    if (!confirmed) return;

    setSavedScenarios((current) => current.filter((item) => item.id !== id));
  };

  const exportSummary = () => {
    const summary = [
      "Final Mile Margin Summary",
      `Scenario: ${form.scenarioName}`,
      "",
      `Revenue: ${currency.format(results.totalRevenue)}`,
      `Total Cost: ${currency.format(results.totalCost)}`,
      `Net Profit: ${currency.format(results.netProfit)}`,
      `Profit Margin: ${number.format(results.profitMargin * 100)}%`,
      `Profit Per Stop: ${currency.format(results.profitPerStop)}`,
      `Profit Per Mile: ${currency.format(results.profitPerMile)}`,
      `Profit Per Hour: ${currency.format(results.profitPerHour)}`,
      `Contract Grade: ${grade.grade} - ${grade.label}`,
      "",
      "Risk Notes:",
      ...risks.map((risk) => `- ${risk}`),
    ].join("\n");

    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "final-mile-margin-summary.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const addAiClaim = (claimDraft) => {
    setClaims((current) => [
      {
        ...claimDraft,
        amount: Number(claimDraft.amount || 0),
        status: claimDraft.status || "Under Review",
      },
      ...current,
    ]);
  };

  const applyAiRouteDraft = (routeDraft) => {
    setLoadedSavedDay(null);
    localStorage.setItem("finalMileProfitabilityView", "Route Profit Check");
    setForm((current) => {
      const next = { ...current };
      Object.entries(routeDraft).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== 0) {
          next[key] = value;
        }
      });
      return next;
    });
  };

  const normalizeLoginIdentifier = (identifier) => {
    const cleaned = identifier.trim().toLowerCase();
    return usernameEmailMap[cleaned] || cleaned;
  };

  const signInWithSupabase = async ({ identifier, password }) => {
    if (!isSupabaseConfigured || !supabase) {
      return { ok: false, error: "Supabase Auth is not configured." };
    }

    const email = normalizeLoginIdentifier(identifier);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };

    setAuthUser(data.user || null);
    setIsLoggedIn(Boolean(data.user));
    return { ok: true };
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setAuthUser(null);
    setIsLoggedIn(false);
  };

  if (isAuthLoading) {
    return (
      <div className={isDark ? "flex min-h-screen items-center justify-center bg-slate-950 text-white" : "flex min-h-screen items-center justify-center bg-slate-100 text-slate-950"}>
        <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-900 p-6 text-center shadow-xl" : "rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl"}>
          <img src={isDark ? lastMileMarginLogoDark : lastMileMarginLogo} alt="Last Mile Margin" className="mx-auto h-24 w-24 object-contain" />
          <p className="mt-4 text-sm font-black">Checking your session...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginPage
        onLogin={signInWithSupabase}
        isDark={isDark}
        setAppSettings={setAppSettings}
      />
    );
  }

  return (
    <div className={isDark ? "theme-dark min-h-screen bg-slate-950 text-white" : "theme-light min-h-screen bg-slate-100 text-slate-950"}>
      <style>{`
        .theme-light main {
          background: #f1f5f9;
        }

        .theme-light .app-card {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06) !important;
          color: #0f172a !important;
        }

        .theme-dark .app-card {
          background: rgba(15, 23, 42, 0.86) !important;
          border: 1px solid rgba(255, 255, 255, 0.10) !important;
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.28) !important;
          color: #ffffff !important;
        }

        .theme-light main input,
        .theme-light main select,
        .theme-light main textarea {
          background: #f8fafc !important;
          color: #0f172a !important;
          border-color: #e2e8f0 !important;
        }

        .theme-light main input::placeholder,
        .theme-light main textarea::placeholder {
          color: #94a3b8 !important;
        }

        .theme-light main label,
        .theme-light main .text-slate-400,
        .theme-light main .text-slate-500 {
          color: #64748b !important;
        }

        .theme-light main .app-card .text-white {
          color: #0f172a !important;
        }

        .theme-light main button.bg-blue-600,
        .theme-light main button.bg-red-600,
        .theme-light main button.bg-purple-600,
        .theme-light main button.bg-emerald-600,
        .theme-light main button.bg-orange-600,
        .theme-light main button[class*="bg-blue-600"],
        .theme-light main button[class*="bg-red-600"],
        .theme-light main button[class*="bg-purple-600"],
        .theme-light main button[class*="bg-emerald-600"],
        .theme-light main button[class*="bg-orange-600"] {
          color: #ffffff !important;
        }

        .theme-light main [class*="bg-slate-950"],
        .theme-light main [class*="bg-slate-900"],
        .theme-light main [class*="bg-white/5"],
        .theme-light main [class*="bg-white/10"] {
          background: #f8fafc !important;
        }

        .theme-light main [class*="border-white/10"],
        .theme-light main [class*="border-white/5"] {
          border-color: #e2e8f0 !important;
        }

        .theme-light table thead {
          color: #64748b !important;
        }

        .theme-light table tbody tr {
          border-color: #e2e8f0 !important;
        }

        .theme-light .app-card .text-slate-200,
        .theme-light .app-card .text-slate-300 {
          color: #334155 !important;
        }


        .theme-light main {
          --app-bg: #f1f5f9;
          --card-bg: #ffffff;
          --app-border: #e2e8f0;
          --text-main: #0f172a;
          --text-muted: #64748b;
          --primary: #2563eb;
          --success: #15803d;
          --danger: #b42318;
          --warning: #b45309;
        }

        .theme-dark main {
          --app-bg: #020617;
          --card-bg: rgba(15, 23, 42, 0.86);
          --app-border: rgba(255,255,255,0.1);
          --text-main: #ffffff;
          --text-muted: #94a3b8;
          --primary: #60a5fa;
          --success: #34d399;
          --danger: #f87171;
          --warning: #fbbf24;
        }

        .theme-light main .text-purple-400,
        .theme-light main .text-purple-500,
        .theme-light main .text-purple-600 {
          color: #334155 !important;
        }

        .theme-light main .bg-purple-600,
        .theme-light main .bg-purple-500,
        .theme-light main [class*="bg-purple-600"],
        .theme-light main [class*="bg-purple-500"] {
          background: #2563eb !important;
        }

        .theme-dark main input,
        .theme-dark main select,
        .theme-dark main textarea {
          background: rgba(2, 6, 23, 0.70) !important;
          color: #ffffff !important;
          border-color: rgba(255, 255, 255, 0.10) !important;
        }
      `}</style>

      <div className="flex min-h-screen">
        <aside className={isDark ? "sticky top-0 hidden h-screen w-72 overflow-y-auto border-r border-white/10 bg-slate-950 p-5 lg:block" : "sticky top-0 hidden h-screen w-72 overflow-y-auto border-r border-slate-200 bg-white p-5 lg:block"}>
          <div className="mb-6 flex justify-center">
            <img
              src={isDark ? lastMileMarginLogoDark : lastMileMarginLogo}
              alt="Last Mile Margin"
              className="h-24 w-40 object-contain"
            />
          </div>

          <button
            onClick={toggleThemeMode}
            className={
              isDark
                ? "mb-6 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
                : "mb-6 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
            }
          >
            <span className="flex items-center gap-3">
              {isDark ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-blue-600" />}
              {isDark ? "Light Mode" : "Dark Mode"}
            </span>
            <span className={isDark ? "rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white" : "rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600"}>
              {isDark ? "On" : "Off"}
            </span>
          </button>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigateToTab(item.name);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${
                    activeTab === item.name
                      ? `${activeAccent.button} text-white`
                      : isDark
                      ? "text-slate-400 hover:bg-white/5 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </button>
              );
            })}
          </nav>

          <div className="mt-10 text-sm text-slate-500">
            <p>{appSettings.companyName}</p>
            <p>{authUser?.email || "Owner Account"}</p>
              <button onClick={signOut} className="mt-3 rounded-lg px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-500/10">Sign Out</button>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto mb-5 flex max-w-[1600px] flex-wrap items-center justify-end gap-3">
            <button
              onClick={saveCurrentDay}
              className={
                savedDayFlash
                  ? "flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm"
                  : isDark
                    ? "flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-200 hover:bg-emerald-500/15"
                    : "flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 shadow-sm hover:bg-emerald-100"
              }
            >
              <Save className="h-4 w-4" />
              {savedDayFlash ? "Snapshot Saved" : "Save Snapshot"}
            </button>

            <div className="relative">
              <button
                onClick={() => {
                  setShowSavedDays((current) => !current);
                  setShowDatePicker(false);
                }}
                className={
                  isDark
                    ? "flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white hover:bg-white/10"
                    : "flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
                }
              >
                <FileText className="h-4 w-4" />
                Daily History
                <span className={isDark ? "rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300" : "rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"}>
                  {savedDays.length}
                </span>
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>▾</span>
              </button>

              {showSavedDays && (
                <div className={isDark ? "absolute right-0 top-12 z-50 w-96 rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-2xl" : "absolute right-0 top-12 z-50 w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className={isDark ? "text-sm font-black text-white" : "text-sm font-black text-slate-950"}>Daily History</p>
                    <p className={isDark ? "text-xs font-bold text-slate-400" : "text-xs font-bold text-slate-500"}>Open a previous workday</p>
                  </div>

                  {savedDays.length === 0 ? (
                    <div className={isDark ? "rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-slate-400" : "rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500"}>
                      No daily history yet. Save a snapshot when you want an extra checkpoint for the current workday.
                    </div>
                  ) : (
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                      {savedDays.map((day) => (
                        <button
                          key={day.id}
                          onClick={() => loadSavedDay(day)}
                          className={
                            isDark
                              ? "flex w-full items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-3 text-left hover:border-blue-500/50 hover:bg-white/5"
                              : "flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-blue-300 hover:bg-blue-50"
                          }
                        >
                          <span>
                            <span className={isDark ? "block text-sm font-black text-white" : "block text-sm font-black text-slate-950"}>{day.label}</span>
                            <span className={isDark ? "mt-1 block text-xs font-semibold text-slate-400" : "mt-1 block text-xs font-semibold text-slate-500"}>
                              {currency.format(day.profit)} profit · {currency.format(day.claimsExposure)} claims
                            </span>
                          </span>
                          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${statusPillClass(day.status)}`}>
                            {day.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowDatePicker((current) => !current);
                  setShowSavedDays(false);
                  const activeDate = new Date(`${globalDateRange.start}T00:00:00`);
                  setCalendarMonth(new Date(activeDate.getFullYear(), activeDate.getMonth(), 1));
                }}
                className={
                  isDark
                    ? "flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white hover:bg-white/10"
                    : "flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
                }
              >
                <FileText className="h-4 w-4" />
                {globalDateLabel}
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>▾</span>
              </button>

              {showDatePicker && (
                <div className={isDark ? "absolute right-0 top-12 z-50 w-[19.5rem] rounded-2xl border border-white/10 bg-slate-900 p-3 shadow-2xl sm:w-[23rem]" : "absolute right-0 top-12 z-50 w-[19.5rem] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl sm:w-[23rem]"}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => moveCalendarMonth(-1)}
                      className={isDark ? "flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-base font-black text-white hover:bg-white/10" : "flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-base font-black text-slate-700 hover:bg-slate-100"}
                      aria-label="Previous month"
                    >
                      ‹
                    </button>
                    <div className="min-w-0 text-center">
                      <p className={isDark ? "text-sm font-black text-white" : "text-sm font-black text-slate-950"}>{calendarMonthLabel}</p>
                      <p className={isDark ? "mt-0.5 text-[11px] font-bold text-slate-400" : "mt-0.5 text-[11px] font-bold text-slate-500"}>{formatDateRangeLabel(globalDateRange)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => moveCalendarMonth(1)}
                      className={isDark ? "flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-base font-black text-white hover:bg-white/10" : "flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-base font-black text-slate-700 hover:bg-slate-100"}
                      aria-label="Next month"
                    >
                      ›
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
                      <div key={weekday} className={isDark ? "pb-1 text-center text-[10px] font-black uppercase text-slate-500" : "pb-1 text-center text-[10px] font-black uppercase text-slate-400"}>
                        {weekday}
                      </div>
                    ))}

                    {calendarDays.map((day) => {
                      const selectedEdge = day.isSelectedStart || day.isSelectedEnd;
                      const dayClass = selectedEdge
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                        : day.isInSelectedRange
                          ? isDark
                            ? "bg-blue-500/15 text-blue-100"
                            : "bg-blue-50 text-blue-700"
                          : day.isCurrentMonth
                            ? isDark
                              ? "text-white hover:bg-white/10"
                              : "text-slate-800 hover:bg-slate-100"
                            : isDark
                              ? "text-slate-600 hover:bg-white/5"
                              : "text-slate-300 hover:bg-slate-50";

                      return (
                        <button
                          key={day.dateKey}
                          type="button"
                          onClick={() => pickCalendarDate(day.dateKey)}
                          className={`relative flex h-8 min-w-0 items-center justify-center rounded-lg text-xs font-black transition ${dayClass}`}
                          title={formatDateLabel(day.dateKey)}
                        >
                          {day.dayNumber}
                          {day.isToday && !selectedEdge && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-blue-500" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className={isDark ? "mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3" : "mt-3 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3"}>
                    <button
                      type="button"
                      onClick={selectToday}
                      className={isDark ? "rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-black text-white hover:bg-white/10" : "rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-100"}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={selectThisWeek}
                      className={isDark ? "rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-black text-white hover:bg-white/10" : "rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-100"}
                    >
                      This Week
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(false)}
                      className="rounded-lg bg-blue-600 px-2 py-1.5 text-xs font-black text-white hover:bg-blue-500"
                    >
                      Done
                    </button>
                  </div>

                  <div className={isDark ? "mt-2 rounded-xl border border-white/10 bg-slate-950/60 p-2.5" : "mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5"}>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ["Start", globalDateRange.start],
                        ["End", globalDateRange.end],
                      ].map(([label, value]) => (
                        <label key={label} className="block">
                          <span className={isDark ? "mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500" : "mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400"}>{label}</span>
                          <input
                            type="date"
                            value={value}
                            onChange={(event) => {
                              setLoadedSavedDay(null);
                              setGlobalDateRange((current) => {
                                const next = label === "Start" ? { ...current, start: event.target.value } : { ...current, end: event.target.value };
                                return next.start <= next.end ? next : { start: next.end, end: next.start };
                              });
                              const activeDate = new Date(`${event.target.value}T00:00:00`);
                              setCalendarMonth(new Date(activeDate.getFullYear(), activeDate.getMonth(), 1));
                            }}
                            className={isDark ? "w-full rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1 text-[11px] font-bold text-white outline-none focus:border-blue-500" : "w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-950 outline-none focus:border-blue-500"}
                          />
                        </label>
                      ))}
                    </div>
                    <p className={isDark ? "mt-1.5 text-[11px] font-semibold text-slate-500" : "mt-1.5 text-[11px] font-semibold text-slate-500"}>
                      Click once for a day. Click a second date to make a range.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1600px]">
            {activeTab === "Dashboard" ? (
              <DashboardHome teams={teams} claims={claims} setActiveTab={navigateToTab} isDark={isDark} appSettings={appSettings} savedDaySnapshot={loadedSavedDay} />
            ) : activeTab === "Intake" ? (
              <AiQuickIntake
                teams={teams}
                claims={claims}
                isDark={isDark}
                appSettings={appSettings}
                onAddClaim={addAiClaim}
                onApplyRoute={applyAiRouteDraft}
                onSaveToDay={saveIntakeToDay}
                navigateToTab={navigateToTab}
                standalone
              />
            ) : activeTab === "Contracts" ? (
              <ContractsDashboard teams={teams} claims={claims} isDark={isDark} navigateToTab={navigateToTab} />
            ) : activeTab === "Compliance" ? (
              <ComplianceDashboard teams={teams} claims={claims} isDark={isDark} />
            ) : activeTab === "Claims" ? (
              <ClaimsDashboard claims={claims} setClaims={setClaims} teams={teams} isDark={isDark} appSettings={appSettings} backendStatus={claimsBackendStatus} />
            ) : activeTab === "Teams" ? (
              <TeamsDashboard teams={teams} setTeams={setTeams} claims={claims} />
            ) : activeTab === "Reports" ? (
              <ReportsDashboard claims={claims} teams={teams} results={results} form={form} isDark={isDark} exportSummary={exportSummary} reportsHomeSignal={reportsHomeSignal} />
            ) : activeTab === "Ask" ? (
              <AskBusinessDashboard
                claims={claims}
                teams={teams}
                results={results}
                form={form}
                savedDays={savedDays}
                appSettings={appSettings}
                isDark={isDark}
                navigateToTab={navigateToTab}
              />
            ) : activeTab === "Settings" ? (
              <SettingsDashboard
                appSettings={appSettings}
                setAppSettings={setAppSettings}
                appStateBackendStatus={appStateBackendStatus}
                claimsBackendStatus={claimsBackendStatus}
              />
            ) : activeTab === "Profitability" ? (
              <ProfitabilityDashboard
                form={form}
                update={update}
                results={results}
                grade={grade}
                risks={risks}
                savedScenarios={savedScenarios}
                saveScenario={saveScenario}
                loadScenario={loadScenario}
                deleteScenario={deleteScenario}
                exportSummary={exportSummary}
                resetForm={() => setForm(defaultForm)}
                isDark={isDark}
                appSettings={appSettings}
              />
            ) : (
              <DashboardHome teams={teams} claims={claims} setActiveTab={navigateToTab} isDark={isDark} appSettings={appSettings} savedDaySnapshot={loadedSavedDay} />
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
