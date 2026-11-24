// Contract rate checker for the public tool. The go / caution / no-go call comes from
// the app's own contract evaluator (src/lib/contractEvaluator.js); this file adds the
// per-stop math, weekly deductions, escrow, and the contract-terms checklist.
import { evaluateContract, learnCostProfile } from "../../lib/contractEvaluator";

export const CONTRACT_TERMS = [
  {
    id: "chargebacks",
    label: "Chargebacks can be deducted without proof or a dispute window",
    tip: "Ask for a written dispute window, and for photos or an itemized invoice before anything comes out of your settlement.",
  },
  {
    id: "escrow",
    label: "Escrow or holdback with no clear refund date",
    tip: "Get the refund timeline in writing, and what they're allowed to take out of it.",
  },
  {
    id: "fuel",
    label: "No fuel surcharge or fuel adjustment",
    tip: "Ask for a surcharge tied to a public fuel price index, so a price spike doesn't come out of your margin.",
  },
  {
    id: "minimum",
    label: "Paid per stop with no daily minimum",
    tip: "Ask for a minimum day pay, so a light day still covers your crew and truck.",
  },
  {
    id: "unpaid",
    label: "Re-attempts, returns, or wait time aren't paid",
    tip: "Ask for re-attempt pay, and wait-time pay after a set time at a stop.",
  },
  {
    id: "fees",
    label: "You pay for scanners, uniforms, truck branding, or software",
    tip: "Put these in the weekly fees above. Small charges add up over a year.",
  },
  {
    id: "payterms",
    label: "You get paid slower than weekly",
    tip: "You'll carry payroll and fuel for weeks before you're paid, so plan the cash.",
  },
  {
    id: "termination",
    label: "They can end the contract on short notice, but you can't",
    tip: "Ask for the same notice period both ways, so you aren't left with a truck and crew and no work.",
  },
  {
    id: "insurance",
    label: "Insurance requirements are higher than what you carry",
    tip: "Get a quote for the extra coverage and add it to your daily truck and insurance cost before you sign.",
  },
  {
    id: "ratechanges",
    label: "Rates can change without written notice",
    tip: "Ask for rate changes in writing, with advance notice.",
  },
];

// n: cleaned numeric inputs (see ContractCheckerTool DEFAULTS), plus payType and currentRoutes.
export function checkContract(n) {
  const perStop = n.payType === "stop";
  const stops = Math.max(0, n.stops);
  const days = Math.max(0, n.daysPerWeek);

  const revenue = (perStop ? n.perStopPay * stops : n.dayPay) + n.otherPay;
  const weeklyDeductions = n.claimsWeek + n.feesWeek;
  const deductionsPerDay = days > 0 ? weeklyDeductions / days : weeklyDeductions;
  const dailyCost = n.crewCost + n.truckCost + n.fuelCost + n.otherCost + deductionsPerDay;

  const currentRoutes = (n.currentRoutes || [])
    .filter((route) => route.revenue > 0)
    .map((route) => ({ revenue: route.revenue, other: route.cost }));
  const profile = learnCostProfile(currentRoutes);
  const result = evaluateContract(
    { revenue, cost: dailyCost },
    profile,
    { targetMargin: n.targetMargin, reviewLineMargin: n.walkAwayMargin },
  );

  // Convert a total day revenue into the offer's own unit (pay per day, or per stop).
  const inOfferUnit = (totalForDay) => {
    if (totalForDay == null) return null;
    const base = totalForDay - n.otherPay;
    if (!perStop) return base;
    return stops > 0 ? base / stops : null;
  };

  const walkAway = n.walkAwayMargin > 0 ? n.walkAwayMargin : 15;
  const walkAwayTotal = walkAway < 100 ? dailyCost / (1 - walkAway / 100) : null;

  return {
    perStop,
    days,
    revenue,
    dailyCost,
    deductionsPerDay,
    result,
    profile,
    breakEvenRate: inOfferUnit(dailyCost),
    targetRate: inOfferUnit(result.breakEvenForTarget),
    walkAwayRate: inOfferUnit(walkAwayTotal),
    walkAway,
    offerRate: perStop ? n.perStopPay : n.dayPay,
    weeklyProfit: result.profit * days,
    escrowWeek: Math.max(0, n.escrowWeek),
  };
}

// Plain-language read of the result (the app's AI writes its own; this is the tool's).
export function describeContract(check, money, rateLabel) {
  const { result } = check;
  const unit = check.perStop ? "per stop" : "per route day";
  const losing = result.profit < 0;
  const base = `At ${money(check.revenue)} a route day against ${money(check.dailyCost)} in costs, you'd ${
    losing ? `lose about ${money(-result.profit)}` : `net about ${money(result.profit)}`
  } a day, a ${result.margin}% margin.`;

  if (result.verdict === "go") {
    return {
      headline: "Looks like a go",
      body: `${base} That clears your ${result.target}% target.`,
      move: "Take it, and get the rate and the terms below in writing before you start.",
    };
  }
  if (result.verdict === "caution") {
    const gap = Math.max(0, Math.round((result.target - result.margin) * 10) / 10);
    return {
      headline: "Proceed with caution",
      body: `${base} That's above your ${check.walkAway}% walk-away line but ${gap} points under your ${result.target}% target.`,
      move:
        check.targetRate != null
          ? `Counter at ${rateLabel(check.targetRate)} ${unit} to hit your target, or cut a cost before you commit.`
          : "Negotiate the rate up or cut a cost before you commit.",
    };
  }
  return {
    headline: losing ? "This loses money" : "Hard to justify",
    body: losing ? `${base} Every route day would cost you money.` : `${base} That's under your ${check.walkAway}% walk-away line.`,
    move:
      check.targetRate != null
        ? `Pass, or counter at ${rateLabel(check.targetRate)} ${unit}. Below ${rateLabel(check.breakEvenRate)} you lose money.`
        : "Pass, or ask for a higher rate.",
  };
}
