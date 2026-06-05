export const guidedDemoSteps = [
  {
    id: "dashboard",
    tab: "Dashboard",
    eyebrow: "Step 1",
    title: "Dashboard: your command center",
    lesson:
      "Start every day here. The Dashboard gives the owner the Today, Week, Month, Quarter, and Year view of the business so profit, revenue, costs, claims exposure, margin, route health, saved routes, recent claims, team readiness, compliance, recent activity, and needs-attention items are visible before you click anywhere else.",
    why:
      "This page exists so a contractor can quickly understand what is happening, what is costing money, and what needs action today.",
    story:
      "In the demo, Route 14 starts as the main business story. The Dashboard shows whether the route is healthy, whether claims are creating exposure, whether teams are ready, and what the owner should click next.",
    walkthrough: [
      "Time views: switch Today, Week, Month, Quarter, or Year to see margin over different operating windows.",
      "Profit, revenue, costs, and margin: show whether the work is worth running.",
      "Claims exposure and recent claims: show money at risk before it becomes normal loss.",
      "Route health, saved routes, and saved days: show which routes and periods have history.",
      "Needs attention: turns scattered problems into a short owner action list.",
      "Team readiness and compliance: show whether the people, trucks, proof, and documents are ready for work.",
      "Recent activity: shows what changed recently so the owner does not have to hunt.",
      "Next action: tells the user exactly which tab to open next.",
    ],
    dataToEnter:
      "The Dashboard is mostly a readout. It becomes useful after contracts, teams, route costs, claims, receipts, compliance items, and saved snapshots are entered.",
    ownerDecision:
      "The owner decides what needs attention first: set up contracts, fix a claim, review profit, check team readiness, or save a snapshot.",
    metrics: ["Today / Week / Month / Qtr / Year", "Profit", "Revenue", "Costs", "Claims exposure", "Margin", "Route health", "Needs attention"],
    outcome: "The owner gets a daily command center instead of guessing from spreadsheets, texts, and emails.",
    nextTab: "Contracts",
    nextLabel: "Next: Set Up Contracts",
    selector: '[data-tour="dashboard-overview"]',
  },
  {
    id: "contracts",
    tab: "Contracts",
    eyebrow: "Step 2",
    title: "Contracts: rate terms come before profit",
    lesson:
      "Contracts come before profitability because the app needs the rate terms first: retailer or customer, route pay, stop pay, weekly route count, contract terms, active contracts, renewals, and contract performance.",
    why:
      "If the contract terms are wrong, every profit calculation after this is wrong.",
    story:
      "Route 14 runs under the Lowe's Appliance Delivery contract. That contract tells the app how revenue is created before costs and claims are subtracted.",
    dataToEnter:
      "Retailer/customer, route pay, stop pay, weekly route count, contract status, renewal date, active terms, claim terms, and any accessorial pay rules.",
    ownerDecision:
      "The owner can decide whether a contract is worth keeping, needs renegotiation, or deserves more route capacity.",
    metrics: ["Retailer / customer", "Route pay", "Stops", "Weekly route count", "Renewals", "Contract performance"],
    outcome: "Revenue has a trusted source before the app starts calculating margin.",
    nextTab: "Teams",
    nextLabel: "Next: Add Teams",
    selector: '[data-tour="contracts"], [data-tour-nav="finance"]',
  },
  {
    id: "teams",
    tab: "Teams",
    eyebrow: "Step 3",
    title: "Teams: who is doing the work",
    lesson:
      "Teams explains the people and trucks behind the route: drivers, helpers, trucks, readiness, assigned routes, compliance status, and photo proof or daily requirements.",
    why:
      "Profit and claims need an owner. Teams connect field execution to route performance, claim risk, and compliance.",
    story:
      "North Route Team runs Route 14 with Truck 214. Their readiness, photo proof, and compliance status flow into Dashboard, Claims, Profitability, Reports, and Ask.",
    dataToEnter:
      "Drivers, helpers, trucks, assigned routes, route teams, readiness status, compliance score, daily photo proof, and route requirements.",
    ownerDecision:
      "The owner can decide which teams are ready, which teams need coaching, and which team should own a route or claim.",
    metrics: ["Drivers", "Helpers", "Trucks", "Assigned routes", "Readiness", "Compliance status", "Photo proof"],
    outcome: "Work is tied to accountable teams instead of floating around without ownership.",
    nextTab: "Profitability",
    nextLabel: "Next: Review Profitability",
    selector: '[data-tour="teams"], [data-tour-nav="operations"]',
  },
  {
    id: "profitability",
    tab: "Profitability",
    eyebrow: "Step 4",
    title: "Profitability: how the money is calculated",
    lesson:
      "Profitability turns contract revenue into real margin by subtracting labor, fuel, truck insurance, maintenance, claims, and other costs. It shows profit per route, profit per stop, margin, saved scenarios, and saved days.",
    why:
      "A route can look busy and still lose money. This tab shows whether the route actually pays after the real costs are counted.",
    story:
      "Route 14 starts with Lowe's contract revenue, then subtracts driver/helper labor, fuel, truck insurance, maintenance reserve, claim exposure, and other costs.",
    dataToEnter:
      "Revenue terms, labor, fuel, truck insurance, maintenance, claims reserve, tolls, parking, other costs, target profit, and scenario details.",
    ownerDecision:
      "The owner can decide whether to keep running the route, raise rates, change staffing, reduce costs, or save the scenario/day for reporting.",
    metrics: ["Revenue", "Labor", "Fuel", "Insurance", "Maintenance", "Claims", "Other costs", "Profit per route", "Profit per stop", "Margin"],
    outcome: "The business can price routes and spot money leaks before they repeat.",
    nextTab: "Claims",
    nextLabel: "Next: Control Claims",
    selector: '[data-tour="expenses"], [data-tour-nav="finance"]',
  },
  {
    id: "claims",
    tab: "Claims",
    eyebrow: "Step 5",
    title: "Claims: the money leak control center",
    lesson:
      "Claims tracks open claims, needs-review items, risk level, claim amount, evidence needed, assigned driver, dispute readiness, and resolved claims.",
    why:
      "Claims directly reduce profit. This tab helps stop chargebacks and disputes from silently eating route margin.",
    story:
      "The Route 14 wall damage claim is tied to North Route Team and reduces profit until evidence is collected, reviewed, disputed, or resolved.",
    dataToEnter:
      "Claim type, amount, route, team, driver, risk level, status, evidence needs, notes, dispute readiness, and resolution outcome.",
    ownerDecision:
      "The owner can decide which claims need evidence, which can be disputed, which are high risk, and which are already resolved.",
    metrics: ["Open claims", "Needs review", "Risk level", "Claim amount", "Evidence needed", "Driver assigned", "Dispute readiness", "Resolved claims"],
    outcome: "Claim losses become visible, prioritized, and actionable.",
    nextTab: "Intake",
    nextLabel: "Next: Import Documents",
    selector: '[data-tour="claims"], [data-tour-nav="operations"]',
  },
  {
    id: "intake",
    tab: "Intake",
    eyebrow: "Step 6",
    title: "Intake: raw business info comes in here",
    lesson:
      "Intake is where unstructured business information enters the system: claim emails, contract notes, receipts, route sheets, documents, and AI Quick Intake results.",
    why:
      "Contractors do not want to manually type everything. Intake lets them paste or upload raw info, review it, and save it to Claims, Receipts, Contracts, or route records.",
    story:
      "A Lowe's rate card, Route 14 sheet, Shell fuel receipt, and wall damage claim email can all start here before being routed into the right tab.",
    dataToEnter:
      "Claim emails, contract notes, receipts, route sheets, documents, screenshots, PDFs, and notes for AI Quick Intake to process.",
    ownerDecision:
      "The owner can decide what the AI extracted correctly and where the reviewed information should be saved.",
    metrics: ["Claim emails", "Contract notes", "Receipts", "Route sheets", "Documents", "AI Quick Intake", "Save to Claims / Receipts / Contracts"],
    outcome: "Manual entry drops and the rest of the system gets cleaner data faster.",
    nextTab: "Receipts",
    nextLabel: "Next: Attach Receipts",
    selector: '[data-tour-nav="intake"]',
  },
  {
    id: "receipts",
    tab: "Receipts",
    eyebrow: "Step 7",
    title: "Receipts: expense proof",
    lesson:
      "Receipts prove the expenses that reduce margin: fuel, tools, repairs, parking, tolls, maintenance, and other owner costs.",
    why:
      "Profitability should be based on proof, not guesses. Receipts give Finance and Reports a cleaner cost record.",
    story:
      "Route 14 includes fuel and toll receipts. Those receipts support the expense side of the profit calculation.",
    dataToEnter:
      "Fuel, tools, repairs, parking, tolls, maintenance, supplies, vendor, amount, date, notes, and route or contract connection.",
    ownerDecision:
      "The owner can decide whether route costs are normal, creeping up, missing proof, or cutting too deep into margin.",
    metrics: ["Fuel", "Tools", "Repairs", "Parking", "Tolls", "Maintenance", "Attach receipts to profitability"],
    outcome: "Expense proof connects field spending to real margin.",
    nextTab: "Compliance",
    nextLabel: "Next: Check Compliance",
    selector: '[data-tour-nav="finance"]',
  },
  {
    id: "compliance",
    tab: "Compliance",
    eyebrow: "Step 8",
    title: "Compliance: operational protection",
    lesson:
      "Compliance protects the operation with insurance, DOT/FMCSA documents, driver documents, expiring documents, readiness score, and items needing review.",
    why:
      "Even profitable routes can create risk if documents, insurance, or readiness requirements are missing.",
    story:
      "Truck 214 and the Route 14 team need document readiness and photo proof so the business can defend claims and stay route-ready.",
    dataToEnter:
      "Insurance, DOT/FMCSA documents, driver files, vehicle documents, expiration dates, readiness items, proof status, and review notes.",
    ownerDecision:
      "The owner can decide what must be updated before dispatch, audit review, retailer scorecards, or claim packet submission.",
    metrics: ["Insurance", "DOT / FMCSA docs", "Driver documents", "Expiring documents", "Readiness score", "Needs review"],
    outcome: "The business reduces preventable penalties, audit risk, and missing-proof problems.",
    nextTab: "Reports",
    nextLabel: "Next: Review Reports",
    selector: '[data-tour-nav="operations"]',
  },
  {
    id: "reports",
    tab: "Reports",
    eyebrow: "Step 9",
    title: "Reports: owner review and history",
    lesson:
      "Reports are where the owner reviews history: profit snapshots, claims reports, route reports, PDF exports, trend review, and saved daily, weekly, or monthly performance.",
    why:
      "Daily work becomes useful only when the owner can review trends and make decisions from history.",
    story:
      "Route 14 appears in profit snapshots, claims impact, route reports, and financial summaries after the data is saved.",
    dataToEnter:
      "Saved daily snapshots, weekly/monthly performance periods, report filters, route selections, claims data, team data, and export choices.",
    ownerDecision:
      "The owner can decide which routes are improving, which claims hurt margin, what to export, and what to fix next week.",
    metrics: ["Profit snapshots", "Claims reports", "Route reports", "PDF export", "Trend review", "Daily / weekly / monthly performance"],
    outcome: "The business gets a repeatable owner review rhythm.",
    nextTab: "Ask",
    nextLabel: "Next: Ask AI",
    selector: '[data-tour="reports"], [data-tour-nav="reports"]',
  },
  {
    id: "ask",
    tab: "Ask",
    eyebrow: "Step 10",
    title: "Ask: AI is last because it needs data",
    lesson:
      "Ask becomes useful after the other tabs have data. It can answer business questions about what is hurting margin, which routes lose money, which teams create the most claims, and what needs attention today.",
    why:
      "AI should not guess from an empty workspace. It should use contracts, teams, profitability, claims, intake, receipts, compliance, and reports.",
    story:
      "After Route 14 has contract terms, a team, costs, a claim, receipts, compliance status, and reports, Ask can explain what is happening and what to do next.",
    dataToEnter:
      "Plain-English questions like: What is hurting margin? Which route loses money? Which team creates the most claims? What needs attention today?",
    ownerDecision:
      "The owner can decide what to fix first based on the full business context instead of digging through every tab manually.",
    metrics: ["Ask business questions", "Margin leaks", "Route losses", "Team claim patterns", "Needs attention today"],
    outcome: "The owner gets fast insight from the data already entered across the system.",
    nextTab: "Complete",
    nextLabel: "Finish Walkthrough",
    selector: '[data-tour="ask-assistant"], [data-tour-nav="ask"]',
  },
];

export const businessJourney = [
  "Dashboard",
  "Contracts",
  "Teams",
  "Profitability",
  "Claims",
  "Intake",
  "Receipts",
  "Compliance",
  "Reports",
  "Ask",
];

export const navPreviewContent = {
  Dashboard: {
    title: "Dashboard",
    description:
      "Shows the command center: time views, profit, revenue, costs, claims exposure, margin, route health, readiness, compliance, and next action.",
    matters: "Keeps the owner focused on what needs attention today.",
    metrics: ["Profit", "Revenue", "Costs", "Claims", "Margin"],
    outcome: "Faster daily decisions.",
  },
  Ask: {
    title: "Ask AI",
    description:
      "Answers business questions after the workspace has contracts, teams, profitability, claims, receipts, compliance, and reports.",
    matters: "AI is most useful after real business data exists.",
    metrics: ["Margin leaks", "Route losses", "Team claim patterns"],
    outcome: "Faster insight from existing data.",
  },
  Intake: {
    title: "Intake",
    description:
      "Processes claim emails, contract notes, receipts, route sheets, documents, screenshots, PDFs, and raw notes.",
    matters: "Reduces manual input and sends reviewed data to Claims, Receipts, Contracts, and other workflows.",
    metrics: ["AI Quick Intake", "Uploads", "Extracted fields"],
    outcome: "Quicker setup and cleaner data.",
  },
  Operations: {
    title: "Operations",
    description:
      "Groups the field execution areas: teams, claims, compliance, route readiness, and blockers.",
    matters: "Connects who did the work to proof, issues, risk, and claim outcomes.",
    metrics: ["Teams", "Claims", "Compliance", "Readiness"],
    outcome: "Cleaner execution and fewer preventable losses.",
  },
  Finance: {
    title: "Finance",
    description:
      "Groups contracts, profitability, and receipts so route revenue and route costs connect.",
    matters: "A busy route can still lose money when costs and claims are counted.",
    metrics: ["Contracts", "Profitability", "Receipts", "Margin"],
    outcome: "Better pricing and route decisions.",
  },
  Reports: {
    title: "Reports",
    description:
      "Turns saved snapshots, claims, routes, teams, and financial data into reviewable reports and exports.",
    matters: "Converts daily activity into owner decisions and historical trend review.",
    metrics: ["Snapshots", "Claims reports", "Route reports", "PDF export"],
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
