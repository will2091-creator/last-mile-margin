import { useState } from "react";
import lastMileMarginLogoDark from "../assets/last-mile-margin-logo-transparent-dark.svg";
import frameDashboard from "../assets/inside-preview/frame-01.png";
import frameRouteProfit from "../assets/inside-preview/frame-05.png";
import frameContracts from "../assets/inside-preview/frame-07.png";
import frameSaveDay from "../assets/inside-preview/frame-08.png";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileSpreadsheet,
  Gauge,
  Moon,
  Percent,
  Route,
  Save,
  ShieldAlert,
  Sun,
  TrendingUp,
} from "lucide-react";

const CLH_URL = "https://contractor-launch-hub.vercel.app";

// Left-side value bullets (split feature section).
const FEATURES = [
  { icon: Gauge, title: "See daily profit fast", text: "Track revenue, expenses, claims exposure, saved days, and margin without digging through spreadsheets." },
  { icon: Route, title: "Know if a route pays", text: "Use Route Profit Check to compare contract pay, labor, miles, fuel, and risk before you accept bad work." },
  { icon: ShieldAlert, title: "Control claims and chargebacks", text: "Track open claims, evidence, dispute status, and exposure so deductions do not quietly eat the month." },
  { icon: Save, title: "Save the day's history", text: "Save snapshots of routes, expenses, claims, and notes so the business has a clean operating record." },
  { icon: FileSpreadsheet, title: "Roll up contracts", text: "Review route rates, stop pay, fees, and contract rules in one place — before guessing with your wallet like it owes you money." },
  { icon: Bot, title: "Ask the business", text: "Use AI insights to surface profit leaks, risk, missing data, and the next best actions." },
];

// Mini on-brand mockups stand in for the two demo-video frames that were mid-transition,
// so every screen in the gallery is crisp.
function MiniSidebar({ active }) {
  const items = ["Dashboard", "Intake", "Profitability", "Contracts", "Claims", "Reports"];
  return (
    <div className="hidden w-24 shrink-0 border-r border-white/10 bg-slate-950/80 p-2 lg:block">
      <div className="mb-3 h-5 rounded bg-white/5" />
      {items.map((i) => (
        <div key={i} className={`mb-1 rounded px-2 py-1 text-[10px] font-bold ${i === active ? "bg-blue-600 text-white" : "text-slate-500"}`}>{i}</div>
      ))}
    </div>
  );
}

function IntakeMock() {
  return (
    <div className="flex h-full w-full bg-slate-950 text-left">
      <MiniSidebar active="Intake" />
      <div className="min-w-0 flex-1 p-3 sm:p-4">
        <p className="text-sm font-black text-white">Intake</p>
        <p className="text-[10px] font-semibold text-slate-400">Drop messy info once. Review, then send it where it belongs.</p>
        <div className="mt-3 rounded-lg border border-dashed border-blue-500/40 bg-blue-500/5 p-3 text-center">
          <p className="text-[11px] font-bold text-blue-300">Drop files here or paste your text</p>
          <p className="mt-0.5 text-[9px] text-slate-500">Email · screenshot · PDF · route sheet · contract terms</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">Extracted</p>
            {[["Source", "Email"], ["Store", "Lowe's #1234"], ["Issue", "Wall Damage"], ["Amount", "$950"]].map(([k, v]) => (
              <div key={k} className="mt-1 flex justify-between text-[10px]"><span className="text-slate-500">{k}</span><span className="font-bold text-slate-200">{v}</span></div>
            ))}
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">Send to</p>
            {["Save to Claim", "Save to Contract", "Save to Profitability", "Save to Saved Day"].map((s) => (
              <div key={s} className="mt-1 rounded bg-blue-600/15 px-2 py-1 text-[10px] font-bold text-blue-300">{s}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClaimsMock() {
  const cols = [
    { name: "Needs Review", cards: [["Wall Damage", "$950", "text-red-400"]] },
    { name: "In Progress", cards: [["Product Damage", "$725", "text-amber-400"]] },
    { name: "Resolved", cards: [["Missed Window", "$250", "text-emerald-400"]] },
  ];
  return (
    <div className="flex h-full w-full bg-slate-950 text-left">
      <MiniSidebar active="Claims" />
      <div className="min-w-0 flex-1 p-3 sm:p-4">
        <p className="text-sm font-black text-white">Claims</p>
        <p className="text-[10px] font-semibold text-slate-400">Drag claims between columns; status updates automatically.</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {cols.map((c) => (
            <div key={c.name}>
              <p className="truncate text-[9px] font-black uppercase tracking-wide text-slate-500">{c.name}</p>
              {c.cards.map(([t, amt, tone]) => (
                <div key={t} className="mt-1 rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-[10px] font-black text-white">{t}</span>
                    <span className={`text-[10px] font-black ${tone}`}>{amt}</span>
                  </div>
                  <p className="mt-0.5 text-[8px] text-slate-500">Driver assigned · Route linked</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Tabbed screenshot gallery. `img` = real app screenshot; `mock` = on-brand component.
const GALLERY = [
  { name: "Command Center", img: frameDashboard, desc: "See today's numbers and what needs attention.", helps: "Spot what's leaking margin before you start digging.", alt: "Last Mile Margin dashboard with today's profit, claims, revenue, margin, and a needs-attention list" },
  { name: "Intake", mock: IntakeMock, desc: "Drop in route, cost, or business info and turn it into usable records.", helps: "Capture the messy stuff once, then send it where it belongs.", alt: "Intake screen where emails, route sheets, and notes become reviewable claim, contract, and route drafts" },
  { name: "Claims", mock: ClaimsMock, desc: "Track deductions, evidence, disputes, and claim exposure.", helps: "Control claims before they control the month.", alt: "Claims board with needs-review, in-progress, and resolved columns for chargebacks and damage claims" },
  { name: "Route Profit Check", img: frameRouteProfit, desc: "Know the route margin before saying yes.", helps: "Catch bad work before you accept it.", alt: "Route Profit Check with a contract rate card and a live route summary showing revenue, cost, net profit, and margin" },
  { name: "Contracts Roll-Up", img: frameContracts, desc: "Compare contract rules, rates, and payout logic.", helps: "Know which contracts are worth keeping.", alt: "Contracts roll-up table comparing routes, revenue, costs, claims, profit, and margin per contract" },
  { name: "Save Day", img: frameSaveDay, desc: "Build daily history for cleaner reporting.", helps: "Close the loop on every day's numbers.", alt: "Save Day screen with a day snapshot of profit, claims, revenue, and margin plus a saved-days history list" },
];

// Demo / example metrics (clearly labeled, not a guarantee).
const METRICS = [
  { icon: DollarSign, value: "$356.03", label: "Today's Profit" },
  { icon: ShieldAlert, value: "$2,600", label: "Claims Exposure" },
  { icon: Calendar, value: "$1,200", label: "Saved Days" },
  { icon: Percent, value: "26.5%", label: "Demo Margin" },
];

function BrowserFrame({ src, alt, children, className = "" }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50 ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-slate-950/80 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-400/80" aria-hidden="true" />
        <span className="h-3 w-3 rounded-full bg-amber-400/80" aria-hidden="true" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/80" aria-hidden="true" />
        <span className="ml-3 hidden truncate rounded-md bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400 sm:block">app.lastmilemargin.com</span>
      </div>
      {src ? (
        <img src={src} alt={alt} className="block w-full" loading="lazy" />
      ) : (
        <div className="aspect-[16/9] w-full overflow-hidden" role="img" aria-label={alt}>{children}</div>
      )}
    </div>
  );
}

export default function FeatureShowcase({ onSignIn, onToggleTheme, isDark }) {
  const [tab, setTab] = useState(0);
  const active = GALLERY[tab];
  const ActiveMock = active.mock;

  const onTabKey = (e) => {
    if (e.key === "ArrowRight") setTab((t) => (t + 1) % GALLERY.length);
    else if (e.key === "ArrowLeft") setTab((t) => (t - 1 + GALLERY.length) % GALLERY.length);
  };

  return (
    <div className="relative min-h-screen overflow-y-auto bg-slate-950 text-white">
      {/* Subtle navy gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(37,99,235,0.18),transparent_70%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-950/30 via-slate-950 to-slate-950" aria-hidden="true" />

      <div className="relative">
        {/* Sticky top bar */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 lg:px-8">
            <img src={lastMileMarginLogoDark} alt="Last Mile Margin" className="h-10 w-auto object-contain" />
            <div className="flex items-center gap-2">
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
                  title="Toggle theme"
                  className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-200 transition hover:bg-white/10"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              )}
              <button
                onClick={onSignIn}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
              >
                Sign in <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* ---------- HERO ---------- */}
        <section className="mx-auto max-w-6xl px-5 pb-10 pt-14 lg:px-8 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-blue-300 backdrop-blur">
                Built for final-mile contractors
              </span>
              <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Know your margin{" "}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">before the route costs you.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-slate-300">
                Last Mile Margin helps final-mile contractors track profit, claims, contracts, expenses, saved days, and
                route performance in one place.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={onSignIn}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-black text-white shadow-xl shadow-blue-600/30 transition hover:-translate-y-0.5 hover:bg-blue-500"
                >
                  Sign in to your workspace <ArrowRight className="h-5 w-5" />
                </button>
                <a
                  href={CLH_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-base font-bold text-slate-100 backdrop-blur transition hover:bg-white/10"
                >
                  Start your company first <ArrowUpRight className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Hero visual: browser-frame dashboard + floating owner-view overlay */}
            <div className="relative">
              <BrowserFrame src={frameDashboard} alt="Last Mile Margin dashboard showing today's profit, claims exposure, revenue, and margin" />
              <div className="absolute -bottom-6 -left-2 w-56 rounded-2xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl shadow-black/60 backdrop-blur sm:-left-8 sm:w-60">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Owner view</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Today's Profit</p>
                    <p className="text-lg font-black text-emerald-400">$356.03</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Claims Exposure</p>
                    <p className="text-lg font-black text-red-400">$2,600</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Saved Days</p>
                    <p className="text-lg font-black text-blue-300">$1,200</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Margin</p>
                    <p className="text-lg font-black text-emerald-400">26.5%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- DEMO METRICS STRIP ---------- */}
        <section className="mx-auto max-w-6xl px-5 pt-10 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur sm:p-8">
            <p className="text-center text-[11px] font-black uppercase tracking-wide text-slate-500">Example demo numbers — not a guarantee of results</p>
            <div className="mt-5 grid grid-cols-2 gap-5 lg:grid-cols-4">
              {METRICS.map(({ icon: Icon, value, label }) => (
                <div key={label} className="text-center">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">{value}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- SPLIT: bullets + screenshot ---------- */}
        <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Run cleaner final-mile operations.</h2>
              <p className="mt-3 max-w-lg text-base font-semibold text-slate-400">Know where the money went, catch profit leaks, and decide before the route — not after.</p>
              <ul className="mt-8 space-y-6">
                {FEATURES.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 text-blue-300 ring-1 ring-white/10">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-white">{title}</h3>
                      <p className="mt-1 text-sm font-medium leading-6 text-slate-300">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:sticky lg:top-24">
              <BrowserFrame src={frameRouteProfit} alt="Route Profit Check comparing contract pay, labor, fuel, and stops with a live margin readout" />
              <p className="mt-4 text-center text-sm font-semibold text-slate-400">Route Profit Check — know if the route pays before you say yes.</p>
            </div>
          </div>
        </section>

        {/* ---------- TABBED GALLERY ---------- */}
        <section className="mx-auto max-w-6xl px-5 pb-16 lg:px-8 lg:pb-24">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">A look inside</h2>
            <p className="mx-auto mt-3 max-w-xl text-base font-semibold text-slate-400">Six screens that keep the business honest.</p>
          </div>
          <div role="tablist" aria-label="Product screens" onKeyDown={onTabKey} className="mb-8 flex flex-wrap justify-center gap-2">
            {GALLERY.map((g, i) => (
              <button
                key={g.name}
                role="tab"
                id={`gallery-tab-${i}`}
                aria-selected={tab === i}
                aria-controls="gallery-panel"
                tabIndex={tab === i ? 0 : -1}
                onClick={() => setTab(i)}
                className={tab === i
                  ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/30"
                  : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10"}
              >
                {g.name}
              </button>
            ))}
          </div>
          <div role="tabpanel" id="gallery-panel" aria-labelledby={`gallery-tab-${tab}`} className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            {ActiveMock ? (
              <BrowserFrame alt={active.alt}><ActiveMock /></BrowserFrame>
            ) : (
              <BrowserFrame key={active.name} src={active.img} alt={active.alt} />
            )}
            <div>
              <h3 className="text-2xl font-black tracking-tight text-white">{active.name}</h3>
              <p className="mt-3 text-base font-semibold leading-7 text-slate-300">{active.desc}</p>
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <p className="text-sm font-bold text-emerald-200">{active.helps}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- BUILT FOR CONTRACTORS ---------- */}
        <section className="mx-auto max-w-5xl px-5 pb-16 lg:px-8 lg:pb-24">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-8 text-center backdrop-blur sm:p-12">
            <h2 className="mx-auto max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              Built for final-mile contractors, not spreadsheet archaeologists.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-slate-300">
              Owners and managers can see what is making money, what is leaking margin, which claims need attention, and
              which routes are worth keeping.
            </p>
          </div>
        </section>

        {/* ---------- CLOSING CTA ---------- */}
        <section className="mx-auto max-w-6xl px-5 pb-20 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-slate-950 p-8 text-center sm:p-14">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Ready to stop guessing where the money went?</h2>
            <p className="mx-auto mt-3 max-w-xl text-base font-semibold text-slate-300">Sign in and let the numbers do the talking while you run the routes.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={onSignIn}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-black text-white shadow-xl shadow-blue-600/30 transition hover:-translate-y-0.5 hover:bg-blue-500"
              >
                Sign in <ArrowRight className="h-5 w-5" />
              </button>
              <a
                href={CLH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-base font-bold text-slate-100 backdrop-blur transition hover:bg-white/10"
              >
                Set up your company first <ArrowUpRight className="h-5 w-5" />
              </a>
            </div>
          </div>
          <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs font-semibold text-slate-500">
            <TrendingUp className="h-3.5 w-3.5" /> Last Mile Margin — margin protection for final-mile delivery contractors.
          </p>
        </section>
      </div>
    </div>
  );
}
