import React, { useMemo, useState } from "react";
import {
  accentThemes,
  BarChart3,
  CheckCircle2,
  currency,
  DollarSign,
  FileText,
  Save,
  Settings,
  ShieldCheck,
  Truck,
  Users,
} from "../shared";

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

function SettingsDashboard({ appSettings, setAppSettings }) {
  const selectedAccent = accentThemes?.[appSettings?.accentColor] || accentThemes?.blue || { from: "#2563eb", to: "#1d4ed8" };
  const isDark = appSettings?.themeMode === "dark";
  const dashboardWidgets = appSettings?.dashboardWidgets || {};
  const marginFactors = {
    ...defaultMarginFactors,
    ...(appSettings?.marginFactors || {}),
    revenue: { ...defaultMarginFactors.revenue, ...(appSettings?.marginFactors?.revenue || {}) },
    costs: { ...defaultMarginFactors.costs, ...(appSettings?.marginFactors?.costs || {}) },
    metrics: { ...defaultMarginFactors.metrics, ...(appSettings?.marginFactors?.metrics || {}) },
  };

  const [activeSettingsTab, setActiveSettingsTab] = useState("Margin Factors");
  const [savedFlash, setSavedFlash] = useState(false);

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

  const tabs = ["Company", "Defaults", "Margin Factors", "Claims", "Accessorials", "Labels", "Employees", "Notifications"];

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
    ["todaysProfit", "Today's Profit"],
    ["financialSummary", "Financial Summary"],
    ["needsAttention", "Needs Attention"],
    ["routeHealth", "Route Health"],
    ["routeEfficiency", "Route Efficiency"],
    ["recentClaims", "Recent Claims"],
    ["savedRoutes", "Saved Routes"],
    ["teamReadiness", "Team Readiness"],
    ["activeContracts", "Active Contracts"],
    ["upcomingRenewals", "Upcoming Renewals"],
    ["fuelCostTracker", "Fuel Cost Tracker"],
    ["documentExpirations", "Document Expirations"],
  ];

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
                  onClick={() => alert(`${label} is included when calculating or displaying ${card.title.toLowerCase()}.`)}
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
                {activeSettingsTab === "Defaults" && "Choose which dashboard widgets show by default."}
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

          {activeSettingsTab === "Defaults" && (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {dashboardWidgetLabels.map(([key, label]) => (
                <div key={key} className={softCard}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`font-black ${titleText}`}>{label}</p>
                      <p className={`text-sm ${mutedText}`}>Show on Dashboard</p>
                    </div>
                    <Toggle
                      checked={appSettings?.dashboardWidgets?.[key] !== false}
                      onClick={() => updateNestedSetting("dashboardWidgets", key, !(appSettings?.dashboardWidgets?.[key] !== false))}
                    />
                  </div>
                </div>
              ))}
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
                  <button onClick={() => setActiveSettingsTab("Defaults")} className="font-black text-blue-600">View All</button>
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
                  ["Single Route", `${selectedCounts.revenue + selectedCounts.costs + selectedCounts.metrics} fields shown`, "emerald", DollarSign],
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
                  <button
                    key={title}
                    onClick={() => alert(`${title} is ready for the next setup step.`)}
                    className={isDark ? "w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10" : "w-full rounded-xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className={`font-black ${titleText}`}>{title}</p>
                        <p className={`text-sm ${mutedText}`}>{subtitle}</p>
                      </div>
                      <span className={mutedText}>›</span>
                    </div>
                  </button>
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
