import { useEffect, useMemo, useState } from "react";
import {
  currency,
  number,
  DollarSign,
  ShieldCheck,
  Truck,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Target,
} from "../shared";
import PageIntro from "../components/PageIntro";
import { loadCashPositionFromSupabase } from "../lib/cashPositionRepository";
import {
  computeCashPositionSummary,
  computeEarlyPayPreview,
  centsToDollars,
} from "../lib/cashPosition";
import {
  mockReceivables,
  mockDriverSettlements,
  financingDefaults,
} from "../data/cashPositionMockData";

const fmt = (cents) => currency.format(centsToDollars(cents));
const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

const AGING_BUCKETS = [
  { key: "b0_15", label: "0–15 days", barLight: "bg-emerald-500", barDark: "bg-emerald-400" },
  { key: "b16_30", label: "16–30 days", barLight: "bg-sky-500", barDark: "bg-sky-400" },
  { key: "b31_45", label: "31–45 days", barLight: "bg-amber-500", barDark: "bg-amber-400" },
  { key: "b45_plus", label: "45+ days", barLight: "bg-rose-500", barDark: "bg-rose-400" },
];

export default function CashPositionDashboard({ isDark }) {
  // Seed synchronously from the offline mock so the view always renders, then
  // merge real rows when Supabase is configured + the schema has been run.
  const [data, setData] = useState(() => ({
    receivables: mockReceivables,
    driverSettlements: mockDriverSettlements,
    financingRates: financingDefaults,
  }));
  const [source, setSource] = useState("demo"); // "demo" | "live"
  const [status, setStatus] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const result = await loadCashPositionFromSupabase();
      if (!mounted) return;
      if (result.ok && result.receivables.length) {
        setData({
          receivables: result.receivables,
          driverSettlements: result.driverSettlements,
          financingRates: result.financingRates,
        });
        setSource("live");
        // Receivables loaded, but settlements/config may have partially failed.
        if (result.error) setStatus(result.error);
      } else {
        setStatus(result.error || "");
      }
    })();
    return () => { mounted = false; };
  }, []);

  const summary = useMemo(
    () => computeCashPositionSummary(data.receivables, data.driverSettlements),
    [data.receivables, data.driverSettlements]
  );
  const earlyPay = useMemo(
    () => computeEarlyPayPreview(data.receivables, data.financingRates),
    [data.receivables, data.financingRates]
  );

  const titleText = isDark ? "text-white" : "text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const subtleText = isDark ? "text-slate-500" : "text-slate-400";
  const card = isDark
    ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const trackBg = isDark ? "bg-white/10" : "bg-slate-200";
  const rowBorder = isDark ? "border-white/10" : "border-slate-200";
  const epCard = isDark
    ? "rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-5 shadow-card"
    : "rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/40 p-5 shadow-sm";

  const verifiedShare = pct(summary.verifiedCents, summary.totalOwedCents);
  const pendingShare = summary.totalOwedCents > 0 ? 100 - verifiedShare : 0;

  return (
    <div className="space-y-5">
      <PageIntro
        isDark={isDark}
        eyebrow="Finance"
        title="Cash Position"
        description="What you're owed, when it's due, and how much is early-pay eligible — pulled from your receivables and driver settlements. Read-only: no funds move here."
        Icon={DollarSign}
        chips={["Preview only", source === "live" ? "Live data" : "Demo data"]}
      />

      {/* Primary KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile isDark={isDark} icon={DollarSign} accent="blue" label="Total outstanding"
          value={fmt(summary.totalOwedCents)} note={`${summary.receivableCount} open receivable${summary.receivableCount === 1 ? "" : "s"}`} />
        <StatTile isDark={isDark} icon={ShieldCheck} accent="emerald" label="Verified / invoiced"
          value={fmt(summary.verifiedCents)} note={`${verifiedShare}% of outstanding`} />
        <StatTile isDark={isDark} icon={AlertTriangle} accent="amber" label="Pending verification"
          value={fmt(summary.pendingCents)} note={`${pendingShare}% of outstanding`} />
        <StatTile isDark={isDark} icon={Truck} accent="indigo" label="Net owed to drivers"
          value={fmt(summary.driverNetOwedCents)} note={`${summary.driverSettlementCount} unpaid settlement${summary.driverSettlementCount === 1 ? "" : "s"}`} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {/* Aging */}
        <div className={card}>
          <div className="flex items-start gap-3">
            <span className={isDark ? "rounded-xl bg-blue-500/10 p-2 text-blue-300" : "rounded-xl bg-blue-50 p-2 text-blue-600"}>
              <BarChart3 className="h-5 w-5" />
            </span>
            <div>
              <h2 className={`text-lg font-bold ${titleText}`}>Receivables aging</h2>
              <p className={`text-sm font-semibold ${mutedText}`}>Outstanding by expected pay date</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {AGING_BUCKETS.map((b) => {
              const amt = summary.buckets[b.key] || 0;
              const width = pct(amt, summary.totalOwedCents);
              return (
                <div key={b.key}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className={`text-sm font-bold ${titleText}`}>{b.label}</span>
                    <span className={`safe-number text-sm font-black ${titleText}`} title={fmt(amt)}>
                      {fmt(amt)} <span className={`text-xs font-bold ${subtleText}`}>· {width}%</span>
                    </span>
                  </div>
                  <div className={`h-2.5 w-full overflow-hidden rounded-full ${trackBg}`}>
                    <div className={`h-full rounded-full transition-all ${isDark ? b.barDark : b.barLight}`} style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {(summary.disputedCents > 0 || summary.paidCents > 0) && (
            <div className={`mt-5 grid grid-cols-2 gap-3 border-t pt-4 ${rowBorder}`}>
              <MiniStat isDark={isDark} label="Disputed (at risk)" value={fmt(summary.disputedCents)} tone="rose" />
              <MiniStat isDark={isDark} label="Collected (paid)" value={fmt(summary.paidCents)} tone="emerald" />
            </div>
          )}
        </div>

        {/* Verified vs Pending split */}
        <div className={card}>
          <div className="flex items-start gap-3">
            <span className={isDark ? "rounded-xl bg-blue-500/10 p-2 text-blue-300" : "rounded-xl bg-blue-50 p-2 text-blue-600"}>
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className={`text-lg font-bold ${titleText}`}>Verified vs pending</h2>
              <p className={`text-sm font-semibold ${mutedText}`}>Confidence in what you're owed</p>
            </div>
          </div>

          <p className={`safe-number mt-5 text-4xl font-black tracking-tight ${titleText}`} title={fmt(summary.totalOwedCents)}>
            {fmt(summary.totalOwedCents)}
          </p>
          <p className={`text-sm font-semibold ${mutedText}`}>total outstanding</p>

          <div className={`mt-4 flex h-3 overflow-hidden rounded-full ${trackBg}`}>
            <div className={isDark ? "h-full bg-emerald-400" : "h-full bg-emerald-500"} style={{ width: `${verifiedShare}%` }} />
            <div className={isDark ? "h-full bg-amber-400" : "h-full bg-amber-500"} style={{ width: `${pendingShare}%` }} />
          </div>

          <div className="mt-4 space-y-2">
            <SplitRow isDark={isDark} dot={isDark ? "bg-emerald-400" : "bg-emerald-500"} label="Verified / invoiced" value={fmt(summary.verifiedCents)} share={verifiedShare} />
            <SplitRow isDark={isDark} dot={isDark ? "bg-amber-400" : "bg-amber-500"} label="Pending verification" value={fmt(summary.pendingCents)} share={pendingShare} />
          </div>
        </div>
      </section>

      {/* Early Pay Eligible — preview only */}
      <section className={epCard}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-600">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={`text-lg font-black ${titleText}`}>Early Pay eligible</h2>
                <span className="rounded-full bg-blue-600/15 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide text-blue-600">Preview</span>
              </div>
              <p className={`mt-1 max-w-xl text-sm font-semibold ${mutedText}`}>
                An estimate of what you could advance against verified, invoiced, and completed receivables.
                This is a preview — <span className="font-black">no funds move and nothing is created.</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <EarlyTile isDark={isDark} icon={Target} label="Eligible amount"
            value={fmt(earlyPay.eligibleAmountCents)} note={`${earlyPay.eligibleCount} receivable${earlyPay.eligibleCount === 1 ? "" : "s"}`} />
          <EarlyTile isDark={isDark} icon={DollarSign} label="Advanceable now"
            value={fmt(earlyPay.advanceableCents)} note={`${number.format(earlyPay.advanceRate * 100)}% advance rate`} emphasize />
          <EarlyTile isDark={isDark} icon={BarChart3} label="Preview fee"
            value={fmt(earlyPay.previewFeeCents)} note={`${number.format(earlyPay.feeRate * 100)}% fee`} />
          <EarlyTile isDark={isDark} icon={CheckCircle2} label="Net funding"
            value={fmt(earlyPay.netFundingCents)} note="estimated to your account" />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className={`text-xs font-semibold ${subtleText}`}>
            Read-only analytics over your internal data. No payment provider, no card program, no transfer.
          </p>
          <button
            type="button"
            disabled
            title="Funding is on the roadmap — this control is intentionally inactive."
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-blue-600/60 px-4 py-2.5 text-sm font-black text-white opacity-70"
          >
            <Sparkles className="h-4 w-4" /> Request Advance (coming soon)
          </button>
        </div>
      </section>

      {/* Footer / data source */}
      <p className={`text-center text-[11px] font-semibold ${subtleText}`}>
        {source === "live"
          ? "Showing live data from your workspace."
          : "Showing demo data."}{" "}
        {status ? `Supabase sync unavailable: ${status}` : "Cash Position is a read-only, system-of-record view."}
      </p>
    </div>
  );
}

function StatTile({ isDark, icon: Icon, label, value, note, accent }) {
  const accents = {
    blue: isDark ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-600",
    emerald: isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-600",
    amber: isDark ? "bg-amber-500/10 text-amber-300" : "bg-amber-50 text-amber-600",
    indigo: isDark ? "bg-indigo-500/10 text-indigo-300" : "bg-indigo-50 text-indigo-600",
  };
  return (
    <div className={isDark ? "rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
      <div className="flex items-center gap-3">
        <span className={`rounded-xl p-2.5 ${accents[accent] || accents.blue}`}><Icon className="h-5 w-5" /></span>
        <p className={`text-xs font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      </div>
      <p className={`safe-number mt-4 text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-950"}`} title={value}>{value}</p>
      <p className={`mt-1 truncate text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{note}</p>
    </div>
  );
}

function MiniStat({ isDark, label, value, tone }) {
  const color = tone === "rose"
    ? (isDark ? "text-rose-300" : "text-rose-600")
    : (isDark ? "text-emerald-300" : "text-emerald-600");
  return (
    <div>
      <p className={`text-[11px] font-bold uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
      <p className={`safe-number mt-1 text-lg font-black ${color}`} title={value}>{value}</p>
    </div>
  );
}

function SplitRow({ isDark, dot, label, value, share }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <span className={`text-sm font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{label}</span>
      </span>
      <span className={`safe-number text-sm font-black ${isDark ? "text-white" : "text-slate-950"}`} title={value}>
        {value} <span className={`text-xs font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>· {share}%</span>
      </span>
    </div>
  );
}

function EarlyTile({ isDark, icon: Icon, label, value, note, emphasize }) {
  return (
    <div className={
      emphasize
        ? (isDark ? "rounded-xl border border-blue-400/40 bg-blue-500/10 p-4" : "rounded-xl border border-blue-300 bg-white p-4 shadow-sm")
        : (isDark ? "rounded-xl border border-white/10 bg-white/5 p-4" : "rounded-xl border border-slate-200 bg-white/70 p-4")
    }>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${isDark ? "text-blue-300" : "text-blue-600"}`} />
        <p className={`text-[11px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      </div>
      <p className={`safe-number mt-2 text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-950"}`} title={value}>{value}</p>
      <p className={`mt-0.5 truncate text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{note}</p>
    </div>
  );
}
