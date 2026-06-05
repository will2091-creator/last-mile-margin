const dashboardTab = "Dashboard";

const dashboardDataStory =
  "This walkthrough stays inside the Dashboard data area first. It starts at the top saved contract data and moves down through every visible Dashboard card before touching the navigation.";

const dashboardDataStep = ({
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
  eyebrow: "Dashboard data",
  title,
  lesson,
  why,
  story: dashboardDataStory,
  dataToEnter,
  ownerDecision,
  metrics,
  outcome: "The owner understands what this Dashboard data shows and what decision it supports.",
  nextTab: "Dashboard",
  nextLabel,
  selector,
});

const navStep = ({
  id,
  tab,
  title,
  lesson,
  why,
  selector,
  nextTab,
  nextLabel,
  metrics,
  dataToEnter,
  ownerDecision,
  outcome,
}) => ({
  id,
  tab,
  eyebrow: "Navigation walkthrough",
  title,
  lesson,
  why,
  story:
    "After the Dashboard data is explained, the walkthrough moves down the sidebar navigation in order: Dashboard, Ask, Intake, Operations, Finance, Reports, then Settings.",
  dataToEnter,
  ownerDecision,
  metrics,
  outcome,
  nextTab,
  nextLabel,
  selector,
});

export const guidedDemoSteps = [
  dashboardDataStep({
    id: "dashboard-saved-contracts",
    title: "Saved Contracts: start the Dashboard data here",
    lesson:
      "This is the first data section on the Dashboard. It shows which contracts are already saved and which customer agreements are feeding the money numbers below.",
    why:
      "Contracts come before profit because rate terms create the revenue that every margin calculation depends on.",
    selector: '[data-tour="dashboard-saved-contracts"]',
    nextLabel: "Next: Lowe's Contract Card",
    metrics: ["Saved contracts", "Routes per week", "Revenue", "Profit", "Margin"],
    dataToEnter: "Customer or retailer, route pay, stop pay, weekly route count, contract costs, and claim terms.",
    ownerDecision: "Decide which contract is creating healthy work and which contract needs pricing attention.",
  }),
  dashboardDataStep({
    id: "dashboard-contract-card-lowes",
    title: "Contract Card 1: Lowe's Appliance Delivery",
    lesson:
      "This card is a complete contract snapshot: contract name, weekly route count, revenue, profit, and margin. It tells whether this customer route is worth running.",
    why:
      "The owner needs to see contract-level profitability before digging into route details.",
    selector: '[data-tour="dashboard-contract-card-0"], [data-tour="dashboard-saved-contracts"]',
    nextLabel: "Next: Regional Contract Card",
    metrics: ["Contract name", "Routes/week", "Revenue", "Profit", "Margin"],
    dataToEnter: "The saved Lowe's contract terms and route cost assumptions.",
    ownerDecision: "Decide if the Lowe's work is priced well enough or needs a cost/rate review.",
  }),
  dashboardDataStep({
    id: "dashboard-contract-card-regional",
    title: "Contract Card 2: Regional Furniture Delivery",
    lesson:
      "The second card lets the owner compare another customer against Lowe's. The Dashboard is not just one route; it shows the contract portfolio side by side.",
    why:
      "Comparing contracts helps the owner see where profit is strongest and where margin may be weaker.",
    selector: '[data-tour="dashboard-contract-card-1"], [data-tour="dashboard-saved-contracts"]',
    nextLabel: "Next: Day Net Profit",
    metrics: ["Customer comparison", "Weekly route load", "Revenue", "Profit", "Margin"],
    dataToEnter: "Another saved customer contract with route count, pay, and cost assumptions.",
    ownerDecision: "Decide which customer should get more attention, more capacity, or a renegotiation.",
  }),
  dashboardDataStep({
    id: "dashboard-period-card-net-profit",
    title: "Day Net Profit: the first quick metric",
    lesson:
      "This card shows net profit for the selected period. In Day view, it answers the simplest owner question: did the business make money today?",
    why:
      "Revenue alone can hide a bad route. Net profit shows what remains after costs and risk are counted.",
    selector: '[data-tour="dashboard-period-card-net-profit"], [data-tour="dashboard-period-metrics"]',
    nextLabel: "Next: Day Open Claims",
    metrics: ["Net profit", "Selected period", "Route profit calculation"],
    dataToEnter: "Contract revenue, labor, fuel, truck cost, maintenance, claims, and other costs.",
    ownerDecision: "Decide whether today's route math is healthy enough to keep running as-is.",
  }),
  dashboardDataStep({
    id: "dashboard-period-card-open-claims",
    title: "Day Open Claims: current claim workload",
    lesson:
      "This card shows how many claims are still open for the selected period. It is the fastest signal that money or customer scorecards need attention.",
    why:
      "Open claims can become chargebacks, lost profit, and customer performance problems.",
    selector: '[data-tour="dashboard-period-card-open-claims"], [data-tour="dashboard-period-metrics"]',
    nextLabel: "Next: Day Claim Exposure",
    metrics: ["Open claims", "Claims needing action", "Selected period"],
    dataToEnter: "Claim status, amount, route, customer, driver, evidence, and review notes.",
    ownerDecision: "Decide which claim needs action first.",
  }),
  dashboardDataStep({
    id: "dashboard-period-card-claim-exposure",
    title: "Day Claim Exposure: money at risk",
    lesson:
      "This card converts open claims into dollars at risk. It shows how much margin could disappear if claims are not controlled.",
    why:
      "A route can look profitable until claim exposure is included.",
    selector: '[data-tour="dashboard-period-card-claim-exposure"], [data-tour="dashboard-period-metrics"]',
    nextLabel: "Next: Day Team Photos",
    metrics: ["Claim dollars", "Open risk", "Margin exposure"],
    dataToEnter: "Claim amount, reserve estimate, dispute status, and expected financial impact.",
    ownerDecision: "Decide whether the claim needs evidence, dispute prep, or reserve planning.",
  }),
  dashboardDataStep({
    id: "dashboard-period-card-team-photos",
    title: "Day Team Photos: readiness proof",
    lesson:
      "This card shows how many teams uploaded daily photo proof. It connects field readiness to claim defense and daily accountability.",
    why:
      "Photo proof protects the contractor when a claim or customer dispute appears later.",
    selector: '[data-tour="dashboard-period-card-team-photos"], [data-tour="dashboard-period-metrics"]',
    nextLabel: "Next: Today's Profit Detail",
    metrics: ["Uploaded photos", "Active teams", "Daily readiness proof"],
    dataToEnter: "Team photo status, route assignment, driver/helper, and truck readiness.",
    ownerDecision: "Decide which team is missing required proof before the day gets away.",
  }),
  dashboardDataStep({
    id: "dashboard-todays-profit",
    title: "Today's Profit Detail: main money readout",
    lesson:
      "This larger profit section explains the main profit number, margin percentage, and trend context from saved snapshots.",
    why:
      "The owner needs a clear financial readout before reviewing the smaller operational details.",
    selector: '[data-tour="dashboard-todays-profit"]',
    nextLabel: "Next: Financial Summary",
    metrics: ["Net profit", "Margin", "Trend", "Snapshot comparison"],
    dataToEnter: "Route revenue, labor, fuel, truck insurance, maintenance, claims, other costs, and saved snapshots.",
    ownerDecision: "Decide whether the business is improving, slipping, or missing enough history to know.",
  }),
  dashboardDataStep({
    id: "dashboard-financial-summary",
    title: "Financial Summary: revenue, costs, claims, escrow",
    lesson:
      "This section breaks the money story into revenue, costs, claims, and escrow so the owner can see what created profit or took it away.",
    why:
      "Profit alone is too broad. The owner needs to know which part of the money flow moved the number.",
    selector: '[data-tour="dashboard-financial-summary"]',
    nextLabel: "Next: Recent Claims",
    metrics: ["Revenue", "Costs", "Claims", "Escrow"],
    dataToEnter: "Contract revenue, cost assumptions, receipts, claim exposure, and reserve/escrow assumptions.",
    ownerDecision: "Decide whether the issue is low revenue, high cost, claim risk, or reserve pressure.",
  }),
  dashboardDataStep({
    id: "dashboard-recent-claims",
    title: "Recent Claims: newest losses and disputes",
    lesson:
      "Recent Claims shows the latest claim type, customer or route, amount, and status. It pulls the newest money leaks onto the Dashboard.",
    why:
      "Claims can turn a good route into a bad route if they are ignored.",
    selector: '[data-tour="dashboard-recent-claims"]',
    nextLabel: "Next: Saved Route Performance",
    metrics: ["Claim type", "Contract", "Amount", "Status"],
    dataToEnter: "Claim details, claim amount, route, customer, evidence, team, and status.",
    ownerDecision: "Decide what claim needs review or dispute evidence first.",
  }),
  dashboardDataStep({
    id: "dashboard-saved-routes",
    title: "Saved Route Performance: route history",
    lesson:
      "Saved Route Performance shows route results that have been saved over time. It lets the owner compare routes instead of trusting one day of data.",
    why:
      "Repeated route history shows whether performance is consistent or just a one-time result.",
    selector: '[data-tour="dashboard-saved-routes"]',
    nextLabel: "Next: Active Contracts",
    metrics: ["Saved routes", "Profit", "Margin", "Route history"],
    dataToEnter: "Saved profitability scenarios, saved days, route names, route revenue, and route costs.",
    ownerDecision: "Decide which route should be grown, fixed, renegotiated, or watched.",
  }),
  dashboardDataStep({
    id: "dashboard-active-contracts",
    title: "Active Contracts: portfolio status",
    lesson:
      "Active Contracts summarizes the contract portfolio: how many agreements are active, on watch, or at risk.",
    why:
      "Contract risk should be visible before renewal season or customer review.",
    selector: '[data-tour="dashboard-active-contracts"]',
    nextLabel: "Next: Contract Performance",
    metrics: ["Active", "Watch", "At Risk"],
    dataToEnter: "Contract status, risk label, performance notes, and renewal context.",
    ownerDecision: "Decide which customer agreement needs attention.",
  }),
  dashboardDataStep({
    id: "dashboard-contract-performance",
    title: "Contract Performance: customer comparison",
    lesson:
      "Contract Performance compares customer agreements by profit, margin, and risk so the owner can see which contracts are helping the business.",
    why:
      "Not every customer is equally profitable. This helps separate good work from costly work.",
    selector: '[data-tour="dashboard-contract-performance"]',
    nextLabel: "Next: Upcoming Renewals",
    metrics: ["Customer", "Profit", "Margin", "Risk"],
    dataToEnter: "Contract revenue, route count, costs, claim terms, and status.",
    ownerDecision: "Decide which contract to protect, expand, renegotiate, or reduce.",
  }),
  dashboardDataStep({
    id: "dashboard-upcoming-renewals",
    title: "Upcoming Renewals: contract deadlines",
    lesson:
      "Upcoming Renewals shows which customer agreements are coming up for review and how much time remains.",
    why:
      "Renewals are the opportunity to improve route pay, stop pay, claim terms, and operating expectations.",
    selector: '[data-tour="dashboard-upcoming-renewals"]',
    nextLabel: "Next: Needs Attention",
    metrics: ["Renewal date", "Days remaining", "Customer"],
    dataToEnter: "Renewal dates, contract terms, customer notes, and target changes.",
    ownerDecision: "Decide which renewal needs preparation before the deadline.",
  }),
  dashboardDataStep({
    id: "dashboard-needs-attention",
    title: "Needs Attention: today's owner action list",
    lesson:
      "Needs Attention gathers the issues that should not be ignored: missing proof, open claims, compliance problems, cost pressure, or reserve risk.",
    why:
      "This turns scattered business problems into one action list.",
    selector: '[data-tour="dashboard-needs-attention"]',
    nextLabel: "Next: Route Health",
    metrics: ["Active issues", "Missing proof", "Claims", "Compliance", "Cost risk"],
    dataToEnter: "Claims, team status, missing photos, compliance items, cost warnings, and reserve exposure.",
    ownerDecision: "Decide what needs to be handled first today.",
  }),
  dashboardDataStep({
    id: "dashboard-route-health",
    title: "Route Health: route quality check",
    lesson:
      "Route Health shows whether route revenue, cost, margin, and claims exposure are healthy or need review.",
    why:
      "A route can create revenue and still be unhealthy if cost, labor, miles, or claims are too high.",
    selector: '[data-tour="dashboard-route-health"]',
    nextLabel: "Next: Route Efficiency",
    metrics: ["Revenue per route", "Cost per route", "Average margin", "Claims exposure"],
    dataToEnter: "Route revenue, route costs, route volume, claim exposure, miles, stops, and labor assumptions.",
    ownerDecision: "Decide whether the route needs pricing, staffing, or operational changes.",
  }),
  dashboardDataStep({
    id: "dashboard-route-efficiency",
    title: "Route Efficiency: how well the route runs",
    lesson:
      "Route Efficiency scores field execution signals like photo readiness, team utilization, at-risk teams, and open claims.",
    why:
      "Efficiency explains whether operational execution is supporting or hurting margin.",
    selector: '[data-tour="dashboard-route-efficiency"]',
    nextLabel: "Next: Team Readiness",
    metrics: ["Readiness score", "Photo readiness", "Team utilization", "Open claims"],
    dataToEnter: "Team status, route assignments, photo proof, at-risk labels, and open claim count.",
    ownerDecision: "Decide if field execution needs follow-up before it becomes a financial problem.",
  }),
  dashboardDataStep({
    id: "dashboard-team-readiness",
    title: "Team Readiness: crews and proof",
    lesson:
      "Team Readiness shows whether crews have uploaded required daily proof and are ready to support the assigned work.",
    why:
      "Team readiness affects dispatch, claim defense, compliance, and customer scorecards.",
    selector: '[data-tour="dashboard-team-readiness"]',
    nextLabel: "Next: Compliance Status",
    metrics: ["Readiness percent", "Uploaded photos", "Active teams"],
    dataToEnter: "Drivers, helpers, trucks, assigned routes, team status, and photo proof.",
    ownerDecision: "Decide which team is ready and which team needs follow-up.",
  }),
  dashboardDataStep({
    id: "dashboard-compliance-status",
    title: "Compliance Status: operational protection",
    lesson:
      "Compliance Status shows the document and readiness health of the business: insurance, driver documents, vehicle documents, and review items.",
    why:
      "Compliance protects the business from audit problems, route eligibility issues, and weak claim packets.",
    selector: '[data-tour="dashboard-compliance-status"]',
    nextLabel: "Next: Fuel Cost Tracker",
    metrics: ["Compliance score", "Documents", "Insurance", "Readiness"],
    dataToEnter: "Insurance records, driver documents, truck documents, expirations, and review notes.",
    ownerDecision: "Decide what must be fixed before audit, dispatch, or customer review.",
  }),
  dashboardDataStep({
    id: "dashboard-fuel-cost-tracker",
    title: "Fuel Cost Tracker: fuel pressure on margin",
    lesson:
      "Fuel Cost Tracker shows whether fuel expense is putting pressure on route margin for the selected period.",
    why:
      "Fuel cost can quietly erase profit if the contract rate or surcharge does not cover it.",
    selector: '[data-tour="dashboard-fuel-cost-tracker"]',
    nextLabel: "Next: Document Expirations",
    metrics: ["Fuel cost", "Weekly impact", "Margin pressure"],
    dataToEnter: "Fuel receipts, fuel assumptions, mileage, surcharge terms, and route distance.",
    ownerDecision: "Decide whether routing, surcharge, or fuel assumptions need adjustment.",
  }),
  dashboardDataStep({
    id: "dashboard-document-expirations",
    title: "Document Expirations: expiring items",
    lesson:
      "Document Expirations flags driver, vehicle, insurance, and compliance documents that are expiring or need review.",
    why:
      "Expired documents can stop work, weaken claim defense, or create audit problems.",
    selector: '[data-tour="dashboard-document-expirations"]',
    nextLabel: "Next: Insurance Summary",
    metrics: ["Expiring documents", "Missing items", "Review items"],
    dataToEnter: "Document names, owners, expiration dates, status, and notes.",
    ownerDecision: "Decide what to renew or collect before it becomes a blocker.",
  }),
  dashboardDataStep({
    id: "dashboard-insurance-summary",
    title: "Insurance Summary: coverage snapshot",
    lesson:
      "Insurance Summary shows coverage status and upcoming insurance risk in one compact Dashboard card.",
    why:
      "Insurance affects compliance, contracts, claims, and the company's ability to keep operating.",
    selector: '[data-tour="dashboard-insurance-summary"]',
    nextLabel: "Next: Recent Activity",
    metrics: ["Coverage status", "Policy risk", "Renewal needs"],
    dataToEnter: "Policy type, expiration date, coverage notes, and renewal status.",
    ownerDecision: "Decide what policy needs renewal or attention.",
  }),
  dashboardDataStep({
    id: "dashboard-recent-activity",
    title: "Recent Activity: what changed last",
    lesson:
      "Recent Activity shows the newest saved contracts, claims, teams, snapshots, receipts, and reports so the owner can see what changed.",
    why:
      "An owner should not have to hunt through every page just to know what was updated.",
    selector: '[data-tour="dashboard-recent-activity"]',
    nextLabel: "Next: Dashboard Tab",
    metrics: ["Recent saves", "Recent claims", "Recent reports", "Activity trail"],
    dataToEnter: "Activity is generated automatically when work is saved across the app.",
    ownerDecision: "Decide whether recent changes require review or follow-up.",
  }),
  navStep({
    id: "nav-dashboard",
    tab: "Dashboard",
    title: "Dashboard Tab: command center",
    lesson:
      "The Dashboard tab is the first navigation item because it gives the owner the daily command center before opening any detailed workspace.",
    why:
      "This is where the owner starts: profit, claims, route health, team readiness, compliance, and recent activity.",
    selector: '[data-tour-nav="dashboard"]',
    nextTab: "Ask",
    nextLabel: "Next: Ask Tab",
    metrics: ["Profit", "Claims", "Route health", "Readiness", "Activity"],
    dataToEnter: "The Dashboard mostly reads from the other tabs and saved snapshots.",
    ownerDecision: "Decide what needs attention first.",
    outcome: "The owner gets a single starting point for the business day.",
  }),
  navStep({
    id: "nav-ask",
    tab: "Ask",
    title: "Ask Tab: business questions",
    lesson:
      "Ask lets the owner ask questions about margin, claims, routes, teams, receipts, contracts, and what needs attention.",
    why:
      "Ask is useful after the workspace has data because it can explain patterns without the owner digging through every page.",
    selector: '[data-tour-nav="ask"]',
    nextTab: "Intake",
    nextLabel: "Next: Intake Tab",
    metrics: ["Margin questions", "Route losses", "Claims patterns", "Today priorities"],
    dataToEnter: "Plain-English questions about the business.",
    ownerDecision: "Decide what to investigate or fix based on the answer.",
    outcome: "The owner gets faster insight from existing data.",
  }),
  navStep({
    id: "nav-intake",
    tab: "Intake",
    title: "Intake Tab: bring raw data in",
    lesson:
      "Intake is where raw business information comes in: claim emails, receipts, contracts, route sheets, PDFs, screenshots, and notes.",
    why:
      "It gives the owner a fast way to turn messy documents into clean records without typing everything manually.",
    selector: '[data-tour-nav="intake"]',
    nextTab: "Operations",
    nextLabel: "Next: Operations Tab",
    metrics: ["AI Quick Intake", "Uploads", "Extracted fields", "Saved drafts"],
    dataToEnter: "Claim emails, contract notes, receipts, route sheets, PDFs, screenshots, and text notes.",
    ownerDecision: "Decide where the extracted data should be saved: Claims, Receipts, Contracts, or the workday.",
    outcome: "Raw business information becomes usable app data.",
  }),
  navStep({
    id: "nav-operations",
    tab: "Operations",
    title: "Operations Tab: field execution",
    lesson:
      "Operations is where field work is managed. It groups dispatch, teams, claims, compliance, proof, and blockers.",
    why:
      "This is where the owner sees who did the work, what went wrong, and what needs operational follow-up.",
    selector: '[data-tour-nav="operations"]',
    nextTab: "Finance",
    nextLabel: "Next: Finance Tab",
    metrics: ["Dispatch", "Teams", "Claims", "Compliance", "Proof"],
    dataToEnter: "Drivers, helpers, trucks, claims, compliance documents, route notes, and daily proof.",
    ownerDecision: "Decide which team, claim, or compliance item needs action.",
    outcome: "Field work becomes accountable and connected to risk.",
  }),
  navStep({
    id: "nav-finance",
    tab: "Finance",
    title: "Finance Tab: money details",
    lesson:
      "Finance is where money is calculated and supported. It groups profitability, receipts, and contracts.",
    why:
      "The owner needs contract rates, expenses, receipts, and route costs in one money workspace.",
    selector: '[data-tour-nav="finance"]',
    nextTab: "Reports",
    nextLabel: "Next: Reports Tab",
    metrics: ["Profitability", "Receipts", "Contracts", "Margin"],
    dataToEnter: "Contract terms, route revenue, labor, fuel, insurance, maintenance, receipts, and other costs.",
    ownerDecision: "Decide whether a route, contract, or expense pattern is helping or hurting profit.",
    outcome: "The business can calculate real margin instead of guessing.",
  }),
  navStep({
    id: "nav-reports",
    tab: "Reports",
    title: "Reports Tab: history and exports",
    lesson:
      "Reports turns saved days, claims, routes, teams, and financial data into owner review pages and PDF exports.",
    why:
      "Reports are where daily activity becomes history, trend review, and business decisions.",
    selector: '[data-tour-nav="reports"]',
    nextTab: "Settings",
    nextLabel: "Next: Settings Tab",
    metrics: ["Profit snapshots", "Claims reports", "Route reports", "PDF export", "Trends"],
    dataToEnter: "Saved snapshots, filters, routes, claims, team data, and export choices.",
    ownerDecision: "Decide what changed over time and what should be fixed next.",
    outcome: "The owner gets a repeatable review rhythm.",
  }),
  navStep({
    id: "nav-settings",
    tab: "Settings",
    title: "Settings Tab: workspace controls",
    lesson:
      "Settings controls company profile, theme, dashboard layout, margin targets, team access, demo tools, and workspace preferences.",
    why:
      "Settings makes the app match how the contractor actually runs the business.",
    selector: '[data-tour-nav="settings"]',
    nextTab: "Complete",
    nextLabel: "Finish Walkthrough",
    metrics: ["Company profile", "Dashboard layout", "Targets", "Team access", "Demo controls"],
    dataToEnter: "Company details, dashboard preferences, benchmarks, roles, and setup preferences.",
    ownerDecision: "Decide how the workspace should be configured for the business.",
    outcome: "The walkthrough ends after every Dashboard data section and every main tab has been explained.",
  }),
];

export const navPreviewContent = {
  Dashboard: {
    title: "Dashboard",
    description:
      "Shows the command center: profit, revenue, costs, claims exposure, route health, team readiness, compliance, and recent activity.",
    matters: "Keeps the owner focused on what needs attention today.",
    metrics: ["Profit", "Revenue", "Costs", "Claims", "Margin"],
    outcome: "Faster daily decisions.",
  },
  Ask: {
    title: "Ask AI",
    description:
      "Answers business questions using the workspace data from Dashboard, Intake, Operations, Finance, and Reports.",
    matters: "Turns business data into plain-English insight.",
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
      "Groups field execution areas: dispatch, teams, claims, compliance, route readiness, and blockers.",
    matters: "Connects who did the work to proof, issues, risk, and claim outcomes.",
    metrics: ["Dispatch", "Teams", "Claims", "Compliance"],
    outcome: "Cleaner execution and fewer preventable losses.",
  },
  Finance: {
    title: "Finance",
    description:
      "Groups profitability, receipts, and contracts so route revenue and route costs connect.",
    matters: "A busy route can still lose money when costs and claims are counted.",
    metrics: ["Profitability", "Receipts", "Contracts", "Margin"],
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
