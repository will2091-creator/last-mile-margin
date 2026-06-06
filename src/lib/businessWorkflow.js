import {
  Bot,
  BriefcaseBusiness,
  Calculator,
  ClipboardCheck,
  FileText,
  ReceiptText,
  Truck,
  Users,
} from "../shared";

export const businessWorkflowSteps = [
  {
    id: "contracts",
    label: "Contracts",
    tab: "Contracts",
    Icon: BriefcaseBusiness,
    purpose: "Set the customer terms before any margin math runs.",
    data: "Retailer, route pay, stop pay, weekly route count, claim terms, renewal dates.",
    decision: "Know whether the work is priced well enough before assigning teams.",
    dependsOn: "Starting point",
  },
  {
    id: "teams",
    label: "Teams",
    tab: "Teams",
    Icon: Users,
    purpose: "Define who is doing the route work.",
    data: "Drivers, helpers, trucks, route assignments, readiness, daily photo requirements.",
    decision: "Know which team can run the route and who owns any future issue.",
    dependsOn: "Contracts",
  },
  {
    id: "operations",
    label: "Operations",
    tab: "Operations",
    Icon: Truck,
    purpose: "Run the daily field workflow.",
    data: "Route health, team readiness, dispatch blockers, photo proof, active work.",
    decision: "Know what needs attention before routes fall behind.",
    dependsOn: "Teams",
  },
  {
    id: "claims",
    label: "Claims",
    tab: "Claims",
    Icon: FileText,
    purpose: "Control the money leaks from damage, disputes, and chargebacks.",
    data: "Open claims, risk level, amount, driver assigned, evidence needed, dispute status.",
    decision: "Know what to dispute, resolve, or reserve against margin.",
    dependsOn: "Operations",
  },
  {
    id: "receipts",
    label: "Receipts",
    tab: "Receipts",
    Icon: ReceiptText,
    purpose: "Prove the costs that reduce margin.",
    data: "Fuel, tolls, tools, parking, maintenance, repairs, supplies.",
    decision: "Know which expenses are real and which routes are being undercounted.",
    dependsOn: "Claims",
  },
  {
    id: "profitability",
    label: "Profitability",
    tab: "Profitability",
    Icon: Calculator,
    purpose: "Turn revenue, labor, expenses, and claims into net margin.",
    data: "Revenue, labor, fuel, truck insurance, maintenance, claims, profit per stop and mile.",
    decision: "Know which routes to keep, reprice, fix, or walk away from.",
    dependsOn: "Receipts",
  },
  {
    id: "reports",
    label: "Reports",
    tab: "Reports",
    Icon: ClipboardCheck,
    purpose: "Review history and turn daily data into decisions.",
    data: "Profit snapshots, claims reports, route reports, team reports, PDF exports.",
    decision: "Know what changed over time and what to review with the team or customer.",
    dependsOn: "Profitability",
  },
  {
    id: "ask",
    label: "Ask AI",
    tab: "Ask",
    Icon: Bot,
    purpose: "Ask business questions after the system has data.",
    data: "Contracts, teams, claims, receipts, profitability, reports, and saved history.",
    decision: "Know what is hurting margin and what needs attention today.",
    dependsOn: "Reports",
  },
];

export function getWorkflowStepStatus(stepId, setupStatus = {}) {
  const checks = setupStatus.checks || {};
  const counts = setupStatus.counts || {};

  const statusByStep = {
    contracts: Boolean(checks.contract),
    teams: Boolean(checks.team),
    operations: Boolean(checks.team || counts.teams > 0 || counts.claims > 0),
    claims: Boolean(checks.claims),
    receipts: Boolean(checks.receipts),
    profitability: Boolean(checks.expenses),
    reports: Boolean(checks.reports),
    ask: Boolean(checks.ask),
  };

  return Boolean(statusByStep[stepId]);
}

export function getWorkflowActiveStep({ activeTab, activeOperationsTab, activeFinanceTab } = {}) {
  if (activeTab === "Operations") {
    if (activeOperationsTab === "Claims") return "claims";
    if (activeOperationsTab === "Teams") return "teams";
    return "operations";
  }

  if (activeTab === "Finance") {
    if (activeFinanceTab === "Contracts") return "contracts";
    if (activeFinanceTab === "Receipts") return "receipts";
    return "profitability";
  }

  const tabMap = {
    Contracts: "contracts",
    Teams: "teams",
    Claims: "claims",
    Receipts: "receipts",
    Profitability: "profitability",
    Reports: "reports",
    Ask: "ask",
  };

  return tabMap[activeTab] || "contracts";
}
