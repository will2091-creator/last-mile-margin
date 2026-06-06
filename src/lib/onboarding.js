const STORAGE_KEYS = {
  quickContracts: "finalMileRollupRows",
  blankQuickContracts: "finalMileBlankDemoRollupRows",
  demoQuickContracts: "finalMileDemoRollupRows",
  quickImports: "finalMileOnboardingImports",
  blankQuickImports: "finalMileBlankDemoOnboardingImports",
  demoQuickImports: "finalMileDemoOnboardingImports",
  setupWizard: "finalMileSetupWizard",
  blankSetupWizard: "finalMileBlankDemoSetupWizard",
  demoSetupWizard: "finalMileDemoSetupWizard",
  receipts: "finalMileUploadedReceipts",
  blankReceipts: "finalMileBlankDemoUploadedReceipts",
  demoReceipts: "finalMileDemoUploadedReceipts",
};

export const setupSteps = [
  {
    id: "profile",
    label: "Profile",
    title: "Confirm company profile",
    outcome: "Names the workspace and sets owner targets.",
    tab: "Settings",
    actionLabel: "Open Settings",
  },
  {
    id: "contract",
    label: "Contract",
    title: "Add your first contract",
    outcome: "Unlocks revenue, route pay, and rate terms.",
    tab: "Dashboard",
    actionLabel: "Add Contract",
  },
  {
    id: "team",
    label: "Team",
    title: "Add your first team",
    outcome: "Unlocks drivers, trucks, routes, and readiness.",
    tab: "Teams",
    actionLabel: "Add Team",
  },
  {
    id: "expenses",
    label: "Expenses",
    title: "Enter expense basics",
    outcome: "Turns route revenue into real margin.",
    tab: "Profitability",
    actionLabel: "Open Profit Calculator",
  },
  {
    id: "data",
    label: "Import",
    title: "Import starting data",
    outcome: "Loads contracts, claim emails, receipts, or route notes.",
    tab: "Intake",
    actionLabel: "Open Intake",
  },
  {
    id: "snapshot",
    label: "Snapshot",
    title: "Save first snapshot",
    outcome: "Creates report history for weekly and monthly review.",
    tab: "Dashboard",
    actionLabel: "Save Snapshot",
  },
];

const safeArray = (value) => (Array.isArray(value) ? value : []);

export function readStoredArray(key) {
  if (typeof window === "undefined" || !key) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readSetupWizard(isBlankDemo = false, isDemoMode = false) {
  if (typeof window === "undefined") return { skipped: {}, previewed: false };
  try {
    const key = isDemoMode ? STORAGE_KEYS.demoSetupWizard : isBlankDemo ? STORAGE_KEYS.blankSetupWizard : STORAGE_KEYS.setupWizard;
    const parsed = JSON.parse(window.localStorage.getItem(key) || "{}");
    return {
      skipped: parsed?.skipped || {},
      previewed: Boolean(parsed?.previewed),
    };
  } catch {
    return { skipped: {}, previewed: false };
  }
}

const readWorkspaceArray = ({ provided, isBlankDemo, mainKey, blankKey }) => {
  if (Array.isArray(provided)) return provided;
  if (isBlankDemo === true) return readStoredArray(blankKey);
  if (isBlankDemo === false) return readStoredArray(mainKey);
  return [...readStoredArray(mainKey), ...readStoredArray(blankKey)];
};

const readWorkspaceArrayWithDemo = ({ provided, isBlankDemo, isDemoMode, mainKey, blankKey, demoKey }) => {
  if (Array.isArray(provided)) return provided;
  if (isDemoMode) return readStoredArray(demoKey);
  return readWorkspaceArray({ provided, isBlankDemo, mainKey, blankKey });
};

const hasExpenseValues = (contracts) =>
  safeArray(contracts).some((row) => {
    const totalCosts =
      Number(row?.labor || 0) +
      Number(row?.fuel || 0) +
      Number(row?.truckInsurance || 0) +
      Number(row?.maintenance || 0) +
      Number(row?.claims || 0) +
      Number(row?.other || 0);
    return totalCosts > 0;
  });

export function getSetupStatus({
  teams,
  claims,
  quickContracts,
  quickImports,
  receipts,
  savedScenarios,
  savedDays,
  appSettings,
  isBlankDemo,
  isDemoMode,
} = {}) {
  const contracts = readWorkspaceArrayWithDemo({
    provided: quickContracts,
    isBlankDemo,
    isDemoMode,
    mainKey: STORAGE_KEYS.quickContracts,
    blankKey: STORAGE_KEYS.blankQuickContracts,
    demoKey: STORAGE_KEYS.demoQuickContracts,
  });
  const imports = readWorkspaceArrayWithDemo({
    provided: quickImports,
    isBlankDemo,
    isDemoMode,
    mainKey: STORAGE_KEYS.quickImports,
    blankKey: STORAGE_KEYS.blankQuickImports,
    demoKey: STORAGE_KEYS.demoQuickImports,
  });
  const uploadedReceipts = readWorkspaceArrayWithDemo({
    provided: receipts,
    isBlankDemo,
    isDemoMode,
    mainKey: STORAGE_KEYS.receipts,
    blankKey: STORAGE_KEYS.blankReceipts,
    demoKey: STORAGE_KEYS.demoReceipts,
  });
  const wizard = readSetupWizard(Boolean(isBlankDemo), Boolean(isDemoMode));

  const hasContracts = contracts.length > 0;
  const hasTeams = safeArray(teams).length > 0;
  const hasClaims = safeArray(claims).length > 0;
  const hasReceipts = uploadedReceipts.length > 0;
  const hasSavedSnapshots = safeArray(savedDays).length > 0;
  const hasSavedScenarios = safeArray(savedScenarios).length > 0;
  const hasImports = imports.length > 0;
  const hasExpenses = hasExpenseValues(contracts) || hasSavedScenarios;
  const hasCompanyProfile = Boolean(appSettings?.companyName || appSettings?.companyLogo);
  const hasTargets = Boolean(appSettings?.profitabilityBenchmarks || appSettings?.claimRiskThresholds);
  const hasAnyBusinessData = hasContracts || hasTeams || hasClaims || hasReceipts || hasImports || hasSavedSnapshots || hasSavedScenarios;

  const checks = {
    profile: hasCompanyProfile,
    contract: hasContracts,
    team: hasTeams,
    expenses: hasExpenses,
    data: hasImports || hasClaims,
    claims: hasClaims,
    receipts: hasReceipts,
    reports: hasSavedSnapshots,
    snapshot: hasSavedSnapshots,
    ask: hasContracts || hasTeams || hasClaims || hasReceipts || hasSavedSnapshots,
    preview: wizard.previewed,
  };

  const items = setupSteps.map((step) => ({
    ...step,
    complete: Boolean(checks[step.id]),
    skipped: Boolean(wizard.skipped?.[step.id]),
  }));

  const completeCount = items.filter((item) => item.complete).length;
  const skippedCount = items.filter((item) => item.skipped && !item.complete).length;
  const requiredCount = items.length;
  const percent = Math.round((completeCount / requiredCount) * 100);

  return {
    items,
    checks,
    completeCount,
    skippedCount,
    requiredCount,
    percent,
    isComplete: completeCount === requiredCount,
    isMostlyComplete: percent >= 70,
    hasAnyBusinessData,
    counts: {
      contracts: contracts.length,
      teams: safeArray(teams).length,
      claims: safeArray(claims).length,
      imports: imports.length,
      receipts: uploadedReceipts.length,
      savedScenarios: safeArray(savedScenarios).length,
      savedDays: safeArray(savedDays).length,
    },
    contracts,
    imports,
    receipts: uploadedReceipts,
    savedDays: safeArray(savedDays),
    savedScenarios: safeArray(savedScenarios),
    companyProfile: {
      hasCompanyProfile,
      hasTargets,
      hasDashboardLayout: Boolean(appSettings?.dashboardWidgetOrder),
      hasTheme: Boolean(appSettings?.accentColor || appSettings?.themeMode),
    },
  };
}

export function getNextBestSetupAction(status) {
  const current = status || getSetupStatus();
  const nextItem =
    current.items.find((item) => !item.complete && !item.skipped) ||
    current.items.find((item) => !item.complete) ||
    current.items[current.items.length - 1];

  const actionDetails = {
    profile: {
      title: "Confirm company profile",
      detail: "Set the company name, owner targets, dashboard layout, and business controls.",
      tab: "Settings",
      actionLabel: "Open Settings",
    },
    contract: {
      title: "Create your first contract",
      detail: "Start with the customer name, route pay, routes per week, stops, and baseline costs.",
      tab: "Dashboard",
      actionLabel: "Add Contract",
    },
    team: {
      title: "Build your first route team",
      detail: "Add the driver, helper, truck, and route so Operations can track readiness.",
      tab: "Teams",
      actionLabel: "Add Team",
    },
    expenses: {
      title: "Finish expense setup",
      detail: "Add labor, fuel, truck, insurance, maintenance, and other recurring costs.",
      tab: "Profitability",
      actionLabel: "Open Profit Calculator",
    },
    data: {
      title: "Import the data you already have",
      detail: "Paste a claim email, route sheet, contract note, or receipt into Intake.",
      tab: "Intake",
      actionLabel: "Open Intake",
    },
    claims: {
      title: "Add or import claims",
      detail: "Claims tell you where money is leaking and what needs evidence.",
      tab: "Claims",
      actionLabel: "Open Claims",
    },
    receipts: {
      title: "Upload your first receipt",
      detail: "Receipts prove gas, tools, maintenance, parking, tolls, and owner expenses.",
      tab: "Receipts",
      actionLabel: "Open Receipts",
    },
    reports: {
      title: "Save a snapshot",
      detail: "Snapshots create the history Reports needs for trend and PDF exports.",
      tab: "Reports",
      actionLabel: "Open Reports",
    },
    ask: {
      title: "Ask your first business question",
      detail: "Ask gets sharper once it can see contracts, teams, claims, and receipts.",
      tab: "Ask",
      actionLabel: "Open Ask",
    },
    snapshot: {
      title: "Save your first snapshot",
      detail: "Save today once contract, team, and cost basics are in place so Reports can build history.",
      tab: "Dashboard",
      actionLabel: "Save Snapshot",
    },
  };

  return {
    ...(actionDetails[nextItem?.id] || actionDetails.contract),
    id: nextItem?.id || "contract",
    item: nextItem,
  };
}

export function getPageEmptyStateConfig(pageName, status) {
  const current = status || getSetupStatus();
  const page = String(pageName || "").toLowerCase();
  const next = getNextBestSetupAction(current);

  const configs = {
    operations: {
      eyebrow: "Operations setup",
      title: "Start with dispatch, teams, claims, and compliance",
      description: "Operations becomes your daily field board once teams, photos, claims, and blockers are entered.",
      primaryAction: { label: "Add Team", tab: "Teams" },
      secondaryActions: [
        { label: "Import Claim", tab: "Claims" },
        { label: "Review Compliance", tab: "Compliance" },
      ],
    },
    finance: {
      eyebrow: "Finance setup",
      title: "Create the money system before the reports",
      description: "Finance connects contract terms, route costs, receipts, and profitability so margins are based on real inputs.",
      primaryAction: { label: "Create First Contract", tab: "Dashboard", setupStep: "contract" },
      secondaryActions: [
        { label: "Import Contract", tab: "Intake" },
        { label: "Open Profit Calculator", tab: "Profitability" },
      ],
    },
    profitability: {
      eyebrow: "Profit check",
      title: "Run your first route profit check",
      description: "Enter revenue, labor, fuel, truck costs, and claims reserve to see profit per stop, mile, hour, and route.",
      primaryAction: { label: "Start Blank Calculator", tab: "Profitability" },
      secondaryActions: [
        { label: "Use Setup Contract", tab: "Dashboard", setupStep: "contract" },
        { label: "Save Scenario", tab: "Profitability" },
      ],
    },
    contracts: {
      eyebrow: "Contract setup",
      title: "No contract rate cards yet",
      description: "Add customer terms, route pay, stop pay, claim terms, renewal dates, and rate structure before Finance can judge margin.",
      primaryAction: { label: "Create First Contract", tab: "Dashboard", setupStep: "contract" },
      secondaryActions: [
        { label: "Import Contract", tab: "Intake" },
        { label: "Open Profitability", tab: "Profitability" },
      ],
    },
    receipts: {
      eyebrow: "Expense proof",
      title: "No receipts uploaded yet",
      description: "Gas, tools, maintenance, parking, and toll receipts uploaded from the mobile app will appear here for owner review.",
      primaryAction: { label: "Open Intake", tab: "Intake" },
      secondaryActions: [
        { label: "Review Mobile Setup", tab: "Settings" },
        { label: "View Finance", tab: "Finance" },
      ],
    },
    claims: {
      eyebrow: "Claims setup",
      title: "No claims yet",
      description: "Claim emails, damage claims, penalties, cargo issues, and property claims will appear here for review and dispute prep.",
      primaryAction: { label: "Import Claim Email", tab: "Intake" },
      secondaryActions: [
        { label: "Add Manual Claim", tab: "Claims" },
        { label: "Open Intake", tab: "Intake" },
      ],
    },
    teams: {
      eyebrow: "Team setup",
      title: "Build your first route team",
      description: "Add drivers, helpers, trucks, routes, and photo readiness so claims and compliance have an owner.",
      primaryAction: { label: "Add Person", tab: "Teams" },
      secondaryActions: [
        { label: "Add Route Team", tab: "Teams" },
      ],
    },
    compliance: {
      eyebrow: "Compliance setup",
      title: "Start your readiness checklist",
      description: "Track insurance, driver documents, truck documents, route photo proof, and claim evidence before blockers become losses.",
      primaryAction: { label: "Upload Documents", tab: "Intake" },
      secondaryActions: [
        { label: "Add Team", tab: "Teams" },
        { label: "Review Claims", tab: "Claims" },
      ],
    },
    reports: {
      eyebrow: "Reports readiness",
      title: "Reports unlock as your data builds",
      description: "Meaningful reports need contracts, route math, teams, and saved snapshots. Claims and receipts make them stronger.",
      primaryAction: { label: "Finish Setup", tab: next.tab },
      secondaryActions: [
        { label: "Save Snapshot", tab: "Dashboard" },
        { label: "Open Dashboard", tab: "Dashboard" },
      ],
    },
    ask: {
      eyebrow: "Ask readiness",
      title: "Ask gets smarter as your data fills in",
      description: "Ask can guide setup now, then answer margin, claims, team, receipts, and report questions as the business data grows.",
      primaryAction: { label: next.actionLabel, tab: next.tab },
      secondaryActions: [
        { label: "Open Intake", tab: "Intake" },
        { label: "View Dashboard", tab: "Dashboard" },
      ],
    },
    intake: {
      eyebrow: "AI intake",
      title: "Paste or upload what you already have",
      description: "Use claim emails, route sheets, contract terms, receipts, screenshots, PDFs, and notes. Nothing saves until you review it.",
      primaryAction: { label: "Analyze Intake", tab: "Intake" },
      secondaryActions: [
        { label: "Open Claims", tab: "Claims" },
        { label: "Open Contracts", tab: "Contracts" },
      ],
    },
    settings: {
      eyebrow: "Setup controls",
      title: "Keep onboarding, targets, and dashboard layout under your control",
      description: "Restore setup guidance, reset the checklist, choose owner presets, and tune margin targets from Settings.",
      primaryAction: { label: "Open Dashboard Layout", tab: "Settings" },
      secondaryActions: [
        { label: "Open Targets", tab: "Settings" },
      ],
    },
  };

  return configs[page] || configs.dashboard || configs.ask;
}

export function resetStoredSetupProgress() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEYS.setupWizard);
  window.localStorage.removeItem(STORAGE_KEYS.blankSetupWizard);
}

export function restoreSetupPanel() {
  if (typeof window === "undefined") return;
  const keys = [STORAGE_KEYS.setupWizard, STORAGE_KEYS.blankSetupWizard];
  keys.forEach((key) => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || "{}");
      window.localStorage.setItem(key, JSON.stringify({ ...parsed, hidden: false }));
    } catch {
      window.localStorage.setItem(key, JSON.stringify({ skipped: {}, previewed: false, hidden: false }));
    }
  });
}
