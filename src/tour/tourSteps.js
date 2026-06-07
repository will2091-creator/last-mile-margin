// The tour is a single coherent spatial sweep: it walks the Dashboard from the
// top of the main content area straight down, then walks the left sidebar top to
// bottom. Every step stays on the Dashboard (the sidebar is always visible), so
// the flow is one continuous "let me show you around" motion — no tab jumping.
//
// Each step targets an element by `anchor` (its [data-tour="..."] value) or by a
// raw CSS `selector` (used for the sidebar nav, which is keyed by data-tour-nav).
// `fallbackAnchor` covers elements that only render in some states.

export const tourSteps = [
  // ---- MAIN CONTENT, top to bottom -------------------------------------------
  {
    id: "toolbar",
    tab: "Dashboard",
    anchor: "dashboard-save-snapshot",
    title: "Your daily controls",
    body: "Save a snapshot of today's numbers, reopen any saved day, or change the date range — all from up here.",
  },
  {
    id: "workflow",
    tab: "Dashboard",
    anchor: "business-workflow",
    title: "The core workflow",
    body: "Your whole operation in eight steps, from contracts to insights. It tracks what's connected and what's next.",
  },
  {
    id: "overview",
    tab: "Dashboard",
    anchor: "dashboard-overview",
    title: "Your command center",
    body: "This is home base. Everything below is driven by data you enter once.",
  },
  {
    id: "period",
    tab: "Dashboard",
    anchor: "dashboard-period-tabs",
    title: "Any timeframe, instantly",
    body: "Flip every figure on the page between day, week, month, quarter, and year.",
  },
  {
    id: "open-ops",
    tab: "Dashboard",
    anchor: "dashboard-open-operations",
    title: "Jump into the field",
    body: "One click into Operations — dispatch, claims, teams, and compliance.",
  },
  {
    id: "net-profit",
    tab: "Dashboard",
    anchor: "dashboard-net-profit",
    title: "Profit, front and center",
    body: "Today's net profit and your trend over time — revenue minus every route cost, live.",
  },
  {
    id: "needs-attention",
    tab: "Dashboard",
    anchor: "dashboard-needs-attention",
    title: "What needs you now",
    body: "The day's risks and blockers surface here so nothing hides until payday.",
  },
  {
    id: "kpis",
    tab: "Dashboard",
    anchor: "dashboard-kpis",
    title: "The numbers that matter",
    body: "Revenue, costs, margin, and team readiness at a glance — tap any card to dig in.",
  },
  {
    id: "contract-performance",
    tab: "Dashboard",
    anchor: "dashboard-contract-performance",
    title: "Which contracts actually pay",
    body: "Revenue, profit, and margin per contract — so a thin-margin route can't hide in the average.",
  },
  {
    id: "recent-claims",
    tab: "Dashboard",
    anchor: "dashboard-recent-claims",
    title: "Your latest claims",
    body: "Recent claims and their risk level, ready to review before they cost you.",
  },

  // ---- LEFT SIDEBAR, top to bottom -------------------------------------------
  {
    id: "nav-brand",
    tab: "Dashboard",
    anchor: "nav-brand",
    title: "Last Mile Margin",
    body: "Now the left rail — your map of the whole app, top to bottom.",
  },
  {
    id: "nav-theme",
    tab: "Dashboard",
    anchor: "nav-theme",
    title: "Light or dark",
    body: "Switch the whole app's theme to whatever's easier on your eyes.",
  },
  {
    id: "nav-dashboard",
    tab: "Dashboard",
    selector: '[data-tour-nav="dashboard"]',
    title: "Dashboard",
    body: "This command center — your profit, risks, and readiness in one view.",
  },
  {
    id: "nav-intake",
    tab: "Dashboard",
    selector: '[data-tour-nav="intake"]',
    title: "Intake",
    body: "Paste a claim email, route sheet, or receipt — AI turns it into clean data.",
  },
  {
    id: "nav-operations",
    tab: "Dashboard",
    selector: '[data-tour-nav="operations"]',
    title: "Operations",
    body: "Run the day: dispatch, claims, teams, and compliance in one board.",
  },
  {
    id: "nav-finance",
    tab: "Dashboard",
    selector: '[data-tour-nav="finance"]',
    title: "Finance",
    body: "Contracts, route profitability, and receipts — prove the margin.",
  },
  {
    id: "nav-reports",
    tab: "Dashboard",
    selector: '[data-tour-nav="reports"]',
    title: "Reports",
    body: "Snapshots become trends and polished PDF exports for owners and partners.",
  },
  {
    id: "nav-ask",
    tab: "Dashboard",
    selector: '[data-tour-nav="ask"]',
    title: "Ask",
    body: "Plain-English answers about your profit, risk, and routes.",
  },
  {
    id: "nav-settings",
    tab: "Dashboard",
    selector: '[data-tour-nav="settings"]',
    title: "Settings",
    body: "Company profile, team access, targets, and dashboard layout.",
  },
  {
    id: "handoff",
    tab: "Dashboard",
    anchor: "nav-take-tour",
    title: "That's the tour",
    body: "Replay this anytime from here. Ready to add your first contract and team?",
    isFinal: true,
  },
];

export default tourSteps;
