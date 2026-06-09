import { Camera, CheckCircle2, ClipboardCheck, Clock, Eye, ImageUp, ShieldCheck, Smartphone } from "lucide-react";

/**
 * MobileShowcase — advertises the Final Mile Margin companion mobile app on the
 * landing page. The phone screens are faithful JSX reproductions of the real
 * Expo app (mobile/src/screens), using the app's actual dark palette so the
 * preview is true product UI, not a stock mockup. The screen interiors stay
 * dark (the app mirrors the web dark theme); only the surrounding section text
 * themes with `isDark`.
 */

// Mobile app dark palette (mobile/src/theme.js → palettes.dark)
const C = {
  bg: "#020617",
  card: "#0f172a",
  ink: "#f8fafc",
  muted: "#94a3b8",
  border: "rgba(255,255,255,0.10)",
  blue: "#60a5fa",
  green: "#34d399",
  red: "#f87171",
  amber: "#fbbf24",
};
const tone = { green: C.green, blue: C.blue, amber: C.amber, red: C.red, ink: C.ink };

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-1.5 text-[11px] font-bold" style={{ color: C.ink }}>
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        {/* signal */}
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><rect x="0" y="6" width="2.5" height="4" rx="0.5" fill="currentColor"/><rect x="4" y="4" width="2.5" height="6" rx="0.5" fill="currentColor"/><rect x="8" y="2" width="2.5" height="8" rx="0.5" fill="currentColor"/><rect x="12" y="0" width="2.5" height="10" rx="0.5" fill="currentColor"/></svg>
        {/* wifi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none"><path d="M7.5 9.5l1.8-2.2a2.3 2.3 0 00-3.6 0L7.5 9.5z" fill="currentColor"/><path d="M3.4 5.4a6 6 0 018.2 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M1.2 3a9 9 0 0112.6 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
        {/* battery */}
        <svg width="24" height="11" viewBox="0 0 24 11" fill="none"><rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor" strokeOpacity="0.5"/><rect x="2" y="2" width="16" height="7" rx="1.5" fill="currentColor"/><rect x="21.5" y="3.5" width="1.5" height="4" rx="0.75" fill="currentColor"/></svg>
      </div>
    </div>
  );
}

function AppHeader({ title, subtitle }) {
  return (
    <div className="flex items-center gap-2.5 px-4 pb-3 pt-1">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}>
        <Smartphone className="h-3.5 w-3.5 text-white" />
      </div>
      <div>
        <p className="text-[15px] font-black leading-none" style={{ color: C.ink }}>{title}</p>
        <p className="mt-1 text-[10px] font-semibold leading-none" style={{ color: C.muted }}>{subtitle}</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, note, t }) {
  return (
    <div className="rounded-2xl border p-3" style={{ background: C.card, borderColor: C.border }}>
      <p className="text-[9.5px] font-bold uppercase tracking-wide" style={{ color: C.muted }}>{label}</p>
      <p className="mt-1.5 text-[17px] font-black leading-none" style={{ color: tone[t] }}>{value}</p>
      <p className="mt-1.5 text-[9.5px] font-semibold" style={{ color: C.muted }}>{note}</p>
    </div>
  );
}

function TabBar({ items, active }) {
  return (
    <div className="mt-auto flex items-center justify-around border-t px-2 pb-5 pt-2.5" style={{ borderColor: C.border, background: C.bg }}>
      {items.map((label) => {
        const on = label === active;
        return (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: on ? C.blue : C.muted, opacity: on ? 1 : 0.4 }} />
            <span className="text-[8.5px] font-bold" style={{ color: on ? C.ink : C.muted }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Owner "Command" dashboard — mirrors HomeScreen owner view ── */
function OwnerScreen() {
  return (
    <>
      <StatusBar />
      <AppHeader title="Command" subtitle="Profit, risk, approvals" />
      <div className="flex-1 overflow-hidden px-4">
        <div className="grid grid-cols-2 gap-2.5">
          <MetricCard label="Today's Profit" value="$574.29" note="Jun 8, 2026" t="green" />
          <MetricCard label="Revenue" value="$2,091.37" note="Contract money" t="blue" />
          <MetricCard label="Expenses" value="$1,517.08" note="Labor & route" t="amber" />
          <MetricCard label="Claims Exposure" value="$2,350" note="3 open" t="red" />
        </div>

        <p className="mt-4 mb-2 text-[10.5px] font-black uppercase tracking-wide" style={{ color: C.muted }}>Needs Attention</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-2xl border p-3" style={{ background: C.card, borderColor: "rgba(248,113,113,0.25)" }}>
            <div>
              <p className="text-[11.5px] font-black" style={{ color: C.ink }}>3 Claims Need Review</p>
              <p className="mt-0.5 text-[9.5px] font-semibold" style={{ color: C.muted }}>Money at risk</p>
            </div>
            <p className="text-[13px] font-black" style={{ color: C.red }}>$2,350</p>
          </div>
          <div className="flex items-center justify-between rounded-2xl border p-3" style={{ background: C.card, borderColor: "rgba(251,191,36,0.25)" }}>
            <div>
              <p className="text-[11.5px] font-black" style={{ color: C.ink }}>2 Receipts Await Approval</p>
              <p className="mt-0.5 text-[9.5px] font-semibold" style={{ color: C.muted }}>Expense decisions</p>
            </div>
            <p className="text-[13px] font-black" style={{ color: C.amber }}>2</p>
          </div>
        </div>
      </div>
      <TabBar items={["Command", "Claims", "Receipts", "Team", "More"]} active="Command" />
    </>
  );
}

/* ── Driver field-tools view — mirrors HomeScreen driver view ── */
function DriverScreen() {
  const actions = [
    { Icon: ClipboardCheck, title: "Check in for your route", note: "Log your start, truck & route status" },
    { Icon: Camera, title: "Submit an expense receipt", note: "Snap fuel, tolls, or supplies" },
    { Icon: ImageUp, title: "Upload field evidence", note: "Attach a photo to a claim ID" },
  ];
  return (
    <>
      <StatusBar />
      <AppHeader title="Home" subtitle="Check-ins, evidence, receipts" />
      <div className="flex-1 px-4">
        <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: C.blue }}>Driver</p>
        <p className="mt-1 text-[16px] font-black leading-tight" style={{ color: C.ink }}>Your field tools</p>
        <p className="mt-1 text-[10px] font-semibold leading-snug" style={{ color: C.muted }}>Check in, submit receipts, and upload evidence from the field.</p>

        <div className="mt-3.5 space-y-2.5">
          {actions.map(({ Icon, title, note }) => (
            <div key={title} className="flex items-center gap-2.5 rounded-2xl border p-3" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(96,165,250,0.12)" }}>
                <Icon className="h-4 w-4" style={{ color: C.blue }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black leading-tight" style={{ color: C.ink }}>{title}</p>
                <p className="mt-0.5 text-[9px] font-semibold leading-tight" style={{ color: C.muted }}>{note}</p>
              </div>
              <span className="text-[10px] font-black" style={{ color: C.blue }}>Open</span>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-2xl border p-3" style={{ background: C.card, borderColor: C.border }}>
          <p className="text-[10.5px] font-black" style={{ color: C.ink }}>Driver mobile access</p>
          <p className="mt-1 text-[9px] font-semibold leading-snug" style={{ color: C.muted }}>Field tools only. Profit, losses, and claim exposure stay with the owner.</p>
        </div>
      </div>
      <TabBar items={["Home", "Receipts", "Check In"]} active="Home" />
    </>
  );
}

function Phone({ children, className = "", style = {} }) {
  return (
    <div className={`relative ${className}`} style={style}>
      <div className="rounded-[2.6rem] p-2.5 shadow-2xl" style={{ background: "#020617", boxShadow: "0 30px 60px -20px rgba(2,6,23,0.65)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="relative flex h-[560px] w-[268px] flex-col overflow-hidden rounded-[2.1rem]" style={{ background: C.bg }}>
          {/* notch */}
          <div className="absolute left-1/2 top-2 z-10 h-5 w-28 -translate-x-1/2 rounded-full" style={{ background: "#000" }} />
          {children}
        </div>
      </div>
    </div>
  );
}

export default function MobileShowcase({ isDark }) {
  const sub = isDark ? "text-slate-400" : "text-slate-500";
  const featTitle = isDark ? "text-white" : "text-slate-950";
  const featText = isDark ? "text-slate-400" : "text-slate-600";
  const badge = isDark ? "border-white/15 bg-white/5 text-blue-300" : "border-blue-200 bg-blue-50 text-blue-700";

  const features = [
    { Icon: Eye, title: "Role-aware by design", text: "Owners see profit, risk, and approvals. Drivers see only field tools — never your margin." },
    { Icon: ClipboardCheck, title: "Check in from the cab", text: "Start-of-route check-ins with truck and route status, logged in seconds." },
    { Icon: Camera, title: "Snap receipts on the spot", text: "Fuel, tolls, supplies — photographed and submitted from the field instantly." },
    { Icon: ShieldCheck, title: "Evidence that wins disputes", text: "Drivers attach field photos to a claim ID straight from the phone." },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
      <div className="mb-10 text-center">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${badge}`}>
          <Smartphone className="h-3.5 w-3.5" /> Companion mobile app
        </span>
        <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Run it from the cab</h2>
        <p className={`mx-auto mt-3 max-w-xl text-base font-semibold ${sub}`}>
          Your whole operation in your pocket. Owners track profit and risk; drivers check in, snap receipts, and upload evidence — all from the field.
        </p>
      </div>

      <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
        {/* Phones */}
        <div className="relative flex justify-center lg:justify-start">
          <Phone className="z-10" style={{ transform: "rotate(-3deg)" }}>
            <OwnerScreen />
          </Phone>
          <Phone className="hidden sm:block" style={{ transform: "rotate(4deg) translateX(-36px) translateY(28px) scale(0.92)" }}>
            <DriverScreen />
          </Phone>
        </div>

        {/* Feature bullets */}
        <div>
          <div className="space-y-6">
            {features.map(({ Icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ${isDark ? "from-blue-500/20 to-indigo-500/10 text-blue-300 ring-white/10" : "from-blue-100 to-indigo-50 text-blue-600 ring-blue-200"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={`text-base font-black ${featTitle}`}>{title}</h3>
                  <p className={`mt-1 text-sm font-semibold leading-6 ${featText}`}>{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-600/30">
              <Clock className="h-4 w-4" /> iOS &amp; Android — coming soon
            </span>
            <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${featText}`}>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> One login, both apps
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
