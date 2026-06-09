import React, { useMemo, useState } from "react";
import {
  accentThemes,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  currency,
  defaultSettings,
  DollarSign,
  FileText,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Truck,
} from "../shared";
import { Download } from "lucide-react";
import { roleOptions } from "../lib/teamAccessRepository";
import { resetStoredSetupProgress, restoreSetupPanel } from "../lib/onboarding";
import { readCompanyNames } from "../lib/marginProfiles";
import { exportMyData, deleteMyAccount } from "../lib/account";
import LaunchQAChecklist from "../components/LaunchQAChecklist";

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
    ["routePay", "Route Pay", "Base pay the retailer or 3PL pays for running the route."],
    ["perStopPay", "Per Stop Pay", "Extra pay earned for each delivery stop, on top of base route pay."],
    ["extraStops", "Extra Stops / Stops Pay", "Pay for stops beyond the contracted minimum."],
    ["installRevenue", "Install Revenue", "Pay for installing or hooking up appliances and products."],
    ["haulAwayRevenue", "Haul Away Revenue", "Pay for removing and hauling away old units."],
    ["fuelSurcharge", "Fuel Surcharge", "A fuel adjustment the retailer adds when fuel prices rise."],
    ["reattemptFee", "Reattempt / Redelivery Fee", "Pay for re-delivering after a failed first attempt."],
    ["stairsLongCarry", "Stairs / Long Carry", "Surcharge for stairs or a long carry into the home."],
    ["detentionWaitTime", "Detention / Wait Time", "Pay for time spent waiting at the warehouse or a stop."],
    ["assemblySetup", "Assembly / Setup", "Pay for assembling or setting up the product on site."],
    ["otherAccessorials", "Other Accessorials", "Any other add-on fee the contract pays."],
  ],
  costs: [
    ["driverPay", "Driver Pay", "What you pay the lead driver for the route."],
    ["helperPay", "Helper Pay", "What you pay the helper or second crew member."],
    ["truckPayment", "Truck Payment / Lease", "Daily share of the truck loan or lease payment."],
    ["truckInsurance", "Truck Insurance", "Daily share of vehicle and cargo insurance."],
    ["fuel", "Fuel", "Fuel burned running the route."],
    ["maintenance", "Maintenance / Repairs", "Repairs, tires, oil, and upkeep (often figured per mile)."],
    ["tollsParking", "Tolls / Parking", "Tolls and parking paid while running the route."],
    ["claimsReserve", "Claims Reserve", "Money set aside to cover expected damage claims and chargebacks."],
    ["bond", "Bond", "Daily share of any surety bond you carry."],
    ["phonesSoftware", "Phones / Software", "Phones, routing apps, and software fees."],
    ["warehouseFees", "Warehouse Fees", "Fees for warehouse or dock access and staging."],
    ["uniformsPpe", "Uniforms / PPE", "Uniforms and protective equipment for the crew."],
    ["backgroundChecks", "Background Checks", "Cost of running driver and helper background checks."],
    ["drugTests", "Drug Tests", "Cost of required drug testing."],
    ["dotCompliance", "DOT / Compliance", "DOT, licensing, and compliance costs."],
    ["otherExpenses", "Other Expenses", "Any other route cost not listed above."],
  ],
  metrics: [
    ["marginPercent", "Margin %", "Profit as a percent of revenue — your core profitability number."],
    ["netProfit", "Net Profit ($)", "Revenue minus all costs, in dollars."],
    ["profitPerStop", "Profit / Stop", "Net profit divided by the number of stops."],
    ["profitPerMile", "Profit / Mile", "Net profit divided by miles driven."],
    ["profitPerHour", "Profit / Hour", "Net profit divided by route hours."],
    ["stopsPerHour", "Stops Per Hour", "Delivery stops completed per hour — a pace gauge."],
    ["milesPerStop", "Miles Per Stop", "Average miles between stops — how dense the route is."],
    ["laborPercentRevenue", "Labor % of Revenue", "Driver plus helper pay as a percent of revenue."],
    ["fuelPercentRevenue", "Fuel % of Revenue", "Fuel cost as a percent of revenue."],
    ["claimsPerRoute", "Claims per Route", "Average number of claims generated per route."],
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
  authUser = null,
  onSignOut,
}) {
  const selectedAccent = accentThemes?.[appSettings?.accentColor] || accentThemes?.blue || { from: "#2563eb", to: "#1d4ed8" };
  const isDark = appSettings?.themeMode === "dark";
  // Per-company margin profiles. "__default__" edits the global config that
  // applies to every company; selecting a company edits that company's override
  // (seeded from the global config until it's first customized).
  const companyList = useMemo(() => readCompanyNames(), []);
  const [marginScope, setMarginScope] = useState("__default__");
  const isDefaultScope = marginScope === "__default__";
  const hasCompanyOverride = !isDefaultScope && Boolean(appSettings?.companyMarginProfiles?.[marginScope]);
  const scopeFactors = isDefaultScope
    ? appSettings?.marginFactors
    : (appSettings?.companyMarginProfiles?.[marginScope] || appSettings?.marginFactors);
  const marginFactors = {
    ...defaultMarginFactors,
    ...(scopeFactors || {}),
    revenue: { ...defaultMarginFactors.revenue, ...(scopeFactors?.revenue || {}) },
    costs: { ...defaultMarginFactors.costs, ...(scopeFactors?.costs || {}) },
    metrics: { ...defaultMarginFactors.metrics, ...(scopeFactors?.metrics || {}) },
  };

  const [activeSettingsTab, setActiveSettingsTab] = useState("Margin Factors");
  const [savedFlash, setSavedFlash] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState("");
  const [inviteDraft, setInviteDraft] = useState({ email: "", role: "dispatcher" });
  const [isInviting, setIsInviting] = useState(false);
  const [exportState, setExportState] = useState("idle"); // idle | working | done | error
  const [accountError, setAccountError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    setAccountError("");
    setExportState("working");
    const result = await exportMyData();
    if (result.ok) {
      setExportState("done");
      window.setTimeout(() => setExportState("idle"), 4000);
    } else {
      setExportState("error");
      setAccountError(result.error || "Could not export your data.");
    }
  };

  const handleDeleteAccount = async () => {
    setAccountError("");
    setIsDeleting(true);
    const result = await deleteMyAccount();
    if (result.ok) {
      // Account is gone — sign out and return to the landing page.
      if (onSignOut) await onSignOut();
      window.location.reload();
    } else {
      setIsDeleting(false);
      setAccountError(result.error || "Could not delete your account.");
    }
  };

  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const pageClass = isDark ? "space-y-5 text-white" : "space-y-5 text-slate-950";
  const cardClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card"
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
    setAppSettings((current) => {
      if (isDefaultScope) {
        return { ...current, marginFactors: nextFactors };
      }
      return {
        ...current,
        companyMarginProfiles: {
          ...(current.companyMarginProfiles || {}),
          [marginScope]: nextFactors,
        },
      };
    });
  };

  const resetCompanyToDefault = () => {
    if (isDefaultScope) return;
    setAppSettings((current) => {
      const next = { ...(current.companyMarginProfiles || {}) };
      delete next[marginScope];
      return { ...current, companyMarginProfiles: next };
    });
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

  // ── Manage Factor Order ──────────────────────────────────────────────────
  const [reorderMode, setReorderMode] = useState(false);

  const orderItemsByCategory = (category, items) => {
    const order = appSettings?.factorOrder?.[category];
    if (!Array.isArray(order) || !order.length) return items;
    const byKey = new Map(items.map((item) => [item[0], item]));
    const ordered = order.map((key) => byKey.get(key)).filter(Boolean);
    const remaining = items.filter((item) => !order.includes(item[0]));
    return [...ordered, ...remaining];
  };

  const moveFactor = (category, items, key, direction) => {
    const orderedKeys = orderItemsByCategory(category, items).map((item) => item[0]);
    const index = orderedKeys.indexOf(key);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= orderedKeys.length) return;
    [orderedKeys[index], orderedKeys[target]] = [orderedKeys[target], orderedKeys[index]];
    setAppSettings((current) => ({
      ...current,
      factorOrder: { ...(current.factorOrder || {}), [category]: orderedKeys },
    }));
  };

  const resetFactorOrder = () => {
    setAppSettings((current) => {
      const next = { ...current };
      delete next.factorOrder;
      return next;
    });
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

  const tabs = ["Company", "Team Access", "Margin Factors", "Targets", "Claims", "Employees", "Notifications", "Account"];

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

  const canManageTeamAccess = ["owner", "admin"].includes(currentUserRole);
  const roleLabelByValue = Object.fromEntries(roleOptions.map((role) => [role.value, role.label]));

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

  // Merge stored values over the defaults so toggling one setting never blanks the others.
  const employeeSettings = {
    requireDriverPhoto: true,
    ...(appSettings?.employees || {}),
  };
  const notificationSettings = {
    missingPhoto: true,
    highClaims: true,
    lowMargin: true,
    renewalReminder: true,
    dailySummary: true,
    ...(appSettings?.notifications || {}),
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
    ["Margin targets", Boolean(appSettings?.profitabilityBenchmarks)],
    ["Claim thresholds", Boolean(appSettings?.claimRiskThresholds)],
  ];
  const companyCompletenessCount = companyCompleteness.filter(([, done]) => done).length;
  const statusLooksSynced = (value = "") => /synced|loaded|connected|ready/i.test(String(value));
  const statusLooksLocal = (value = "") => /local|unavailable|failed/i.test(String(value));
  const launchQaChecks = [
    {
      label: "Workspace save state",
      done: statusLooksSynced(appStateBackendStatus),
      detail: appStateBackendStatus || "App state sync has not reported yet.",
      next: statusLooksLocal(appStateBackendStatus) ? "Review Supabase app state setup" : "Waiting on sync status",
    },
    {
      label: "Claims save state",
      done: statusLooksSynced(claimsBackendStatus),
      detail: claimsBackendStatus || "Claims sync has not reported yet.",
      next: statusLooksLocal(claimsBackendStatus) ? "Review Supabase claims setup" : "Waiting on claims status",
    },
    {
      label: "Team access",
      done: statusLooksSynced(teamAccessStatus) || teamMembers.length > 0,
      detail: teamAccessStatus || "Team access has not loaded yet.",
      next: "Invite a team member or confirm Supabase access",
    },
    {
      label: "Company profile",
      done: companyCompletenessCount >= 4,
      detail: `${companyCompletenessCount} of ${companyCompleteness.length} profile controls are filled.`,
      next: "Finish company profile",
    },
    {
      label: "Onboarding recovery",
      done: true,
      detail: "Setup guidance can be restored and checklist progress can be reset.",
      next: "No action needed",
    },
    {
      label: "Export readiness",
      done: true,
      detail: "Reports generate owner-ready PDF files from available route, claims, team, and snapshot data.",
      next: "Daily history builds automatically",
    },
    {
      label: "Mobile review",
      done: false,
      detail: "Dashboard, Intake, Claims, Teams, and Receipts still need a dedicated phone-width QA pass.",
      next: "Run mobile QA pass",
    },
    {
      label: "Refresh survival",
      done: statusLooksSynced(appStateBackendStatus),
      detail: "Hard refresh every major tab before launch to confirm data survives route reloads.",
      next: "Run refresh QA",
    },
  ];

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
              <h3 className={`text-lg font-bold ${titleText}`}>{card.title}</h3>
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
          {orderItemsByCategory(card.key, card.items).map(([key, label, description], index, arr) => (
            <div key={key} className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                {reorderMode ? (
                  <span className="mt-0.5 flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveFactor(card.key, card.items, key, "up")}
                      disabled={index === 0}
                      aria-label={`Move ${label} up`}
                      className={`leading-none ${index === 0 ? "opacity-30" : "text-blue-600 hover:text-blue-500"}`}
                    >▲</button>
                    <button
                      type="button"
                      onClick={() => moveFactor(card.key, card.items, key, "down")}
                      disabled={index === arr.length - 1}
                      aria-label={`Move ${label} down`}
                      className={`leading-none ${index === arr.length - 1 ? "opacity-30" : "text-blue-600 hover:text-blue-500"}`}
                    >▼</button>
                  </span>
                ) : (
                  <span className={`mt-0.5 text-xs ${mutedText}`}>⋮⋮</span>
                )}
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${titleText}`}>{label}</p>
                  {description && <p className={`text-xs leading-snug ${mutedText}`}>{description}</p>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() => showNotice(`${label}: ${description || `included when calculating or displaying ${card.title.toLowerCase()}.`} Toggle it off to leave it out of your margin math.`)}
                  title={description || ""}
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
      <div data-tour="settings-header" className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className={`text-3xl font-black leading-tight tracking-tight sm:text-4xl ${titleText}`}>Settings</h1>
          <p className={`mt-1 text-sm font-semibold sm:text-base ${mutedText}`}>Configure your business, margin calculations, and workspace preferences.</p>
        </div>

        <button
          onClick={savePreferences}
          className="flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
        >
          <Save className="h-4 w-4" />
          {savedFlash ? "Saved" : "Save Preferences"}
        </button>
      </div>

      <div data-tour="settings-backend-sync" className={cardClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className={toneStyles.emerald + " flex h-11 w-11 items-center justify-center rounded-2xl"}>
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${titleText}`}>Backend Sync</h2>
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

      <div data-tour="settings-onboarding-controls" className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className={cardClass}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Onboarding controls</p>
              <h2 className={`mt-1 text-xl font-bold ${titleText}`}>Setup guidance stays recoverable</h2>
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
        </div>

        <div className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Company profile</p>
          <h2 className={`mt-1 text-lg font-bold ${titleText}`}>{companyCompletenessCount} of {companyCompleteness.length} complete</h2>
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

      <LaunchQAChecklist isDark={isDark} checks={launchQaChecks} />

      <div data-tour="settings-tab-selector" className={`flex gap-7 overflow-x-auto border-b ${rowBorder}`}>
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
        <div data-tour="settings-active-panel" className={cardClass}>
          <div className="flex items-center gap-3">
            <div className={toneStyles.blue + " flex h-12 w-12 items-center justify-center rounded-2xl"}>
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${titleText}`}>{activeSettingsTab}</h2>
              <p className={`text-sm ${mutedText}`}>
                {activeSettingsTab === "Company" && "Business identity, theme, and accent settings."}
                {activeSettingsTab === "Team Access" && "Invite users and control what each role can access."}
                {activeSettingsTab === "Dashboard Layout" && "Control which dashboard sections show and the order they appear in."}
                {activeSettingsTab === "Claims" && "Set claim review rules, including amount thresholds for risk levels."}
                {activeSettingsTab === "Employees" && "Control driver/helper readiness and accountability settings."}
                {activeSettingsTab === "Notifications" && "Choose the alerts you want the app to surface."}
                {activeSettingsTab === "Account" && "Export your data or permanently delete your account."}
              </p>
            </div>
          </div>

          {activeSettingsTab === "Company" && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Company Name</label>
                <input
                  value={appSettings?.companyName || "Final Mile Delivery"}
                  onChange={(event) => updateSetting("companyName", event.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Theme Mode</label>
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
                <label className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Accent Color</label>
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
              <div data-tour="settings-formula-preview" className={softCard}>
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
                      <h3 className={`text-lg font-bold ${titleText}`}>Business Users</h3>
                      <p className={`mt-1 text-sm leading-6 ${mutedText}`}>
                        Your account is the owner. Add people here first, then they can be connected to Supabase Auth when the invite email flow is turned on.
                      </p>
                    </div>
                    <span className={isDark ? "w-fit rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-200" : "w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700"}>
                      You are {roleLabelByValue[currentUserRole] || currentUserRole}
                    </span>
                  </div>

                  <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-bold ${isDark ? "border-white/10 bg-slate-950/70 text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}>
                    {teamAccessStatus || "Team access status will appear here."}
                  </div>
                </div>

                <form onSubmit={submitInvite} className={softCard}>
                  <h3 className={`text-lg font-bold ${titleText}`}>Add Team Member</h3>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Email</label>
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
                      <label className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Role</label>
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
                    <h3 className={`text-lg font-bold ${titleText}`}>Members and Roles</h3>
                    <p className={`text-sm ${mutedText}`}>{teamMembers.length} user{teamMembers.length === 1 ? "" : "s"} connected to this business workspace.</p>
                  </div>
                </div>

                <div className={`overflow-hidden rounded-2xl border ${rowBorder}`}>
                  <div className={isDark ? "grid grid-cols-[1.3fr_160px_140px] gap-3 bg-slate-950/70 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400" : "grid grid-cols-[1.3fr_160px_140px] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"}>
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

          {activeSettingsTab === "Targets" && (
            <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_360px]">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Target Margin</label>
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
                  <p className={`mt-1 text-xs leading-snug ${mutedText}`}>The margin you aim to clear on a route. Routes at or above this read as healthy.</p>
                </div>

                <div>
                  <label className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Claims Reserve Target</label>
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
                  <p className={`mt-1 text-xs leading-snug ${mutedText}`}>How much to set aside for claims and chargebacks — a buffer so one bad week doesn't erase the month.</p>
                </div>

                <div>
                  <label className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Review Line Margin</label>
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
                  <p className={`mt-1 text-xs leading-snug ${mutedText}`}>Your red line. Routes below this margin get flagged for review.</p>
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
                <p className={`md:col-span-2 text-xs leading-5 ${mutedText}`}>
                  These dollar amounts decide how each claim is flagged. A claim at or above the High amount is marked <span className="font-bold">High risk</span>; at or above Medium it's <span className="font-bold">Medium</span>; below that it's <span className="font-bold">Low</span>. Risk flags drive the review queue and the alerts on Operations and Compliance.
                </p>
                <div>
                  <label className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Medium Risk Starts At</label>
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
                  <label className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${mutedText}`}>High Risk Starts At</label>
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

          {activeSettingsTab === "Employees" && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["requireDriverPhoto", "Require Driver Photo", "Daily route photo counts toward team readiness. Turn off to drop it from the readiness score and stop missing-photo alerts."],
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
                ["missingPhoto", "Missing Photo Alerts", "Surface teams missing today's route photo in your Do-this-now feed."],
                ["highClaims", "High Claims Alerts", "Surface high-value, contestable claims in your feed."],
                ["lowMargin", "Low Margin Alerts", "Surface margin drops, thin routes, and the forecast nudge in your feed."],
                ["renewalReminder", "Renewal Reminders", "Surface expiring insurance, DOT, and license documents in your feed."],
                ["dailySummary", "Daily Summary", "Show the AI-written summary line at the top of your feed."],
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

          {activeSettingsTab === "Account" && (
            <div className="mt-6 space-y-4">
              {authUser?.email && (
                <p className={`text-sm font-semibold ${mutedText}`}>
                  Signed in as <span className={titleText}>{authUser.email}</span>.
                </p>
              )}

              {accountError && (
                <div className={isDark ? "rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300" : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600"}>
                  {accountError}
                </div>
              )}

              {/* Export */}
              <div className={softCard}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className={`font-black ${titleText}`}>Export my data</p>
                    <p className={`text-sm ${mutedText}`}>
                      Download everything in your workspace — claims, financials, documents, and settings — as a JSON file.
                    </p>
                    {exportState === "done" && (
                      <p className="mt-1 text-sm font-bold text-emerald-600">Your data has been downloaded.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    disabled={exportState === "working"}
                    className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Download className="h-4 w-4" />
                    {exportState === "working" ? "Preparing…" : "Export"}
                  </button>
                </div>
              </div>

              {/* Delete */}
              <div className={isDark ? "rounded-2xl border border-red-500/30 bg-red-500/5 p-5" : "rounded-2xl border border-red-200 bg-red-50/60 p-5"}>
                <div className="flex items-start gap-3">
                  <div className={isDark ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-300" : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600"}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-black ${isDark ? "text-red-200" : "text-red-700"}`}>Delete my account</p>
                    <p className={`mt-1 text-sm leading-6 ${isDark ? "text-red-200/80" : "text-red-600/90"}`}>
                      Permanently deletes your account and all associated data — claims, financials, documents, team, and
                      settings. Any active subscription is cancelled. This cannot be undone.
                    </p>

                    {!deleteOpen ? (
                      <button
                        type="button"
                        onClick={() => { setDeleteOpen(true); setAccountError(""); }}
                        className={isDark ? "mt-4 flex items-center gap-2 rounded-xl border border-red-500/40 px-4 py-2.5 text-sm font-black text-red-300 hover:bg-red-500/10" : "mt-4 flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-black text-red-600 hover:bg-red-50"}
                      >
                        <Trash2 className="h-4 w-4" /> Delete account
                      </button>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <label className={`block text-sm font-bold ${isDark ? "text-red-200" : "text-red-700"}`}>
                          Type <span className="font-black">DELETE</span> to confirm
                        </label>
                        <input
                          type="text"
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder="DELETE"
                          autoComplete="off"
                          className={isDark ? "w-full max-w-xs rounded-xl border border-red-500/40 bg-slate-950/60 px-3 py-2 text-sm font-bold text-white outline-none focus:border-red-400" : "w-full max-w-xs rounded-xl border border-red-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-red-500"}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirm !== "DELETE" || isDeleting}
                            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            {isDeleting ? "Deleting…" : "Permanently delete"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDeleteOpen(false); setDeleteConfirm(""); setAccountError(""); }}
                            disabled={isDeleting}
                            className={isDark ? "rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5 disabled:opacity-50" : "rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className={cardClass}>
            <div className="grid gap-5 xl:grid-cols-[280px_1fr_360px]">
              <div>
                <h2 className={`text-lg font-bold ${titleText}`}>Configure for</h2>
                <select
                  value={marginScope}
                  onChange={(event) => setMarginScope(event.target.value)}
                  className={`${inputClass} mt-3`}
                >
                  <option value="__default__">All companies (default)</option>
                  {companyList.map((company) => (
                    <option key={company} value={company}>
                      {company}{appSettings?.companyMarginProfiles?.[company] ? " — custom" : ""}
                    </option>
                  ))}
                </select>
                {!isDefaultScope && (
                  <p className={`mt-2 text-xs font-semibold leading-5 ${hasCompanyOverride ? "text-emerald-600" : mutedText}`}>
                    {hasCompanyOverride
                      ? `Custom margin profile for ${marginScope}.`
                      : `${marginScope} currently uses the default — edit any factor below to create its own profile.`}
                    {hasCompanyOverride && (
                      <button type="button" onClick={resetCompanyToDefault} className="ml-2 font-black text-blue-600 hover:underline">
                        Reset to default
                      </button>
                    )}
                  </p>
                )}
                {companyList.length === 0 && (
                  <p className={`mt-2 text-xs leading-5 ${mutedText}`}>
                    Add contracts in Finance → Contracts to set per-company profiles.
                  </p>
                )}

                <h2 className={`mt-5 text-lg font-bold ${titleText}`}>Starting Template</h2>
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
                  {isDefaultScope
                    ? "Sets the default factors for every company. Pick a starting template, then customize below."
                    : `Pick a starting template for ${marginScope}, then customize the factors below — this only affects ${marginScope}.`}
                </p>
              </div>

              <div className={softCard}>
                <div className="mb-4 flex items-center gap-2">
                  <h2 className={`text-lg font-bold ${titleText}`}>Margin Formula Preview</h2>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${mutedText}`}>i</span>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
                  <div className={toneStyles.emerald + " rounded-2xl p-4 text-center"}>
                    <p className="text-sm font-black">Revenue</p>
                    <p className="mt-1 text-xs">{selectedCounts.revenue} factors</p>
                  </div>
                  <p className={`hidden text-center text-xl font-bold md:block ${mutedText}`}>−</p>
                  <div className={toneStyles.red + " rounded-2xl p-4 text-center"}>
                    <p className="text-sm font-black">Costs</p>
                    <p className="mt-1 text-xs">{selectedCounts.costs} factors</p>
                  </div>
                  <p className={`hidden text-center text-xl font-bold md:block ${mutedText}`}>=</p>
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
                <h2 className={`text-lg font-bold ${titleText}`}>Formula Description</h2>
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

          <div data-tour="settings-factor-cards" className="grid gap-5 xl:grid-cols-3">
            {categoryCards.map((card) => (
              <FactorCard key={card.key} card={card} />
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
            <div data-tour="settings-preview-impact" className={cardClass}>
              <div className="mb-5 flex items-center gap-3">
                <div className={toneStyles.blue + " flex h-11 w-11 items-center justify-center rounded-2xl"}>
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${titleText}`}>Preview Impact</h2>
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

            <div data-tour="settings-advanced-options" className={cardClass}>
              <div className="mb-5 flex items-center gap-3">
                <div className={toneStyles.blue + " flex h-11 w-11 items-center justify-center rounded-2xl"}>
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${titleText}`}>Advanced Options</h2>
                  <p className={`text-sm ${mutedText}`}>Customize deeper margin controls.</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Manage Factor Order — functional */}
                <div className={isDark ? "w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left" : "w-full rounded-xl border border-slate-200 bg-white p-4 text-left"}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`font-black ${titleText}`}>Manage Factor Order</p>
                      <p className={`text-sm ${mutedText}`}>Reorder how factors appear in the lists above.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReorderMode((value) => !value)}
                      className={
                        reorderMode
                          ? "shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-500"
                          : isDark
                            ? "shrink-0 rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/5"
                            : "shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-blue-600 hover:bg-slate-50"
                      }
                    >
                      {reorderMode ? "Done" : "Reorder"}
                    </button>
                  </div>
                  {reorderMode && (
                    <p className={`mt-3 text-xs font-semibold leading-5 ${mutedText}`}>
                      Use the ▲▼ arrows next to each factor in the cards above to reorder them.
                      <button type="button" onClick={resetFactorOrder} className="ml-2 font-black text-blue-600 hover:underline">
                        Reset to default order
                      </button>
                    </p>
                  )}
                </div>

                {/* Create Custom Factor — planned */}
                <div className={isDark ? "w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left" : "w-full rounded-xl border border-slate-200 bg-white p-4 text-left"}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`font-black ${titleText}`}>Create Custom Factor</p>
                      <p className={`text-sm ${mutedText}`}>Add a factor unique to your business</p>
                    </div>
                    <span className={isDark ? "rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500"}>Planned</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SettingsDashboard;
