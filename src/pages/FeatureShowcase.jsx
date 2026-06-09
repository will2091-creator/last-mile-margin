import { useState } from "react";
import lastMileMarginLogo from "../assets/last-mile-margin-logo-transparent.svg";
import lastMileMarginLogoDark from "../assets/last-mile-margin-logo-transparent-dark.svg";
import frameDashboard from "../assets/inside-preview/frame-01.webp";
import frameIntake from "../assets/inside-preview/intake.webp";
import frameClaims from "../assets/inside-preview/claims.webp";
import frameRouteProfit from "../assets/inside-preview/route-profit.webp";
import frameContracts from "../assets/inside-preview/contracts.webp";
import frameSaveDay from "../assets/inside-preview/frame-08.webp";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Bot,
  CheckCircle2,
  DollarSign,
  FileSpreadsheet,
  Gauge,
  ListChecks,
  MessageSquare,
  Moon,
  Percent,
  Route,
  Save,
  ShieldAlert,
  Sparkles,
  Sun,
  TrendingUp,
  TriangleAlert,
  Upload,
  XCircle,
} from "lucide-react";

const CLH_URL = "https://contractor-launch-hub.vercel.app";

// Left-side value bullets (split feature section).
const FEATURES = [
  { icon: Gauge, title: "See daily profit fast", text: "Track revenue, expenses, claims exposure, saved days, and margin without digging through spreadsheets." },
  { icon: Route, title: "Know if a route pays", text: "Use Route Profit Check to compare contract pay, labor, miles, fuel, and risk before you accept bad work." },
  { icon: ShieldAlert, title: "Stop losing money to chargebacks", text: "Every undisputed chargeback is money you earned and handed back. Track claims, score dispute viability with AI, and fight the ones worth winning." },
  { icon: Save, title: "Automatic daily history", text: "Every workday closes itself out into clean history — routes, expenses, claims, and margin — with nothing to remember to save." },
  { icon: FileSpreadsheet, title: "Roll up contracts", text: "Review route rates, stop pay, fees, and contract rules in one place — before guessing with your wallet like it owes you money." },
  { icon: Bot, title: "Ask the business", text: "Use AI insights to surface profit leaks, risk, missing data, and the next best actions." },
];

// Tabbed gallery — real screenshots of the app.
const GALLERY = [
  { name: "Command Center", img: frameDashboard, desc: "Your whole workspace, ranked into one AI to-do list.", helps: "Know what to fix first, before you start digging.", alt: "Last Mile Margin dashboard with a 'Do this now' AI action feed of disputes, claims, and margin alerts" },
  { name: "Intake", img: frameIntake, desc: "Drop a claim email, file, or notes and AI pulls out what matters.", helps: "Capture the messy stuff once, then send it where it belongs.", alt: "AI Intake screen that turns emails, route sheets, and notes into reviewable drafts" },
  { name: "Claims", img: frameClaims, desc: "Open-claim exposure, AI risk scoring, and one-click dispute packets — so you know exactly what to fight and what it's worth.", helps: "Stop accepting chargebacks you didn't earn. Dispute the right ones with the right evidence.", alt: "Operations claims view with open-claim exposure, high-risk scoring, and a claim-risk forecast" },
  { name: "Profitability", img: frameRouteProfit, desc: "Contract-level revenue, cost, margin, and claims — plus Route Profit Check.", helps: "Know which routes actually pay before you say yes.", alt: "Profitability dashboard with revenue, net profit, claims exposure, and average margin per contract" },
  { name: "Contracts", img: frameContracts, desc: "Compare contracts and edit terms in place.", helps: "Know which contracts are worth keeping.", alt: "Contracts view comparing revenue, cost, claims, and margin per contract" },
  { name: "Reports", img: frameSaveDay, desc: "Roll up profit, claims, and route performance for clean reporting.", helps: "Close the loop on the month.", alt: "Reports view rolling up profit, claims, and route performance" },
];

// Example demo metrics (clearly labeled, not a guarantee). Values match the demo workspace.
const METRICS = [
  { icon: DollarSign, value: "$14,640", label: "Weekly Revenue" },
  { icon: TrendingUp, value: "$4,020", label: "Net Profit" },
  { icon: Percent, value: "27.46%", label: "Average Margin" },
  { icon: ShieldAlert, value: "$1,380", label: "Claims Exposure" },
];

function BrowserFrame({ src, alt, className = "" }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50 ${className}`}>
      <img src={src} alt={alt} className="block w-full" loading="lazy" />
    </div>
  );
}

export default function FeatureShowcase({ onSignIn, onToggleTheme, isDark }) {
  const [tab, setTab] = useState(0);
  const active = GALLERY[tab];

  const onTabKey = (e) => {
    if (e.key === "ArrowRight") setTab((t) => (t + 1) % GALLERY.length);
    else if (e.key === "ArrowLeft") setTab((t) => (t - 1 + GALLERY.length) % GALLERY.length);
  };

  // Theme tokens — all surface/text decisions live here
  const t = {
    root:        isDark ? "bg-slate-950 text-white"          : "bg-slate-50 text-slate-950",
    header:      isDark ? "border-white/10 bg-slate-950/80"  : "border-slate-200 bg-white/80",
    toggleBtn:   isDark ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"   : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
    badge:       isDark ? "border-white/15 bg-white/5 text-blue-300"                      : "border-blue-200 bg-blue-50 text-blue-700",
    heroPara:    isDark ? "text-slate-300"  : "text-slate-600",
    heroSec:     isDark ? "border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"   : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
    metricsCard: isDark ? "border-white/10 bg-white/[0.03]"  : "border-slate-200 bg-white",
    metricsLabel:isDark ? "text-slate-500"  : "text-slate-500",
    metricVal:   isDark ? "text-white"      : "text-slate-950",
    metricSub:   isDark ? "text-slate-400"  : "text-slate-500",
    aiBox:       isDark ? "border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-slate-950"
                        : "border-violet-300 bg-gradient-to-br from-violet-50 via-indigo-50/50 to-white",
    aiLabel:     isDark ? "text-violet-400" : "text-violet-600",
    aiIconBg:    isDark ? "bg-violet-500/20 ring-violet-500/30 text-violet-300" : "bg-violet-100 ring-violet-200 text-violet-600",
    aiPara:      isDark ? "text-slate-400"  : "text-slate-600",
    aiCard:      isDark ? "border-white/8 bg-white/[0.03]"   : "border-violet-100 bg-white",
    aiCardTitle: isDark ? "text-white"      : "text-slate-950",
    aiCardText:  isDark ? "text-slate-400"  : "text-slate-600",
    featureIcon: isDark ? "from-blue-500/20 to-indigo-500/10 text-blue-300 ring-white/10" : "from-blue-100 to-indigo-50 text-blue-600 ring-blue-200",
    featureTitle:isDark ? "text-white"      : "text-slate-950",
    featureText: isDark ? "text-slate-300"  : "text-slate-600",
    featureSub:  isDark ? "text-slate-400"  : "text-slate-500",
    sectionSub:  isDark ? "text-slate-400"  : "text-slate-500",
    tabInactive: isDark ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
    galleryTitle:isDark ? "text-white"      : "text-slate-950",
    galleryDesc: isDark ? "text-slate-300"  : "text-slate-600",
    galleryHelps:isDark ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200" : "border-emerald-300 bg-emerald-50 text-emerald-700",
    contractorsBox: isDark ? "border-white/10 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 text-white"
                           : "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 text-slate-950",
    contractorsPara: isDark ? "text-slate-300" : "text-slate-600",
    ctaBox:      isDark ? "border-blue-400/20 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-slate-950"
                        : "border-blue-300 bg-gradient-to-br from-blue-600/10 via-indigo-50 to-white",
    ctaPara:     isDark ? "text-slate-300"  : "text-slate-600",
    ctaSec:      isDark ? "border-white/15 bg-white/5 text-slate-100 hover:bg-white/10" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
    footer:      isDark ? "text-slate-500"  : "text-slate-400",
  };

  return (
    <div className={`relative min-h-screen overflow-y-auto ${t.root}`}>
      {/* Subtle gradient backdrop */}
      {isDark && <>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(37,99,235,0.18),transparent_70%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-950/30 via-slate-950 to-slate-950" aria-hidden="true" />
      </>}

      <div className="relative">
        {/* Sticky top bar */}
        <header className={`sticky top-0 z-30 border-b backdrop-blur-md ${t.header}`}>
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 lg:px-8">
            <img src={isDark ? lastMileMarginLogoDark : lastMileMarginLogo} alt="Last Mile Margin" className="h-10 w-auto object-contain" />
            <div className="flex items-center gap-2">
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
                  title="Toggle theme"
                  className={`rounded-xl border p-2.5 transition ${t.toggleBtn}`}
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
              <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-wide backdrop-blur ${t.badge}`}>
                Built for final-mile contractors
              </span>
              <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Know your margin{" "}
                <span className={`bg-gradient-to-r bg-clip-text text-transparent ${isDark ? "from-blue-400 via-indigo-400 to-violet-400" : "from-blue-600 via-indigo-600 to-violet-600"}`}>before the route costs you.</span>
              </h1>
              <p className={`mt-6 max-w-xl text-lg font-semibold leading-8 ${t.heroPara}`}>
                Last Mile Margin helps final-mile contractors track profit, fight chargebacks, manage claims, and know their real margin — before a bad route or undisputed deduction wipes out the month.
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
                  className={`flex items-center justify-center gap-2 rounded-xl border px-7 py-3.5 text-base font-bold backdrop-blur transition ${t.heroSec}`}
                >
                  Start your company first <ArrowUpRight className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative">
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-blue-500/10 blur-2xl" aria-hidden="true" />
              <BrowserFrame src={frameDashboard} alt="Last Mile Margin dashboard with the 'Do this now' AI action feed ranking disputes, claims, and margin alerts" />
            </div>
          </div>
        </section>

        {/* ---------- DEMO METRICS STRIP ---------- */}
        <section className="mx-auto max-w-6xl px-5 pt-10 lg:px-8">
          <div className={`rounded-3xl border p-6 backdrop-blur sm:p-8 ${t.metricsCard}`}>
            <p className={`text-center text-[11px] font-black uppercase tracking-wide ${t.metricsLabel}`}>Example demo numbers — not a guarantee of results</p>
            <div className="mt-5 grid grid-cols-2 gap-5 lg:grid-cols-4">
              {METRICS.map(({ icon: Icon, value, label }) => (
                <div key={label} className="text-center">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className={`mt-3 text-2xl font-black tracking-tight sm:text-3xl ${t.metricVal}`}>{value}</p>
                  <p className={`mt-1 text-xs font-bold ${t.metricSub}`}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- CLAIMS MONEY CALLOUT ---------- */}
        <section className="mx-auto max-w-6xl px-5 pt-14 lg:px-8 lg:pt-20">
          <div className={`overflow-hidden rounded-3xl border p-8 sm:p-12 ${isDark ? "border-red-500/20 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-slate-950" : "border-red-200 bg-gradient-to-br from-red-50 via-orange-50/50 to-white"}`}>
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"}`}>
                    <XCircle className="h-4 w-4" />
                  </span>
                  <span className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-red-400" : "text-red-600"}`}>The quiet profit killer</span>
                </div>
                <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                  Most chargebacks go undisputed — not because they're valid, but because nobody fought them.
                </h2>
                <p className={`mt-4 text-base font-semibold leading-7 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Every uncontested deduction is money you earned and quietly gave back. Final-mile contractors absorb chargebacks, short-pays, and damage claims every week — most of which have strong dispute grounds when the right evidence is captured.
                </p>
                <p className={`mt-3 text-base font-semibold leading-7 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Last Mile Margin tracks every open claim, scores it for dispute viability, flags missing evidence, and builds the dispute packet — so you submit once with the right support.
                </p>
                <button
                  onClick={onSignIn}
                  className={`mt-7 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 ${isDark ? "bg-red-600 shadow-red-600/30 hover:bg-red-500" : "bg-red-600 shadow-red-600/20 hover:bg-red-500"}`}
                >
                  Start recovering claims <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  { icon: XCircle,   color: isDark ? "text-red-400 bg-red-500/15"    : "text-red-600 bg-red-50",    stat: "Most chargebacks",    sub: "go undisputed — not because they're valid, but because tracking them manually is impossible." },
                  { icon: Banknote,  color: isDark ? "text-amber-400 bg-amber-500/15": "text-amber-600 bg-amber-50", stat: "High-value claims",    sub: "over $500 often have strong grounds for dispute when photos, timestamps, and evidence are captured at delivery." },
                  { icon: TrendingUp,color: isDark ? "text-emerald-400 bg-emerald-500/15":"text-emerald-700 bg-emerald-50",stat: "AI-scored disputes",  sub: "let you prioritize the fights worth having — and skip the ones that aren't, so your time goes where the money is." },
                ].map(({ icon: Icon, color, stat, sub }) => (
                  <div key={stat} className={`flex gap-4 rounded-2xl border p-5 ${isDark ? "border-white/8 bg-white/[0.03]" : "border-slate-100 bg-white"}`}>
                    <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className={`text-sm font-black ${isDark ? "text-white" : "text-slate-950"}`}>{stat}</p>
                      <p className={`mt-1 text-sm font-medium leading-5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- AI SECTION ---------- */}
        <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
          <div className={`relative overflow-hidden rounded-3xl border p-8 sm:p-12 ${t.aiBox}`}>
            {isDark && <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" aria-hidden="true" />}
            <div className="relative">
              <div className="flex items-center justify-center gap-2">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${t.aiIconBg}`}>
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className={`text-xs font-black uppercase tracking-widest ${t.aiLabel}`}>AI built in, not bolted on</span>
              </div>
              <h2 className="mx-auto mt-5 max-w-2xl text-center text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                Five places AI does the work so you don't have to.
              </h2>
              <p className={`mx-auto mt-4 max-w-xl text-center text-base font-semibold leading-7 ${t.aiPara}`}>
                Every AI feature runs on your actual workspace data — no generic advice, no hallucinated numbers.
              </p>

              <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { Icon: ListChecks,    title: "Ranked action feed",  text: `Every open task — disputes, thin-margin routes, missing data, overdue reminders — ranked by dollar impact and urgency into one "Do this now" list. No digging.` },
                  { Icon: Upload,        title: "AI Intake",           text: "Drop a claim email, route sheet, or notes. AI reads it, pulls out the fields that matter, and routes the draft to Claims or Expenses for one-tap review — no manual entry." },
                  { Icon: TriangleAlert, title: "Claim risk scoring",  text: "Each open claim gets an AI score: dispute viability, dollar impact, and evidence gaps. Know exactly which chargebacks are worth fighting — and what it's going to take to win." },
                  { Icon: MessageSquare, title: "Ask the business",    text: "Powered by Claude. Ask anything about your profit, claims, or operations in plain English and get a direct answer — grounded in your actual snapshot data, not a generic template." },
                  { Icon: Bot,           title: "AI dispute packets",  text: "For claims worth fighting, AI builds the full dispute packet — evidence checklist, missing gaps, dispute angle. Submit once, correctly, instead of losing by default because the paperwork was too hard.", span: "sm:col-span-2 lg:col-span-1" },
                ].map(({ Icon, title, text, span = "" }) => (
                  <div key={title} className={`flex flex-col gap-4 rounded-2xl border p-6 backdrop-blur ${t.aiCard} ${span}`}>
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${t.aiIconBg}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className={`text-base font-black ${t.aiCardTitle}`}>{title}</h3>
                      <p className={`mt-2 text-sm font-medium leading-6 ${t.aiCardText}`}>{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- SPLIT: bullets + screenshot ---------- */}
        <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Run cleaner final-mile operations.</h2>
              <p className={`mt-3 max-w-lg text-base font-semibold ${t.sectionSub}`}>Know where the money went, catch profit leaks, and decide before the route — not after.</p>
              <ul className="mt-8 space-y-6">
                {FEATURES.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-4">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ${t.featureIcon}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className={`text-base font-black ${t.featureTitle}`}>{title}</h3>
                      <p className={`mt-1 text-sm font-medium leading-6 ${t.featureText}`}>{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:sticky lg:top-24">
              <BrowserFrame src={frameRouteProfit} alt="Profitability dashboard showing revenue, net profit, average margin, and claims exposure per contract" />
              <p className={`mt-4 text-center text-sm font-semibold ${t.featureSub}`}>Route Profit Check — know if the route pays before you say yes.</p>
            </div>
          </div>
        </section>

        {/* ---------- TABBED GALLERY ---------- */}
        <section className="mx-auto max-w-6xl px-5 pb-16 lg:px-8 lg:pb-24">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">A look inside</h2>
            <p className={`mx-auto mt-3 max-w-xl text-base font-semibold ${t.sectionSub}`}>Six screens that keep the business honest.</p>
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
                  : `rounded-full border px-4 py-2 text-sm font-bold transition ${t.tabInactive}`}
              >
                {g.name}
              </button>
            ))}
          </div>
          <div role="tabpanel" id="gallery-panel" aria-labelledby={`gallery-tab-${tab}`} className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <BrowserFrame key={active.name} src={active.img} alt={active.alt} />
            <div>
              <h3 className={`text-2xl font-black tracking-tight ${t.galleryTitle}`}>{active.name}</h3>
              <p className={`mt-3 text-base font-semibold leading-7 ${t.galleryDesc}`}>{active.desc}</p>
              <div className={`mt-5 flex items-start gap-2.5 rounded-2xl border p-4 ${t.galleryHelps}`}>
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <p className="text-sm font-bold">{active.helps}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- BUILT FOR CONTRACTORS ---------- */}
        <section className="mx-auto max-w-5xl px-5 pb-16 lg:px-8 lg:pb-24">
          <div className={`rounded-3xl border p-8 text-center backdrop-blur sm:p-12 ${t.contractorsBox}`}>
            <h2 className="mx-auto max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              Built for final-mile contractors, not spreadsheet archaeologists.
            </h2>
            <p className={`mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 ${t.contractorsPara}`}>
              Owners and managers can see what is making money, what is leaking margin, which claims need attention, and
              which routes are worth keeping.
            </p>
          </div>
        </section>

        {/* ---------- CLOSING CTA ---------- */}
        <section className="mx-auto max-w-6xl px-5 pb-20 lg:px-8">
          <div className={`overflow-hidden rounded-3xl border p-8 text-center sm:p-14 ${t.ctaBox}`}>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Ready to stop guessing where the money went?</h2>
            <p className={`mx-auto mt-3 max-w-xl text-base font-semibold ${t.ctaPara}`}>Sign in and let the numbers do the talking while you run the routes.</p>
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
                className={`flex items-center justify-center gap-2 rounded-xl border px-8 py-3.5 text-base font-bold backdrop-blur transition ${t.ctaSec}`}
              >
                Set up your company first <ArrowUpRight className="h-5 w-5" />
              </a>
            </div>
          </div>
          <p className={`mt-8 flex items-center justify-center gap-2 text-center text-xs font-semibold ${t.footer}`}>
            <TrendingUp className="h-3.5 w-3.5" /> Last Mile Margin — margin protection for final-mile delivery contractors.
          </p>
        </section>
      </div>
    </div>
  );
}
