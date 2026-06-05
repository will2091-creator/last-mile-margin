export const guidedDemoSteps = [
  {
    id: "dashboard",
    tab: "Dashboard",
    eyebrow: "Step 1",
    title: "Dashboard: the margin command center",
    lesson:
      "Final Mile Margin shows whether a route business is making money after labor, fuel, trucks, claims, receipts, and contract terms are counted.",
    why:
      "Start here to see revenue, profit, claims exposure, compliance, teams, and contracts in one owner view.",
    story:
      "Demo Fleet runs Route 14 for Lowe's Appliance Delivery. This week the route generated revenue, picked up fuel and toll costs, and received one property damage claim that now affects margin.",
    metrics: ["Weekly revenue", "Net profit", "Open claims", "Compliance score", "Active teams"],
    outcome: "Owners know what needs attention before money leaks become normal.",
    selector: '[data-tour="dashboard-overview"]',
  },
  {
    id: "operations",
    tab: "Operations",
    eyebrow: "Step 2",
    title: "Operations: where route execution happens",
    lesson:
      "Operations connects dispatch, teams, claims, and compliance so field work has an owner and every issue can be followed back to the route.",
    why:
      "This is the daily execution layer. It tells you who ran the work, what went wrong, and what must be cleaned up.",
    story:
      "Route 14 is assigned to North Route Team. When a claim appears, Operations shows the team, route, photos, and compliance context.",
    metrics: ["Ready teams", "Missing photos", "Open exposure", "Compliance blockers"],
    outcome: "Field problems become trackable work instead of scattered texts and emails.",
    selector: '[data-tour-nav="operations"]',
  },
  {
    id: "teams",
    tab: "Teams",
    eyebrow: "Step 3",
    title: "Teams: drivers, helpers, trucks, and assignments",
    lesson:
      "Teams stores the people and equipment doing the work: driver, helper, truck, route assignment, readiness, and photo status.",
    why:
      "Profit and claims only make sense when they can be tied back to the team that ran the route.",
    story:
      "North Route Team runs Route 14 with Truck 214. Their route revenue, claim exposure, and compliance score all feed other pages.",
    metrics: ["Route owner", "Photo status", "Compliance score", "Routes completed"],
    outcome: "You can coach teams, prove readiness, and see which crews protect margin.",
    selector: '[data-tour="teams"], [data-tour-nav="operations"]',
  },
  {
    id: "claims",
    tab: "Claims",
    eyebrow: "Step 4",
    title: "Claims: damage, chargebacks, disputes, and resolutions",
    lesson:
      "Claims tracks damage claims, customer issues, chargebacks, dispute status, evidence gaps, and the financial exposure tied to a route.",
    why:
      "Claims directly reduce profit and can affect contractor scorecards, renewals, and customer trust.",
    story:
      "A wall damage claim on Route 14 is assigned to North Route Team. The claim appears in Operations, reduces profitability, and rolls into Reports and Ask.",
    metrics: ["Open exposure", "Under review", "Closed claims", "Dispute readiness"],
    outcome: "Losses become measurable and disputable instead of silently eating margin.",
    selector: '[data-tour="claims"], [data-tour-nav="operations"]',
  },
  {
    id: "compliance",
    tab: "Compliance",
    eyebrow: "Step 5",
    title: "Compliance: audit readiness and document control",
    lesson:
      "Compliance tracks insurance, driver documents, vehicle documents, proof photos, expirations, and readiness blockers.",
    why:
      "Retail delivery work depends on being ready for audits, route requirements, and claim packet reviews.",
    story:
      "Truck 214 and the Route 14 driver have documents tied to the same business story as the contract, claims, and team records.",
    metrics: ["Compliance score", "Expiring documents", "Missing photos", "Audit blockers"],
    outcome: "You reduce preventable penalties and keep routes eligible for work.",
    selector: '[data-tour-nav="operations"]',
  },
  {
    id: "finance",
    tab: "Finance",
    eyebrow: "Step 6",
    title: "Finance: are you actually making money?",
    lesson:
      "Finance groups contract terms, receipts, and route profitability because margin only works when revenue and expenses are connected.",
    why:
      "A route can look busy and still lose money. Finance shows the truth after costs and claims.",
    story:
      "Lowe's pays route and stop revenue, receipts add fuel and toll costs, and the claim reduces profit. Finance puts those together.",
    metrics: ["Revenue", "Expenses", "Net profit", "Margin percentage"],
    outcome: "Owners can decide what to renegotiate, fix, or stop doing.",
    selector: '[data-tour-nav="finance"]',
  },
  {
    id: "contracts",
    tab: "Contracts",
    eyebrow: "Step 7",
    title: "Contracts: the source of route revenue",
    lesson:
      "Contracts store customer agreements, route pay, stop pay, accessorials, renewal dates, and claim terms.",
    why:
      "Contract terms drive revenue calculations and explain why one route pays better than another.",
    story:
      "The Lowe's Appliance Delivery contract powers Route 14 revenue: base route pay, per-stop pay, install pay, fuel surcharge, and claim packet rules.",
    metrics: ["Route pay", "Stop pay", "Claim terms", "Renewal date", "Contract margin"],
    outcome: "You can see which customers and routes deserve more trucks, higher rates, or renegotiation.",
    selector: '[data-tour="contracts"], [data-tour-nav="finance"]',
  },
  {
    id: "receipts",
    tab: "Receipts",
    eyebrow: "Step 8",
    title: "Receipts: proof of expenses",
    lesson:
      "Receipts capture fuel, maintenance, tolls, supplies, tools, and other route costs from the field.",
    why:
      "Expenses reduce margin. Without receipts, route profit is just a guess.",
    story:
      "Route 14 includes a fuel receipt and toll receipt. Those costs lower net profit and appear in finance reports.",
    metrics: ["Fuel", "Maintenance", "Tolls", "Supplies", "Owner expenses"],
    outcome: "You get cleaner margins, better reimbursement records, and stronger reporting.",
    selector: '[data-tour-nav="finance"]',
  },
  {
    id: "profitability",
    tab: "Profitability",
    eyebrow: "Step 9",
    title: "Profitability: how margin is calculated",
    lesson:
      "Profitability subtracts labor, fuel, truck, insurance, maintenance, claims, and other costs from route revenue.",
    why:
      "This is where revenue becomes net profit, profit per stop, profit per mile, and profit per labor hour.",
    story:
      "Route 14 starts with contract revenue, then subtracts driver/helper pay, fuel, truck costs, maintenance reserve, and claim exposure.",
    metrics: ["Net profit", "Profit per stop", "Profit per mile", "Profit per hour", "Target profit"],
    outcome: "You can price routes, coach teams, and spot money leaks before they repeat.",
    selector: '[data-tour="expenses"], [data-tour-nav="finance"]',
  },
  {
    id: "reports",
    tab: "Reports",
    eyebrow: "Step 10",
    title: "Reports: turning data into decisions",
    lesson:
      "Reports convert contracts, teams, claims, receipts, and snapshots into weekly summaries and owner-ready exports.",
    why:
      "Reports are where patterns become decisions: which route is profitable, which claim type repeats, and which team needs support.",
    story:
      "Route 14 appears in weekly profit, claims impact, team performance, and financial reports.",
    metrics: ["Weekly report", "Claims report", "Team report", "Financial report"],
    outcome: "The business gets a repeatable review rhythm instead of reactive guessing.",
    selector: '[data-tour="reports"], [data-tour-nav="reports"]',
  },
  {
    id: "ask",
    tab: "Ask",
    eyebrow: "Step 11",
    title: "Ask AI: questions across the whole business",
    lesson:
      "Ask uses data from teams, claims, contracts, receipts, profitability, and reports to answer business questions.",
    why:
      "Contractors should not have to dig through screens to understand what needs attention.",
    story:
      "Ask can explain why Route 14 margin dropped, which claim to dispute first, or what to fix before next week.",
    metrics: ["Money leaks", "Claim priorities", "Team risk", "Report summaries"],
    outcome: "Owners get faster answers from the data they already entered.",
    selector: '[data-tour="ask-assistant"], [data-tour-nav="ask"]',
  },
  {
    id: "intake",
    tab: "Intake",
    eyebrow: "Step 12",
    title: "Intake: upload or paste what you already have",
    lesson:
      "Intake processes claim emails, contracts, receipts, route sheets, screenshots, PDFs, and notes so setup is faster.",
    why:
      "The fastest workflow is upload, review, approve, and let the system route the data to the right page.",
    story:
      "A Lowe's rate card, Route 14 sheet, Shell fuel receipt, and wall damage claim email can all start in Intake.",
    metrics: ["Extracted revenue", "Claim details", "Receipt costs", "Route notes"],
    outcome: "Manual entry drops, and the data starts flowing to the business system.",
    selector: '[data-tour-nav="intake"]',
  },
  {
    id: "completion",
    tab: "Dashboard",
    eyebrow: "Complete",
    title: "Congratulations, you've completed the walkthrough",
    lesson:
      "Final Mile Margin connects the business journey from contract terms to AI insights so route owners can protect profit.",
    why:
      "Each page matters because it owns one part of the money flow.",
    story:
      "Contract -> Team -> Operations -> Claims -> Receipts -> Profitability -> Reports -> AI Insights.",
    metrics: ["Connected workflow", "Margin visibility", "Operational accountability", "Faster decisions"],
    outcome: "You now know what every page does, why it matters, and how money moves through the business.",
    selector: '[data-tour="dashboard-overview"]',
    completion: true,
  },
];

export const businessJourney = [
  "Contract",
  "Team",
  "Operations",
  "Claims",
  "Receipts",
  "Profitability",
  "Reports",
  "AI Insights",
];

export const navPreviewContent = {
  Dashboard: {
    title: "Dashboard",
    description:
      "Shows the daily owner view: revenue, profit, claims, compliance, teams, contracts, and the next action.",
    matters: "Keeps the business focused on what needs attention today.",
    metrics: ["Revenue", "Profit", "Claims", "Compliance"],
    outcome: "Faster daily decisions.",
  },
  Ask: {
    title: "Ask AI",
    description:
      "Answers business questions using teams, claims, contracts, receipts, reports, and profitability data.",
    matters: "Contractors can ask for the answer instead of hunting through every page.",
    metrics: ["Money leaks", "Claim priorities", "Team risk"],
    outcome: "Faster insight from existing data.",
  },
  Intake: {
    title: "Intake",
    description:
      "Processes claim emails, contracts, receipts, route sheets, screenshots, PDFs, and notes.",
    matters: "Reduces manual input and sends reviewed data to the right workflow.",
    metrics: ["Uploads", "Extracted fields", "Review status"],
    outcome: "Quicker setup and cleaner data.",
  },
  Operations: {
    title: "Operations",
    description:
      "Where route execution happens: teams, claims, compliance, readiness, and field blockers.",
    matters: "Connects daily work to claims, proof, and route accountability.",
    metrics: ["Ready teams", "Open claims", "Missing photos", "Blockers"],
    outcome: "Cleaner execution and fewer preventable losses.",
  },
  Finance: {
    title: "Finance",
    description:
      "Combines profitability, receipts, and contracts to show whether routes are actually making money.",
    matters: "Busy routes can still lose money when costs and claims are counted.",
    metrics: ["Revenue", "Expenses", "Net profit", "Margin"],
    outcome: "Better pricing and renegotiation decisions.",
  },
  Reports: {
    title: "Reports",
    description:
      "Turns contracts, teams, claims, receipts, and snapshots into weekly, claims, team, and financial reports.",
    matters: "Converts daily activity into owner decisions and customer-ready summaries.",
    metrics: ["Weekly trends", "Claims impact", "Team performance"],
    outcome: "Repeatable business review rhythm.",
  },
  Settings: {
    title: "Settings",
    description:
      "Controls company profile, margin targets, dashboard layout, team access, demo mode, and setup preferences.",
    matters: "Keeps the workspace tuned to how the contractor actually runs the business.",
    metrics: ["Targets", "Roles", "Layout", "Demo controls"],
    outcome: "A workspace that matches the operation.",
  },
};
