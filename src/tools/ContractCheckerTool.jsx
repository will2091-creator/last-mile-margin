import { useRef } from "react";
import { clamp, cleanNum, money, money2 } from "./format";
import { CONTRACT_TERMS, checkContract, describeContract } from "./lib/contractCheck";
import { useInView } from "./useInView";
import { useToolState } from "./useToolState";
import { Badge, CheckRow, FieldGrid, MobileSummary, ResultNav, NumberField, Panel, Segmented, Stat, TextField, ToolActions } from "./ui";
import ToolUpgrade from "./ToolUpgrade";

// Example: a $950/day offer against a $700/day cost base plus weekly claims and fees.
const DEFAULTS = {
  payType: "day",
  dayPay: "950",
  perStopPay: "47.50",
  stops: "20",
  otherPay: "0",
  daysPerWeek: "5",
  crewCost: "400",
  truckCost: "170",
  fuelCost: "105",
  otherCost: "25",
  claimsWeek: "150",
  feesWeek: "50",
  escrowWeek: "100",
  targetMargin: "25",
  walkAwayMargin: "15",
  terms: [],
  r1n: "",
  r1r: "",
  r1c: "",
  r2n: "",
  r2r: "",
  r2c: "",
  r3n: "",
  r3r: "",
  r3c: "",
};

const VERDICT = {
  go: { tone: "good", label: "Go" },
  caution: { tone: "warn", label: "Caution" },
  "no-go": { tone: "bad", label: "No-go" },
};

export default function ContractCheckerTool() {
  const { values: v, set, reset, shareUrl } = useToolState("lmm-tool-contract-check", DEFAULTS);

  const numbers = {
    payType: v.payType === "stop" ? "stop" : "day",
    dayPay: cleanNum(v.dayPay),
    perStopPay: cleanNum(v.perStopPay),
    stops: cleanNum(v.stops),
    otherPay: cleanNum(v.otherPay),
    daysPerWeek: clamp(cleanNum(v.daysPerWeek), 0, 14),
    crewCost: cleanNum(v.crewCost),
    truckCost: cleanNum(v.truckCost),
    fuelCost: cleanNum(v.fuelCost),
    otherCost: cleanNum(v.otherCost),
    claimsWeek: cleanNum(v.claimsWeek),
    feesWeek: cleanNum(v.feesWeek),
    escrowWeek: cleanNum(v.escrowWeek),
    targetMargin: clamp(cleanNum(v.targetMargin), 0, 99),
    walkAwayMargin: clamp(cleanNum(v.walkAwayMargin), 0, 99),
    currentRoutes: [1, 2, 3].map((i) => ({ name: v[`r${i}n`], revenue: cleanNum(v[`r${i}r`]), cost: cleanNum(v[`r${i}c`]) })),
  };

  const check = checkContract(numbers);
  const { result } = check;
  const rateLabel = (value) => (check.perStop ? money2(value) : money(value));
  const story = describeContract(check, money, rateLabel);
  const verdict = VERDICT[result.verdict];
  const unit = check.perStop ? "per stop" : "per route day";
  const flagged = CONTRACT_TERMS.filter((term) => v.terms.includes(term.id));

  const ladder = [
    { label: "Break-even (no profit)", value: check.breakEvenRate },
    { label: `Walk-away (${check.walkAway}% margin)`, value: check.walkAwayRate },
    { label: `Target (${result.target}% margin)`, value: result.target > 0 ? check.targetRate : null },
    { label: "Their offer", value: check.offerRate, offer: true },
  ]
    .filter((row) => row.value != null && Number.isFinite(row.value))
    .sort((a, b) => a.value - b.value || (a.offer ? 1 : -1));

  const toggleTerm = (id, on) => set("terms", on ? [...new Set([...v.terms, id])] : v.terms.filter((t) => t !== id));

  const resultsRef = useRef(null);
  const resultsInView = useInView(resultsRef);

  const field = (key, label, extra = {}) => <NumberField label={label} value={v[key]} onChange={(value) => set(key, value)} {...extra} />;

  return (
    <div className="calculator-layout">
      <MobileSummary
        show={!resultsInView}
        label="Verdict"
        value={`${verdict.label} · ${result.margin}% margin`}
        tone={verdict.tone === "good" ? "good" : verdict.tone === "warn" ? "warn" : "bad"}
      />
      <div id="inputs" tabIndex={-1} className="calculator-inputs">
        <Panel title="The offer">
          <div className="space-y-4">
            <Segmented
              label="How they pay"
              value={numbers.payType}
              onChange={(value) => set("payType", value)}
              options={[
                { value: "day", label: "Per route day" },
                { value: "stop", label: "Per stop" },
              ]}
            />
            <FieldGrid>
              {numbers.payType === "stop" ? (
                <>
                  {field("perStopPay", "Pay per stop", { prefix: "$", suffix: "per stop" })}
                  {field("stops", "Average stops per day", { suffix: "stops" })}
                </>
              ) : (
                field("dayPay", "Pay per route day", { prefix: "$", suffix: "per day" })
              )}
              {field("otherPay", "Other pay per day", { prefix: "$", hint: "Installs, accessorials, fuel surcharge." })}
              {field("daysPerWeek", "Route days per week", { suffix: "days", hint: "Two trucks, five days a week = 10." })}
            </FieldGrid>
          </div>
        </Panel>

        <Panel
          title="What a route day costs you"
          description={
            <>
              Per truck, per day. Not sure? Work it out with the{" "}
              <a href="/tools/route-profit-calculator" className="font-semibold text-blue-700 underline underline-offset-2">
                route profit calculator
              </a>
              .
            </>
          }
        >
          <FieldGrid>
            {field("crewCost", "Crew pay", { prefix: "$", suffix: "per day" })}
            {field("truckCost", "Truck, insurance & software", { prefix: "$", suffix: "per day" })}
            {field("fuelCost", "Fuel and maintenance", { prefix: "$", suffix: "per day" })}
            {field("otherCost", "Tolls, parking & other", { prefix: "$", suffix: "per day" })}
          </FieldGrid>
        </Panel>

        <Panel title="What the contract takes out" description="Per week, across all your route days on this contract.">
          <FieldGrid cols={3}>
            {field("claimsWeek", "Expected claims & chargebacks", { prefix: "$", suffix: "/wk" })}
            {field("feesWeek", "Fees", { prefix: "$", suffix: "/wk", hint: "Scanners, uniforms, software." })}
            {field("escrowWeek", "Escrow or holdback", { prefix: "$", suffix: "/wk", hint: "Cash held back, not a cost." })}
          </FieldGrid>
        </Panel>

        <Panel title="Your targets">
          <FieldGrid>
            {field("targetMargin", "Target margin", { suffix: "%", hint: "The margin you want on every route." })}
            {field("walkAwayMargin", "Walk-away margin", { suffix: "%", hint: "Below this, you pass." })}
          </FieldGrid>
        </Panel>

        <Panel title="Compare with your current routes" description="Optional. Add up to three routes you run now, per route day.">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="route-compare-grid">
                <TextField label={`Route ${i}`} value={v[`r${i}n`]} onChange={(value) => set(`r${i}n`, value)} placeholder="Name" maxLength={40} />
                {field(`r${i}r`, "Revenue", { prefix: "$", placeholder: "" })}
                {field(`r${i}c`, "Cost", { prefix: "$", placeholder: "" })}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Contract terms to check" description="Check any that show up in this contract. They cost money even when the rate looks fine.">
          <div className="grid gap-2">
            {CONTRACT_TERMS.map((term) => (
              <CheckRow key={term.id} label={term.label} checked={v.terms.includes(term.id)} onChange={(on) => toggleTerm(term.id, on)} />
            ))}
          </div>
        </Panel>
      </div>

      <div
        id="results"
        ref={resultsRef}
        tabIndex={-1} className="calculator-results"
        aria-live="polite"
      >
        <ResultNav />
        <Panel className="result-panel">
          <p className="result-kicker">Contract verdict</p>
          <div className="result-heading">
            <p className="result-number" data-tone={verdict.tone}>{verdict.label}</p>
            <Badge tone={verdict.tone}>{result.margin}% margin</Badge>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            Offer of {rateLabel(check.offerRate)} {unit}.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{story.body}</p>
          <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-3 text-sm font-semibold leading-6 text-slate-800 ring-1 ring-slate-100">{story.move}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Stat label="Profit per route day" value={money(result.profit)} tone={result.profit < 0 ? "bad" : "default"} />
            <Stat label={`Per week (${check.days} days)`} value={money(check.weeklyProfit)} tone={check.weeklyProfit < 0 ? "bad" : "default"} />
            <Stat label="Per month" value={money(check.weeklyProfit * 4.33)} tone={check.weeklyProfit < 0 ? "bad" : "default"} />
            <Stat label="Per year" value={money(check.weeklyProfit * 52)} tone={check.weeklyProfit < 0 ? "bad" : "default"} />
          </div>
          {check.deductionsPerDay > 0 && (
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Costs include {money(check.deductionsPerDay)} a day of claims and fees, spread across {check.days || 1} route{" "}
              {check.days === 1 ? "day" : "days"}.
            </p>
          )}
        </Panel>

        <Panel title={`The rates that matter, ${unit}`}>
          <ol className="space-y-2">
            {ladder.map((row) => (
              <li
                key={row.label}
                className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm ${
                  row.offer ? "bg-blue-600 font-bold text-white" : "bg-slate-50 font-semibold text-slate-700 ring-1 ring-slate-100"
                }`}
              >
                <span>{row.label}</span>
                <span className="tabular-nums">{rateLabel(row.value)}</span>
              </li>
            ))}
          </ol>
        </Panel>

        {check.profile.sampleSize > 0 && result.portfolioRank && (
          <Panel title="Against your current routes">
            <p className="text-sm leading-6 text-slate-700">
              This offer would beat <strong>{result.portfolioRank.betterThan}</strong> of your {result.portfolioRank.of} current{" "}
              {result.portfolioRank.of === 1 ? "route" : "routes"}, which average a {result.avgMargin}% margin.
            </p>
          </Panel>
        )}

        {check.escrowWeek > 0 && (
          <Panel title="Cash held back">
            <p className="text-sm leading-6 text-slate-700">
              <strong>{money(check.escrowWeek)}</strong> a week in escrow is about {money(check.escrowWeek * 4.33)} a month and{" "}
              {money(check.escrowWeek * 13)} over three months. It's still your money, but you can't use it for payroll or fuel. Ask when it's
              refunded and what can be taken out of it.
            </p>
          </Panel>
        )}

        <ToolActions getShareUrl={shareUrl} onReset={reset} />
        <ToolUpgrade source="contract-rate-checker" example={JSON.stringify(v) === JSON.stringify(DEFAULTS)} payload={{
          kind: "offer comparison", title: "Contract offer comparison", inputs: v,
          metrics: [["Offer " + unit, rateLabel(check.offerRate)], ["Target " + unit, check.targetRate == null ? "—" : rateLabel(check.targetRate)], ["Verdict", verdict.label]],
          comparison: [...ladder.map(row => [row.label, rateLabel(row.value)]), ...numbers.currentRoutes.filter(route => route.revenue > 0).map((route, index) => [route.name || "Current route " + (index + 1), money(route.revenue - route.cost) + " net per day"])],
        }} />

        <Panel title="Push back on these">
          {flagged.length ? (
            <ul className="space-y-3">
              {flagged.map((term) => (
                <li key={term.id} className="text-sm leading-6">
                  <p className="font-bold text-slate-900">{term.label}</p>
                  <p className="text-slate-600">{term.tip}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-slate-600">
              Nothing checked yet. Go through the contract terms list before you sign. Those clauses cost money even when the rate looks right.
            </p>
          )}
        </Panel>

      </div>
    </div>
  );
}
