export const productTourSteps = [
  {
    id: "dashboard-overview",
    title: "Business Launch Center",
    description:
      "Start here when the workspace is new. The Dashboard shows setup progress first, then becomes the daily command center once contracts, teams, costs, and claims exist.",
    selectors: ['[data-tour="dashboard-overview"]'],
  },
  {
    id: "setup-progress",
    title: "Setup progress and next action",
    description:
      "This section keeps setup resumable. Skipped items stay visible, completed items feed the rest of the app, and the next action points to the most useful step.",
    selectors: ['[data-tour="setup-progress"]'],
    fallback:
      "Setup is hidden after the workspace has enough data. You can still add or adjust contracts, teams, expenses, and imports from the main navigation.",
  },
  {
    id: "contracts",
    title: "Contracts unlock margin",
    description:
      "Contracts are where customer names, route pay, stops, route count, and contract profitability come together.",
    selectors: ['[data-tour="contracts"]', '[data-tour-nav="finance"]'],
    fallback:
      "Contracts live under Finance. Add the first contract to unlock route pay, margin, and contract-level reporting.",
  },
  {
    id: "teams",
    title: "Operations workflow",
    description:
      "Operations connects dispatch, teams, claims, and compliance. Team and photo readiness help decide what needs owner attention before the day gets away.",
    selectors: ['[data-tour="teams"]', '[data-tour-nav="operations"]'],
    fallback:
      "Teams live under Operations. Add drivers, helpers, and trucks once you are ready to assign real work.",
  },
  {
    id: "expenses",
    title: "Finance workflow",
    description:
      "Finance groups Profitability, Receipts, and Contracts because route math only works when revenue, expenses, and rate terms agree.",
    selectors: ['[data-tour="expenses"]', '[data-tour-nav="finance"]'],
    fallback:
      "Expenses are part of Finance and contract setup. They keep profit math tied to real route costs.",
  },
  {
    id: "claims",
    title: "Claims and evidence",
    description:
      "Claims show risk, exposure, status, driver or team assignment, evidence gaps, and whether a claim is ready to dispute.",
    selectors: ['[data-tour="claims"]', '[data-tour-nav="operations"]'],
    fallback:
      "Claims live under Operations. Once claims are added, this area helps decide what needs review before losses hit margin.",
  },
  {
    id: "reports",
    title: "Reports readiness",
    description:
      "Reports show what data is required before they unlock. Save daily snapshots to build useful trend history and PDF exports.",
    selectors: ['[data-tour="reports"]', '[data-tour-nav="reports"]'],
    fallback:
      "Reports become more useful after contracts, expenses, teams, and claims are saved.",
  },
  {
    id: "ask-assistant",
    title: "Ask data readiness",
    description:
      "Ask shows what it can see: contracts, teams, claims, receipts, and snapshots. If data is missing, it should guide setup before guessing.",
    selectors: ['[data-tour="ask-assistant"]', '[data-tour-nav="ask"]'],
    fallback:
      "Ask uses the data in this workspace, so it gets smarter as setup and daily activity are filled in.",
  },
  {
    id: "finish",
    title: "Keep building the command center",
    description:
      "Add your first contract to unlock margin insights, then keep adding teams, expenses, receipts, and claims as the business runs.",
    selectors: [],
  },
];
