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

const tabDetailStep = ({
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
  eyebrow: `${tab} walkthrough`,
  title,
  lesson,
  why,
  story:
    "Inside each tab, the walkthrough moves from the top of the page to the bottom so the owner understands every workspace before moving to the next navigation item.",
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
    nextTab: "Ask",
    nextLabel: "Next: Ask Header",
    metrics: ["Margin questions", "Route losses", "Claims patterns", "Today priorities"],
    dataToEnter: "Plain-English questions about the business.",
    ownerDecision: "Decide what to investigate or fix based on the answer.",
    outcome: "The owner gets faster insight from existing data.",
  }),
  tabDetailStep({
    id: "ask-header",
    tab: "Ask",
    title: "Ask Header: start with the AI workspace",
    lesson:
      "This header explains that Ask is the owner’s question-and-answer workspace. It sits near the top because the owner should know what data the AI is using before trusting the answer.",
    why:
      "Ask is most useful after the app has contracts, teams, claims, receipts, and reports to reference.",
    selector: '[data-tour="ask-header"]',
    nextTab: "Ask",
    nextLabel: "Next: Daily AI Briefing",
    metrics: ["Business questions", "Workspace context", "AI readiness"],
    dataToEnter: "Plain-English business questions about routes, claims, teams, costs, contracts, or today’s priorities.",
    ownerDecision: "Decide what issue deserves investigation before opening several tabs manually.",
    outcome: "The owner knows Ask is for answers, not raw data entry.",
  }),
  tabDetailStep({
    id: "ask-briefing",
    tab: "Ask",
    title: "Daily AI Briefing: what needs attention",
    lesson:
      "The briefing summarizes the most important current signals from the workspace so the owner can start with a focused readout.",
    why:
      "A good daily briefing turns scattered operational and financial data into an owner action list.",
    selector: '[data-tour="ask-briefing"]',
    nextTab: "Ask",
    nextLabel: "Next: Data Health",
    metrics: ["Daily priorities", "Margin pressure", "Claims risk", "Readiness"],
    dataToEnter: "This is generated from saved contracts, claims, receipts, team status, reports, and snapshots.",
    ownerDecision: "Decide what to ask about first or what problem needs immediate review.",
    outcome: "The owner gets a fast business pulse before asking a custom question.",
  }),
  tabDetailStep({
    id: "ask-data-health",
    tab: "Ask",
    title: "Data Health: can AI answer well?",
    lesson:
      "Data Health shows whether enough business information exists for reliable answers. Missing contracts, receipts, claims, or snapshots limit what Ask can explain.",
    why:
      "AI output is only as strong as the workspace data behind it.",
    selector: '[data-tour="ask-data-health"]',
    nextTab: "Ask",
    nextLabel: "Next: Suggested Questions",
    metrics: ["Contracts present", "Receipts present", "Claims present", "Snapshots present"],
    dataToEnter: "Save the missing records called out by the checklist.",
    ownerDecision: "Decide what data should be added before relying on deeper AI analysis.",
    outcome: "The owner understands why clean data creates better answers.",
  }),
  tabDetailStep({
    id: "ask-suggested-prompts",
    tab: "Ask",
    title: "Suggested Questions: start with useful prompts",
    lesson:
      "Suggested questions show the kinds of owner decisions Ask can support, like what is hurting margin or which route needs attention.",
    why:
      "Most owners know the problem but may not know the best question to ask first.",
    selector: '[data-tour="ask-suggested-prompts"]',
    nextTab: "Ask",
    nextLabel: "Next: Answer Panel",
    metrics: ["Margin questions", "Route questions", "Claims questions", "Team questions"],
    dataToEnter: "Choose a suggested prompt or type a custom question.",
    ownerDecision: "Decide which business question has the highest value today.",
    outcome: "The owner can use Ask without starting from a blank prompt box.",
  }),
  tabDetailStep({
    id: "ask-answer-panel",
    tab: "Ask",
    title: "Answer Panel: turn data into explanation",
    lesson:
      "The answer panel is where Ask explains what it found, which records were relevant, and what the owner should review.",
    why:
      "This turns workspace data into a decision instead of another spreadsheet to interpret.",
    selector: '[data-tour="ask-answer-panel"]',
    nextTab: "Ask",
    nextLabel: "Next: Question Box",
    metrics: ["Answer summary", "Referenced data", "Recommended next action"],
    dataToEnter: "Ask a question after the workspace has useful records.",
    ownerDecision: "Decide whether to open a claim, review a route, check a receipt, or adjust a contract.",
    outcome: "The owner gets a plain-English explanation tied to the business data.",
  }),
  tabDetailStep({
    id: "ask-question-box",
    tab: "Ask",
    title: "Question Box: ask the next business question",
    lesson:
      "This is where the owner types a specific question, such as what is hurting margin or which team has the most claim risk.",
    why:
      "The app becomes more valuable when the owner can interrogate the business instead of manually hunting for patterns.",
    selector: '[data-tour="ask-question-box"]',
    nextTab: "Ask",
    nextLabel: "Next: Ask Guardrails",
    metrics: ["Custom question", "Selected context", "Follow-up analysis"],
    dataToEnter: "A clear question about margin, routes, claims, receipts, teams, or contracts.",
    ownerDecision: "Decide the next operational or financial move from the response.",
    outcome: "Ask becomes the final analysis layer once data exists.",
  }),
  tabDetailStep({
    id: "ask-disclaimer",
    tab: "Ask",
    title: "Ask Guardrails: verify important decisions",
    lesson:
      "The bottom note reminds the owner that AI helps analyze the workspace, but important financial and legal decisions should still be reviewed carefully.",
    why:
      "AI should speed up thinking, not replace owner judgment or professional review.",
    selector: '[data-tour="ask-disclaimer"]',
    nextTab: "Intake",
    nextLabel: "Next: Intake Tab",
    metrics: ["Decision support", "Review needed", "Owner judgment"],
    dataToEnter: "No entry here. This is a trust and review reminder.",
    ownerDecision: "Decide when an AI answer needs confirmation from records or an advisor.",
    outcome: "The owner understands Ask as decision support.",
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
    nextTab: "Intake",
    nextLabel: "Next: Intake Header",
    metrics: ["AI Quick Intake", "Uploads", "Extracted fields", "Saved drafts"],
    dataToEnter: "Claim emails, contract notes, receipts, route sheets, PDFs, screenshots, and text notes.",
    ownerDecision: "Decide where the extracted data should be saved: Claims, Receipts, Contracts, or the workday.",
    outcome: "Raw business information becomes usable app data.",
  }),
  tabDetailStep({
    id: "intake-header",
    tab: "Intake",
    title: "Intake Header: the front door for raw information",
    lesson:
      "The Intake header introduces the place where messy business inputs become structured records.",
    why:
      "Contracts, claims, receipts, and route sheets often arrive as emails, photos, PDFs, or notes before they become usable data.",
    selector: '[data-tour="intake-header"]',
    nextTab: "Intake",
    nextLabel: "Next: Intake Examples",
    metrics: ["Uploads", "Emails", "Notes", "Documents"],
    dataToEnter: "Claim emails, contract notes, receipt photos, route sheets, PDFs, screenshots, and text notes.",
    ownerDecision: "Decide what raw information needs to be processed first.",
    outcome: "The owner knows Intake is for capturing information before it is sorted.",
  }),
  tabDetailStep({
    id: "intake-examples",
    tab: "Intake",
    title: "Intake Examples: what can be imported",
    lesson:
      "The examples show the real kinds of material this page can understand: claim emails, contracts, receipts, route sheets, and documents.",
    why:
      "The owner should see that Intake is not limited to one form type.",
    selector: '[data-tour="intake-examples"]',
    nextTab: "Intake",
    nextLabel: "Next: Upload or Paste",
    metrics: ["Claim emails", "Contract notes", "Receipts", "Route sheets"],
    dataToEnter: "Any supported source that contains business details.",
    ownerDecision: "Decide which source should become a claim, receipt, contract, or route record.",
    outcome: "The owner understands the upload possibilities.",
  }),
  tabDetailStep({
    id: "intake-drop-zone",
    tab: "Intake",
    title: "Upload or Paste: capture the raw file",
    lesson:
      "This area is where the owner drops a file, pastes text, or starts AI Quick Intake.",
    why:
      "Fast capture reduces the chance that claim details, receipts, or contract terms sit outside the system.",
    selector: '[data-tour="intake-drop-zone"]',
    nextTab: "Intake",
    nextLabel: "Next: Review Extracted Draft",
    metrics: ["File upload", "Text paste", "AI extraction"],
    dataToEnter: "Upload the document or paste the source text.",
    ownerDecision: "Decide whether the intake source is ready for extraction.",
    outcome: "Raw information enters the workspace.",
  }),
  tabDetailStep({
    id: "intake-review-draft",
    tab: "Intake",
    title: "Review Draft: confirm extracted details",
    lesson:
      "After processing, the review draft is where extracted fields are checked before they are saved into the business records.",
    why:
      "Human review keeps AI intake useful without letting bad data pollute claims, contracts, receipts, or reports.",
    selector: '[data-tour="intake-review-draft"]',
    nextTab: "Intake",
    nextLabel: "Next: Save Destination",
    metrics: ["Extracted fields", "Draft status", "Confidence"],
    dataToEnter: "Correct any extracted customer, amount, date, route, claim, receipt, or contract fields.",
    ownerDecision: "Decide whether the draft is accurate enough to save.",
    outcome: "The owner keeps control before data enters the system.",
  }),
  tabDetailStep({
    id: "intake-next-step",
    tab: "Intake",
    title: "Save Destination: send data to the right tab",
    lesson:
      "This section explains where the processed information should go next: Claims, Receipts, Contracts, or another workflow.",
    why:
      "Intake is valuable because it routes information into the correct part of the business.",
    selector: '[data-tour="intake-next-step"]',
    nextTab: "Intake",
    nextLabel: "Next: Recent Intakes",
    metrics: ["Save to Claims", "Save to Receipts", "Save to Contracts", "Save to Route"],
    dataToEnter: "Choose the correct destination for the reviewed draft.",
    ownerDecision: "Decide what workflow owns the information.",
    outcome: "Messy input becomes organized business data.",
  }),
  tabDetailStep({
    id: "intake-recent",
    tab: "Intake",
    title: "Recent Intakes: what was processed",
    lesson:
      "Recent Intakes shows the latest files and notes that came through this page.",
    why:
      "The owner can verify what has already been captured and avoid duplicate work.",
    selector: '[data-tour="intake-recent"]',
    nextTab: "Operations",
    nextLabel: "Next: Operations Tab",
    metrics: ["Recent uploads", "Drafts", "Saved destinations"],
    dataToEnter: "This list updates when documents or notes are processed.",
    ownerDecision: "Decide whether anything needs review, correction, or follow-up.",
    outcome: "The owner has a processing history for raw documents.",
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
    nextTab: "Operations",
    nextLabel: "Next: Operations Header",
    metrics: ["Dispatch", "Teams", "Claims", "Compliance", "Proof"],
    dataToEnter: "Drivers, helpers, trucks, claims, compliance documents, route notes, and daily proof.",
    ownerDecision: "Decide which team, claim, or compliance item needs action.",
    outcome: "Field work becomes accountable and connected to risk.",
  }),
  tabDetailStep({
    id: "operations-header",
    tab: "Operations",
    title: "Operations Header: field execution starts here",
    lesson:
      "The Operations header frames this tab as the place where route execution, teams, claims, compliance, and proof are managed.",
    why:
      "Operations explains what happened in the field before Finance explains what it cost.",
    selector: '[data-tour="operations-header"]',
    nextTab: "Operations",
    nextLabel: "Next: Operations Sections",
    metrics: ["Dispatch", "Teams", "Claims", "Compliance"],
    dataToEnter: "Drivers, helpers, trucks, route assignments, claim notes, proof, and compliance items.",
    ownerDecision: "Decide what operational area needs attention first.",
    outcome: "The owner understands Operations as the execution workspace.",
  }),
  tabDetailStep({
    id: "operations-sections",
    tab: "Operations",
    title: "Operations Sections: dispatch, teams, claims, compliance",
    lesson:
      "The section selector separates the operational workflows so the owner can move from dispatch to teams, claims, and compliance without losing context.",
    why:
      "Field work creates several kinds of risk, and each section owns a different part of that risk.",
    selector: '[data-tour="operations-sections"]',
    nextTab: "Operations",
    nextLabel: "Next: Operations Metrics",
    metrics: ["Dispatch status", "Team readiness", "Claims workload", "Compliance status"],
    dataToEnter: "Choose the workflow that matches the issue being handled.",
    ownerDecision: "Decide whether the day needs dispatch work, team follow-up, claim control, or document review.",
    outcome: "The owner knows how Operations is organized.",
  }),
  tabDetailStep({
    id: "operations-metrics",
    tab: "Operations",
    title: "Operations Metrics: the field health summary",
    lesson:
      "These metrics summarize the current operational condition before the owner opens the detailed workflow.",
    why:
      "A quick health readout helps the owner catch proof gaps, open claims, or compliance blockers early.",
    selector: '[data-tour="operations-metrics"]',
    nextTab: "Operations",
    nextLabel: "Next: Next Move",
    metrics: ["Active teams", "Open claims", "Proof status", "Compliance readiness"],
    dataToEnter: "Team status, claim status, route proof, and document readiness.",
    ownerDecision: "Decide whether the operation is ready or needs intervention.",
    outcome: "Operational risk is visible before it hurts margin.",
  }),
  tabDetailStep({
    id: "operations-next-move",
    tab: "Operations",
    title: "Next Move: what to handle now",
    lesson:
      "This section points the owner to the most important operational action, such as missing proof, an open claim, or a compliance item.",
    why:
      "Operations should not just show status; it should make the next action obvious.",
    selector: '[data-tour="operations-next-move"]',
    nextTab: "Operations",
    nextLabel: "Next: Active Operations Workflow",
    metrics: ["Priority action", "Risk area", "Owner follow-up"],
    dataToEnter: "The app builds this from teams, claims, compliance, and route activity.",
    ownerDecision: "Decide what needs immediate follow-up.",
    outcome: "The owner leaves the overview with a clear action.",
  }),
  tabDetailStep({
    id: "operations-active-workflow",
    tab: "Operations",
    title: "Active Workflow: manage the actual field work",
    lesson:
      "The active workflow below is where the owner manages the selected operational area in detail, such as teams, claims, compliance, or dispatch.",
    why:
      "This is where route execution becomes accountable: who worked, what proof exists, what claim occurred, and what document is missing.",
    selector: '[data-tour="operations-active-workflow"]',
    nextTab: "Finance",
    nextLabel: "Next: Finance Tab",
    metrics: ["Assigned team", "Claim status", "Document status", "Route proof"],
    dataToEnter: "Update the specific operational record shown in the selected workflow.",
    ownerDecision: "Decide how to fix the operational issue before it becomes a financial issue.",
    outcome: "Field execution connects to claims, compliance, and profitability.",
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
    nextTab: "Finance",
    nextLabel: "Next: Finance Header",
    metrics: ["Profitability", "Receipts", "Contracts", "Margin"],
    dataToEnter: "Contract terms, route revenue, labor, fuel, insurance, maintenance, receipts, and other costs.",
    ownerDecision: "Decide whether a route, contract, or expense pattern is helping or hurting profit.",
    outcome: "The business can calculate real margin instead of guessing.",
  }),
  tabDetailStep({
    id: "finance-header",
    tab: "Finance",
    title: "Finance Header: the money workspace",
    lesson:
      "The Finance header frames this tab as the place where contract terms, expenses, and profitability come together.",
    why:
      "The owner needs one place to answer whether the work is actually making money.",
    selector: '[data-tour="finance-header"]',
    nextTab: "Finance",
    nextLabel: "Next: Finance Sections",
    metrics: ["Contracts", "Receipts", "Profitability", "Margin"],
    dataToEnter: "Contract rates, route volume, labor, fuel, insurance, maintenance, receipts, and claim costs.",
    ownerDecision: "Decide whether to review rates, costs, expenses, or margin.",
    outcome: "The owner understands Finance as the margin workspace.",
  }),
  tabDetailStep({
    id: "finance-sections",
    tab: "Finance",
    title: "Finance Sections: contracts, receipts, profitability",
    lesson:
      "The finance sections separate the money workflow: contracts define revenue, receipts prove expenses, and profitability calculates the result.",
    why:
      "Profit calculations are only meaningful when revenue terms and expense proof are connected.",
    selector: '[data-tour="finance-sections"]',
    nextTab: "Finance",
    nextLabel: "Next: Active Finance Workflow",
    metrics: ["Rate terms", "Expense proof", "Net profit", "Margin"],
    dataToEnter: "Choose the finance workflow that matches the money question.",
    ownerDecision: "Decide whether the issue is contract pricing, expense load, or route margin.",
    outcome: "The owner sees how money flows through Finance.",
  }),
  tabDetailStep({
    id: "finance-active-workflow",
    tab: "Finance",
    title: "Active Finance Workflow: calculate or support the numbers",
    lesson:
      "The active finance workflow is where the selected money task happens: manage contracts, attach receipts, or calculate profitability.",
    why:
      "This is where rates, costs, and proof turn into the margin numbers shown on the Dashboard and Reports.",
    selector: '[data-tour="finance-active-workflow"]',
    nextTab: "Reports",
    nextLabel: "Next: Reports Tab",
    metrics: ["Revenue", "Expenses", "Net profit", "Profit per route", "Profit per stop"],
    dataToEnter: "Enter or update the rates, costs, receipts, and assumptions for the active workflow.",
    ownerDecision: "Decide whether a route or contract is worth running at the current terms.",
    outcome: "Finance produces the margin truth the owner uses to make decisions.",
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
    nextTab: "Reports",
    nextLabel: "Next: Reports Header",
    metrics: ["Profit snapshots", "Claims reports", "Route reports", "PDF export", "Trends"],
    dataToEnter: "Saved snapshots, filters, routes, claims, team data, and export choices.",
    ownerDecision: "Decide what changed over time and what should be fixed next.",
    outcome: "The owner gets a repeatable review rhythm.",
  }),
  tabDetailStep({
    id: "reports-header",
    tab: "Reports",
    title: "Reports Header: review history",
    lesson:
      "The Reports header introduces the place where saved activity becomes weekly, monthly, and operational review.",
    why:
      "Owners need history, not just today’s numbers, to see trends and make better decisions.",
    selector: '[data-tour="reports-header"]',
    nextTab: "Reports",
    nextLabel: "Next: Report Data Health",
    metrics: ["Saved snapshots", "Exports", "Trend review"],
    dataToEnter: "Saved route days, claims, teams, receipts, contracts, and filters.",
    ownerDecision: "Decide what history needs to be reviewed.",
    outcome: "The owner understands Reports as the review workspace.",
  }),
  tabDetailStep({
    id: "reports-data-health",
    tab: "Reports",
    title: "Report Data Health: enough data to report?",
    lesson:
      "Data Health shows whether the report has enough saved information to be meaningful.",
    why:
      "Reports are strongest when daily snapshots, claims, receipts, and route data are saved consistently.",
    selector: '[data-tour="reports-data-health"]',
    nextTab: "Reports",
    nextLabel: "Next: Report Center",
    metrics: ["Snapshot coverage", "Claims coverage", "Finance coverage", "Team coverage"],
    dataToEnter: "Save missing records before depending on a report for a decision.",
    ownerDecision: "Decide what data gap should be closed before exporting.",
    outcome: "The owner knows whether the report is ready.",
  }),
  tabDetailStep({
    id: "reports-center",
    tab: "Reports",
    title: "Report Center: choose the report type",
    lesson:
      "The Report Center is where the owner chooses between profit snapshots, claims reports, route reports, team reports, and financial reports.",
    why:
      "Different business questions need different report views.",
    selector: '[data-tour="reports-center"]',
    nextTab: "Reports",
    nextLabel: "Next: Filters",
    metrics: ["Profit reports", "Claims reports", "Route reports", "Team reports"],
    dataToEnter: "Choose the report that matches the decision being reviewed.",
    ownerDecision: "Decide which report answers the current owner question.",
    outcome: "The owner can move from raw data to the right review format.",
  }),
  tabDetailStep({
    id: "reports-filters",
    tab: "Reports",
    title: "Filters: narrow the report",
    lesson:
      "Filters control the dates, routes, customers, teams, and report scope.",
    why:
      "A focused report is easier to act on than a broad dump of every record.",
    selector: '[data-tour="reports-filters"]',
    nextTab: "Reports",
    nextLabel: "Next: Recent Exports",
    metrics: ["Date range", "Route", "Customer", "Team", "Status"],
    dataToEnter: "Pick the time period and scope the owner wants to review.",
    ownerDecision: "Decide what slice of history matters for the current review.",
    outcome: "Reports become specific enough for action.",
  }),
  tabDetailStep({
    id: "reports-recent-exports",
    tab: "Reports",
    title: "Recent Exports: what has been shared",
    lesson:
      "Recent Exports shows the reports that were already created or saved.",
    why:
      "Owners need a record of what was reviewed, exported, or shared with a customer, accountant, or manager.",
    selector: '[data-tour="reports-recent-exports"]',
    nextTab: "Reports",
    nextLabel: "Next: Report Insights",
    metrics: ["Export history", "Report type", "Created date"],
    dataToEnter: "Exports appear here after reports are generated.",
    ownerDecision: "Decide whether a prior report can be reused or a new report is needed.",
    outcome: "The owner has report history without recreating work.",
  }),
  tabDetailStep({
    id: "reports-insights",
    tab: "Reports",
    title: "Report Insights: convert history into decisions",
    lesson:
      "Report Insights summarize patterns in the selected report so the owner can see what changed and what needs attention.",
    why:
      "Reports should create decisions, not just documents.",
    selector: '[data-tour="reports-insights"]',
    nextTab: "Settings",
    nextLabel: "Next: Settings Tab",
    metrics: ["Trend", "Risk", "Margin movement", "Claims movement"],
    dataToEnter: "Insights come from the report data and selected filters.",
    ownerDecision: "Decide what operational or financial change should happen next.",
    outcome: "The owner turns history into next actions.",
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
    nextTab: "Settings",
    nextLabel: "Next: Settings Header",
    metrics: ["Company profile", "Dashboard layout", "Targets", "Team access", "Demo controls"],
    dataToEnter: "Company details, dashboard preferences, benchmarks, roles, and setup preferences.",
    ownerDecision: "Decide how the workspace should be configured for the business.",
    outcome: "The owner understands why Settings comes after the main workflow.",
  }),
  tabDetailStep({
    id: "settings-header",
    tab: "Settings",
    title: "Settings Header: configure the workspace",
    lesson:
      "The Settings header starts the configuration area where company details, preferences, and account controls live.",
    why:
      "A premium workflow still needs to match the contractor’s real business rules.",
    selector: '[data-tour="settings-header"]',
    nextTab: "Settings",
    nextLabel: "Next: Backend Sync",
    metrics: ["Company setup", "Preferences", "Save status"],
    dataToEnter: "Company and workspace preferences.",
    ownerDecision: "Decide what configuration needs to be saved or updated.",
    outcome: "The owner knows Settings controls the workspace.",
  }),
  tabDetailStep({
    id: "settings-backend-sync",
    tab: "Settings",
    title: "Backend Sync: data connection status",
    lesson:
      "Backend Sync shows whether the workspace is connected to the cloud data layer.",
    why:
      "The owner should know whether data is saved locally, synced, or waiting on setup.",
    selector: '[data-tour="settings-backend-sync"]',
    nextTab: "Settings",
    nextLabel: "Next: Demo Workspace Controls",
    metrics: ["Sync status", "Workspace connection", "Setup state"],
    dataToEnter: "Backend setup details when available.",
    ownerDecision: "Decide whether sync setup needs attention before using the app with real data.",
    outcome: "The owner understands where workspace data is stored.",
  }),
  tabDetailStep({
    id: "settings-demo-workspace",
    tab: "Settings",
    title: "Demo Workspace Controls: reset the learning environment",
    lesson:
      "Demo Workspace controls let the owner reset or reload the demo experience.",
    why:
      "A fresh demo should be repeatable so new users can learn the workflow from the beginning.",
    selector: '[data-tour="settings-demo-workspace"]',
    nextTab: "Settings",
    nextLabel: "Next: Onboarding Controls",
    metrics: ["Demo reset", "Fresh walkthrough", "Sample workspace"],
    dataToEnter: "No business data is required; this manages the demo environment.",
    ownerDecision: "Decide whether to reset the demo before training or reviewing.",
    outcome: "The demo stays clean and teachable.",
  }),
  tabDetailStep({
    id: "settings-onboarding-controls",
    tab: "Settings",
    title: "Onboarding Controls: setup progress",
    lesson:
      "This area shows onboarding progress and profile completeness controls.",
    why:
      "Setup progress helps the owner know what still needs to be completed before the workspace is fully useful.",
    selector: '[data-tour="settings-onboarding-controls"]',
    nextTab: "Settings",
    nextLabel: "Next: Settings Sections",
    metrics: ["Setup progress", "Profile completeness", "Guided setup"],
    dataToEnter: "Company profile and setup tasks.",
    ownerDecision: "Decide which setup item should be finished next.",
    outcome: "The owner can finish setup in a structured way.",
  }),
  tabDetailStep({
    id: "settings-tab-selector",
    tab: "Settings",
    title: "Settings Sections: choose what to configure",
    lesson:
      "The settings sections organize profile, dashboard, margin factors, team access, and preferences.",
    why:
      "Settings can become broad, so the app separates configuration into clear groups.",
    selector: '[data-tour="settings-tab-selector"]',
    nextTab: "Settings",
    nextLabel: "Next: Formula Preview",
    metrics: ["Profile", "Dashboard", "Margin factors", "Access", "Preferences"],
    dataToEnter: "Choose the configuration area that matches the change being made.",
    ownerDecision: "Decide which part of the workspace should be adjusted.",
    outcome: "The owner understands how Settings is organized.",
  }),
  tabDetailStep({
    id: "settings-formula-preview",
    tab: "Settings",
    title: "Formula Preview: how margin is calculated",
    lesson:
      "Formula Preview shows how route revenue, costs, claims, and targets combine into the margin model.",
    why:
      "Owners need to understand the math behind the Dashboard and Profitability numbers.",
    selector: '[data-tour="settings-formula-preview"]',
    nextTab: "Settings",
    nextLabel: "Next: Factor Cards",
    metrics: ["Revenue", "Costs", "Claims", "Margin target"],
    dataToEnter: "Margin targets, cost assumptions, and benchmark preferences.",
    ownerDecision: "Decide whether the default margin assumptions match the business.",
    outcome: "The owner sees the formula behind the numbers.",
  }),
  tabDetailStep({
    id: "settings-factor-cards",
    tab: "Settings",
    title: "Factor Cards: tune the business assumptions",
    lesson:
      "Factor Cards let the owner adjust the assumptions that affect profitability, benchmarks, and warning thresholds.",
    why:
      "Every contractor has different costs, risk tolerance, and target margins.",
    selector: '[data-tour="settings-factor-cards"]',
    nextTab: "Settings",
    nextLabel: "Next: Preview Impact",
    metrics: ["Margin target", "Cost factors", "Warning levels", "Benchmarks"],
    dataToEnter: "Update assumptions that reflect the real business.",
    ownerDecision: "Decide what thresholds should trigger attention.",
    outcome: "The app’s guidance becomes tailored to the owner’s operation.",
  }),
  tabDetailStep({
    id: "settings-preview-impact",
    tab: "Settings",
    title: "Preview Impact: see what settings change",
    lesson:
      "Preview Impact shows how changes to assumptions may affect margin signals and dashboard warnings.",
    why:
      "The owner should see the effect before committing to new targets or thresholds.",
    selector: '[data-tour="settings-preview-impact"]',
    nextTab: "Settings",
    nextLabel: "Next: Advanced Options",
    metrics: ["Projected impact", "Warnings", "Margin movement"],
    dataToEnter: "Adjust factors and review the preview.",
    ownerDecision: "Decide whether the settings change improves the workspace.",
    outcome: "Configuration changes become easier to trust.",
  }),
  tabDetailStep({
    id: "settings-advanced-options",
    tab: "Settings",
    title: "Advanced Options: finish the walkthrough",
    lesson:
      "Advanced Options closes the tour by showing the deeper controls that can refine the workspace after the main setup is understood.",
    why:
      "Settings comes last because owners should understand the workflow before tuning the system.",
    selector: '[data-tour="settings-advanced-options"]',
    nextTab: "Complete",
    nextLabel: "Finish Walkthrough",
    metrics: ["Advanced settings", "Workspace tuning", "Final setup"],
    dataToEnter: "Only adjust advanced settings when the business rules are clear.",
    ownerDecision: "Decide whether advanced configuration is needed now or later.",
    outcome: "The walkthrough ends after the Dashboard data, each main tab, and each tab’s internal sections have been explained.",
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
