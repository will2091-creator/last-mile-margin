import loginRoadLakeTruck from "../assets/login-road-lake-truck-branded.jpg";
import lastMileMarginLogoDark from "../assets/last-mile-margin-logo-transparent-dark.svg";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Camera,
  ClipboardCheck,
  FileText,
  Mic,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: Sparkles,
    accent: "from-blue-500 to-indigo-500",
    title: "“Do this now” command center",
    blurb:
      "Your whole workspace, ranked into one to-do list. Claims to dispute, margins slipping, photos missing, documents expiring — prioritized by the dollars at stake, with one tap to act.",
  },
  {
    icon: FileText,
    accent: "from-rose-500 to-orange-500",
    title: "AI Dispute Engine",
    blurb:
      "Turn chargebacks into recovered dollars. Generate a sendable dispute letter from any claim in seconds — and it learns from the angles that won you money before.",
  },
  {
    icon: ShieldCheck,
    accent: "from-emerald-500 to-teal-500",
    title: "Proactive Watchdog",
    blurb:
      "An AI that watches your numbers so you don’t have to. It connects a margin drop to a thin route, flags the high-risk claim, and tells you the single most important move.",
  },
  {
    icon: TrendingUp,
    accent: "from-violet-500 to-fuchsia-500",
    title: "Margin Forecast",
    blurb:
      "See where you’re headed before the month is over. Project profit and margin to month-end from your real run-rate and know if you’ll clear your target.",
  },
  {
    icon: BriefcaseBusiness,
    accent: "from-indigo-500 to-blue-500",
    title: "Contract Go / No-Go",
    blurb:
      "Know if a route pays before you commit. AI predicts a new contract’s profit from your own cost structure and gives a clear go, caution, or no-go — with the pay you’d need to hit target.",
  },
  {
    icon: Bot,
    accent: "from-sky-500 to-cyan-500",
    title: "Ask Copilot",
    blurb:
      "An assistant that acts, not just answers. Ask it anything about your business and it’ll draft the disputes, open the claim, set a reminder, or log your day for you.",
  },
  {
    icon: Mic,
    accent: "from-amber-500 to-orange-500",
    title: "Zero-friction capture",
    blurb:
      "Speak it, snap it, done. Talk through your day and AI fills the numbers. Photograph damage or a receipt and AI drafts the claim or logs the expense — no typing required.",
  },
  {
    icon: ClipboardCheck,
    accent: "from-teal-500 to-emerald-500",
    title: "Claims, teams & compliance",
    blurb:
      "The operational backbone. Track dispute readiness and evidence, team route photos, insurance and DOT documents — all in one place, all feeding the AI.",
  },
];

export default function FeatureShowcase({ onClose }) {
  return (
    <div className="relative min-h-screen overflow-y-auto bg-slate-950 text-white">
      {/* Hero backdrop photo — only behind the top of the page, fading into dark. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-cover bg-center" style={{ backgroundImage: `url(${loginRoadLakeTruck})` }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-gradient-to-b from-slate-950/75 via-slate-950/88 to-slate-950" />
      <div className="relative">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/60 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 lg:px-8">
            <img src={lastMileMarginLogoDark} alt="Last Mile Margin" className="h-10 w-auto object-contain" />
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
            >
              Sign in <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-5 pb-12 pt-16 text-center lg:px-8 lg:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-blue-300 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> The AI leader in final-mile logistics
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Protect every dollar of margin —{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">automatically.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-300">
            Last Mile Margin is the AI command center for delivery contractors. It watches your numbers, recovers your
            deductions, vets your contracts, and tells you exactly what to do next.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-black text-white shadow-xl shadow-blue-600/30 transition hover:-translate-y-0.5 hover:bg-blue-500"
            >
              Sign in to your workspace <ArrowRight className="h-5 w-5" />
            </button>
            <a
              href="https://contractor-launch-hub.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-base font-bold text-slate-100 backdrop-blur transition hover:bg-white/10"
            >
              New? Start your company →
            </a>
          </div>
        </section>

        {/* The moat / thesis strip */}
        <section className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-6 text-center backdrop-blur sm:p-8">
            <p className="text-base font-bold leading-7 text-slate-200 sm:text-lg">
              Every day you log sharpens the predictions. The AI learns from <span className="text-white">your</span> wins, costs,
              and disputes — a data flywheel no competitor can copy.
            </p>
          </div>
        </section>

        {/* Highlights grid */}
        <section className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Everything inside</h2>
            <p className="mx-auto mt-3 max-w-xl text-base font-semibold text-slate-400">
              AI in every decision loop — not bolted on, built in.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHTS.map(({ icon: Icon, title, blurb, accent }) => (
              <div
                key={title}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg`}>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-black tracking-tight text-white">{title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-300">{blurb}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-6xl px-5 pb-20 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-slate-950 p-8 text-center sm:p-12">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Ready to stop leaking margin?</h2>
            <p className="mx-auto mt-3 max-w-xl text-base font-semibold text-slate-300">
              Sign in and let the AI run the back office while you run the routes.
            </p>
            <button
              onClick={onClose}
              className="mx-auto mt-7 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-black text-white shadow-xl shadow-blue-600/30 transition hover:-translate-y-0.5 hover:bg-blue-500"
            >
              Sign in <ArrowRight className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-8 text-center text-xs font-semibold text-slate-500">
            Last Mile Margin — AI margin protection for final-mile delivery contractors.
          </p>
        </section>
      </div>
    </div>
  );
}
