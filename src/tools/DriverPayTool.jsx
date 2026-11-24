import { useRef } from "react";
import { clamp, cleanNum, money, money2, pct } from "./format";
import { computeCrewPay } from "./lib/driverPay";
import { useInView } from "./useInView";
import { useToolState } from "./useToolState";
import { CheckRow, FieldGrid, MobileSummary, Notes, NumberField, Panel, Segmented, Stat, ToolActions } from "./ui";

const DEFAULTS = {
  driverType: "day",
  driverRate: "220",
  helperCount: "1",
  helperType: "day",
  helperRate: "180",
  stops: "20",
  hours: "10",
  days: "5",
  burdenPct: "15",
  overtime: false,
  routeRevenue: "1200",
};

const PAY_TYPES = [
  { value: "day", label: "Per day" },
  { value: "stop", label: "Per stop" },
  { value: "hour", label: "Per hour" },
];
const UNIT = { day: "per day", stop: "per stop", hour: "per hour" };

export default function DriverPayTool() {
  const { values: v, set, reset, shareUrl } = useToolState("lmm-tool-driver-pay", DEFAULTS);
  const n = {
    driverType: v.driverType,
    driverRate: cleanNum(v.driverRate),
    helperCount: clamp(cleanNum(v.helperCount), 0, 4),
    helperType: v.helperType,
    helperRate: cleanNum(v.helperRate),
    stops: cleanNum(v.stops),
    hours: clamp(cleanNum(v.hours), 0, 24),
    days: clamp(cleanNum(v.days), 0, 7),
    burdenPct: clamp(cleanNum(v.burdenPct), 0, 100),
    overtime: v.overtime,
    routeRevenue: cleanNum(v.routeRevenue),
  };
  const c = computeCrewPay(n);
  const heavyLabor = c.laborShare != null && c.laborShare > 0.35;

  const notes = [];
  if (heavyLabor) notes.push(`Crew cost is ${pct(c.laborShare)} of route revenue. Above 35%, it's hard to cover the truck, fuel, insurance, and claims and still make money.`);
  if (c.otHours > 0 && !n.overtime)
    notes.push(`Your crew works ${c.weeklyHours} hours a week. If they're owed overtime, that adds about ${money(c.otExposure)} a week. Turn on overtime to include it.`);
  if (c.otHours > 0 && n.overtime) notes.push(`Includes ${money(c.otExposure)} a week of overtime for ${c.otHours} hours over 40.`);
  if (n.driverType === "stop") notes.push("Per-stop pay moves with volume, so a light day costs you less and your driver earns less. See the table below.");
  if (!notes.length) notes.push("Crew cost looks in line with the route revenue you entered.");

  const inputsRef = useRef(null);
  const resultsRef = useRef(null);
  const inputsInView = useInView(inputsRef);
  const resultsInView = useInView(resultsRef);
  const field = (key, label, extra = {}) => <NumberField label={label} value={v[key]} onChange={(value) => set(key, value)} {...extra} />;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <div ref={inputsRef} className="space-y-5">
        <Panel title="Driver">
          <div className="space-y-4">
            <Segmented label="How you pay" value={v.driverType} onChange={(value) => set("driverType", value)} options={PAY_TYPES} />
            {field("driverRate", "Driver pay", { prefix: "$", suffix: UNIT[v.driverType] })}
          </div>
        </Panel>
        <Panel title="Helpers">
          <div className="space-y-4">
            {field("helperCount", "Helpers per truck", { suffix: "people", hint: "Enter 0 if the driver runs solo." })}
            {n.helperCount > 0 && (
              <>
                <Segmented label="How you pay" value={v.helperType} onChange={(value) => set("helperType", value)} options={PAY_TYPES} />
                {field("helperRate", "Helper pay", { prefix: "$", suffix: UNIT[v.helperType] })}
              </>
            )}
          </div>
        </Panel>
        <Panel title="The work">
          <FieldGrid cols={3}>
            {field("stops", "Stops per day", { suffix: "stops" })}
            {field("hours", "Hours per day", { suffix: "hours" })}
            {field("days", "Days per week", { suffix: "days" })}
          </FieldGrid>
        </Panel>
        <Panel title="Payroll costs">
          <div className="space-y-4">
            {field("burdenPct", "Employer taxes and workers' comp", {
              suffix: "% of pay",
              hint: "15% is a rough starting point. Use the real rate from your payroll provider.",
            })}
            <CheckRow
              label="Include overtime for hours over 40 a week"
              hint="Whether you owe it depends on your trucks and your state. See the FAQ below."
              checked={v.overtime}
              onChange={(on) => set("overtime", on)}
            />
            {field("routeRevenue", "Route revenue per day (optional)", { prefix: "$", hint: "Shows crew cost as a share of what the route pays." })}
          </div>
        </Panel>
      </div>

      <div
        id="results"
        ref={resultsRef}
        className="scroll-mt-24 space-y-5 lg:sticky lg:top-24 lg:-m-1 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:p-1"
        aria-live="polite"
      >
        <Panel>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Crew cost per truck, per day</p>
          <p className="mt-1 font-display text-5xl font-extrabold tracking-tight tabular-nums text-slate-950">{money(c.dailyCost)}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Wages plus {n.burdenPct}% payroll costs{c.laborShare != null ? `, ${pct(c.laborShare)} of route revenue` : ""}.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Week" value={money(c.weeklyCost)} />
            <Stat label="Month" value={money(c.monthlyCost)} />
            <Stat label="Year" value={money(c.yearlyCost)} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Stat label="Per stop" value={money2(c.perStop)} />
            <Stat label="Labor share" value={c.laborShare != null ? pct(c.laborShare) : "–"} tone={heavyLabor ? "warn" : "default"} />
          </div>
        </Panel>

        <Panel title="What each person earns" description="Wages only, before taxes.">
          <div className="space-y-3">
            {[
              { name: "Driver", p: c.driver },
              ...(c.helpers > 0 ? [{ name: c.helpers === 1 ? "Helper" : `Each helper (×${c.helpers})`, p: c.helper }] : []),
            ].map(({ name, p }) => (
              <div key={name} className="rounded-xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-100">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-bold text-slate-900">{name}</p>
                  <p className="text-sm font-extrabold tabular-nums text-slate-950">{money2(p.effectiveHourly)}/hr</p>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {money(p.day)} a day = {money2(p.perStop)} a stop = {money2(p.perHour)} an hour. {money(p.week)} a week.
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="When stop counts swing" description="Same hours, fewer or more stops.">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="pb-2">Stops</th>
                <th className="pb-2 text-right">Crew/day</th>
                <th className="pb-2 text-right">Per stop</th>
                <th className="pb-2 text-right">Driver/hr</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {c.volumes.map((row, i) => (
                <tr key={i} className={`border-t border-slate-100 ${i === 1 ? "font-bold text-slate-950" : "text-slate-700"}`}>
                  <td className="py-2">{row.stops}</td>
                  <td className="py-2 text-right">{money(row.cost)}</td>
                  <td className="py-2 text-right">{money2(row.perStop)}</td>
                  <td className="py-2 text-right">{money2(row.driverHourly)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="What to watch">
          <Notes items={notes} tone={heavyLabor || (c.otHours > 0 && !n.overtime) ? "warn" : "info"} />
        </Panel>

        <ToolActions getShareUrl={shareUrl} onReset={reset} />
      </div>

      <MobileSummary show={inputsInView && !resultsInView} label="Crew cost per day" value={money(c.dailyCost)} />
    </div>
  );
}
