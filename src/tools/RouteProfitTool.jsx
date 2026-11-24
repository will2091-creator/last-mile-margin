import { useRef } from "react";
import { computeRouteResults, getGrade, getRouteRisks } from "../lib/routeProfit";
import { clamp, cleanForm, money, money2, pct } from "./format";
import { useInView } from "./useInView";
import { useToolState } from "./useToolState";
import { Badge, BarList, FieldGrid, MobileSummary, ResultNav, Notes, NumberField, Panel, Stat, ToolActions } from "./ui";
import ToolUpgrade from "./ToolUpgrade";
import { ROUTE_EXAMPLE } from "./lib/routeExample";

const GRADE_TONE = { A: "good", B: "good", C: "warn", D: "warn", F: "bad" };

export default function RouteProfitTool() {
  const { values: v, set, reset, shareUrl } = useToolState("lmm-tool-route-profit", ROUTE_EXAMPLE);
  const n = cleanForm(v);
  const r = computeRouteResults(n);
  const grade = getGrade(r);
  const risks = getRouteRisks(n, r);

  const days = clamp(n.daysPerWeek, 0, 7);
  const weekly = r.netProfit * days;
  const profitTone = r.netProfit < 0 ? "bad" : r.profitMargin < 0.15 ? "warn" : "good";

  const stopPayTotal = n.perStopPay * n.stops;
  const otherPay = r.totalRevenue - n.routePay - stopPayTotal;
  const shortBy = r.requiredRevenue - r.totalRevenue;
  const perStopNeeded = n.stops > 0 ? (r.requiredRevenue - n.routePay - otherPay) / n.stops : null;
  const usesFlat = n.routePay > 0 || n.perStopPay <= 0;
  const usesStop = n.perStopPay > 0;

  const costItems = [
    { label: "Crew pay", value: r.laborCosts, className: "bg-blue-600" },
    { label: "Truck, insurance & software", value: r.fixedCosts, className: "bg-indigo-500" },
    { label: "Fuel", value: r.fuelCost, className: "bg-sky-500" },
    { label: "Maintenance", value: r.maintenanceCost, className: "bg-cyan-500" },
    { label: "Claims & chargebacks", value: n.claimsChargebacks, className: "bg-amber-500" },
    { label: "Tolls, parking & other", value: n.tollsParking + n.otherCosts, className: "bg-slate-400" },
    { label: "Your profit", value: Math.max(0, r.netProfit), className: "bg-emerald-500" },
  ];

  const resultsRef = useRef(null);
  const resultsInView = useInView(resultsRef);

  const field = (key, label, extra = {}) => <NumberField label={label} value={v[key]} onChange={(value) => set(key, value)} {...extra} />;

  return (
    <div className="calculator-layout">
      <MobileSummary
        show={!resultsInView}
        label="Net profit per route day"
        value={`${money(r.netProfit)} · ${pct(r.profitMargin)}`}
        tone={profitTone}
      />
      <div id="inputs" tabIndex={-1} className="calculator-inputs">
        <Panel title="What the route pays" description="For one route day. Fill in whichever pay your contract uses: flat, per stop, or both.">
          <FieldGrid>
            {field("routePay", "Flat route pay", { prefix: "$", suffix: "per day" })}
            {field("perStopPay", "Pay per stop", { prefix: "$", suffix: "per stop" })}
            {field("stops", "Stops", { suffix: "stops" })}
          </FieldGrid>
          <details className="input-details">
            <summary>Other revenue and surcharges</summary>
            <FieldGrid>
              {field("installPay", "Install / assembly pay", { prefix: "$" })}
              {field("accessorialPay", "Accessorial pay", { prefix: "$", hint: "Haul-away, stairs, extra crew, and similar." })}
              {field("fuelSurcharge", "Fuel surcharge", { prefix: "$" })}
              {field("reattemptPay", "Re-attempt pay", { prefix: "$" })}
            </FieldGrid>
          </details>
        </Panel>

        <Panel title="Miles and time">
          <FieldGrid>
            {field("miles", "Miles driven", { suffix: "miles", hint: "Include the drive to and from the warehouse." })}
            {field("mpg", "Truck fuel economy", { suffix: "mpg" })}
            {field("fuelPrice", "Fuel price", { prefix: "$", suffix: "per gal" })}
            {field("routeHours", "Route hours", { suffix: "hours" })}
          </FieldGrid>
        </Panel>

        <Panel title="Crew pay" description="What you pay each person for the day. Enter 0 for helper pay if you run solo.">
          <FieldGrid>
            {field("driverPay", "Driver pay", { prefix: "$", suffix: "per day" })}
            {field("helperPay", "Helper pay", { prefix: "$", suffix: "per day" })}
          </FieldGrid>
        </Panel>

        <Panel title="Truck and overhead" description="Spread monthly bills over the days the truck runs. A $2,000 monthly payment over 22 workdays is about $91 a day.">
          <FieldGrid>
            {field("dailyTruckPayment", "Truck payment or lease", { prefix: "$", suffix: "per day" })}
            {field("dailyInsurance", "Insurance", { prefix: "$", suffix: "per day" })}
            {field("maintenancePerMile", "Maintenance and tires", { prefix: "$", suffix: "per mile" })}
            {field("phoneSoftware", "Phones, scanners & software", { prefix: "$", suffix: "per day" })}
            {field("tollsParking", "Tolls and parking", { prefix: "$", suffix: "per day" })}
          </FieldGrid>
        </Panel>

        <Panel title="Claims and other costs">
          <FieldGrid>
            {field("claimsChargebacks", "Claims and chargebacks", {
              prefix: "$",
              suffix: "per day",
              hint: "Take the last 3 months of deductions and divide by the days you ran.",
            })}
            {field("otherCosts", "Other daily costs", { prefix: "$", suffix: "per day" })}
          </FieldGrid>
        </Panel>

        <Panel title="Your goal">
          <FieldGrid>
            {field("targetProfit", "Profit you want per route day", { prefix: "$" })}
            {field("daysPerWeek", "Days a week you run it", { suffix: "days" })}
          </FieldGrid>
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
          <p className="result-kicker">Net profit per route day</p>
          <div className="result-heading">
            <p className="result-number" data-tone={profitTone}>{money(r.netProfit)}</p>
            <Badge tone={GRADE_TONE[grade.grade]}>
              Grade {grade.grade} · {grade.label}
            </Badge>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            {pct(r.profitMargin)} margin on {money(r.totalRevenue)} of revenue and {money(r.totalCost)} of costs.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Per stop" value={money2(r.profitPerStop)} tone={r.profitPerStop < 0 ? "bad" : "default"} />
            <Stat label="Per mile" value={money2(r.profitPerMile)} tone={r.profitPerMile < 0 ? "bad" : "default"} />
            <Stat label="Per hour" value={money2(r.profitPerHour)} tone={r.profitPerHour < 0 ? "bad" : "default"} />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
            At {days} {days === 1 ? "day" : "days"} a week
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Stat label="Week" value={money(weekly)} tone={weekly < 0 ? "bad" : "default"} />
            <Stat label="Month" value={money(weekly * 4.33)} tone={weekly < 0 ? "bad" : "default"} />
            <Stat label="Year" value={money(weekly * 52)} tone={weekly < 0 ? "bad" : "default"} />
          </div>
        </Panel>

        <Panel title={`To make ${money(n.targetProfit)} a day`} className="goal-panel">
          {shortBy <= 0 ? (
            <p className="text-sm leading-6 text-slate-700">
              You clear it by <strong className="text-emerald-700">{money(-shortBy)}</strong> a day. The route could pay{" "}
              {money(-shortBy)} less and still hit your goal.
            </p>
          ) : (
            <div className="space-y-2 text-sm leading-6 text-slate-700">
              <p>
                You're <strong className="text-red-600">{money(shortBy)}</strong> a day short. You'd need {money(r.requiredRevenue)} in total pay
                for the day:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                {usesFlat && (
                  <li>
                    a flat route pay of <strong>{money(r.requiredRoutePay)}</strong>
                    {otherPay + stopPayTotal > 0 ? " with your other pay unchanged" : ""}
                  </li>
                )}
                {usesStop && perStopNeeded != null && (
                  <li>
                    or <strong>{money2(perStopNeeded)}</strong> per stop{n.routePay > 0 || otherPay > 0 ? " with your other pay unchanged" : ""}
                  </li>
                )}
                {!usesStop && n.stops > 0 && (
                  <li>
                    that's <strong>{money2(r.requiredPerStop)}</strong> per stop, all in
                  </li>
                )}
              </ul>
            </div>
          )}
        </Panel>

        <ToolActions getShareUrl={shareUrl} onReset={reset} />
        <ToolUpgrade source="route-profit-calculator" example={JSON.stringify(v) === JSON.stringify(ROUTE_EXAMPLE)} payload={{
          kind: "route scenario", title: "Route profit scenario", inputs: v, routeForm: n,
          metrics: [["Daily revenue", money(r.totalRevenue)], ["Daily cost", money(r.totalCost)], ["Net profit", money(r.netProfit)]],
        }} />

        <Panel title="Where the money goes" description="Each cost as a share of the day's revenue.">
          <BarList items={costItems} total={r.totalRevenue} formatValue={money} />
        </Panel>

        <Panel title="What to watch">
          <Notes items={risks} tone={risks.length === 1 && risks[0].startsWith("Route looks healthy") ? "good" : "warn"} />
        </Panel>

      </div>
    </div>
  );
}
