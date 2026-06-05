import React, { useMemo, useState } from "react";
import {
  accentThemes,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  currency,
  defaultSettings,
  DollarSign,
  FileText,
  Save,
  Settings,
  ShieldCheck,
  Truck,
} from "../shared";
import { roleOptions } from "../lib/teamAccessRepository";
import { resetStoredSetupProgress, restoreSetupPanel } from "../lib/onboarding";

const defaultMarginFactors = {
  profile: "Appliance Delivery",
  revenue: {
    routePay: true,
    perStopPay: true,
    extraStops: true,
    installRevenue: true,
    haulAwayRevenue: true,
    fuelSurcharge: true,
    reattemptFee: true,
    stairsLongCarry: true,
    detentionWaitTime: false,
    assemblySetup: false,
    otherAccessorials: true,
  },
  costs: {
    driverPay: true,
    helperPay: true,
    truckPayment: true,
    truckInsurance: true,
    fuel: true,
    maintenance: true,
    tollsParking: false,
    claimsReserve: true,
    bond: true,
    phonesSoftware: false,
    warehouseFees: false,
    uniformsPpe: false,
    backgroundChecks: false,
    drugTests: false,
    dotCompliance: false,
    otherExpenses: true,
  },
  metrics: {
    marginPercent: true,
    netProfit: true,
    profitPerStop: true,
    profitPerMile: true,
    profitPerHour: true,
    stopsPerHour: true,
    milesPerStop: false,
    laborPercentRevenue: true,
    fuelPercentRevenue: false,
    claimsPerRoute: false,
  },
};

const factorLabels = {
  revenue: [
    ["routePay", "Route Pay"],
    ["perStopPay", "Per Stop Pay"],
    ["extraStops", "Extra Stops / Stops Pay"],
    ["installRevenue", "Install Revenue"],
    ["haulAwayRevenue", "Haul Away Revenue"],
    ["fuelSurcharge", "Fuel Surcharge"],
    ["reattemptFee", "Reattempt / Redelivery Fee"],
    ["stairsLongCarry", "Stairs / Long Carry"],
    ["detentionWaitTime", "Detention / Wait Time"],
    ["assemblySetup", "Assembly / Setup"],
    ["otherAccessorials", "Other Accessorials"],
  ],
  costs: [
    ["driverPay", "Driver Pay"],
    ["helperPay", "Helper Pay"],
    ["truckPayment", "Truck Payment / Lease"],
    ["truckInsurance", "Truck Insurance"],
    ["fuel", "Fuel"],
    ["maintenance", "Maintenance / Repairs"],
    ["tollsParking", "Tolls / Parking"],
    ["claimsReserve", "Claims Reserve"],
    ["bond", "Bond"],
    ["phonesSoftware", "Phones / Software"],
    ["warehouseFees", "Warehouse Fees"],
    ["uniformsPpe", "Uniforms / PPE"],
    ["backgroundChecks", "Background Checks"],
    ["drugTests", "Drug Tests"],
    ["dotCompliance", "DOT / Compliance"],
    ["otherExpenses", "Other Expenses"],
  ],
  metrics: [
    ["marginPercent", "Margin %"],
    ["netProfit", "Net Profit ($)"],
    ["profitPerStop", "Profit / Stop"],
    ["profitPerMile", "Profit / Mile"],
    ["profitPerHour", "Profit / Hour"],
    ["stopsPerHour", "Stops Per Hour"],
    ["milesPerStop", "Miles Per Stop"],
    ["laborPercentRevenue", "Labor % of Revenue"],
    ["fuelPercentRevenue", "Fuel % of Revenue"],
    ["claimsPerRoute", "Claims per Route"],
  ],
};

const profilePresets = {
  "Appliance Delivery": {
    revenue: ["routePay", "perStopPay", "extraStops", "installRevenue", "haulAwayRevenue", "fuelSurcharge", "reattemptFee", "stairsLongCarry", "otherAccessorials"],
    costs: ["driverPay", "helperPay", "truckPayment", "truckInsurance", "fuel", "maintenance", "claimsReserve", "bond", "otherExpenses"],
    metrics: ["marginPercent", "netProfit", "profitPerStop", "profitPerMile", "profitPerHour", "stopsPerHour", "laborPercentRevenue"],
  },
  "Furniture Delivery": {
    revenue: ["routePay", "perStopPay", "extraStops", "haulAwayRevenue", "stairsLongCarry", "assemblySetup", "otherAccessorials"],
    costs: ["driverPay", "helperPay", "truckPayment", "truckInsurance", "fuel", "maintenance", "claimsReserve", "bond", "uniformsPpe", "otherExpenses"],
    metrics: ["marginPercent", "netProfit", "profitPerStop", "profitPerHour", "stopsPerHour", "claimsPerRoute"],
  },
  "White Glove": {
    revenue: ["routePay", "perStopPay", "extraStops", "installRevenue", "haulAwayRevenue", "stairsLongCarry", "detentionWaitTime", "assemblySetup", "otherAccessorials"],
    costs: ["driverPay", "helperPay", "truckPayment", "truckInsurance", "fuel", "maintenance", "claimsReserve", "bond", "uniformsPpe", "backgroundChecks", "drugTests", "otherExpenses"],
    metrics: ["marginPercent", "netProfit", "profitPerStop", "profitPerMile", "profitPerHour", "stopsPerHour", "laborPercentRevenue", "claimsPerRoute"],
  },
  "Big & Bulky": {
    revenue: ["routePay", "perStopPay", "extraStops", "fuelSurcharge", "detentionWaitTime", "otherAccessorials"],
    costs: ["driverPay", "helperPay", "truckPayment", "truckInsurance", "fuel", "maintenance", "tollsParking", "claimsReserve", "bond", "warehouseFees", "otherExpenses"],
    metrics: ["marginPercent", "netProfit", "profitPerStop", "profitPerMile", "profitPerHour", "stopsPerHour", "milesPerStop", "fuelPercentRevenue"],
  },
  Custom: null,
};

function buildPreset(profile) {
  const preset = profilePresets[profile];
  if (!preset) return { ...defaultMarginFactors, profile: "Custom" };

  const next = {
    profile,
    revenue: {},
    costs: {},
    metrics: {},
  };

  Object.keys(defaultMarginFactors.revenue).forEach((key) => {
    next.revenue[key] = preset.revenue.includes(key);
  });

  Object.keys(defaultMarginFactors.costs).forEach((key) => {
    next.costs[key] = preset.costs.includes(key);
  });

  Object.keys(defaultMarginFactors.metrics).forEach((key) => {
    next.metrics[key] = preset.metrics.includes(key);
  });

  return next;
}

function SettingsDashboard({
  appSettings,
  setAppSettings,
  appStateBackendStatus,
  claimsBackendStatus,
  teamMembers = [],
  currentUserRole = "owner",
  teamAccessStatus = "",
  onInviteTeamMember,
  onUpdateTeamMemberRole,
  isDemoMode = false,
  onLaunchDemo,
  onExitDemo,
  onResetDemo,
  onRestartDemo,
}) {
  const selectedAccent = accentThemes?.[appSettings?.accentColor] || accentThemes?.blue || { from: "#2563eb", to: "#1d4ed8" };
  const isDark = appSettings?.themeMode === "dark";
  const dashboardWidgets = {
    ...defaultSettings.dashboardWidgets,
    ...(appSettings?.dashboardWidgets || {}),
  };
  const defaultDashboardOrder = defaultSettings.dashboardWidgetOrder || Object.keys(defaultSettings.dashboardWidgets);
  const dashboardWidgetOrder = [
    ...new Set([...(appSettings?.dashboardWidgetOrder || []), ...defaultDashboardOrder]),
  ].filter((key) => Object.prototype.hasOwnProperty.call(defaultSettings.dashboardWidgets, key));
  const marginFactors = {
    ...defaultMarginFactors,
    ...(appSettings?.marginFactors || {}),
    revenue: { ...defaultMarginFactors.revenue, ...(appSettings?.marginFactors?.revenue || {}) },
    costs: { ...defaultMarginFactors.costs, ...(appSettings?.marginFactors?.costs || {}) },
    metrics: { ...defaultMarginFactors.metrics, ...(appSettings?.marginFactors?.metrics || {}) },
  };

  const [activeSettingsTab, setActiveSettingsTab] = useState("Margin Factors");
  const [savedFlash, setSavedFlash] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState("");
  const [inviteDraft, setInviteDraft] = useState({ email: "", role: "dispatcher" });
  const [isInviting, setIsInviting] = useState(false);

  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const pageClass = isDark ? "space-y-5 text-white" : "space-y-5 text-slate-950";
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const softCard = isDark
    ? "rounded-2xl border border-white/10 bg-slate-950/60 p-4"
    : "rounded-2xl border border-slate-200 bg-slate-50/80 p-4";
  const rowBorder = isDark ? "border-white/10" : "border-slate-200";
  const inputClass = isDark
    ? "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm font-bold text-white outline-none focus:border-blue-500"
    : "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-blue-500";

  const updateSetting = (key, value) => {
    setAppSettings((current) => ({ ...current, [key]: value }));
  };

  const updateNestedSetting = (group, key, value) => {
    setAppSettings((current) => ({
      ...current,
      [group]: {
        ...(current[group] || {}),
        [key]: value,
      },
    }));
  };

  const updateMarginFactors = (nextFactors) => {
    setAppSettings((current) => ({
      ...current,
      marginFactors: nextFactors,
    }));
  };

  const toggleFactor = (category, key) => {
    updateMarginFactors({
      ...marginFactors,
      profile: "Custom",
      [category]: {
        ...marginFactors[category],
        [key]: !marginFactors[category][key],
      },
    });
  };

  const selectAllCategory = (category, checked) => {
    const nextCategory = {};
    Object.keys(marginFactors[category]).forEach((key) => {
      nextCategory[key] = checked;
    });

    updateMarginFactors({
      ...marginFactors,
      profile: "Custom",
      [category]: nextCategory,
    });
  };

  const applyProfile = (profile) => {
    updateMarginFactors(buildPreset(profile));
  };

  const selectedCounts = useMemo(() => {
    const count = (category) => Object.values(marginFactors[category]).filter(Boolean).length;
    return {
      revenue: count("revenue"),
      costs: count("costs"),
      metrics: count("metrics"),
      total: count("revenue") + count("costs") + count("metrics"),
      excluded:
        Object.keys(marginFactors.revenue).length +
        Object.keys(marginFactors.costs).length +
        Object.keys(marginFactors.metrics).length -
        (count("revenue") + count("costs") + count("metrics")),
    };
  }, [marginFactors]);

  const savePreferences = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  };

  const showNotice = (message) => {
    setSettingsNotice(message);
    setTimeout(() => setSettingsNotice(""), 2600);
  };
  const resetSetupChecklist = () => {
    resetStoredSetupProgress();
    showNotice("Setup checklist reset. Return to Dashboard to start the launch flow again.");
  };
  const restoreSetupGuidance = () => {
    restoreSetupPanel();
    showNotice("Setup guidance restored. The Dashboard will show onboarding prompts again.");
  };

  const tabs = ["Company", "Team Access", "Dashboard Layout", "Margin Factors", "Targets", "Claims", "Accessorials", "Labels", "Employees", "Notifications"];

  const categoryCards = [
    {
      key: "revenue",
      title: "Revenue Drivers",
      subtitle: "Select the revenue items to include",
      icon: DollarSign,
      tone: "emerald",
      items: factorLabels.revenue,
      selected: selectedCounts.revenue,
    },
    {
      key: "costs",
      title: "Cost Drivers",
      subtitle: "Select the cost items to include",
      icon: Truck,
      tone: "red",
      items: factorLabels.costs,
      selected: selectedCounts.costs,
    },
    {
      key: "metrics",
      title: "Performance Metrics",
      subtitle: "Select the performance metrics to display",
      icon: BarChart3,
      tone: "violet",
      items: factorLabels.metrics,
      selected: selectedCounts.metrics,
    },
  ];

  const toneStyles = {
    emerald: isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700",
    red: isDark ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-700",
    violet: isDark ? "bg-violet-500/10 text-violet-300" : "bg-violet-50 text-violet-700",
    blue: isDark ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700",
    amber: isDark ? "bg-amber-500/10 text-amber-300" : "bg-amber-50 text-amber-700",
  };

  const dashboardWidgetLabels = [
    ["periodMetrics", "Period Metric Cards", "The compact Day/Week/Month cards across the top."],
    ["todaysProfit", "Today's Profit"],
    ["financialSummary", "Financial Summary"],
    ["needsAttention", "Needs Attention"],
    ["routeHealth", "Route Health"],
    ["routeEfficiency", "Route Efficiency"],
    ["recentClaims", "Recent Claims"],
    ["savedRoutes", "Saved Routes"],
    ["recentActivity", "Recent Activity"],
    ["teamReadiness", "Team Readiness"],
    ["activeContracts", "Active Contracts"],
    ["contractPerformance", "Contract Performance"],
    ["upcomingRenewals", "Upcoming Renewals"],
    ["complianceStatus", "Compliance Status"],
    ["fuelCostTracker", "Fuel Cost Tracker"],
    ["documentExpirations", "Document Expirations"],
    ["insuranceSummary", "Insurance Summary"],
  ];
  const dashboardWidgetMeta = Object.fromEntries(
    dashboardWidgetLabels.map(([key, label, description]) => [key, { label, description: description || "Dashboard card or section." }])
  );
  const enabledDashboardCount = dashboardWidgetOrder.filter((key) => dashboardWidgets[key] !== false).length;
  const canManageTeamAccess = ["owner", "admin"].includes(currentUserRole);
  const roleLabelByValue = Object.fromEntries(roleOptions.map((role) => [role.value, role.label]));

  const updateDashboardWidget = (key, value) => {
    setAppSettings((current) => ({
      ...current,
      dashboardWidgets: {
        ...defaultSettings.dashboardWidgets,
        ...(current.dashboardWidgets || {}),
        [key]: value,
      },
    }));
  };

  const updateDashboardOrder = (nextOrder) => {
    setAppSettings((current) => ({
      ...current,
      dashboardWidgetOrder: nextOrder,
    }));
  };

  const moveDashboardWidget = (key, direction) => {
    const index = dashboardWidgetOrder.indexOf(key);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= dashboardWidgetOrder.length) return;

    const nextOrder = [...dashboardWidgetOrder];
    [nextOrder[index], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[index]];
    updateDashboardOrder(nextOrder);
  };

  const setAllDashboardWidgets = (enabled) => {
    setAppSettings((current) => ({
      ...current,
      dashboardWidgets: Object.fromEntries(defaultDashboardOrder.map((key) => [key, enabled])),
    }));
  };

  const applyDashboardPreset = (preset) => {
    const presets = {
      Operations: ["periodMetrics", "needsAttention", "recentClaims", "teamReadiness", "routeHealth", "routeEfficiency", "recentActivity"],
      Finance: ["periodMetrics", "todaysProfit", "financialSummary", "savedRoutes", "activeContracts", "contractPerformance", "fuelCostTracker"],
      Compliance: ["periodMetrics", "needsAttention", "complianceStatus", "documentExpirations", "insuranceSummary", "upcomingRenewals", "recentActivity"],
      Full: defaultDashboardOrder,
    };
    const enabledKeys = presets[preset] || defaultDashboardOrder;

    setAppSettings((current) => ({
      ...current,
      dashboardWidgets: Object.fromEntries(defaultDashboardOrder.map((key) => [key, enabledKeys.includes(key)])),
      dashboardWidgetOrder: [...enabledKeys, ...defaultDashboardOrder.filter((key) => !enabledKeys.includes(key))],
    }));
  };

  const submitInvite = async (event) => {
    event.preventDefault();
    if (!onInviteTeamMember || !canManageTeamAccess) return;

    setIsInviting(true);
    const result = await onInviteTeamMember(inviteDraft);
    setIsInviting(false);

    if (result?.ok) {
      setInviteDraft({ email: "", role: "dispatcher" });
      showNotice("Team member saved as a pending invite.");
    } else {
      showNotice(result?.error || "Could not save team member.");
    }
  };

  const accessorialSettings = appSettings?.accessorials || {
    haulAway: 35,
    stairs: 25,
    longCarry: 30,
    install: 25,
    waitTime: 45,
    redelivery: 75,
  };
  const labelSettings = appSettings?.labels || {
    contract: "Contract",
    route: "Route",
    driver: "Driver",
    helper: "Helper",
    claim: "Claim",
    margin: "Margin",
  };
  const employeeSettings = appSettings?.employees || {
    requireDriverPhoto: true,
    requireHelperPhoto: true,
    trackCompliance: true,
    showClaimsByDriver: true,
  };
  const notificationSettings = appSettings?.notifications || {
    missingPhoto: true,
    highClaims: true,
    lowMargin: true,
    renewalReminder: true,
    dailySummary: false,
  };
  const claimRiskThresholds = {
    medium: Number(appSettings?.claimRiskThresholds?.medium ?? 200),
    high: Number(appSettings?.claimRiskThresholds?.high ?? 500),
  };
  const profitabilityBenchmarks = {
    ...defaultSettings.profitabilityBenchmarks,
    ...(appSettings?.profitabilityBenchmarks || {}),
    targetMargin: Number(appSettings?.profitabilityBenchmarks?.targetMargin ?? defaultSettings.profitabilityBenchmarks.targetMargin),
    claimsReserveTarget: Number(appSettings?.profitabilityBenchmarks?.claimsReserveTarget ?? defaultSettings.profitabilityBenchmarks.claimsReserveTarget),
    reviewLineMargin: Number(appSettings?.profitabilityBenchmarks?.reviewLineMargin ?? defaultSettings.profitabilityBenchmarks.reviewLineMargin),
  };
  const companyCompleteness = [
    ["Company name", Boolean(appSettings?.companyName)],
    ["Accent/theme", Boolean(appSettings?.accentColor || appSettings?.themeMode)],
    ["Dashboard layout", Boolean(appSettings?.dashboardWidgetOrder)],
    ["Margin targets", Boolean(appSettings?.profitabilityBenchmarks)],
    ["Claim thresholds", Boolean(appSettings?.claimRiskThresholds)],
  ];
  const companyCompletenessCount = companyCompleteness.filter(([, done]) => done).length;

  const Toggle = ({ checked, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-blue-600" : isDark ? "bg-slate-700" : "bg-slate-300"
        }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? "left-[18px]" : "left-0.5"
          }`}
      />
    </button>
  );

  const FactorCard = ({ card }) => {
    const allSelected = card.items.every(([key]) => marginFactors[card.key][key]);

    return (
      <div className={cardClass}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneStyles[card.tone]}`}>
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className={`text-lg font-black ${titleText}`}>{card.title}</h3>
              <p className={`text-sm ${mutedText}`}>{card.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => selectAllCategory(card.key, !allSelected)}
              className="text-xs font-black text-blue-600"
            >
              {allSelected ? "Clear All" : "Select All"}
            </button>
            <Toggle checked={allSelected} onClick={() => selectAllCategory(card.key, !allSelected)} />
          </div>
        </div>

        <div className={`space-y-3 border-t pt-4 ${rowBorder}`}>
          {card.items.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`text-xs ${mutedText}`}>⋮⋮</span>
                <p className={`truncate text-sm font-semibold ${titleText}`}>{label}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => showNotice(`${label} is included when calculating or displaying ${card.title.toLowerCase()}.`)}
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${mutedText}`}
                >
                  i
                </button>
                <Toggle checked={marginFactors[card.key][key]} onClick={() => toggleFactor(card.key, key)} />
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-5 border-t pt-4 text-sm font-black ${rowBorder} ${card.selected === card.items.length ? "text-emerald-700" : card.selected === 0 ? "text-red-600" : "text-blue-600"
          }`}>
          {card.selected} of {card.items.length} selected
        </div>
      </div>
    );
  };

  return (
    <div className={pageClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className={`text-3xl font-black tracking-tight ${titleText}`}>Settings</h1>
          <p className={`mt-1 text-sm ${mutedText}`}>Configure your business, dashboard, and margin calculation preferences.</p>
        </div>

        <button
          onClick={savePreferences}
          className="flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
        >
          <Save className="h-4 w-4" />
          {savedFlash ? "Saved" : "Save Preferences"}
        </button>
      </div>

      <div className={cardClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className={toneStyles.emerald + " flex h-11 w-11 items-center justify-center rounded-2xl"}>
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className={`text-lg font-black ${titleText}`}>Backend Sync</h2>
              <p className={`text-sm ${mutedText}`}>Claims, settings, teams, saved days, and scenarios are prepared for Supabase.</p>
            </div>
          </div>

          <div className="grid gap-2 text-sm font-black sm:grid-cols-2 lg:min-w-[520px]">
            <div className={isDark ? "rounded-xl border border-white/10 bg-slate-950/60 p-3 text-emerald-200" : "rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-700"}>
              {claimsBackendStatus || "Claims sync pending."}
            </div>
            <div className={isDark ? "rounded-xl border border-white/10 bg-slate-950/60 p-3 text-blue-200" : "rounded-xl border border-blue-100 bg-blue-50 p-3 text-blue-700"}>
              {appStateBackendStatus || "App state sync pending."}
            </div>
          </div>
        </div>
      </div>

      <div className={isDemoMode ? (isDark ? "rounded-2xl border border-blue-400/30 bg-blue-500/15 p-5 shadow-xl shadow-black/20" : "rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm") : cardClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className={toneStyles.blue + " flex h-11 w-11 items-center justify-center rounded-2xl"}>
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-600">Demo Workspace</p>
              <h2 className={`mt-1 text-lg font-black ${titleText}`}>{isDemoMode ? "Viewing Demo Workspace" : "Demo Mode is off"}</h2>
              <p className={`mt-1 max-w-3xl text-sm font-semibold leading-6 ${mutedText}`}>
                Demo data is stored separately from real workspace data. Use it to show contracts, claims, teams, receipts, reports, trend history, and Ask responses without touching live information.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className={isDark ? "flex items-center gap-3 rounded-xl border border-white/10 px-4 py-2" : "flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2"}>
              <span className={`text-sm font-black ${titleText}`}>Demo Mode</span>
              <Toggle checked={isDemoMode} onClick={() => (isDemoMode ? onExitDemo?.() : onLaunchDemo?.({ reset: false }))} />
            </div>
            <button
              type="button"
              onClick={() => (isDemoMode ? onExitDemo?.() : onLaunchDemo?.({ reset: false }))}
              className={isDemoMode ? "rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800" : "rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-500"}
            >
              {isDemoMode ? "Exit Demo Mode" : "Launch Demo Workspace"}
            </button>
            <button
              type="button"
              onClick={onResetDemo}
              className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/5" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}
            >
              Reset Demo Data
            </button>
            <button
              type="button"
              onClick={onRestartDemo}
              className={isDark ? "rounded-xl border border-emerald-400/30 px-4 py-2 text-sm font-black text-emerald-200 hover:bg-emerald-500/10" : "rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 hover:bg-emerald-50"}
            >
              Restart Guided Demo
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["State separation", "Demo rows use finalMileDemo* storage keys."],
            ["Safe return", "Exit Demo Mode restores your real/blank workspace."],
            ["Reset anytime", "Reset Demo Data reloads the original sample company."],
          ].map(([label, detail]) => (
            <div key={label} className={isDark ? "rounded-xl border border-white/10 bg-slate-950/50 p-3" : "rounded-xl border border-blue-100 bg-white p-3"}>
              <p className={`text-sm font-black ${titleText}`}>{label}</p>
              <p className={`mt-1 text-xs font-bold leading-5 ${mutedText}`}>{detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className={cardClass}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-600">Onboarding controls</p>
              <h2 className={`mt-1 text-xl font-black ${titleText}`}>Setup guidance stays recoverable</h2>
              <p className={`mt-2 max-w-3xl text-sm font-semibold leading-6 ${mutedText}`}>
                Reset the checklist, restore setup prompts, or use dashboard presets when you want the app to guide a new owner through setup again.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={restoreSetupGuidance} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-500">
                Restore Setup
              </button>
              <button type="button" onClick={resetSetupChecklist} className={isDark ? "rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/5" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"}>
                Reset Checklist
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {["Owner daily view", "Claims-heavy operation", "Finance review", "Compliance review"].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  const presetName = preset.includes("Claims") ? "Operations" : preset.includes("Finance") ? "Finance" : preset.includes("Compliance") ? "Compliance" : "Full";
                  applyDashboardPreset(presetName);
                  showNotice(`${preset} preset applied.`);
                }}
                className={isDark ? "rounded-xl bg-white/5 px-3 py-2 text-xs font-black text-slate-200 hover:bg-white/10" : "rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 hover:bg-blue-50"}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className={cardClass}>
          <p className="text-xs font-black uppercase tracking-wide text-blue-600">Company profile</p>
          <h2 className={`mt-1 text-lg font-black ${titleText}`}>{companyCompletenessCount} of {companyCompleteness.length} complete</h2>
          <div className={isDark ? "mt-3 h-2 overflow-hidden rounded-full bg-slate-950/70" : "mt-3 h-2 overflow-hidden rounded-full bg-slate-100"}>
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${(companyCompletenessCount / companyCompleteness.length) * 100}%` }} />
          </div>
          <div className="mt-4 space-y-2">
            {companyCompleteness.map(([label, done]) => (
              <div key={label} className="flex items-center justify-between gap-3 text-sm">
                <span className={`font-bold ${mutedText}`}>{label}</span>
                <span className={done ? "font-black text-emerald-700" : "font-black text-amber-700"}>{done ? "Done" : "Needed"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`flex gap-7 overflow-x-auto border-b ${rowBorder}`}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSettingsTab(tab)}
            className={
              activeSettingsTab === tab
                ? "whitespace-nowrap border-b-2 border-blue-600 pb-3 text-sm font-black text-blue-600"
                : `whitespace-nowrap pb-3 text-sm font-bold ${mutedText} hover:text-blue-600`
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {settingsNotice && (
        <div className={isDark ? "rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-100" : "rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700"}>
          {settingsNotice}
        </div>
      )}

      {activeSettingsTab !== "Margin Factors" ? (
        <div className={cardClass}>
          <div className="flex items-center gap-3">
            <div className={toneStyles.blue + " flex h-12 w-12 items-center justify-center rounded-2xl"}>
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h2 className={`text-xl font-black ${titleText}`}>{activeSettingsTab}</h2>
              <p className={`text-sm ${mutedText}`}>
                {activeSettingsTab === "Company" && "Business identity, theme, and accent settings."}
                {activeSettingsTab === "Team Access" && "Invite users and control what each role can access."}
                {activeSettingsTab === "Dashboard Layout" && "Control which dashboard sections show and the order they appear in."}
                {activeSettingsTab === "Claims" && "Set claim review rules, including amount thresholds for risk levels."}
                {activeSettingsTab === "Accessorials" && "Set default add-on charges used by contracts and route math."}
                {activeSettingsTab === "Labels" && "Rename common app words to match how your business talks."}
                {activeSettingsTab === "Employees" && "Control driver/helper readiness and accountability settings."}
                {activeSettingsTab === "Notifications" && "Choose the alerts you want the app to surface."}
              </p>
            </div>
          </div>

          {activeSettingsTab === "Company" && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Company Name</label>
                <input
                  value={appSettings?.companyName || "Final Mile Delivery"}
                  onChange={(event) => updateSetting("companyName", event.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Theme Mode</label>
                <select
                  value={appSettings?.themeMode || "light"}
                  onChange={(event) => updateSetting("themeMode", event.target.value)}
                  className={inputClass}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div>
                <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Accent Color</label>
                <select
                  value={appSettings?.accentColor || "blue"}
                  onChange={(event) => updateSetting("accentColor", event.target.value)}
                  className={inputClass}
                >
                  {Object.keys(accentThemes || { blue: true }).map((color) => (
                    <option key={color} value={color}>
                      {color.charAt(0).toUpperCase() + color.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className={softCard}>
                <p className={`text-sm font-black ${mutedText}`}>Selected Accent</p>
                <div
                  className="mt-3 h-10 rounded-xl"
                  style={{
                    background: `linear-gradient(90deg, ${selectedAccent.from}, ${selectedAccent.to})`,
                  }}
                />
              </div>
            </div>
          )}

          {activeSettingsTab === "Team Access" && (
            <div className="mt-6 space-y-5">
              <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
                <div className={softCard}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className={`text-lg font-black ${titleText}`}>Business Users</h3>
                      <p className={`mt-1 text-sm leading-6 ${mutedText}`}>
                        Your account is the owner. Add people here first, then they can be connected to Supabase Auth when the invite email flow is turned on.
                      </p>
                    </div>
                    <span className={isDark ? "w-fit rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-200" : "w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700"}>
                      You are {roleLabelByValue[currentUserRole] || currentUserRole}
                    </span>
                  </div>

                  <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-bold ${isDark ? "border-white/10 bg-slate-950/70 text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}>
                    {teamAccessStatus || "Team access status will appear here."}
                  </div>
                </div>

                <form onSubmit={submitInvite} className={softCard}>
                  <h3 className={`text-lg font-black ${titleText}`}>Add Team Member</h3>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Email</label>
                      <input
                        type="email"
                        value={inviteDraft.email}
                        disabled={!canManageTeamAccess}
                        onChange={(event) => setInviteDraft((current) => ({ ...current, email: event.target.value }))}
                        className={inputClass}
                        placeholder="dispatcher@company.com"
                      />
                    </div>
                    <div>
                      <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Role</label>
                      <select
                        value={inviteDraft.role}
                        disabled={!canManageTeamAccess}
                        onChange={(event) => setInviteDraft((current) => ({ ...current, role: event.target.value }))}
                        className={inputClass}
                      >
                        {roleOptions.filter((role) => role.value !== "owner").map((role) => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={!canManageTeamAccess || isInviting}
                      className={!canManageTeamAccess ? "w-full rounded-xl bg-slate-300 px-4 py-3 text-sm font-black text-slate-500" : "w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-500"}
                    >
                      {isInviting ? "Saving..." : "Save Pending Invite"}
                    </button>
                  </div>
                  <p className={`mt-3 text-xs leading-5 ${mutedText}`}>
                    This saves the access record now. Sending invite emails requires a secure backend function because Supabase service keys cannot live in the browser.
                  </p>
                </form>
              </div>

              <div className={cardClass}>
                <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className={`text-lg font-black ${titleText}`}>Members and Roles</h3>
                    <p className={`text-sm ${mutedText}`}>{teamMembers.length} user{teamMembers.length === 1 ? "" : "s"} connected to this business workspace.</p>
                  </div>
                </div>

                <div className={`overflow-hidden rounded-2xl border ${rowBorder}`}>
                  <div className={isDark ? "grid grid-cols-[1.3fr_160px_140px] gap-3 bg-slate-950/70 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-400" : "grid grid-cols-[1.3fr_160px_140px] gap-3 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500"}>
                    <span>User</span>
                    <span>Role</span>
                    <span>Status</span>
                  </div>

                  {teamMembers.length === 0 ? (
                    <div className={`px-4 py-6 text-sm font-bold ${mutedText}`}>No team members loaded yet.</div>
                  ) : (
                    teamMembers.map((member) => (
                      <div key={member.id} className={`grid grid-cols-[1.3fr_160px_140px] items-center gap-3 border-t px-4 py-4 ${rowBorder}`}>
                        <div className="min-w-0">
                          <p className={`truncate font-black ${titleText}`}>{member.name || member.email}</p>
                          <p className={`truncate text-sm ${mutedText}`}>{member.email}</p>
                        </div>
                        <select
                          value={member.role}
                          disabled={!canManageTeamAccess || member.role === "owner"}
                          onChange={(event) => onUpdateTeamMemberRole?.({ memberId: member.id, role: event.target.value })}
                          className={inputClass}
                        >
                          {roleOptions.map((role) => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                        <span className={member.status === "active" ? "w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700" : "w-fit rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-700"}>
                          {member.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {roleOptions.map((role) => (
                  <div key={role.value} className={softCard}>
                    <p className={`font-black ${titleText}`}>{role.label}</p>
                    <p className={`mt-2 text-sm leading-6 ${mutedText}`}>{role.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSettingsTab === "Dashboard Layout" && (
            <div className="mt-6 space-y-5">
              <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
                <div className={softCard}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className={`text-lg font-black ${titleText}`}>Dashboard Order</h3>
                      <p className={`mt-1 text-sm ${mutedText}`}>
                        {enabledDashboardCount} of {dashboardWidgetOrder.length} sections are visible. Use the arrows to arrange what appears first.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setAllDashboardWidgets(true)} className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-black text-blue-600 hover:bg-blue-50">Show All</button>
                      <button onClick={() => setAllDashboardWidgets(false)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Hide All</button>
                      <button onClick={() => updateDashboardOrder(defaultDashboardOrder)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-500">Reset Order</button>
                    </div>
                  </div>
                </div>

                <div className={softCard}>
                  <h3 className={`text-sm font-black ${titleText}`}>Quick Presets</h3>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {["Operations", "Finance", "Compliance", "Full"].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => applyDashboardPreset(preset)}
                        className={isDark ? "rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/15" : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {dashboardWidgetOrder.map((key, index) => {
                  const widget = dashboardWidgetMeta[key] || { label: key, description: "Dashboard section." };
                  const enabled = dashboardWidgets[key] !== false;

                  return (
                    <div key={key} className={`${softCard} ${enabled ? "" : "opacity-60"}`}>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className={isDark ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-black text-slate-200" : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-700"}>
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-black ${titleText}`}>{widget.label}</p>
                            <p className={`mt-1 text-sm ${mutedText}`}>{widget.description}</p>
                            <span className={enabled ? "mt-3 inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-black text-emerald-700" : "mt-3 inline-flex rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-black text-slate-500"}>
                              {enabled ? "Visible" : "Hidden"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                          <button
                            type="button"
                            onClick={() => moveDashboardWidget(key, -1)}
                            disabled={index === 0}
                            className={index === 0 ? "rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-300" : "rounded-xl border border-blue-200 px-3 py-2 text-xs font-black text-blue-600 hover:bg-blue-50"}
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDashboardWidget(key, 1)}
                            disabled={index === dashboardWidgetOrder.length - 1}
                            className={index === dashboardWidgetOrder.length - 1 ? "rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-300" : "rounded-xl border border-blue-200 px-3 py-2 text-xs font-black text-blue-600 hover:bg-blue-50"}
                          >
                            Down
                          </button>
                          <Toggle checked={enabled} onClick={() => updateDashboardWidget(key, !enabled)} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSettingsTab === "Targets" && (
            <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_360px]">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Target Margin</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={profitabilityBenchmarks.targetMargin}
                      onChange={(event) => updateNestedSetting("profitabilityBenchmarks", "targetMargin", Number(event.target.value || 0))}
                      className={`${inputClass} pr-8`}
                    />
                    <span className={`absolute right-3 top-2.5 text-sm font-black ${mutedText}`}>%</span>
                  </div>
                </div>

                <div>
                  <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Claims Reserve Target</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-2.5 text-sm font-black ${mutedText}`}>$</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={profitabilityBenchmarks.claimsReserveTarget}
                      onChange={(event) => updateNestedSetting("profitabilityBenchmarks", "claimsReserveTarget", Number(event.target.value || 0))}
                      className={`${inputClass} pl-7`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Review Line Margin</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={profitabilityBenchmarks.reviewLineMargin}
                      onChange={(event) => updateNestedSetting("profitabilityBenchmarks", "reviewLineMargin", Number(event.target.value || 0))}
                      className={`${inputClass} pr-8`}
                    />
                    <span className={`absolute right-3 top-2.5 text-sm font-black ${mutedText}`}>%</span>
                  </div>
                </div>
              </div>

              <div className={softCard}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-sm font-black ${titleText}`}>Show Benchmarks</p>
                    <p className={`mt-1 text-xs leading-5 ${mutedText}`}>These values appear on profitability summary cards once contract data exists.</p>
                  </div>
                  <Toggle
                    checked={profitabilityBenchmarks.enabled !== false}
                    onClick={() => updateNestedSetting("profitabilityBenchmarks", "enabled", profitabilityBenchmarks.enabled === false)}
                  />
                </div>

                <div className={`mt-4 divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
                  <div className="flex items-center justify-between py-3 text-sm">
                    <span className={mutedText}>Target margin</span>
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-600">{profitabilityBenchmarks.targetMargin.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between py-3 text-sm">
                    <span className={mutedText}>Claims reserve</span>
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-700">{currency.format(profitabilityBenchmarks.claimsReserveTarget)}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 text-sm">
                    <span className={mutedText}>Review line</span>
                    <span className={isDark ? "rounded-full bg-slate-500/10 px-3 py-1 text-xs font-black text-slate-300" : "rounded-full bg-slate-500/10 px-3 py-1 text-xs font-black text-slate-600"}>{profitabilityBenchmarks.reviewLineMargin.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab === "Claims" && (
            <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_360px]">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>Medium Risk Starts At</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-2.5 text-sm font-black ${mutedText}`}>$</span>
                    <input
                      type="number"
                      min="0"
                      value={claimRiskThresholds.medium}
                      onChange={(event) => updateNestedSetting("claimRiskThresholds", "medium", Number(event.target.value || 0))}
                      className={`${inputClass} pl-7`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>High Risk Starts At</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-2.5 text-sm font-black ${mutedText}`}>$</span>
                    <input
                      type="number"
                      min="0"
                      value={claimRiskThresholds.high}
                      onChange={(event) => updateNestedSetting("claimRiskThresholds", "high", Number(event.target.value || 0))}
                      className={`${inputClass} pl-7`}
                    />
                  </div>
                </div>
              </div>

              <div className={softCard}>
                <p className={`text-sm font-black ${titleText}`}>Risk Preview</p>
                <div className={`mt-4 divide-y ${isDark ? "divide-white/10" : "divide-slate-200"}`}>
                  <div className="flex items-center justify-between py-3 text-sm">
                    <span className={mutedText}>Below {currency.format(claimRiskThresholds.medium)}</span>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700">Low</span>
                  </div>
                  <div className="flex items-center justify-between py-3 text-sm">
                    <span className={mutedText}>{currency.format(claimRiskThresholds.medium)} to {currency.format(Math.max(claimRiskThresholds.high - 0.01, claimRiskThresholds.medium))}</span>
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-700">Medium</span>
                  </div>
                  <div className="flex items-center justify-between py-3 text-sm">
                    <span className={mutedText}>{currency.format(claimRiskThresholds.high)} and up</span>
                    <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-black text-red-600">High</span>
                  </div>
                </div>
                <p className={`mt-4 text-xs leading-5 ${mutedText}`}>
                  Imported claim emails will use these thresholds when the app guesses risk from the claim amount.
                </p>
              </div>
            </div>
          )}

          {activeSettingsTab === "Accessorials" && (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                ["haulAway", "Haul Away", "$"],
                ["stairs", "Stairs / Long Carry", "$"],
                ["longCarry", "Long Carry", "$"],
                ["install", "Install", "$"],
                ["waitTime", "Wait Time / Hour", "$"],
                ["redelivery", "Redelivery", "$"],
              ].map(([key, label, prefix]) => (
                <div key={key}>
                  <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>{label}</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-2.5 text-sm font-black ${mutedText}`}>{prefix}</span>
                    <input
                      type="number"
                      value={accessorialSettings[key]}
                      onChange={(event) => updateNestedSetting("accessorials", key, Number(event.target.value || 0))}
                      className={`${inputClass} pl-7`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSettingsTab === "Labels" && (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                ["contract", "Contract"],
                ["route", "Route"],
                ["driver", "Driver"],
                ["helper", "Helper"],
                ["claim", "Claim"],
                ["margin", "Margin"],
              ].map(([key, fallback]) => (
                <div key={key}>
                  <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${mutedText}`}>{fallback} Label</label>
                  <input
                    value={labelSettings[key]}
                    onChange={(event) => updateNestedSetting("labels", key, event.target.value)}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          )}

          {activeSettingsTab === "Employees" && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["requireDriverPhoto", "Require Driver Photo", "Driver must upload a daily readiness photo."],
                ["requireHelperPhoto", "Require Helper Photo", "Helper must upload a daily readiness photo."],
                ["trackCompliance", "Track Compliance", "Show readiness and document status for workers."],
                ["showClaimsByDriver", "Show Claims by Driver", "Assign claim exposure to individual drivers."],
              ].map(([key, label, note]) => (
                <div key={key} className={softCard}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className={`font-black ${titleText}`}>{label}</p>
                      <p className={`text-sm ${mutedText}`}>{note}</p>
                    </div>
                    <Toggle checked={employeeSettings[key]} onClick={() => updateNestedSetting("employees", key, !employeeSettings[key])} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSettingsTab === "Notifications" && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["missingPhoto", "Missing Photo Alerts", "Flag workers or routes missing daily photos."],
                ["highClaims", "High Claims Alerts", "Flag drivers or contracts with high exposure."],
                ["lowMargin", "Low Margin Alerts", "Show contracts or routes below target margin."],
                ["renewalReminder", "Renewal Reminders", "Warn before contract renewal dates."],
                ["dailySummary", "Daily Summary", "Prepare a simple daily operations summary."],
              ].map(([key, label, note]) => (
                <div key={key} className={softCard}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className={`font-black ${titleText}`}>{label}</p>
                      <p className={`text-sm ${mutedText}`}>{note}</p>
                    </div>
                    <Toggle checked={notificationSettings[key]} onClick={() => updateNestedSetting("notifications", key, !notificationSettings[key])} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className={cardClass}>
            <div className="grid gap-5 xl:grid-cols-[280px_1fr_360px]">
              <div>
                <h2 className={`text-lg font-black ${titleText}`}>Margin Profile</h2>
                <select
                  value={marginFactors.profile}
                  onChange={(event) => applyProfile(event.target.value)}
                  className={`${inputClass} mt-3`}
                >
                  {Object.keys(profilePresets).map((profile) => (
                    <option key={profile}>{profile}</option>
                  ))}
                </select>
                <p className={`mt-3 text-sm leading-6 ${mutedText}`}>
                  Pick a starting profile, then customize the individual factors below.
                </p>
              </div>

              <div className={softCard}>
                <div className="mb-4 flex items-center gap-2">
                  <h2 className={`text-lg font-black ${titleText}`}>Margin Formula Preview</h2>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${mutedText}`}>i</span>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
                  <div className={toneStyles.emerald + " rounded-2xl p-4 text-center"}>
                    <p className="text-sm font-black">Revenue</p>
                    <p className="mt-1 text-xs">{selectedCounts.revenue} factors</p>
                  </div>
                  <p className={`hidden text-center text-xl font-black md:block ${mutedText}`}>−</p>
                  <div className={toneStyles.red + " rounded-2xl p-4 text-center"}>
                    <p className="text-sm font-black">Costs</p>
                    <p className="mt-1 text-xs">{selectedCounts.costs} factors</p>
                  </div>
                  <p className={`hidden text-center text-xl font-black md:block ${mutedText}`}>=</p>
                  <div className={toneStyles.blue + " rounded-2xl p-4 text-center"}>
                    <p className="text-sm font-black">Net Profit</p>
                    <p className="mt-1 text-xs">Margin %</p>
                  </div>
                </div>

                <div className={`mt-4 grid gap-3 rounded-xl border p-3 text-sm ${rowBorder} md:grid-cols-3`}>
                  <div className="flex items-center gap-2 font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {selectedCounts.total} factors included
                  </div>
                  <div className={`font-bold ${mutedText}`}>{selectedCounts.excluded} factors excluded</div>
                  <button onClick={() => setActiveSettingsTab("Dashboard Layout")} className="font-black text-blue-600">View Layout</button>
                </div>
              </div>

              <div>
                <h2 className={`text-lg font-black ${titleText}`}>Formula Description</h2>
                <p className={`mt-4 text-sm leading-6 ${mutedText}`}>
                  Your margin is calculated as:
                </p>
                <p className={`mt-2 text-sm font-black ${titleText}`}>Total Revenue − Total Costs = Net Profit</p>
                <p className={`mt-4 text-sm leading-6 ${mutedText}`}>
                  Only the enabled factors below are included in profitability screens, reports, and exports.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            {categoryCards.map((card) => (
              <FactorCard key={card.key} card={card} />
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
            <div className={cardClass}>
              <div className="mb-5 flex items-center gap-3">
                <div className={toneStyles.blue + " flex h-11 w-11 items-center justify-center rounded-2xl"}>
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className={`text-lg font-black ${titleText}`}>Preview Impact</h2>
                  <p className={`text-sm ${mutedText}`}>See how your selected factors appear in the app.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                {[
                  ["Route Profit Check", `${selectedCounts.revenue + selectedCounts.costs + selectedCounts.metrics} fields shown`, "emerald", DollarSign],
                  ["All Contracts", `${selectedCounts.revenue + selectedCounts.costs} columns available`, "blue", FileText],
                  ["Reports", `${selectedCounts.metrics} metrics available`, "amber", BarChart3],
                  ["Exports", `${selectedCounts.total} factors exported`, "violet", Save],
                ].map(([title, subtitle, tone, Icon]) => (
                  <div key={title} className={toneStyles[tone] + " rounded-2xl p-4"}>
                    <Icon className="h-6 w-6" />
                    <p className="mt-3 text-sm font-black">{title}</p>
                    <p className="mt-1 text-xs">{subtitle}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={cardClass}>
              <div className="mb-5 flex items-center gap-3">
                <div className={toneStyles.blue + " flex h-11 w-11 items-center justify-center rounded-2xl"}>
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className={`text-lg font-black ${titleText}`}>Advanced Options</h2>
                  <p className={`text-sm ${mutedText}`}>Customize deeper margin controls.</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  ["Create Custom Factor", "Add a factor unique to your business"],
                  ["Manage Factor Order", "Reorder how factors appear in forms"],
                ].map(([title, subtitle]) => (
                  <div
                    key={title}
                    className={isDark ? "w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left" : "w-full rounded-xl border border-slate-200 bg-white p-4 text-left"}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className={`font-black ${titleText}`}>{title}</p>
                        <p className={`text-sm ${mutedText}`}>{subtitle}</p>
                      </div>
                      <span className={isDark ? "rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500"}>Planned</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SettingsDashboard;
