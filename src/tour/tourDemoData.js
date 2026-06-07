import { initialClaims, initialTeams, defaultForm } from "../shared";

// Realistic, IN-MEMORY-ONLY dataset the guided tour swaps in so every
// spotlighted feature has something meaningful to show. It is never persisted:
// App.jsx suspends all localStorage/Supabase persisters while the tour is
// active and restores the user's real state on exit. Built from the same
// sample data the app already ships with so it stays consistent and auditable.

export const demoClaims = initialClaims;
export const demoTeams = initialTeams;
export const demoForm = defaultForm;

// A "saved day" snapshot. The Dashboard hero, financial summary, and KPI row
// read from savedDaySnapshot (App.jsx `loadedSavedDay`) before falling back to
// contract data, so this single object populates the whole command center
// without touching any contract localStorage key.
export const demoSnapshot = {
  id: "demo-tour-day",
  label: "Demo workspace",
  savedAt: "2026-06-06T13:00:00.000Z",
  savedBy: "demo",
  dateRange: { start: "2026-06-06", end: "2026-06-06" },
  profit: 425,
  revenue: 1200,
  costs: 775,
  margin: 0.354,
  claimsExposure: 2600,
  openClaims: 4,
  photosUploaded: 3,
  teamsCount: 4,
  escrow: 5160,
  status: "Good",
};

// A short trend of snapshots so Reports history and the dashboard trend chart
// have something to render. Profit trends gently upward for a believable story.
export const demoSavedDays = [
  { ...demoSnapshot, id: "demo-day-1", label: "Mon, Jun 1", savedAt: "2026-06-01T13:00:00.000Z", profit: 318, revenue: 1100, costs: 782, margin: 0.289, status: "Watch" },
  { ...demoSnapshot, id: "demo-day-2", label: "Tue, Jun 2", savedAt: "2026-06-02T13:00:00.000Z", profit: 364, revenue: 1150, costs: 786, margin: 0.316, status: "Watch" },
  { ...demoSnapshot, id: "demo-day-3", label: "Wed, Jun 3", savedAt: "2026-06-03T13:00:00.000Z", profit: 401, revenue: 1180, costs: 779, margin: 0.34, status: "Good" },
  { ...demoSnapshot, id: "demo-day-4", label: "Thu, Jun 4", savedAt: "2026-06-04T13:00:00.000Z", profit: 388, revenue: 1170, costs: 782, margin: 0.331, status: "Good" },
  { ...demoSnapshot, id: "demo-day-5", label: "Fri, Jun 5", savedAt: "2026-06-05T13:00:00.000Z", profit: 425, revenue: 1200, costs: 775, margin: 0.354, status: "Good" },
];

// Demo contracts (rollup-row shape) written to localStorage `finalMileRollupRows`
// during the tour so the dashboard's Contract Performance table shows real
// revenue/profit/margin. Snapshotted and restored byte-for-byte on exit.
// One deliberately thin-margin contract makes the "watch your contracts" point.
export const demoContracts = [
  { id: "demo-c1", contract: "Lowe's Appliance Route", revenue: 6240, labor: 2200, fuel: 480, truckInsurance: 360, maintenance: 400, claims: 520, other: 300, routes: 5 },
  { id: "demo-c2", contract: "Home Depot Furniture", revenue: 4800, labor: 1900, fuel: 420, truckInsurance: 300, maintenance: 360, claims: 680, other: 240, routes: 4 },
  { id: "demo-c3", contract: "Mattress Firm Express", revenue: 3600, labor: 1300, fuel: 300, truckInsurance: 240, maintenance: 260, claims: 180, other: 180, routes: 3 },
];

// A saved profit scenario so the "Saved routes" surfaces aren't empty.
export const demoScenarios = [
  {
    id: "demo-scenario-1",
    name: "Lowe's Appliance Route",
    form: { ...defaultForm },
    results: {
      totalRevenue: 1200,
      totalCost: 775,
      netProfit: 425,
      profitMargin: 0.354,
      profitPerStop: 21,
      profitPerMile: 3.54,
    },
    grade: "B",
    createdAt: "Jun 5, 2026, 1:00 PM",
  },
];

// Everything the tour swaps into App.jsx state, in one auditable place.
export const demoDataset = {
  claims: demoClaims,
  teams: demoTeams,
  form: demoForm,
  savedDays: demoSavedDays,
  savedScenarios: demoScenarios,
  loadedSavedDay: demoSnapshot,
};
