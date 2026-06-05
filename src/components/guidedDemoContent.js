const dashboardTab = "Dashboard";

const dashboardStep = ({
  id,
  title,
  lesson,
  why,
  selector,
  nextLabel,
  metrics,
  dataToEnter,
  ownerDecision,
}) => ({
  id,
  tab: dashboardTab,
  eyebrow: "Dashboard walkthrough",
  title,
  lesson,
  why,
  story:
    "Read the Dashboard from top to bottom. It is the owner command center: first the date and time controls, then saved contract context, then financial and operations widgets, then the issues and activity that decide what happens next.",
  dataToEnter,
  ownerDecision,
  metrics,
  outcome: "The owner knows what happened, why it matters, and where to click next.",
  nextTab: "Dashboard",
  nextLabel,
  selector,
});

export const guidedDemoSteps = [
  dashboardStep({
    id: "dashboard-header",
    title: "Start here: Daily Command Center",
    lesson:
      "This top header tells the user where they are and what the Dashboard is for. It shows the open-claims count, the Dashboard title, and the plain-English instruction: use Operations for field work, Finance for money detail, and Reports for history.",
    why:
      "The user needs orientation before they touch the cards. This tells them the Dashboard is not a data-entry page; it is the command center.",
    selector: '[data-tour="dashboard-overview"]',
    nextLabel: "Next: Save Snapshots",
    metrics: ["Open claims", "Dashboard purpose", "Daily command center"],
    dataToEnter: "Nothing here. This is the readout that frames the rest of the page.",
    ownerDecision: "Decide whether the day needs field action, money review, or report review.",
  }),
  dashboardStep({
    id: "dashboard-save-snapshot",
    title: "Save Snapshot: lock in the business picture",
    lesson:
      "Save Snapshot stores the current day or period so the owner can build history. This is how daily, weekly, monthly, quarterly, and yearly performance becomes reviewable later.",
    why:
      "Without snapshots, the user only sees the current moment. With snapshots, they can compare profit, claims, route health, and team readiness over time.",
    selector: '[data-tour="dashboard-save-snapshot"]',
    nextLabel: "Next: Daily History",
    metrics: ["Saved day", "Profit history", "Claim history", "Performance trend"],
    dataToEnter: "The user clicks this after the route day or review period is ready to preserve.",
    ownerDecision: "Decide when a day is important enough to save for later reporting.",
  }),
  dashboardStep({
    id: "dashboard-daily-history",
    title: "Daily History: open saved performance",
    lesson:
      "Daily History shows saved snapshots. The number in the button tells how many saved periods exist. Opening one lets the owner review an earlier workday instead of only today's numbers.",
    why:
      "Owners need history to see if the business is improving or repeating the same margin and claim problems.",
    selector: '[data-tour="dashboard-daily-history"]',
    nextLabel: "Next: Date Range",
    metrics: ["Saved snapshots", "Daily history count", "Prior performance"],
    dataToEnter: "Save snapshots over time. Then use this control to reopen past days.",
    ownerDecision: "Compare current performance against a prior day, week, or month.",
  }),
  dashboardStep({
    id: "dashboard-date-range",
    title: "Date Range: choose the operating window",
    lesson:
      "The date control lets the owner choose which day or range the Dashboard is showing. It works with snapshots and the period buttons so the user can review the correct operating window.",
    why:
      "A claim, route, or expense only makes sense when it is tied to the right date range.",
    selector: '[data-tour="dashboard-date-range"]',
    nextLabel: "Next: Demo Controls",
    metrics: ["Work date", "Date range", "Calendar selection"],
    dataToEnter: "Pick the day or date range the owner wants to review.",
    ownerDecision: "Decide whether today, a specific route day, or a longer period needs review.",
  }),
  dashboardStep({
    id: "dashboard-demo-controls",
    title: "Tour buttons: choose the learning mode",
    lesson:
      "Take a Tour is the quick product tour. Interactive Demo is the guided business walkthrough. Launch Demo Workspace loads the connected example data.",
    why:
      "Users should understand the difference between a quick tour and the full business-story demo.",
    selector: '[data-tour="dashboard-interactive-demo"]',
    nextLabel: "Next: Time Period Buttons",
    metrics: ["Take a Tour", "Interactive Demo", "Launch Demo Workspace"],
    dataToEnter: "No business data here. These buttons control how the user learns the software.",
    ownerDecision: "Choose whether to learn quickly, run the full guided demo, or load sample data.",
  }),
  dashboardStep({
    id: "dashboard-period-tabs",
    title: "Day, Week, Month, Quarter, Year",
    lesson:
      "These period buttons change the Dashboard readout. Day is for daily operations. Week shows route rhythm. Month shows owner performance. Quarter and Year support bigger business review.",
    why:
      "The same business can look healthy today and weak over a month. Period controls stop the owner from making decisions from one tiny slice of data.",
    selector: '[data-tour="dashboard-period-tabs"]',
    nextLabel: "Next: Open Operations",
    metrics: ["Day", "Week", "Month", "Quarter", "Year"],
    dataToEnter: "Select the timeframe the owner wants to review.",
    ownerDecision: "Decide whether the issue is a one-day problem or a bigger trend.",
  }),
  dashboardStep({
    id: "dashboard-open-operations",
    title: "Open Operations: jump to field work",
    lesson:
      "Open Operations is the shortcut from the command center to field execution: teams, claims, compliance, readiness, and blockers.",
    why:
      "When the Dashboard reveals an issue, the user needs a fast route to the work area that fixes it.",
    selector: '[data-tour="dashboard-open-operations"]',
    nextLabel: "Next: Saved Contracts",
    metrics: ["Operations shortcut", "Teams", "Claims", "Compliance"],
    dataToEnter: "Nothing here. This is a navigation action.",
    ownerDecision: "Decide whether the next action is operational instead of financial.",
  }),
  dashboardStep({
    id: "dashboard-saved-contracts",
    title: "Saved Contracts: rate terms on the Dashboard",
    lesson:
      "This section shows contracts already saved into the business. Each card shows the contract name, routes per week, revenue, profit, and margin.",
    why:
      "Contracts sit high on the Dashboard because rates come before profit. The owner must know what contract is creating the revenue.",
    selector: '[data-tour="dashboard-saved-contracts"]',
    nextLabel: "Next: Day Metric Cards",
    metrics: ["Contract name", "Routes per week", "Revenue", "Profit", "Margin"],
    dataToEnter: "Add customer or retailer contracts, route pay, stop pay, route count, and contract costs.",
    ownerDecision: "Decide which contract is performing well and which one needs rate or cost review.",
  }),
  dashboardStep({
    id: "dashboard-period-metrics",
    title: "Metric cards: daily profit, claims, exposure, and photos",
    lesson:
      "These cards summarize the selected period. Day Net Profit shows route profit. Day Open Claims shows claim workload. Day Claim Exposure shows money at risk. Day Team Photos shows readiness proof.",
    why:
      "These are the fast owner signals. They tell whether the business made money, has open risk, and has proof from the field.",
    selector: '[data-tour="dashboard-period-metrics"]',
    nextLabel: "Next: Today’s Profit",
    metrics: ["Net profit", "Open claims", "Claim exposure", "Team photos"],
    dataToEnter: "Contracts, costs, claims, teams, and photo proof feed these cards.",
    ownerDecision: "Decide whether the day is profitable, risky, or missing field proof.",
  }),
  dashboardStep({
    id: "dashboard-todays-profit",
    title: "Today’s Profit: the main money number",
    lesson:
      "Today’s Profit is the hero financial readout when enabled. It shows net profit, margin, and trend context from saved snapshots.",
    why:
      "The owner needs one clear money number before reviewing details.",
    selector: '[data-tour="dashboard-todays-profit"]',
    nextLabel: "Next: Revenue, Costs, Claims, Escrow",
    metrics: ["Net profit", "Margin", "Trend", "Snapshot comparison"],
    dataToEnter: "Route revenue, labor, fuel, truck costs, claims, other costs, and snapshots.",
    ownerDecision: "Decide whether the route economics are healthy enough to keep running as-is.",
  }),
  dashboardStep({
    id: "dashboard-financial-summary",
    title: "Financial Summary: revenue, costs, claims, and escrow",
    lesson:
      "This widget breaks the money picture into revenue, costs, claims, and escrow. It explains what created profit or took profit away.",
    why:
      "Profit alone is not enough. Owners need to know which line item moved the number.",
    selector: '[data-tour="dashboard-financial-summary"]',
    nextLabel: "Next: Recent Claims",
    metrics: ["Revenue", "Costs", "Claims", "Escrow"],
    dataToEnter: "Revenue from contracts, costs from profitability and receipts, claims from Claims, and escrow/risk assumptions.",
    ownerDecision: "Decide whether the problem is low revenue, high cost, claims exposure, or retained risk.",
  }),
  dashboardStep({
    id: "dashboard-recent-claims",
    title: "Recent Claims: newest money leaks",
    lesson:
      "Recent Claims shows the latest claim type, contract or route, amount, and status. It gives the owner immediate visibility into what is threatening margin.",
    why:
      "Claims can turn a good route into a bad route. They need to appear before the owner forgets about them.",
    selector: '[data-tour="dashboard-recent-claims"]',
    nextLabel: "Next: Saved Route Performance",
    metrics: ["Claim type", "Route", "Amount", "Status"],
    dataToEnter: "Claim amount, type, route, team, driver, evidence, and status.",
    ownerDecision: "Decide which claim needs review, dispute evidence, or resolution first.",
  }),
  dashboardStep({
    id: "dashboard-saved-routes",
    title: "Saved Route Performance: route history",
    lesson:
      "Saved Route Performance shows historical route results. It helps owners compare routes and see which ones are consistently profitable or weak.",
    why:
      "One day is not enough. Saved route history shows patterns.",
    selector: '[data-tour="dashboard-saved-routes"]',
    nextLabel: "Next: Active Contracts",
    metrics: ["Saved routes", "Route profit", "Route margin", "Performance history"],
    dataToEnter: "Save scenarios or route days from Profitability and Dashboard snapshots.",
    ownerDecision: "Decide which routes deserve attention, renegotiation, or more capacity.",
  }),
  dashboardStep({
    id: "dashboard-active-contracts",
    title: "Active Contracts: portfolio status",
    lesson:
      "Active Contracts summarizes how many customer agreements are active, on watch, or at risk.",
    why:
      "The owner needs to know if contract risk is building before renewal or performance review.",
    selector: '[data-tour="dashboard-active-contracts"]',
    nextLabel: "Next: Contract Performance",
    metrics: ["Active", "Watch", "At Risk"],
    dataToEnter: "Contract status, performance notes, renewal dates, and risk labels.",
    ownerDecision: "Decide which customer agreement needs review.",
  }),
  dashboardStep({
    id: "dashboard-contract-performance",
    title: "Contract Performance: compare customers",
    lesson:
      "Contract Performance compares revenue, margin, and risk across contracts.",
    why:
      "Not all customers are equal. This tells which contract is worth growing and which one may need negotiation.",
    selector: '[data-tour="dashboard-contract-performance"]',
    nextLabel: "Next: Upcoming Renewals",
    metrics: ["Revenue", "Margin", "Risk"],
    dataToEnter: "Contract revenue, route count, costs, claim terms, and performance status.",
    ownerDecision: "Decide which contract to protect, renegotiate, or reduce.",
  }),
  dashboardStep({
    id: "dashboard-upcoming-renewals",
    title: "Upcoming Renewals: contract deadlines",
    lesson:
      "Upcoming Renewals shows which contracts are coming up for review and how many days remain.",
    why:
      "Renewals are where better rates and better terms can be negotiated.",
    selector: '[data-tour="dashboard-upcoming-renewals"]',
    nextLabel: "Next: Needs Attention",
    metrics: ["Renewal date", "Days remaining", "Contract name"],
    dataToEnter: "Renewal dates and contract terms.",
    ownerDecision: "Decide which contract needs preparation before renewal.",
  }),
  dashboardStep({
    id: "dashboard-needs-attention",
    title: "Needs Attention: owner action list",
    lesson:
      "Needs Attention gathers active issues from claims, compliance, teams, photos, and margin risk. It tells the owner what should not be ignored.",
    why:
      "This converts scattered issues into one prioritized list.",
    selector: '[data-tour="dashboard-needs-attention"]',
    nextLabel: "Next: Route Health",
    metrics: ["Active issues", "Claim blockers", "Compliance blockers", "Team blockers"],
    dataToEnter: "Claims, compliance items, team readiness, missing proof, route risks, and notes.",
    ownerDecision: "Decide what needs to be fixed first today.",
  }),
  dashboardStep({
    id: "dashboard-route-health",
    title: "Route Health: is the route healthy?",
    lesson:
      "Route Health summarizes whether stops, miles, claims, labor, and route performance are healthy or trending badly.",
    why:
      "A route can make revenue and still be unhealthy if it has too many stops, miles, claims, or labor hours.",
    selector: '[data-tour="dashboard-route-health"]',
    nextLabel: "Next: Route Efficiency",
    metrics: ["Stops", "Miles", "Claims", "Labor", "Overall health"],
    dataToEnter: "Route sheet details, mileage, stops, labor hours, and claims.",
    ownerDecision: "Decide whether the route needs staffing, pricing, or operational changes.",
  }),
  dashboardStep({
    id: "dashboard-route-efficiency",
    title: "Route Efficiency: how well the route runs",
    lesson:
      "Route Efficiency scores the operational side of route performance, including proof, route execution, and efficiency signals.",
    why:
      "Efficiency explains whether the route process is clean or wasting labor, fuel, and time.",
    selector: '[data-tour="dashboard-route-efficiency"]',
    nextLabel: "Next: Team Readiness",
    metrics: ["Efficiency score", "Route execution", "Proof status", "Operating signals"],
    dataToEnter: "Route timing, stops, mileage, photos, and performance notes.",
    ownerDecision: "Decide if the route process needs to be tightened.",
  }),
  dashboardStep({
    id: "dashboard-team-readiness",
    title: "Team Readiness: are crews ready?",
    lesson:
      "Team Readiness shows the percentage of teams with required daily proof and readiness status.",
    why:
      "Team readiness prevents avoidable claim, compliance, and dispatch problems.",
    selector: '[data-tour="dashboard-team-readiness"]',
    nextLabel: "Next: Compliance Status",
    metrics: ["Photo uploads", "Ready teams", "Team status"],
    dataToEnter: "Drivers, helpers, trucks, assigned routes, readiness, and photo proof.",
    ownerDecision: "Decide which team can run work and which team needs follow-up.",
  }),
  dashboardStep({
    id: "dashboard-compliance-status",
    title: "Compliance Status: readiness protection",
    lesson:
      "Compliance Status shows whether documents, insurance, and operational requirements are in good shape.",
    why:
      "Compliance protects the business from penalties, lost routes, and weak claim packets.",
    selector: '[data-tour="dashboard-compliance-status"]',
    nextLabel: "Next: Fuel Cost Tracker",
    metrics: ["Compliance score", "Open issues", "Readiness"],
    dataToEnter: "Insurance, driver documents, vehicle documents, expirations, and review notes.",
    ownerDecision: "Decide what must be fixed before audits, dispatch, or customer review.",
  }),
  dashboardStep({
    id: "dashboard-fuel-cost-tracker",
    title: "Fuel Cost Tracker: fuel impact",
    lesson:
      "Fuel Cost Tracker shows how fuel costs are affecting route margin for the selected period.",
    why:
      "Fuel can quietly erase profit if the contract rate or surcharge does not cover it.",
    selector: '[data-tour="dashboard-fuel-cost-tracker"]',
    nextLabel: "Next: Document Expirations",
    metrics: ["Fuel cost", "Weekly impact", "Margin pressure"],
    dataToEnter: "Fuel price, mileage, receipts, fuel surcharge, and route distance.",
    ownerDecision: "Decide whether fuel assumptions, surcharges, or routing need adjustment.",
  }),
  dashboardStep({
    id: "dashboard-document-expirations",
    title: "Document Expirations: what is about to go stale",
    lesson:
      "Document Expirations flags insurance, vehicle, driver, and compliance documents that are due soon or missing.",
    why:
      "Expired documents create route eligibility and audit risk.",
    selector: '[data-tour="dashboard-document-expirations"]',
    nextLabel: "Next: Insurance Summary",
    metrics: ["Expiring documents", "Missing documents", "Items needing review"],
    dataToEnter: "Document names, owners, expiration dates, status, and notes.",
    ownerDecision: "Decide what to renew or collect before it becomes a blocker.",
  }),
  dashboardStep({
    id: "dashboard-insurance-summary",
    title: "Insurance Summary: coverage risk",
    lesson:
      "Insurance Summary shows coverage status and upcoming insurance risk.",
    why:
      "Insurance affects compliance, claims, contract eligibility, and business protection.",
    selector: '[data-tour="dashboard-insurance-summary"]',
    nextLabel: "Next: Recent Activity",
    metrics: ["Coverage status", "Expiring policy", "Risk snapshot"],
    dataToEnter: "Policy type, expiration date, coverage notes, and renewal status.",
    ownerDecision: "Decide what policy needs renewal or attention.",
  }),
  dashboardStep({
    id: "dashboard-recent-activity",
    title: "Recent Activity: what changed lately",
    lesson:
      "Recent Activity shows the newest saved contracts, reports, claims, receipts, and route actions.",
    why:
      "It gives the owner a quick audit trail so they know what happened without searching every tab.",
    selector: '[data-tour="dashboard-recent-activity"]',
    nextLabel: "Next: Set Up Contracts",
    metrics: ["Recent saves", "Recent claims", "Recent reports", "Activity trail"],
    dataToEnter: "Activity is generated by work done across the app.",
    ownerDecision: "Decide whether recent changes require review or follow-up.",
  }),
  {
    id: "contracts",
    tab: "Contracts",
    eyebrow: "Tab walkthrough",
    title: "Contracts: rate terms come before profit",
    lesson:
      "Contracts are the first tab after the Dashboard because the app needs retailer/customer terms before it can calculate profit. This is where route pay, stops, weekly route count, terms, active contracts, renewals, and contract performance live.",
    why: "If the contract terms are wrong, every profit number after this is wrong.",
    story: "Route 14 runs under the Lowe's Appliance Delivery contract. That contract is the revenue source for the rest of the workflow.",
    dataToEnter: "Retailer/customer, route pay, stop pay, route count, accessorials, claim terms, renewal dates, and contract status.",
    ownerDecision: "Decide which contract is healthy, which one needs renegotiation, and which customer is worth growing.",
    metrics: ["Retailer", "Route pay", "Stops", "Weekly route count", "Renewals", "Performance"],
    outcome: "Revenue has a trusted source before the app calculates margin.",
    nextTab: "Teams",
    nextLabel: "Next: Add Teams",
    selector: '[data-tour="contracts"], [data-tour-nav="finance"]',
  },
  {
    id: "teams",
    tab: "Teams",
    eyebrow: "Tab walkthrough",
    title: "Teams: who is doing the work",
    lesson:
      "Teams explains the drivers, helpers, trucks, readiness, assigned routes, compliance status, and photo proof requirements behind the route.",
    why: "Claims and profit need ownership. Teams connect field work to results.",
    story: "North Route Team runs Route 14 with Truck 214. Their readiness feeds the Dashboard, Claims, Compliance, Reports, and Ask.",
    dataToEnter: "Drivers, helpers, trucks, assigned routes, team status, readiness, compliance score, and daily photo proof.",
    ownerDecision: "Decide which team is ready, which team needs coaching, and who owns each route or claim.",
    metrics: ["Drivers", "Helpers", "Trucks", "Readiness", "Assigned routes", "Photo proof"],
    outcome: "Field work becomes accountable.",
    nextTab: "Profitability",
    nextLabel: "Next: Review Profitability",
    selector: '[data-tour="teams"], [data-tour-nav="operations"]',
  },
  {
    id: "profitability",
    tab: "Profitability",
    eyebrow: "Tab walkthrough",
    title: "Profitability: how money is calculated",
    lesson:
      "Profitability turns contract revenue into real margin by subtracting labor, fuel, truck insurance, maintenance, claims, and other costs. It shows profit per route, profit per stop, margin, and saved scenarios/days.",
    why: "A busy route can still lose money. This tab shows whether the work actually pays.",
    story: "Route 14 starts with Lowe's contract revenue and subtracts driver/helper labor, fuel, truck costs, maintenance, claims, and other costs.",
    dataToEnter: "Revenue, labor, fuel, truck insurance, maintenance, claims reserve, other costs, target profit, and scenario details.",
    ownerDecision: "Decide whether to keep running the route, raise rates, change staffing, reduce costs, or save a scenario/day.",
    metrics: ["Revenue", "Labor", "Fuel", "Insurance", "Maintenance", "Claims", "Profit per route", "Profit per stop", "Margin"],
    outcome: "The owner can price routes and spot money leaks.",
    nextTab: "Claims",
    nextLabel: "Next: Control Claims",
    selector: '[data-tour="expenses"], [data-tour-nav="finance"]',
  },
  {
    id: "claims",
    tab: "Claims",
    eyebrow: "Tab walkthrough",
    title: "Claims: the money leak control center",
    lesson:
      "Claims tracks open claims, needs-review items, risk level, claim amount, evidence needed, driver assigned, dispute readiness, and resolved claims.",
    why: "Claims directly reduce profit and can hurt scorecards, renewals, and cash flow.",
    story: "The Route 14 wall damage claim is tied to North Route Team and reduces profitability until reviewed or resolved.",
    dataToEnter: "Claim type, amount, route, team, driver, risk, status, evidence, notes, dispute readiness, and resolution outcome.",
    ownerDecision: "Decide which claims need evidence, which can be disputed, and which are resolved.",
    metrics: ["Open claims", "Needs review", "Risk level", "Amount", "Evidence", "Dispute readiness"],
    outcome: "Claim losses become visible and actionable.",
    nextTab: "Intake",
    nextLabel: "Next: Import Documents",
    selector: '[data-tour="claims"], [data-tour-nav="operations"]',
  },
  {
    id: "intake",
    tab: "Intake",
    eyebrow: "Tab walkthrough",
    title: "Intake: raw business info comes in",
    lesson:
      "Intake is where claim emails, contract notes, receipts, route sheets, documents, screenshots, PDFs, and AI Quick Intake results enter the system.",
    why: "Contractors should be able to upload or paste what they already have instead of manually typing everything.",
    story: "A Lowe's rate card, Route 14 sheet, fuel receipt, and wall damage claim email can all start here.",
    dataToEnter: "Claim emails, contract notes, receipts, route sheets, documents, screenshots, PDFs, and notes.",
    ownerDecision: "Review what AI extracted and decide whether to save it to Claims, Receipts, Contracts, or route records.",
    metrics: ["Claim emails", "Contract notes", "Receipts", "Route sheets", "AI Quick Intake"],
    outcome: "Manual entry drops and the rest of the app gets cleaner data.",
    nextTab: "Receipts",
    nextLabel: "Next: Attach Receipts",
    selector: '[data-tour-nav="intake"]',
  },
  {
    id: "receipts",
    tab: "Receipts",
    eyebrow: "Tab walkthrough",
    title: "Receipts: expense proof",
    lesson:
      "Receipts prove expenses like fuel, tools, repairs, parking, tolls, maintenance, and supplies.",
    why: "Expenses reduce margin. Receipts make profitability more accurate.",
    story: "Route 14 includes fuel and toll receipts that support the expense side of the profit calculation.",
    dataToEnter: "Vendor, amount, date, category, notes, receipt proof, and route or contract connection.",
    ownerDecision: "Decide whether route costs are normal, missing proof, or cutting into margin.",
    metrics: ["Fuel", "Tools", "Repairs", "Parking", "Tolls", "Maintenance"],
    outcome: "Expense proof connects field spending to real margin.",
    nextTab: "Compliance",
    nextLabel: "Next: Check Compliance",
    selector: '[data-tour-nav="finance"]',
  },
  {
    id: "compliance",
    tab: "Compliance",
    eyebrow: "Tab walkthrough",
    title: "Compliance: operational protection",
    lesson:
      "Compliance protects the operation with insurance, DOT/FMCSA documents, driver documents, expiring documents, readiness score, and items needing review.",
    why: "Even profitable work can become risky if documents or readiness requirements are missing.",
    story: "Truck 214 and the Route 14 team need document readiness and proof so the business can defend claims and pass reviews.",
    dataToEnter: "Insurance, DOT/FMCSA documents, driver files, vehicle documents, expirations, readiness items, and proof status.",
    ownerDecision: "Decide what must be updated before dispatch, audit review, retailer scorecards, or claim packets.",
    metrics: ["Insurance", "DOT/FMCSA docs", "Driver documents", "Expiring documents", "Readiness score"],
    outcome: "The business reduces penalties, audit risk, and missing-proof problems.",
    nextTab: "Reports",
    nextLabel: "Next: Review Reports",
    selector: '[data-tour-nav="operations"]',
  },
  {
    id: "reports",
    tab: "Reports",
    eyebrow: "Tab walkthrough",
    title: "Reports: owner review and history",
    lesson:
      "Reports are where the owner reviews profit snapshots, claims reports, route reports, PDF exports, trend review, and saved daily/weekly/monthly performance.",
    why: "Daily activity becomes useful when it turns into history and decisions.",
    story: "Route 14 appears in profit snapshots, claims impact, route reports, and financial summaries after data is saved.",
    dataToEnter: "Saved snapshots, report filters, route selections, claims data, team data, financial data, and export choices.",
    ownerDecision: "Decide which routes are improving, which claims hurt margin, and what to fix next week.",
    metrics: ["Profit snapshots", "Claims reports", "Route reports", "PDF export", "Trend review"],
    outcome: "The business gets a repeatable owner review rhythm.",
    nextTab: "Ask",
    nextLabel: "Next: Ask AI",
    selector: '[data-tour="reports"], [data-tour-nav="reports"]',
  },
  {
    id: "ask",
    tab: "Ask",
    eyebrow: "Tab walkthrough",
    title: "Ask: AI comes last because it needs data",
    lesson:
      "Ask is useful after the other tabs have data. It can answer what is hurting margin, which routes lose money, which teams create the most claims, and what needs attention today.",
    why: "AI should use real business context instead of guessing from an empty workspace.",
    story: "After Route 14 has contract terms, a team, costs, a claim, receipts, compliance status, and reports, Ask can explain what is happening.",
    dataToEnter: "Plain-English questions about margin, route losses, claims, team patterns, and today's priorities.",
    ownerDecision: "Decide what to fix first based on the full business context.",
    metrics: ["Business questions", "Margin leaks", "Route losses", "Team claim patterns", "Needs attention"],
    outcome: "The owner gets fast insight from the data already entered.",
    nextTab: "Complete",
    nextLabel: "Finish Walkthrough",
    selector: '[data-tour="ask-assistant"], [data-tour-nav="ask"]',
  },
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
      "Processes claim emails, contracts, receipts, route sheets, documents, screenshots, PDFs, and raw notes.",
    matters: "Reduces manual input and sends reviewed data to the right workflow.",
    metrics: ["AI Quick Intake", "Uploads", "Extracted fields"],
    outcome: "Quicker setup and cleaner data.",
  },
  Operations: {
    title: "Operations",
    description:
      "Groups field execution areas: teams, claims, compliance, route readiness, and blockers.",
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
      "Turns saved snapshots, claims, routes, teams, and financial data into reports and exports.",
    matters: "Converts daily activity into owner decisions and historical trend review.",
    metrics: ["Snapshots", "Claims reports", "Route reports", "PDF export"],
    outcome: "Repeatable business review rhythm.",
  },
  Settings: {
    title: "Settings",
    description:
      "Controls company profile, margin targets, dashboard layout, team access, demo mode, and setup preferences.",
    matters: "Keeps the workspace tuned to how the contractor runs the business.",
    metrics: ["Targets", "Roles", "Layout", "Demo controls"],
    outcome: "A workspace that matches the operation.",
  },
};
