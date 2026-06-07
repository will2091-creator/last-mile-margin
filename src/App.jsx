import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import lastMileMarginLogo from "./assets/last-mile-margin-logo-transparent.svg";
import lastMileMarginLogoDark from "./assets/last-mile-margin-logo-transparent-dark.svg";
import LoginPage from "./pages/LoginPage";
import DashboardHome from "./pages/DashboardHome";
import SettingsDashboard from "./pages/SettingsDashboard";
import OperationsDashboard from "./pages/OperationsDashboard";
import FinanceDashboard from "./pages/FinanceDashboard";
import ReportsDashboard from "./pages/ReportsDashboard";
import AskBusinessDashboard from "./pages/AskBusinessDashboard";
import AiQuickIntake from "./components/AiQuickIntake";
import BusinessWorkflowRail from "./components/BusinessWorkflowRail";
import DemoCompletionModal from "./components/DemoCompletionModal";
import GuidedDemoTour from "./components/GuidedDemoTour";
import ProductTour from "./components/ProductTour";
import SyncConfidencePanel from "./components/SyncConfidencePanel";
import { navPreviewContent } from "./components/guidedDemoContent";
import AppSidebar from "./components/app/AppSidebar";
import DemoBanner from "./components/app/DemoBanner";
import AppToolbar from "./components/app/AppToolbar";
import AppBottomNav from "./components/app/AppBottomNav";
import { loadAppStateFromSupabase, saveAppStateToSupabase } from "./lib/appStateRepository";
import { loadClaimsFromSupabase, syncClaimsToSupabase } from "./lib/claimsRepository";
import {
  clearDemoWorkspaceData,
  demoStorageKeys,
  getDemoWorkspaceData,
  isDemoModeActive,
  seedDemoWorkspace,
  setDemoModeActive,
} from "./lib/demoWorkspace";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient";
import { addTeamMember, loadTeamAccess, updateTeamMemberRole } from "./lib/teamAccessRepository";
import { emptyTourStatus, markProductTourCompleted, markProductTourProgress, markProductTourSkipped, readProductTourStatus, resetProductTourStatus } from "./lib/tourStorage";
import { getSetupStatus } from "./lib/onboarding";
import {
  accentThemes,
  Bot,
  BriefcaseBusiness,
  Calculator,
  Camera,
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

const usernameEmailMap = {
  "william.mckoy": "william.mckoy2@gmail.com",
};

const tabSlugs = {
  Dashboard: "dashboard",
  Intake: "intake",
  Operations: "operations",
  Finance: "finance",
  Profitability: "profitability",
  Receipts: "receipts",
  Contracts: "contracts",
  Compliance: "compliance",
  Claims: "claims",
  Teams: "teams",
  Reports: "reports",
  Ask: "ask",
  Settings: "settings",
};

const tabBySlug = Object.fromEntries(Object.entries(tabSlugs).map(([tab, slug]) => [slug, tab]));

const groupedTabs = {
  Claims: ["Operations", "Claims"],
  Teams: ["Operations", "Teams"],
  Compliance: ["Operations", "Compliance"],
  Dispatch: ["Operations", "Dispatch"],
  Profitability: ["Finance", "Profitability"],
  Receipts: ["Finance", "Receipts"],
  Contracts: ["Finance", "Contracts"],
};

const normalizeTopTab = (tab) => groupedTabs[tab]?.[0] || tab;

const roleAccess = {
  owner: ["Dashboard", "Ask", "Intake", "Operations", "Finance", "Reports", "Settings"],
  admin: ["Dashboard", "Ask", "Intake", "Operations", "Finance", "Reports", "Settings"],
  dispatcher: ["Dashboard", "Ask", "Intake", "Operations", "Reports"],
  driver: ["Dashboard", "Intake"],
};

const roleLabels = {
  owner: "Owner",
  admin: "Admin",
  dispatcher: "Dispatcher",
  driver: "Driver",
};

const getAllowedTabsForRole = (role) => roleAccess[role] || roleAccess.driver;

const canAccessTab = (role, tabName) => getAllowedTabsForRole(role).includes(normalizeTopTab(tabName));

const getHashSlug = () => window.location.hash.replace(/^#\/?/, "").toLowerCase();

const getTabFromUrl = () => {
  const slug = getHashSlug();
  return tabBySlug[slug] || "Dashboard";
};

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const blankDemoForm = {
  ...defaultForm,
  scenarioName: "",
  routePay: 0,
  perStopPay: 0,
  stops: 0,
  installPay: 0,
  accessorialPay: 0,
  fuelSurcharge: 0,
  reattemptPay: 0,
  miles: 0,
  mpg: 0,
  fuelPrice: 0,
  routeHours: 0,
  driverPay: 0,
  helperPay: 0,
  tollsParking: 0,
  dailyTruckPayment: 0,
  dailyInsurance: 0,
  maintenancePerMile: 0,
  phoneSoftware: 0,
  claimsChargebacks: 0,
  otherCosts: 0,
  targetProfit: 0,
  claimsPerWeek: 0,
  averageClaimAmount: 0,
  routesPerWeek: 0,
  escrowPerWeek: 0,
  routeType: "",
  vehicleType: "",
};

const blankDemoSettings = {
  ...defaultSettings,
  companyName: "New Demo Company",
  profitabilityBenchmarks: {
    ...defaultSettings.profitabilityBenchmarks,
    enabled: false,
  },
};

const blankDemoStorageKeys = [
  "finalMileBlankDemoRollupRows",
  "finalMileBlankDemoContracts",
  "finalMileBlankDemoOnboardingImports",
  "finalMileBlankDemoSetupWizard",
  "finalMileBlankDemoUploadedReceipts",
  "finalMileBlankDemoRouteProfitContractId",
];

const resetBlankDemoStorage = () => {
  if (typeof window === "undefined") return;
  blankDemoStorageKeys.forEach((key) => localStorage.removeItem(key));
};

let hasResetBlankDemoStorageOnStartup = false;

export default function App() {
  if (
    typeof window !== "undefined" &&
    !hasResetBlankDemoStorageOnStartup &&
    sessionStorage.getItem("finalMileBlankDemo") === "true"
  ) {
    hasResetBlankDemoStorageOnStartup = true;
    resetBlankDemoStorage();
  }

  const loadFromLocalStorage = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
      console.warn(`Could not load ${key} from localStorage`, error);
      return fallback;
    }
  };

  const [isDemoBannerDismissed, setIsDemoBannerDismissed] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(() => isDemoModeActive());
  const [isDemoWorkspace, setIsDemoWorkspace] = useState(() =>
    sessionStorage.getItem("finalMileBlankDemo") === "true" || isDemoModeActive()
  );
  const isBlankDemoWorkspace = isDemoWorkspace && !isDemoMode;
  const [form, setForm] = useState(() => {
    if (isDemoMode) {
      const demo = seedDemoWorkspace();
      return loadFromLocalStorage(demoStorageKeys.form, demo.form);
    }
    return isDemoWorkspace ? blankDemoForm : defaultForm;
  });
  const [savedScenarios, setSavedScenarios] = useState(() =>
    isDemoMode
      ? loadFromLocalStorage(demoStorageKeys.savedScenarios, seedDemoWorkspace().savedScenarios)
      : loadFromLocalStorage("finalMileSavedScenarios", [])
  );
  const initialUrlTab = getTabFromUrl();
  const [activeTab, setActiveTab] = useState(() => normalizeTopTab(initialUrlTab));
  const [activeOperationsTab, setActiveOperationsTab] = useState(() => groupedTabs[initialUrlTab]?.[0] === "Operations" ? groupedTabs[initialUrlTab][1] : "Dispatch");
  const [activeFinanceTab, setActiveFinanceTab] = useState(() => groupedTabs[initialUrlTab]?.[0] === "Finance" ? groupedTabs[initialUrlTab][1] : "Profitability");
  const [reportsHomeSignal, setReportsHomeSignal] = useState(0);
  const [isProductTourOpen, setIsProductTourOpen] = useState(false);
  const [isGuidedDemoOpen, setIsGuidedDemoOpen] = useState(false);
  const [isDemoCompletionOpen, setIsDemoCompletionOpen] = useState(false);
  const [tourInitialStepIndex, setTourInitialStepIndex] = useState(() => readProductTourStatus().tourStepIndex || 0);
  const [hasAutoStartedBlankDemoTour, setHasAutoStartedBlankDemoTour] = useState(false);
  const [productTourStatus, setProductTourStatus] = useState(readProductTourStatus);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSavedDays, setShowSavedDays] = useState(false);
  const [savedDayFlash, setSavedDayFlash] = useState(false);
  const [savedDays, setSavedDays] = useState(() =>
    isDemoMode
      ? loadFromLocalStorage(demoStorageKeys.savedDays, seedDemoWorkspace().savedDays)
      : isDemoWorkspace ? [] : loadFromLocalStorage("finalMileSavedDays", [])
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
    isDemoMode
      ? loadFromLocalStorage(demoStorageKeys.claims, seedDemoWorkspace().claims)
      : isDemoWorkspace ? [] : loadFromLocalStorage("finalMileClaims", initialClaims)
  );
  const [claimsBackendStatus, setClaimsBackendStatus] = useState("Local claims ready.");
  const [hasLoadedRemoteClaims, setHasLoadedRemoteClaims] = useState(false);
  const [appStateBackendStatus, setAppStateBackendStatus] = useState("Local app state ready.");
  const [hasLoadedRemoteAppState, setHasLoadedRemoteAppState] = useState(false);
  const [teams, setTeams] = useState(() =>
    isDemoMode
      ? loadFromLocalStorage(demoStorageKeys.teams, seedDemoWorkspace().teams)
      : isDemoWorkspace ? [] : loadFromLocalStorage("finalMileTeams", initialTeams)
  );
  const [appSettings, setAppSettings] = useState(() => {
    if (isDemoMode) {
      const demoSettings = loadFromLocalStorage(demoStorageKeys.settings, seedDemoWorkspace().settings);
      return {
        ...defaultSettings,
        ...demoSettings,
        dashboardWidgets: {
          ...defaultSettings.dashboardWidgets,
          ...(demoSettings.dashboardWidgets || {}),
        },
        dashboardWidgetOrder: [
          ...new Set([
            ...(demoSettings.dashboardWidgetOrder || []),
            ...(defaultSettings.dashboardWidgetOrder || Object.keys(defaultSettings.dashboardWidgets)),
          ]),
        ].filter((key) => Object.prototype.hasOwnProperty.call(defaultSettings.dashboardWidgets, key)),
        claimRiskThresholds: {
          ...defaultSettings.claimRiskThresholds,
          ...(demoSettings.claimRiskThresholds || {}),
        },
        profitabilityBenchmarks: {
          ...defaultSettings.profitabilityBenchmarks,
          ...(demoSettings.profitabilityBenchmarks || {}),
        },
      };
    }
    if (isDemoWorkspace) return blankDemoSettings;
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
      profitabilityBenchmarks: {
        ...defaultSettings.profitabilityBenchmarks,
        ...(savedSettings.profitabilityBenchmarks || {}),
      },
    };
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    isDemoWorkspace || localStorage.getItem("finalMileLoggedIn") === "true"
  );
  const [authUser, setAuthUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseConfigured && !isDemoWorkspace);
  const [teamMembers, setTeamMembers] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState("owner");
  const [teamAccessStatus, setTeamAccessStatus] = useState("Team access will load after sign in.");

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem(demoStorageKeys.settings, JSON.stringify(appSettings));
      return;
    }
    if (isDemoWorkspace) return;
    localStorage.setItem("finalMileSettings", JSON.stringify(appSettings));
  }, [appSettings, isDemoMode, isDemoWorkspace]);

  useEffect(() => {
    if (!isDemoMode) return;
    localStorage.setItem(demoStorageKeys.form, JSON.stringify(form));
  }, [form, isDemoMode]);

  useEffect(() => {
    if (isDemoWorkspace) return;
    localStorage.setItem("finalMileLoggedIn", String(isLoggedIn));
  }, [isDemoWorkspace, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || isDemoMode || activeTab !== "Dashboard") return;
    if (isProductTourOpen || isGuidedDemoOpen || hasAutoStartedBlankDemoTour) return;
    const contractKey = isBlankDemoWorkspace ? "finalMileBlankDemoRollupRows" : "finalMileRollupRows";
    const importKey = isBlankDemoWorkspace ? "finalMileBlankDemoOnboardingImports" : "finalMileOnboardingImports";
    const hasStoredContracts = loadFromLocalStorage(contractKey, []).length > 0;
    const hasStoredImports = loadFromLocalStorage(importKey, []).length > 0;
    const isEmptyWorkspace =
      teams.length === 0 &&
      claims.length === 0 &&
      savedDays.length === 0 &&
      savedScenarios.length === 0 &&
      !hasStoredContracts &&
      !hasStoredImports;
    if (!isEmptyWorkspace) return;
    setHasAutoStartedBlankDemoTour(true);
    const tourTimer = window.setTimeout(() => {
      setTourInitialStepIndex(readProductTourStatus().tourStepIndex || 0);
      setIsProductTourOpen(true);
    }, 450);
    return () => window.clearTimeout(tourTimer);
  }, [activeTab, claims.length, hasAutoStartedBlankDemoTour, isBlankDemoWorkspace, isDemoMode, isGuidedDemoOpen, isLoggedIn, isProductTourOpen, savedDays.length, savedScenarios.length, teams.length]);

  const refreshTeamAccess = async () => {
    const result = await loadTeamAccess();
    if (result.ok) {
      setTeamMembers(result.members);
      setCurrentUserRole(result.currentRole);
      setTeamAccessStatus("Team access synced to Supabase.");
    } else {
      setTeamAccessStatus(`Team access unavailable: ${result.error}`);
    }

    return result;
  };

  useEffect(() => {
    if (isDemoWorkspace) return;
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
  }, [isDemoWorkspace]);

  useEffect(() => {
    if (isDemoWorkspace) {
      setTeamMembers([]);
      setCurrentUserRole("owner");
      setTeamAccessStatus(isDemoMode ? "Viewing Demo Workspace. Team access is demo-only." : "Blank demo workspace. No team users have been added.");
      return;
    }
    if (!authUser) {
      setTeamMembers([]);
      setCurrentUserRole("owner");
      setTeamAccessStatus("Team access will load after sign in.");
      return;
    }

    let isMounted = true;
    const loadAccess = async () => {
      const result = await loadTeamAccess();
      if (!isMounted) return;

      if (result.ok) {
        setTeamMembers(result.members);
        setCurrentUserRole(result.currentRole);
        setTeamAccessStatus("Team access synced to Supabase.");
      } else {
        setTeamAccessStatus(`Team access unavailable: ${result.error}`);
      }
    };

    loadAccess();
    return () => {
      isMounted = false;
    };
  }, [authUser, isDemoMode, isDemoWorkspace]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem(demoStorageKeys.teams, JSON.stringify(teams));
      return;
    }
    if (isDemoWorkspace) return;
    localStorage.setItem("finalMileTeams", JSON.stringify(teams));
  }, [isDemoMode, isDemoWorkspace, teams]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem(demoStorageKeys.claims, JSON.stringify(claims));
      return;
    }
    if (isDemoWorkspace) return;
    localStorage.setItem("finalMileClaims", JSON.stringify(claims));
  }, [claims, isDemoMode, isDemoWorkspace]);

  useEffect(() => {
    if (isDemoWorkspace) {
      setAppStateBackendStatus(isDemoMode ? "Viewing Demo Workspace. Supabase sync is off." : "Blank demo workspace. Supabase sync is off.");
      setHasLoadedRemoteAppState(true);
      return;
    }
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
            profitabilityBenchmarks: {
              ...defaultSettings.profitabilityBenchmarks,
              ...(remoteState.appSettings.profitabilityBenchmarks || {}),
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
  }, [isDemoMode, isDemoWorkspace]);

  useEffect(() => {
    if (isDemoWorkspace) {
      setClaimsBackendStatus(isDemoMode ? "Viewing Demo Workspace. Claims are demo-only." : "Blank demo workspace. No claims entered yet.");
      setHasLoadedRemoteClaims(true);
      return;
    }
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
  }, [isDemoMode, isDemoWorkspace]);

  useEffect(() => {
    if (isDemoWorkspace) return;
    if (!hasLoadedRemoteClaims) return;

    let isMounted = true;
    const previousClaims = JSON.parse(localStorage.getItem("finalMileLastSyncedClaims") || "[]");

    const syncRemoteClaims = async () => {
      setClaimsBackendStatus("Saving claims to Supabase...");
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
  }, [claims, hasLoadedRemoteClaims, isDemoWorkspace]);

  useEffect(() => {
    if (isDemoWorkspace) return;
    if (!hasLoadedRemoteAppState) return;

    let isMounted = true;
    const syncTimer = window.setTimeout(async () => {
      setAppStateBackendStatus("Saving workspace to Supabase...");
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
  }, [appSettings, currentWorkDate, form, globalDateRange, hasLoadedRemoteAppState, isDemoWorkspace, savedDays, savedScenarios, teams]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem(demoStorageKeys.savedScenarios, JSON.stringify(savedScenarios));
      return;
    }
    if (isDemoWorkspace) return;
    localStorage.setItem("finalMileSavedScenarios", JSON.stringify(savedScenarios));
  }, [isDemoMode, isDemoWorkspace, savedScenarios]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem(demoStorageKeys.savedDays, JSON.stringify(savedDays));
      return;
    }
    if (isDemoWorkspace) return;
    localStorage.setItem("finalMileSavedDays", JSON.stringify(savedDays));
  }, [isDemoMode, isDemoWorkspace, savedDays]);

  useEffect(() => {
    if (isDemoWorkspace) return;
    localStorage.setItem("finalMileCurrentWorkDate", currentWorkDate);
  }, [currentWorkDate, isDemoWorkspace]);

  useEffect(() => {
    const handleHistoryChange = () => {
      const slug = getHashSlug();
      if (slug && !tabBySlug[slug]) {
        window.history.replaceState({ tab: "Dashboard" }, "", `#/${tabSlugs.Dashboard}`);
      }

      const nextTab = getTabFromUrl();
      if (!canAccessTab(currentUserRole, nextTab)) {
        const fallbackTab = getAllowedTabsForRole(currentUserRole)[0] || "Dashboard";
        window.history.replaceState({ tab: fallbackTab }, "", `#/${tabSlugs[fallbackTab]}`);
        setActiveTab(fallbackTab);
        return;
      }
      if (groupedTabs[nextTab]?.[0] === "Operations") setActiveOperationsTab(groupedTabs[nextTab][1]);
      if (groupedTabs[nextTab]?.[0] === "Finance") setActiveFinanceTab(groupedTabs[nextTab][1]);
      const nextTopTab = normalizeTopTab(nextTab);
      setActiveTab(nextTopTab);
      if (nextTopTab === "Reports") {
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
  }, [currentUserRole]);

  const isDark = appSettings.themeMode === "dark";
  const activeAccent = accentThemes[appSettings.accentColor] || accentThemes.blue;
  const ownerName = (() => {
    const local = (authUser?.email || "").split("@")[0] || "";
    const first = local.split(/[._-]/)[0] || "";
    return first ? first.charAt(0).toUpperCase() + first.slice(1) : "";
  })();

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

  const workflowSetupStatus = useMemo(
    () => getSetupStatus({
      teams,
      claims,
      savedScenarios,
      savedDays,
      appSettings,
      isBlankDemo: isBlankDemoWorkspace,
      isDemoMode,
    }),
    [teams, claims, savedScenarios, savedDays, appSettings, isBlankDemoWorkspace, isDemoMode]
  );

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
    setAppStateBackendStatus(isDemoMode ? "Demo scenario saved locally." : "Scenario saved locally. Supabase sync queued.");
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Intake", icon: Upload },
    { name: "Operations", icon: BriefcaseBusiness },
    { name: "Finance", icon: Calculator },
    { name: "Reports", icon: ClipboardCheck },
    { name: "Ask", icon: Bot },
    { name: "Settings", icon: Settings },
  ];
  const allowedTabs = getAllowedTabsForRole(currentUserRole);
  const visibleNavItems = navItems.filter((item) => allowedTabs.includes(item.name));
  const defaultAllowedTab = allowedTabs[0] || "Dashboard";
  const canManageBusiness = currentUserRole === "owner" || currentUserRole === "admin";

  const navigateToTab = (tabName, options = {}) => {
    if (groupedTabs[tabName]?.[0] === "Operations") {
      setActiveOperationsTab(groupedTabs[tabName][1]);
      tabName = "Operations";
    }

    if (groupedTabs[tabName]?.[0] === "Finance") {
      setActiveFinanceTab(groupedTabs[tabName][1]);
      tabName = "Finance";
    }

    if (!tabSlugs[tabName]) return;
    if (!canAccessTab(currentUserRole, tabName)) {
      tabName = defaultAllowedTab;
    }

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

  const startProductTour = () => {
    const nextStatus = productTourStatus.hasCompletedTour ? resetProductTourStatus() : readProductTourStatus();
    if (productTourStatus.hasCompletedTour) {
      setProductTourStatus(nextStatus);
    }
    setTourInitialStepIndex(nextStatus.tourStepIndex || 0);
    setIsGuidedDemoOpen(false);
    setIsDemoCompletionOpen(false);
    if (isBlankDemoWorkspace || isDemoMode) {
      loadDemoWorkspace({ reset: true, startTour: true });
      return;
    }
    navigateToTab("Dashboard");
    window.setTimeout(() => setIsProductTourOpen(true), 120);
  };

  const finishProductTour = () => {
    setProductTourStatus(markProductTourCompleted());
    setIsProductTourOpen(false);
    clearCompletedDemoWorkspace();
    setIsDemoCompletionOpen(true);
  };

  const skipProductTour = () => {
    setProductTourStatus(markProductTourSkipped());
    setIsProductTourOpen(false);
  };

  const handleProductTourStepChange = useCallback((stepIndex, stepId) => {
    markProductTourProgress(stepIndex, stepId);
  }, []);

  const clearCompletedDemoWorkspace = () => {
    if (!isDemoWorkspace) return;
    clearDemoWorkspaceData();
    resetBlankDemoStorage();
    sessionStorage.removeItem("finalMileBlankDemo");
    setDemoModeActive(false);
    setIsDemoMode(false);
    setIsDemoWorkspace(false);
    setForm(defaultForm);
    setSavedScenarios(loadFromLocalStorage("finalMileSavedScenarios", []));
    setSavedDays(loadFromLocalStorage("finalMileSavedDays", []));
    setLoadedSavedDay(null);
    setClaims(loadFromLocalStorage("finalMileClaims", initialClaims));
    setTeams(loadFromLocalStorage("finalMileTeams", initialTeams));
    const savedSettings = loadFromLocalStorage("finalMileSettings", defaultSettings);
    setAppSettings({
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
      profitabilityBenchmarks: {
        ...defaultSettings.profitabilityBenchmarks,
        ...(savedSettings.profitabilityBenchmarks || {}),
      },
    });
    setClaimsBackendStatus("Demo complete. Sample claims were cleared.");
    setAppStateBackendStatus("Demo complete. Sample data was cleared.");
    setActiveTab("Dashboard");
    setActiveOperationsTab("Dispatch");
    setActiveFinanceTab("Profitability");
    setShowSavedDays(false);
    setShowDatePicker(false);
    window.history.replaceState({ tab: "Dashboard" }, "", `#/${tabSlugs.Dashboard}`);
  };

  const loadDemoWorkspace = ({ reset = false, startTour = false, startGuidedDemo = false, resetTour = false } = {}) => {
    let nextTourStatus = readProductTourStatus();
    if (resetTour) {
      nextTourStatus = resetProductTourStatus();
      setProductTourStatus(nextTourStatus);
    }
    const resumeStepIndex = nextTourStatus.tourStepIndex || 0;
    const demo = seedDemoWorkspace({ reset });
    sessionStorage.removeItem("finalMileBlankDemo");
    setDemoModeActive(true);
    setIsDemoWorkspace(true);
    setIsDemoMode(true);
    setAuthUser(null);
    setIsLoggedIn(true);
    setIsAuthLoading(false);
    setCurrentUserRole("owner");
    setTeamMembers([]);
    setTeamAccessStatus("Viewing Demo Workspace. Team access is demo-only.");
    setForm(demo.form);
    setSavedScenarios(demo.savedScenarios);
    setSavedDays(demo.savedDays);
    setLoadedSavedDay(null);
    setClaims(demo.claims);
    setTeams(demo.teams);
    setAppSettings(demo.settings);
    setClaimsBackendStatus("Viewing Demo Workspace. Claims are demo-only.");
    setAppStateBackendStatus("Viewing Demo Workspace. Supabase sync is off.");
    setHasLoadedRemoteClaims(true);
    setHasLoadedRemoteAppState(true);
    setActiveTab("Dashboard");
    setActiveOperationsTab("Dispatch");
    setActiveFinanceTab("Profitability");
    setShowSavedDays(false);
    setShowDatePicker(false);
    setIsProductTourOpen(false);
    setIsGuidedDemoOpen(false);
    setIsDemoCompletionOpen(false);
    window.history.replaceState({ tab: "Dashboard" }, "", `#/${tabSlugs.Dashboard}`);
    if (startTour) {
      setTourInitialStepIndex(resumeStepIndex);
      window.setTimeout(() => setIsProductTourOpen(true), 180);
    }
    if (startGuidedDemo) {
      setTourInitialStepIndex(resumeStepIndex);
      window.setTimeout(() => setIsGuidedDemoOpen(true), 220);
    }
  };

  const exitDemoWorkspace = () => {
    setDemoModeActive(false);
    setIsDemoMode(false);
    setIsDemoWorkspace(false);
    setIsProductTourOpen(false);
    setIsGuidedDemoOpen(false);
    setIsDemoCompletionOpen(false);
    setForm(defaultForm);
    setSavedScenarios(loadFromLocalStorage("finalMileSavedScenarios", []));
    setSavedDays(loadFromLocalStorage("finalMileSavedDays", []));
    setLoadedSavedDay(null);
    setClaims(loadFromLocalStorage("finalMileClaims", initialClaims));
    setTeams(loadFromLocalStorage("finalMileTeams", initialTeams));
    const savedSettings = loadFromLocalStorage("finalMileSettings", defaultSettings);
    setAppSettings({
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
      profitabilityBenchmarks: {
        ...defaultSettings.profitabilityBenchmarks,
        ...(savedSettings.profitabilityBenchmarks || {}),
      },
    });
    setClaimsBackendStatus("Local claims ready.");
    setAppStateBackendStatus("Local app state ready.");
    setActiveTab("Dashboard");
    window.history.replaceState({ tab: "Dashboard" }, "", `#/${tabSlugs.Dashboard}`);
  };

  const turnOffDemoAndTour = () => {
    clearDemoWorkspaceData();
    resetBlankDemoStorage();
    sessionStorage.removeItem("finalMileBlankDemo");
    setDemoModeActive(false);
    setIsDemoMode(false);
    setIsDemoWorkspace(false);
    setIsProductTourOpen(false);
    setIsGuidedDemoOpen(false);
    setIsDemoCompletionOpen(false);
    setProductTourStatus(markProductTourCompleted());
    setForm(defaultForm);
    setSavedScenarios(loadFromLocalStorage("finalMileSavedScenarios", []));
    setSavedDays(loadFromLocalStorage("finalMileSavedDays", []));
    setLoadedSavedDay(null);
    setClaims(loadFromLocalStorage("finalMileClaims", initialClaims));
    setTeams(loadFromLocalStorage("finalMileTeams", initialTeams));
    const savedSettings = loadFromLocalStorage("finalMileSettings", defaultSettings);
    setAppSettings({
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
      profitabilityBenchmarks: {
        ...defaultSettings.profitabilityBenchmarks,
        ...(savedSettings.profitabilityBenchmarks || {}),
      },
    });
    setClaimsBackendStatus("Demo and tour are turned off.");
    setAppStateBackendStatus("Demo and tour are turned off.");
    setHasAutoStartedBlankDemoTour(true);
    setActiveTab("Dashboard");
    setActiveOperationsTab("Dispatch");
    setActiveFinanceTab("Profitability");
    setShowSavedDays(false);
    setShowDatePicker(false);
    window.history.replaceState({ tab: "Dashboard" }, "", `#/${tabSlugs.Dashboard}`);
  };

  const resetDemoWorkspace = () => {
    loadDemoWorkspace({ reset: true, resetTour: true });
  };

  const restartGuidedDemo = () => {
    loadDemoWorkspace({ reset: true, startGuidedDemo: true, resetTour: true });
  };

  const startInteractiveDemo = () => {
    const nextStatus = productTourStatus.hasCompletedTour ? resetProductTourStatus() : readProductTourStatus();
    if (productTourStatus.hasCompletedTour) {
      setProductTourStatus(nextStatus);
    }
    setTourInitialStepIndex(nextStatus.tourStepIndex || 0);
    setIsProductTourOpen(false);
    setIsDemoCompletionOpen(false);
    loadDemoWorkspace({ reset: true, startGuidedDemo: true });
  };

  const closeGuidedDemo = () => {
    setProductTourStatus(markProductTourSkipped());
    setIsGuidedDemoOpen(false);
  };

  const completeGuidedDemo = () => {
    setProductTourStatus(markProductTourCompleted());
    setIsGuidedDemoOpen(false);
    clearCompletedDemoWorkspace();
    setIsDemoCompletionOpen(true);
    navigateToTab("Dashboard");
  };

  const closeDemoCompletion = () => {
    setIsDemoCompletionOpen(false);
    navigateToTab("Dashboard");
  };

  const restartDemoFromCompletion = () => {
    setIsDemoCompletionOpen(false);
    restartGuidedDemo();
  };

  useEffect(() => {
    if (!isLoggedIn || canAccessTab(currentUserRole, activeTab)) return;
    navigateToTab(defaultAllowedTab, { replace: true });
  }, [activeTab, currentUserRole, defaultAllowedTab, isLoggedIn]);

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
    setAppStateBackendStatus(isDemoMode ? "Demo snapshot saved locally." : "Snapshot saved locally. Supabase sync queued.");
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
    const cleanIdentifier = String(identifier || "").trim().toLowerCase();
    if (cleanIdentifier === "demo123" && password === "demo1234") {
      if (supabase) await supabase.auth.signOut();
      resetBlankDemoStorage();
      resetProductTourStatus();
      sessionStorage.setItem("finalMileBlankDemo", "true");
      setDemoModeActive(false);
      setIsDemoMode(false);
      setIsDemoWorkspace(true);
      setAuthUser(null);
      setIsLoggedIn(true);
      setIsAuthLoading(false);
      setCurrentUserRole("owner");
      setTeamMembers([]);
      setTeamAccessStatus("Blank demo workspace. No team users have been added.");
      setForm(blankDemoForm);
      setSavedScenarios([]);
      setSavedDays([]);
      setLoadedSavedDay(null);
      setClaims([]);
      setTeams([]);
      setAppSettings(blankDemoSettings);
      setClaimsBackendStatus("Blank demo workspace. No claims entered yet.");
      setAppStateBackendStatus("Blank demo workspace. Supabase sync is off.");
      setHasLoadedRemoteClaims(true);
      setHasLoadedRemoteAppState(true);
      setActiveTab("Dashboard");
      setActiveOperationsTab("Dispatch");
      setActiveFinanceTab("Profitability");
      setProductTourStatus(emptyTourStatus);
      setIsProductTourOpen(false);
      setIsDemoCompletionOpen(false);
      setHasAutoStartedBlankDemoTour(false);
      window.history.replaceState({ tab: "Dashboard" }, "", `#/${tabSlugs.Dashboard}`);
      return { ok: true };
    }

    if (!isSupabaseConfigured || !supabase) {
      return { ok: false, error: "Supabase Auth is not configured." };
    }

    sessionStorage.removeItem("finalMileBlankDemo");
    setDemoModeActive(false);
    setIsDemoMode(false);
    setIsDemoWorkspace(false);
    const email = normalizeLoginIdentifier(identifier);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };

    setAuthUser(data.user || null);
    setIsLoggedIn(Boolean(data.user));
    return { ok: true };
  };

  const signOut = async () => {
    sessionStorage.removeItem("finalMileBlankDemo");
    setDemoModeActive(false);
    setIsDemoMode(false);
    setIsDemoWorkspace(false);
    setIsProductTourOpen(false);
    setHasAutoStartedBlankDemoTour(false);
    if (supabase) {
      await supabase.auth.signOut();
    }
    setAuthUser(null);
    setIsLoggedIn(false);
  };

  const inviteTeamMember = async ({ email, role }) => {
    const result = await addTeamMember({ email, role });
    if (result.ok) {
      await refreshTeamAccess();
      setTeamAccessStatus("Team member saved as a pending invite.");
    } else {
      setTeamAccessStatus(`Could not save team member: ${result.error}`);
    }

    return result;
  };

  const changeTeamMemberRole = async ({ memberId, role }) => {
    const result = await updateTeamMemberRole({ memberId, role });
    if (result.ok) {
      await refreshTeamAccess();
      setTeamAccessStatus("Team member role updated.");
    } else {
      setTeamAccessStatus(`Could not update role: ${result.error}`);
    }

    return result;
  };

  if (isAuthLoading) {
    return (
      <div className={isDark ? "flex min-h-screen items-center justify-center bg-slate-950 text-white" : "flex min-h-screen items-center justify-center bg-slate-100 text-slate-950"}>
        <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-900 p-6 text-center shadow-xl" : "rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl"}>
          <img src={isDark ? lastMileMarginLogoDark : lastMileMarginLogo} alt="Last Mile Margin" className="mx-auto h-20 w-40 object-contain" />
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

  const showDemoTourOffControl =
    isDemoMode ||
    isDemoWorkspace ||
    isProductTourOpen ||
    isGuidedDemoOpen ||
    isDemoCompletionOpen ||
    !productTourStatus?.hasCompletedTour;

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

      <div className="flex min-h-screen overflow-x-hidden">
        <AppSidebar
          isDark={isDark}
          activeAccent={activeAccent}
          visibleNavItems={visibleNavItems}
          activeTab={activeTab}
          appSettings={appSettings}
          isDemoMode={isDemoMode}
          isDemoWorkspace={isDemoWorkspace}
          authUser={authUser}
          currentUserRole={currentUserRole}
          roleLabel={roleLabels[currentUserRole]}
          toggleThemeMode={toggleThemeMode}
          navigateToTab={navigateToTab}
          signOut={signOut}
          onLoadDemo={loadDemoWorkspace}
          onExitDemo={exitDemoWorkspace}
        />

        <main className="min-w-0 flex-1 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8">
          {isDemoMode && (
            <DemoBanner
              isDark={isDark}
              isDemoBannerDismissed={isDemoBannerDismissed}
              setIsDemoBannerDismissed={setIsDemoBannerDismissed}
            />
          )}
          <AppToolbar
            isDark={isDark}
            isDemoMode={isDemoMode}
            canManageBusiness={canManageBusiness}
            showDemoTourOffControl={showDemoTourOffControl}
            savedDayFlash={savedDayFlash}
            savedDays={savedDays}
            showSavedDays={showSavedDays}
            setShowSavedDays={setShowSavedDays}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
            globalDateLabel={globalDateLabel}
            globalDateRange={globalDateRange}
            setGlobalDateRange={setGlobalDateRange}
            setLoadedSavedDay={setLoadedSavedDay}
            setCalendarMonth={setCalendarMonth}
            calendarDays={calendarDays}
            calendarMonthLabel={calendarMonthLabel}
            moveCalendarMonth={moveCalendarMonth}
            pickCalendarDate={pickCalendarDate}
            selectToday={selectToday}
            selectThisWeek={selectThisWeek}
            loadSavedDay={loadSavedDay}
            saveCurrentDay={saveCurrentDay}
            turnOffDemoAndTour={turnOffDemoAndTour}
            formatDateLabel={formatDateLabel}
            formatDateRangeLabel={formatDateRangeLabel}
            onLoadDemo={loadDemoWorkspace}
            onExitDemo={exitDemoWorkspace}
          />
          {!isDemoMode && (
            <div className="mx-auto mb-3 max-w-[1600px] sm:mb-5">
              <SyncConfidencePanel
                isDark={isDark}
                appStateStatus={appStateBackendStatus}
                claimsStatus={claimsBackendStatus}
                teamStatus={teamAccessStatus}
                isDemoMode={isDemoMode}
                isDemoWorkspace={isDemoWorkspace}
              />
            </div>
          )}
          <BusinessWorkflowRail
            isDark={isDark}
            setupStatus={workflowSetupStatus}
            activeTab={activeTab}
            activeOperationsTab={activeOperationsTab}
            activeFinanceTab={activeFinanceTab}
            onNavigate={navigateToTab}
            collapsible={activeTab === "Dashboard"}
          />
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1600px]">
            {activeTab === "Dashboard" ? (
              <DashboardHome teams={teams} claims={claims} setTeams={setTeams} setClaims={setClaims} setActiveTab={navigateToTab} isDark={isDark} appSettings={appSettings} savedDaySnapshot={loadedSavedDay} savedDays={savedDays} isBlankDemo={isBlankDemoWorkspace} isDemoMode={isDemoMode} onStartTour={startProductTour} onStartGuidedDemo={startInteractiveDemo} onLaunchDemo={loadDemoWorkspace} onSaveSnapshot={saveCurrentDay} productTourStatus={productTourStatus} ownerName={ownerName} />
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
                isDemoMode={isDemoMode}
                isBlankDemo={isBlankDemoWorkspace}
                standalone
              />
            ) : activeTab === "Operations" ? (
              <OperationsDashboard
                activeSection={activeOperationsTab}
                setActiveSection={setActiveOperationsTab}
                navigateToTab={navigateToTab}
                claims={claims}
                setClaims={setClaims}
                teams={teams}
                setTeams={setTeams}
                isDark={isDark}
                appSettings={appSettings}
                claimsBackendStatus={claimsBackendStatus}
                isBlankDemo={isBlankDemoWorkspace}
                isDemoMode={isDemoMode}
              />
            ) : activeTab === "Reports" ? (
              <ReportsDashboard claims={claims} teams={teams} results={results} form={form} savedDays={savedDays} savedScenarios={savedScenarios} appSettings={appSettings} isDark={isDark} exportSummary={exportSummary} reportsHomeSignal={reportsHomeSignal} navigateToTab={navigateToTab} isBlankDemo={isBlankDemoWorkspace} isDemoMode={isDemoMode} />
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
                isBlankDemo={isBlankDemoWorkspace}
                isDemoMode={isDemoMode}
              />
            ) : activeTab === "Settings" ? (
              <SettingsDashboard
                appSettings={appSettings}
                setAppSettings={setAppSettings}
                appStateBackendStatus={appStateBackendStatus}
                claimsBackendStatus={claimsBackendStatus}
                teamMembers={teamMembers}
                currentUserRole={currentUserRole}
                teamAccessStatus={teamAccessStatus}
                onInviteTeamMember={inviteTeamMember}
                onUpdateTeamMemberRole={changeTeamMemberRole}
                isDemoMode={isDemoMode}
                onLaunchDemo={loadDemoWorkspace}
                onExitDemo={exitDemoWorkspace}
                onResetDemo={resetDemoWorkspace}
                onRestartDemo={restartGuidedDemo}
              />
            ) : activeTab === "Finance" ? (
              <FinanceDashboard
                activeSection={activeFinanceTab}
                setActiveSection={setActiveFinanceTab}
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
                resetForm={() => setForm(isDemoMode ? getDemoWorkspaceData().form : defaultForm)}
                isDark={isDark}
                appSettings={appSettings}
                teams={teams}
                claims={claims}
                navigateToTab={navigateToTab}
                isBlankDemo={isBlankDemoWorkspace}
                isDemoMode={isDemoMode}
              />
            ) : (
              <DashboardHome teams={teams} claims={claims} setTeams={setTeams} setClaims={setClaims} setActiveTab={navigateToTab} isDark={isDark} appSettings={appSettings} savedDaySnapshot={loadedSavedDay} savedDays={savedDays} isBlankDemo={isBlankDemoWorkspace} isDemoMode={isDemoMode} onStartTour={startProductTour} onStartGuidedDemo={startInteractiveDemo} onLaunchDemo={loadDemoWorkspace} onSaveSnapshot={saveCurrentDay} productTourStatus={productTourStatus} ownerName={ownerName} />
            )}
          </motion.div>
        </main>

        <AppBottomNav
          isDark={isDark}
          activeAccent={activeAccent}
          visibleNavItems={visibleNavItems}
          activeTab={activeTab}
          navigateToTab={navigateToTab}
        />

        <ProductTour
          isOpen={isProductTourOpen}
          isDark={isDark}
          initialStepIndex={tourInitialStepIndex}
          onFinish={finishProductTour}
          onSkip={skipProductTour}
          onNavigate={navigateToTab}
          onStepChange={handleProductTourStepChange}
        />
        <GuidedDemoTour
          isOpen={isGuidedDemoOpen}
          isDark={isDark}
          initialStepIndex={tourInitialStepIndex}
          onClose={closeGuidedDemo}
          onComplete={completeGuidedDemo}
          onNavigate={navigateToTab}
          onStepChange={handleProductTourStepChange}
        />
        <DemoCompletionModal
          isOpen={isDemoCompletionOpen}
          isDark={isDark}
          onClose={closeDemoCompletion}
          onRestart={restartDemoFromCompletion}
        />
      </div>
    </div>
  );
}
