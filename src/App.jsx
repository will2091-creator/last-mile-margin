import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import lastMileMarginLogo from "./assets/last-mile-margin-logo-transparent.svg";
import lastMileMarginLogoDark from "./assets/last-mile-margin-logo-transparent-dark.svg";
import LoginPage from "./pages/LoginPage";
// Heavy authenticated pages (charts, AI, big forms) are code-split so the
// initial load — and especially the logged-out login screen — stays lean.
const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const SettingsDashboard = lazy(() => import("./pages/SettingsDashboard"));
const OperationsDashboard = lazy(() => import("./pages/OperationsDashboard"));
const FinanceDashboard = lazy(() => import("./pages/FinanceDashboard"));
const ReportsDashboard = lazy(() => import("./pages/ReportsDashboard"));
const AskBusinessDashboard = lazy(() => import("./pages/AskBusinessDashboard"));
const AiQuickIntake = lazy(() => import("./components/AiQuickIntake"));
import BusinessWorkflowRail from "./components/BusinessWorkflowRail";
import SyncConfidencePanel from "./components/SyncConfidencePanel";
import AppSidebar from "./components/app/AppSidebar";
import AppToolbar from "./components/app/AppToolbar";
import AppBottomNav from "./components/app/AppBottomNav";
import ErrorBoundary from "./components/ErrorBoundary";
import TourOverlay from "./tour/TourOverlay";
import { tourSteps } from "./tour/tourSteps";
import { demoDataset, demoContracts } from "./tour/tourDemoData";
import { useToast } from "./components/Toast";
import { loadAppStateFromSupabase, saveAppStateToSupabase } from "./lib/appStateRepository";
import { loadClaimsFromSupabase, syncClaimsToSupabase } from "./lib/claimsRepository";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient";
import { addTeamMember, loadTeamAccess, updateTeamMemberRole } from "./lib/teamAccessRepository";
import { getSetupStatus, getNextBestSetupAction } from "./lib/onboarding";
import {
  accentThemes,
  Bot,
  BriefcaseBusiness,
  Calculator,
  ClipboardCheck,
  currency,
  defaultForm,
  defaultSettings,
  getGrade,
  initialClaims,
  initialTeams,
  LayoutDashboard,
  number,
  Settings,
  toNum,
  Upload,
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

// Shown briefly while a code-split page chunk loads. Mirrors a dashboard's
// shape (hero + KPI grid + table) with shimmer blocks so navigation never
// flashes blank.
function PageFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <span className="skeleton block h-9 w-64 rounded-xl" />
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <span className="skeleton block h-56 rounded-2xl" />
        <span className="skeleton block h-56 rounded-2xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <span className="skeleton block h-28 rounded-2xl" />
        <span className="skeleton block h-28 rounded-2xl" />
        <span className="skeleton block h-28 rounded-2xl" />
        <span className="skeleton block h-28 rounded-2xl" />
      </div>
      <span className="skeleton block h-64 rounded-2xl" />
    </div>
  );
}

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

  // Demo mode and tours were removed. These remain as constant `false` so the
  // existing non-demo conditionals and page props continue to behave correctly.
  const isDemoMode = false;
  const isDemoWorkspace = false;
  const isBlankDemoWorkspace = false;
  // Guided product tour: runs over an in-memory demo dataset, then restores the
  // user's real workspace. tourSnapshotRef holds the real state during the tour;
  // tourLaunchedRef makes the auto-launch fire at most once per session.
  const [tourActive, setTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const tourSnapshotRef = useRef(null);
  const tourLaunchedRef = useRef(false);
  const { toast } = useToast();
  const [form, setForm] = useState(defaultForm);
  const [savedScenarios, setSavedScenarios] = useState(() =>
    loadFromLocalStorage("finalMileSavedScenarios", [])
  );
  const initialUrlTab = getTabFromUrl();
  const [activeTab, setActiveTab] = useState(() => normalizeTopTab(initialUrlTab));
  const [activeOperationsTab, setActiveOperationsTab] = useState(() => groupedTabs[initialUrlTab]?.[0] === "Operations" ? groupedTabs[initialUrlTab][1] : "Dispatch");
  const [activeFinanceTab, setActiveFinanceTab] = useState(() => groupedTabs[initialUrlTab]?.[0] === "Finance" ? groupedTabs[initialUrlTab][1] : "Profitability");
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
      profitabilityBenchmarks: {
        ...defaultSettings.profitabilityBenchmarks,
        ...(savedSettings.profitabilityBenchmarks || {}),
      },
    };
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    localStorage.getItem("finalMileLoggedIn") === "true"
  );
  const [authUser, setAuthUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseConfigured);
  const [teamMembers, setTeamMembers] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState("owner");
  const [teamAccessStatus, setTeamAccessStatus] = useState("Team access will load after sign in.");

  useEffect(() => {
    if (tourActive) return;
    localStorage.setItem("finalMileSettings", JSON.stringify(appSettings));
  }, [appSettings, tourActive]);

  useEffect(() => {
    localStorage.setItem("finalMileLoggedIn", String(isLoggedIn));
  }, [isLoggedIn]);

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
  }, [authUser]);

  useEffect(() => {
    if (tourActive) return;
    localStorage.setItem("finalMileTeams", JSON.stringify(teams));
  }, [teams, tourActive]);

  useEffect(() => {
    if (tourActive) return;
    localStorage.setItem("finalMileClaims", JSON.stringify(claims));
  }, [claims, tourActive]);

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
    if (tourActive) return;
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
  }, [claims, hasLoadedRemoteClaims, tourActive]);

  useEffect(() => {
    if (tourActive) return;
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
  }, [appSettings, currentWorkDate, form, globalDateRange, hasLoadedRemoteAppState, savedDays, savedScenarios, teams, tourActive]);

  useEffect(() => {
    if (tourActive) return;
    localStorage.setItem("finalMileSavedScenarios", JSON.stringify(savedScenarios));
  }, [savedScenarios, tourActive]);

  useEffect(() => {
    if (tourActive) return;
    localStorage.setItem("finalMileSavedDays", JSON.stringify(savedDays));
  }, [savedDays, tourActive]);

  useEffect(() => {
    if (tourActive) return;
    localStorage.setItem("finalMileCurrentWorkDate", currentWorkDate);
  }, [currentWorkDate, tourActive]);

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

  useEffect(() => {
    if (!isLoggedIn || canAccessTab(currentUserRole, activeTab)) return;
    navigateToTab(defaultAllowedTab, { replace: true });
  }, [activeTab, currentUserRole, defaultAllowedTab, isLoggedIn]);

  // --- Guided product tour ---------------------------------------------------
  // Only show steps whose tab the current role can reach.
  const tourStepsForRole = useMemo(
    () => tourSteps.filter((stepDef) => canAccessTab(currentUserRole, stepDef.tab)),
    [currentUserRole]
  );

  const startTour = () => {
    // Idempotent — guards React StrictMode's double effect invocation and any
    // double-click on the replay button.
    if (tourActive || tourSnapshotRef.current) return;
    tourSnapshotRef.current = {
      claims,
      teams,
      savedScenarios,
      savedDays,
      form,
      loadedSavedDay,
      // The dashboard's Contract Performance table reads contracts from
      // localStorage, so snapshot + swap that key too (restored on exit, never
      // synced because the React persisters are gated while the tour runs).
      rollupRows: (() => {
        try { return localStorage.getItem("finalMileRollupRows"); } catch { return null; }
      })(),
    };
    try { localStorage.setItem("finalMileRollupRows", JSON.stringify(demoContracts)); } catch (error) { console.warn("tour: could not stage demo contracts", error); }
    setClaims(demoDataset.claims);
    setTeams(demoDataset.teams);
    setForm(demoDataset.form);
    setSavedDays(demoDataset.savedDays);
    setSavedScenarios(demoDataset.savedScenarios);
    setLoadedSavedDay(demoDataset.loadedSavedDay);
    setTourStepIndex(0);
    setTourActive(true);
    navigateToTab("Dashboard");
  };

  // Restore the user's real workspace, mark the tour seen, and re-enable the
  // persisters (setTourActive(false) runs last so they only fire with real data).
  const endTour = () => {
    const snap = tourSnapshotRef.current;
    if (snap) {
      setClaims(snap.claims);
      setTeams(snap.teams);
      setSavedScenarios(snap.savedScenarios);
      setSavedDays(snap.savedDays);
      setForm(snap.form);
      setLoadedSavedDay(snap.loadedSavedDay);
      // Restore the contracts localStorage key byte-for-byte.
      try {
        if (snap.rollupRows === null) localStorage.removeItem("finalMileRollupRows");
        else localStorage.setItem("finalMileRollupRows", snap.rollupRows);
      } catch (error) {
        console.warn("tour: could not restore contracts", error);
      }
    }
    tourSnapshotRef.current = null;
    setAppSettings((current) => ({ ...current, tourCompleted: true }));
    try {
      localStorage.setItem("finalMileTourSeen", "true");
    } catch (error) {
      console.warn("Could not persist tour-seen flag", error);
    }
    setTourStepIndex(0);
    setTourActive(false);
  };

  const finishTour = () => {
    // Compute the real next setup step from the snapshot BEFORE clearing it.
    // Pass the real contracts explicitly (localStorage still holds the demo ones
    // until endTour restores them).
    const snap = tourSnapshotRef.current;
    let realContracts = [];
    try {
      realContracts = snap?.rollupRows ? JSON.parse(snap.rollupRows) : [];
    } catch {
      realContracts = [];
    }
    const realStatus = getSetupStatus({
      teams: snap?.teams,
      claims: snap?.claims,
      quickContracts: realContracts,
      savedScenarios: snap?.savedScenarios,
      savedDays: snap?.savedDays,
      appSettings,
    });
    endTour();
    const next = getNextBestSetupAction(realStatus);
    navigateToTab(next?.tab || "Settings");
  };

  const skipTour = () => endTour();
  const goNextTourStep = () => setTourStepIndex((index) => Math.min(index + 1, tourStepsForRole.length - 1));
  const goBackTourStep = () => setTourStepIndex((index) => Math.max(index - 1, 0));

  // Auto-launch once for a brand-new, empty workspace (owner/admin only). Waits
  // for both remote loads so we never launch over data about to arrive.
  useEffect(() => {
    if (!isLoggedIn || !hasLoadedRemoteAppState || !hasLoadedRemoteClaims) return;
    if (tourActive || tourLaunchedRef.current) return;
    if (appSettings.tourCompleted) return;
    if (currentUserRole !== "owner" && currentUserRole !== "admin") return;
    if (workflowSetupStatus.hasAnyBusinessData) return;
    try {
      if (localStorage.getItem("finalMileTourSeen")) return;
    } catch (error) {
      console.warn("Could not read tour-seen flag", error);
    }
    tourLaunchedRef.current = true;
    startTour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoggedIn,
    hasLoadedRemoteAppState,
    hasLoadedRemoteClaims,
    appSettings.tourCompleted,
    workflowSetupStatus.hasAnyBusinessData,
    currentUserRole,
    tourActive,
  ]);

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
    toast({ tone: "success", title: "Snapshot saved", description: `${snapshot.label || "Today"} saved to your daily history.` });
  };

  const pendingDayLogSaveRef = useRef(false);
  const applyDayLog = ({ formPatch, claims: claimDrafts } = {}) => {
    if (Array.isArray(claimDrafts) && claimDrafts.length) {
      const normalized = claimDrafts
        .filter((draft) => draft && (draft.type || draft.amount))
        .map((draft, index) => ({
          id: draft.id || `CLM-${Date.now()}-${index}`,
          category: draft.category || "Property",
          type: draft.type || "Reported damage",
          driver: draft.driver || "",
          team: draft.team || "",
          route: draft.route || formPatch?.scenarioName || "",
          amount: Number(draft.amount || 0),
          status: draft.status || "Open",
          preventable: draft.preventable || "Maybe",
          date: draft.date || "Today",
          risk: draft.risk || "Medium",
        }));
      if (normalized.length) setClaims((current) => [...normalized, ...current]);
    }
    const cleanPatch = {};
    if (formPatch && typeof formPatch === "object") {
      Object.entries(formPatch).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        if (!Object.prototype.hasOwnProperty.call(defaultForm, key)) return;
        cleanPatch[key] = typeof defaultForm[key] === "number" ? Number(value) : value;
      });
    }
    if (Object.keys(cleanPatch).length) {
      setForm((current) => ({ ...current, ...cleanPatch }));
      pendingDayLogSaveRef.current = true; // save the snapshot once results recompute from the new form
    }
    return { appliedFields: Object.keys(cleanPatch), claimsAdded: Array.isArray(claimDrafts) ? claimDrafts.length : 0 };
  };

  useEffect(() => {
    if (!pendingDayLogSaveRef.current) return;
    pendingDayLogSaveRef.current = false;
    saveCurrentDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

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
    if (tourActive) return undefined;
    autoSaveAndStartFreshDay();
    const interval = window.setInterval(autoSaveAndStartFreshDay, 30000);
    return () => window.clearInterval(interval);
  }, [currentWorkDate, claims, teams, results, tourActive]);

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
      "Last Mile Margin Summary",
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
        <div className={isDark ? "w-72 rounded-2xl border border-white/10 bg-slate-900 p-6 text-center shadow-card" : "w-72 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-card"}>
          <img src={isDark ? lastMileMarginLogoDark : lastMileMarginLogo} alt="Last Mile Margin" className="mx-auto h-20 w-40 object-contain" />
          <p className="mt-4 text-sm font-black">Checking your session...</p>
          <span aria-hidden="true" className="skeleton mx-auto mt-4 block h-1.5 w-40 rounded-full" />
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
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -6px rgba(15, 23, 42, 0.08) !important;
          color: #0f172a !important;
        }

        .theme-dark .app-card {
          background: rgba(15, 23, 42, 0.86) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.20), 0 12px 32px -8px rgba(0, 0, 0, 0.28) !important;
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

        /* Dark mode is the baseline, but slate-500 muted text on dark cards
           lands at ~3:1 contrast — below WCAG AA. Lift the dimmest muted text
           one step to slate-400 (~4.9:1) everywhere, centrally, mirroring how
           light mode is themed above. */
        .theme-dark main .text-slate-500 {
          color: #94a3b8 !important;
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

        /* ---- Premium table polish (both themes) ---- */
        /* Consistent header typography across every table. */
        main table thead th {
          font-weight: 600;
          letter-spacing: 0.04em;
          white-space: nowrap;
          /* Stick the header to the top of any vertically-scrolling table
             container (no-op for short, non-scrolling tables). */
          position: sticky;
          top: 0;
          z-index: 1;
        }
        /* Subtle header band so the column labels read as a distinct row. */
        .theme-light main table thead th {
          background: #f8fafc;
        }
        .theme-dark main table thead th {
          background: rgba(255, 255, 255, 0.035);
        }
        main table thead th:first-child {
          border-top-left-radius: 8px;
          border-bottom-left-radius: 8px;
        }
        main table thead th:last-child {
          border-top-right-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        /* Clean bottom edge — drop the dangling divider on the final row. */
        main table tbody tr:last-child,
        main table tbody tr:last-child td {
          border-bottom-width: 0 !important;
        }
        /* Column breathing room so adjacent headers/values never collide
           (e.g. a right-aligned "Amount" bumping into "Status"). */
        main table th:not(:first-child),
        main table td:not(:first-child) {
          padding-left: 1.25rem;
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
          onStartTour={startTour}
          signOut={signOut}
        />

        <main className="min-w-0 flex-1 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8">
          <AppToolbar
            isDark={isDark}
            isDemoMode={isDemoMode}
            canManageBusiness={canManageBusiness}
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
            formatDateLabel={formatDateLabel}
            formatDateRangeLabel={formatDateRangeLabel}
          />
          {!isDemoMode &&
            [appStateBackendStatus, claimsBackendStatus, teamAccessStatus].some((status) =>
              /fail|unavailable|local/i.test(String(status || ""))
            ) && (
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
            collapsible
          />
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1600px]">
            <ErrorBoundary key={activeTab} variant="page">
            <Suspense fallback={<PageFallback />}>
            {activeTab === "Dashboard" ? (
              <DashboardHome key={tourActive ? "dash-tour" : "dash-live"} teams={teams} claims={claims} setTeams={setTeams} setClaims={setClaims} setActiveTab={navigateToTab} isDark={isDark} appSettings={appSettings} savedDaySnapshot={loadedSavedDay} savedDays={savedDays} isBlankDemo={isBlankDemoWorkspace} isDemoMode={isDemoMode} onSaveSnapshot={saveCurrentDay} onApplyDayLog={applyDayLog} ownerName={ownerName} />
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
                resetForm={() => setForm(defaultForm)}
                isDark={isDark}
                appSettings={appSettings}
                teams={teams}
                claims={claims}
                navigateToTab={navigateToTab}
                isBlankDemo={isBlankDemoWorkspace}
                isDemoMode={isDemoMode}
              />
            ) : (
              <DashboardHome key={tourActive ? "dash-tour" : "dash-live"} teams={teams} claims={claims} setTeams={setTeams} setClaims={setClaims} setActiveTab={navigateToTab} isDark={isDark} appSettings={appSettings} savedDaySnapshot={loadedSavedDay} savedDays={savedDays} isBlankDemo={isBlankDemoWorkspace} isDemoMode={isDemoMode} onSaveSnapshot={saveCurrentDay} onApplyDayLog={applyDayLog} ownerName={ownerName} />
            )}
            </Suspense>
            </ErrorBoundary>
          </motion.div>
        </main>

        <AppBottomNav
          isDark={isDark}
          activeAccent={activeAccent}
          visibleNavItems={visibleNavItems}
          activeTab={activeTab}
          navigateToTab={navigateToTab}
        />
      </div>

      <TourOverlay
        active={tourActive}
        steps={tourStepsForRole}
        stepIndex={tourStepIndex}
        isDark={isDark}
        onNext={goNextTourStep}
        onBack={goBackTourStep}
        onSkip={skipTour}
        onFinish={finishTour}
        navigateToTab={navigateToTab}
      />
    </div>
  );
}
