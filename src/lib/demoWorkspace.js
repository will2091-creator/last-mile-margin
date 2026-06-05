import { defaultForm, defaultSettings } from "../shared";

export const DEMO_MODE_KEY = "finalMileDemoModeActive";
export const DEMO_DATA_VERSION_KEY = "finalMileDemoDataVersion";
export const DEMO_DATA_VERSION = "2026-06-05-demo-v1";

export const demoStorageKeys = {
  form: "finalMileDemoForm",
  teams: "finalMileDemoTeams",
  claims: "finalMileDemoClaims",
  settings: "finalMileDemoSettings",
  contracts: "finalMileDemoContracts",
  rollupRows: "finalMileDemoRollupRows",
  onboardingImports: "finalMileDemoOnboardingImports",
  receipts: "finalMileDemoUploadedReceipts",
  savedScenarios: "finalMileDemoSavedScenarios",
  savedDays: "finalMileDemoSavedDays",
  setupWizard: "finalMileDemoSetupWizard",
};

const dayMs = 24 * 60 * 60 * 1000;

const isoDate = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export const demoForm = {
  ...defaultForm,
  scenarioName: "Route 14 - Lowe's Appliance",
  routePay: 1280,
  perStopPay: 8,
  stops: 22,
  installPay: 140,
  accessorialPay: 85,
  fuelSurcharge: 55,
  reattemptPay: 0,
  miles: 118,
  mpg: 9.5,
  fuelPrice: 3.72,
  routeHours: 9.5,
  driverPay: 245,
  helperPay: 185,
  tollsParking: 34,
  dailyTruckPayment: 96,
  dailyInsurance: 68,
  maintenancePerMile: 0.58,
  phoneSoftware: 18,
  claimsChargebacks: 95,
  otherCosts: 28,
  targetProfit: 520,
  claimsPerWeek: 1,
  averageClaimAmount: 640,
  routesPerWeek: 11,
  escrowPerWeek: 275,
  routeType: "Appliance Delivery",
  vehicleType: "26 ft Box Truck",
};

export const demoTeams = [
  {
    id: "DEMO-TEAM-1",
    name: "North Route Team",
    lead: "Marcus Reed",
    helper: "Jalen Brooks",
    truck: "Demo Truck 214",
    route: "Route 14 - Lowe's Appliance",
    complianceScore: 94,
    surveyAvg: 9.3,
    routesCompleted: 46,
    status: "Good",
    photoUrl: "",
    photoUploadedAt: "6:38 AM",
    photoStatus: "Uploaded",
  },
  {
    id: "DEMO-TEAM-2",
    name: "Furniture Team",
    lead: "Sam R.",
    helper: "Devin M.",
    truck: "Demo Truck 118",
    route: "Regional Furniture Delivery",
    complianceScore: 82,
    surveyAvg: 8.7,
    routesCompleted: 39,
    status: "Watch",
    photoUrl: "",
    photoUploadedAt: "7:12 AM",
    photoStatus: "Uploaded",
  },
  {
    id: "DEMO-TEAM-3",
    name: "South Route Team",
    lead: "Taylor J.",
    helper: "Chris P.",
    truck: "Demo Truck 309",
    route: "Route 14 - Lowe's Appliance",
    complianceScore: 68,
    surveyAvg: 7.8,
    routesCompleted: 31,
    status: "At Risk",
    photoUrl: "",
    photoUploadedAt: "Missing",
    photoStatus: "Missing",
  },
];

export const demoClaims = [
  {
    id: "DEMO-CLM-101",
    category: "Property",
    type: "Wall Damage",
    team: "North Route Team",
    driver: "Marcus Reed",
    route: "Route 14 - Lowe's Appliance",
    amount: 950,
    status: "Open",
    preventable: "Yes",
    date: "Today",
    risk: "High",
  },
  {
    id: "DEMO-CLM-102",
    category: "Cargo",
    type: "Product Damage",
    team: "Furniture Team",
    driver: "Sam R.",
    route: "Regional Furniture Delivery",
    amount: 425,
    status: "Under Review",
    preventable: "Maybe",
    date: "Yesterday",
    risk: "Medium",
  },
  {
    id: "DEMO-CLM-103",
    category: "Penalty",
    type: "Missed Delivery Window",
    team: "North Route Team",
    driver: "Marcus Reed",
    route: "Route 14 - Lowe's Appliance",
    amount: 175,
    status: "Closed",
    preventable: "No",
    date: "4 days ago",
    risk: "Low",
  },
];

export const demoRollupRows = [
  {
    id: "DEMO-LOWES-APPL",
    contract: "Lowe's Appliance Delivery",
    revenue: 1516,
    routes: 11,
    stops: 22,
    labor: 430,
    fuel: 46.2,
    truckInsurance: 164,
    maintenance: 68.44,
    claims: 95,
    other: 62,
    margin: 0.46,
    team: "North Route Team",
    routeType: "Route 14 - Appliance Delivery",
    location: "North market",
  },
  {
    id: "DEMO-FURN-REG",
    contract: "Regional Furniture Delivery",
    revenue: 1325,
    routes: 8,
    stops: 16,
    labor: 390,
    fuel: 52.75,
    truckInsurance: 152,
    maintenance: 72,
    claims: 60,
    other: 48,
    margin: 0.42,
    team: "Furniture Team",
    routeType: "Furniture Delivery",
    location: "Regional market",
  },
];

export const demoContracts = [
  {
    id: "DEMO-LOWES-APPL",
    name: "Lowe's Appliance Delivery",
    customer: "Lowe's",
    customerType: "Retail",
    location: "North market",
    type: "Appliance Delivery",
    payStructure: "$1,280 route + $8 stop",
    payType: "Hybrid",
    routePay: 1280,
    perStop: 8,
    installPay: 140,
    monthlyRevenue: 1516 * 11 * 4,
    margin: 46,
    status: "Active",
    risk: "Watch",
    team: "North Route Team",
    drivers: "Marcus Reed / Jalen Brooks",
    schedule: "11 routes / week",
    startDate: "Jan 1, 2026",
    renewalDate: "Oct 15, 2026",
    renewalDays: 132,
    overview: "Primary appliance route with install/accessorial revenue and claim packet requirements.",
    logo: "LOW",
    notes: "Route 14 has high stop count and appliance accessorials. Watch property-damage exposure and stairs/haul-away documentation.",
  },
  {
    id: "DEMO-FURN-REG",
    name: "Regional Furniture Delivery",
    customer: "Regional Furniture",
    customerType: "Retail",
    location: "Regional market",
    type: "Furniture Delivery",
    payStructure: "$1,325 / route",
    payType: "Flat Rate",
    routePay: 1325,
    perStop: 0,
    installPay: 0,
    monthlyRevenue: 1325 * 8 * 4,
    margin: 42,
    status: "Active",
    risk: "Good",
    team: "Furniture Team",
    drivers: "Sam R. / Devin M.",
    schedule: "8 routes / week",
    startDate: "Feb 10, 2026",
    renewalDate: "Dec 1, 2026",
    renewalDays: 179,
    overview: "Furniture contract focused on flat route pay, proof of delivery, and damage prevention.",
    logo: "REG",
    notes: "Healthy contract. Watch labor hours and toll receipts.",
  },
];

export const demoReceipts = [
  {
    id: "DEMO-REC-FUEL",
    name: "Fuel receipt - Shell",
    category: "Expense Receipts",
    owner: "Mobile App",
    notes: "Gas expense | Amount: 46.20 | Vendor: Shell | Notes: Route 14 Lowe's appliance fuel",
    uploaded_at: new Date(Date.now() - dayMs).toISOString(),
  },
  {
    id: "DEMO-REC-MAINT",
    name: "Maintenance receipt - Fleet Repair",
    category: "Expense Receipts",
    owner: "Mobile App",
    notes: "Maintenance expense | Amount: 184.75 | Vendor: Fleet Repair | Notes: Brake inspection reserve",
    uploaded_at: new Date(Date.now() - dayMs * 2).toISOString(),
  },
  {
    id: "DEMO-REC-TOLL",
    name: "Toll receipt - E-ZPass",
    category: "Expense Receipts",
    owner: "Mobile App",
    notes: "Parking/Tolls expense | Amount: 34.00 | Vendor: E-ZPass | Notes: Route 14 bridge tolls",
    uploaded_at: new Date(Date.now() - dayMs * 3).toISOString(),
  },
];

export const demoDocuments = [
  {
    id: "DEMO-DOC-INS",
    name: "Insurance certificate",
    category: "Insurance",
    status: "Uploaded",
    owner: "Demo Fleet",
    expiration: "Sep 30, 2026",
    notes: "Commercial auto and cargo insurance certificate.",
  },
  {
    id: "DEMO-DOC-DQF",
    name: "Driver qualification file",
    category: "Driver Files",
    status: "Uploaded",
    owner: "Marcus Reed",
    expiration: "Aug 15, 2026",
    notes: "License, medical card, and onboarding packet.",
  },
  {
    id: "DEMO-DOC-REG",
    name: "Vehicle registration",
    category: "Vehicle Documents",
    status: "Expiring Soon",
    owner: "Demo Truck 214",
    expiration: "Jul 18, 2026",
    notes: "Registration renewal reminder for the demo truck.",
  },
];

export const demoOnboardingImports = [
  {
    id: "DEMO-IMPORT-CLAIM",
    type: "Claim Email",
    title: "Route 14 wall damage claim email",
    summary: "Customer reported wall damage after Lowe's appliance delivery on Route 14. Claim amount is $950 and needs photo evidence from North Route Team.",
    source: "Demo Gmail import",
    createdAt: new Date(Date.now() - dayMs).toISOString(),
  },
  {
    id: "DEMO-IMPORT-CONTRACT",
    type: "Contract Upload",
    title: "Lowe's appliance rate card",
    summary: "Route pay, per-stop pay, install pay, accessorials, claim packet rules, and renewal date.",
    source: "Demo contract PDF",
    createdAt: new Date(Date.now() - dayMs * 3).toISOString(),
  },
  {
    id: "DEMO-IMPORT-ROUTE",
    type: "Route Sheet",
    title: "Route 14 north market route sheet",
    summary: "22 stops, 118 miles, 9.5 planned hours, appliance route with install work for North Route Team.",
    source: "Demo route sheet",
    createdAt: new Date(Date.now() - dayMs * 4).toISOString(),
  },
  {
    id: "DEMO-IMPORT-RECEIPT",
    type: "Receipt Upload",
    title: "Shell fuel receipt",
    summary: "$46.20 fuel expense tied to Route 14 Lowe's Appliance Delivery.",
    source: "Demo mobile receipt",
    createdAt: new Date(Date.now() - dayMs * 5).toISOString(),
  },
];

export const demoSavedDays = Array.from({ length: 30 }, (_, index) => {
  const dayOffset = -29 + index;
  const revenue = 2580 + index * 22 + Math.sin(index / 2) * 115;
  const costs = 1510 + Math.cos(index / 3) * 72 + (index % 5) * 18;
  const claimsExposure = index === 28 ? 950 : index % 9 === 0 ? 425 : 0;
  const profit = revenue - costs - claimsExposure * 0.12;
  const dateKey = isoDate(dayOffset);
  const status = claimsExposure >= 900 ? "Review" : profit / revenue < 0.28 ? "Watch" : "Good";

  return {
    id: dateKey,
    label: new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    savedAt: new Date(Date.now() + dayOffset * dayMs).toISOString(),
    savedBy: "demo",
    dateRange: { start: dateKey, end: dateKey },
    profit: Math.round(profit),
    revenue: Math.round(revenue),
    costs: Math.round(costs),
    margin: revenue > 0 ? profit / revenue : 0,
    claimsExposure,
    openClaims: claimsExposure > 0 ? 1 : 0,
    photosUploaded: index % 6 === 0 ? 2 : 3,
    teamsCount: 3,
    escrow: 4250 + claimsExposure * 0.35,
    status,
  };
}).reverse();

export const demoSavedScenarios = [
  {
    id: "DEMO-SCENARIO-LOWES",
    name: "Route 14 - Lowe's Appliance",
    form: demoForm,
    results: {
      totalRevenue: 1516,
      totalCost: 925.64,
      netProfit: 590.36,
      profitMargin: 0.389,
      profitPerStop: 26.83,
      profitPerMile: 5,
      profitPerHour: 62.14,
    },
    grade: { grade: "A", label: "Healthy route" },
    createdAt: new Date(Date.now() - dayMs * 2).toLocaleString(),
  },
];

export const demoSettings = {
  ...defaultSettings,
  companyName: "Demo Final Mile Co.",
  demoWorkspaceEnabled: true,
  dashboardWidgets: {
    ...defaultSettings.dashboardWidgets,
    teamReadiness: true,
    complianceStatus: true,
    activeContracts: true,
    contractPerformance: true,
    upcomingRenewals: true,
    fuelCostTracker: true,
    documentExpirations: true,
    insuranceSummary: true,
  },
  dashboardWidgetOrder: [
    "periodMetrics",
    "todaysProfit",
    "financialSummary",
    "recentClaims",
    "savedRoutes",
    "activeContracts",
    "contractPerformance",
    "upcomingRenewals",
    "needsAttention",
    "routeHealth",
    "routeEfficiency",
    "teamReadiness",
    "complianceStatus",
    "fuelCostTracker",
    "documentExpirations",
    "insuranceSummary",
    "recentActivity",
  ],
};

export function getDemoWorkspaceData() {
  return {
    form: demoForm,
    teams: demoTeams,
    claims: demoClaims,
    settings: demoSettings,
    savedDays: demoSavedDays,
    savedScenarios: demoSavedScenarios,
    contracts: demoContracts,
    rollupRows: demoRollupRows,
    receipts: demoReceipts,
    documents: demoDocuments,
    onboardingImports: demoOnboardingImports,
  };
}

const canUseStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const writeStorage = (key, value) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

export function seedDemoWorkspace({ reset = false } = {}) {
  if (!canUseStorage()) return getDemoWorkspaceData();
  const currentVersion = window.localStorage.getItem(DEMO_DATA_VERSION_KEY);
  if (!reset && currentVersion === DEMO_DATA_VERSION) {
    return getDemoWorkspaceData();
  }

  const demo = getDemoWorkspaceData();
  writeStorage(demoStorageKeys.form, demo.form);
  writeStorage(demoStorageKeys.teams, demo.teams);
  writeStorage(demoStorageKeys.claims, demo.claims);
  writeStorage(demoStorageKeys.settings, demo.settings);
  writeStorage(demoStorageKeys.contracts, demo.contracts);
  writeStorage(demoStorageKeys.rollupRows, demo.rollupRows);
  writeStorage(demoStorageKeys.onboardingImports, demo.onboardingImports);
  writeStorage(demoStorageKeys.receipts, demo.receipts);
  writeStorage(demoStorageKeys.savedScenarios, demo.savedScenarios);
  writeStorage(demoStorageKeys.savedDays, demo.savedDays);
  writeStorage(demoStorageKeys.setupWizard, { skipped: {}, previewed: true, hidden: false });
  window.localStorage.setItem(DEMO_DATA_VERSION_KEY, DEMO_DATA_VERSION);
  return demo;
}

export function clearDemoWorkspaceData() {
  if (!canUseStorage()) return;
  Object.values(demoStorageKeys).forEach((key) => window.localStorage.removeItem(key));
  window.localStorage.removeItem(DEMO_DATA_VERSION_KEY);
}

export function setDemoModeActive(active) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(DEMO_MODE_KEY, String(Boolean(active)));
}

export function isDemoModeActive() {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(DEMO_MODE_KEY) === "true";
}
