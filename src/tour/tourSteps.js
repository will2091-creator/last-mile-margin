// The narrative spine of the guided tour. Each step navigates to `tab` (if not
// already there) and spotlights the element marked `[data-tour="anchor"]`.
// The arc deliberately mirrors the business workflow and the 6 setup steps so
// the tour and the real setup wizard tell the same story:
//   command center -> capture work -> run operations -> prove margin ->
//   ask your business -> now set up yours.
//
// `anchor` values are verified to exist in the app. `fallbackAnchor` is used if
// the primary anchor never mounts (e.g. a panel that only shows in some states).

export const tourSteps = [
  {
    id: "welcome",
    tab: "Dashboard",
    anchor: "dashboard-overview",
    title: "Welcome to your command center",
    body: "This is where your whole operation comes together. Every number is driven by data you enter once.",
  },
  {
    id: "net-profit",
    tab: "Dashboard",
    anchor: "dashboard-net-profit",
    title: "Profit, the moment it happens",
    body: "Today's net profit — revenue minus every route cost — front and center, updated live.",
  },
  {
    id: "kpis",
    tab: "Dashboard",
    anchor: "dashboard-kpis",
    title: "The numbers that decide routes",
    body: "Profit per stop, per mile, and per hour tell you whether a route is actually worth running.",
  },
  {
    id: "recent-claims",
    tab: "Dashboard",
    anchor: "dashboard-recent-claims",
    title: "See risk before it costs you",
    body: "Recent claims surface here so a leak never hides until payday.",
  },
  {
    id: "intake",
    tab: "Intake",
    anchor: "intake-header",
    title: "Capture work in seconds",
    body: "Paste a claim email, route sheet, or receipt — AI turns it into clean data. Nothing saves until you review.",
  },
  {
    id: "intake-examples",
    tab: "Intake",
    anchor: "intake-examples",
    title: "Try it on a sample",
    body: "Start from an example to watch a messy email become a structured draft.",
  },
  {
    id: "operations",
    tab: "Operations",
    anchor: "operations-metrics",
    title: "Run the day from one board",
    body: "Teams, claims, compliance, and dispatch — your daily operational truth in one place.",
  },
  {
    id: "next-move",
    tab: "Operations",
    anchor: "operations-next-move",
    title: "Always know the next move",
    body: "The app surfaces the single highest-leverage action to take right now.",
  },
  {
    id: "finance",
    tab: "Finance",
    anchor: "finance-active-workflow",
    fallbackAnchor: "finance-header",
    title: "Prove the margin",
    body: "Contract terms plus real route costs become honest profit-per-route math.",
  },
  {
    id: "ask",
    tab: "Ask",
    anchor: "ask-suggested-prompts",
    title: "Just ask your business",
    body: "Ask plain-English questions about profit, risk, and routes — answers sharpen as your data fills in.",
  },
  {
    id: "handoff",
    tab: "Dashboard",
    anchor: "setup-progress",
    fallbackAnchor: "business-workflow",
    title: "Now let's set up yours",
    body: "That was a sample. Next, add your first contract and team — your real numbers take over from here.",
    isFinal: true,
  },
];

export default tourSteps;
