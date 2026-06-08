import { useState } from "react";
import loginRoadLakeTruck from "../assets/login-road-lake-truck-branded.jpg";
import lastMileMarginLogo from "../assets/last-mile-margin-logo-transparent.svg";
import lastMileMarginLogoDark from "../assets/last-mile-margin-logo-transparent-dark.svg";
import FeatureShowcase from "./FeatureShowcase";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";

function LoginPage({ onLogin, isDark, setAppSettings }) {
  const [loginForm, setLoginForm] = useState({
    identifier: "",
    password: "",
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const panelClass = isDark
    ? "border-white/10 bg-slate-950/82 shadow-2xl shadow-black/40 backdrop-blur-md"
    : "border-white/55 bg-white/88 shadow-2xl shadow-slate-950/20 backdrop-blur-md";
  const inputClass = isDark
    ? "w-full rounded-xl border border-white/10 bg-slate-950/70 py-3.5 pl-11 pr-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500"
    : "w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-500";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setLoginError("");

    const result = await onLogin({
      identifier: loginForm.identifier,
      password: loginForm.password,
    });

    setIsSubmitting(false);

    if (result?.ok) {
      return;
    }

    setLoginError(result?.error || "Could not sign in. Check your username and password.");
  };

  const toggleTheme = () => {
    setAppSettings((current) => ({
      ...current,
      themeMode: current.themeMode === "dark" ? "light" : "dark",
    }));
  };

  if (showFeatures) {
    return <FeatureShowcase isDark={isDark} onClose={() => setShowFeatures(false)} />;
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-slate-950 bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${loginRoadLakeTruck})` }}
    >
      <div className="min-h-screen bg-slate-950/42">
      <button
        onClick={toggleTheme}
        className={
          isDark
            ? "absolute right-5 top-5 rounded-xl border border-white/10 bg-white/5 p-2.5 text-white hover:bg-white/10"
            : "absolute right-5 top-5 rounded-xl border border-white/50 bg-white/80 p-2.5 text-slate-700 shadow-sm backdrop-blur hover:bg-white"
        }
        title="Toggle theme"
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-lg items-center px-5 py-10 lg:max-w-5xl lg:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-2">
          {/* Desktop product teaser — sign-in stays the clear focus; hidden on mobile so the page never feels cluttered */}
          <div className="hidden lg:block">
            <p className="text-xs font-black uppercase tracking-wide text-blue-300">Inside</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-white">
              Profit, claims, contracts, routes, and reports — in one place.
            </h2>
            <p className="mt-3 max-w-md text-sm font-semibold text-slate-200">
              Know where the money went, catch profit leaks, and decide before the route — not after.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                ["Today's Profit", "$356.03", "text-emerald-400"],
                ["Claims Exposure", "$2,600", "text-red-400"],
                ["Demo Margin", "26.5%", "text-emerald-400"],
              ].map(([label, value, tone]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-300">{label}</p>
                  <p className={`mt-1 text-lg font-black ${tone}`}>{value}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowFeatures(true)}
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl border border-blue-400/40 bg-blue-500/15 px-4 py-2.5 text-sm font-black text-white backdrop-blur transition hover:bg-blue-500/25"
            >
              <Sparkles className="h-4 w-4" /> See what's inside
            </button>
            <p className="mt-3 text-[11px] font-semibold text-slate-400">Example demo numbers, not a guarantee.</p>
          </div>

          <section className={`w-full rounded-2xl border p-6 ${panelClass}`}>
          <div className="mb-7 text-center">
            <img
              src={isDark ? lastMileMarginLogoDark : lastMileMarginLogo}
              alt="Last Mile Margin"
              className="mx-auto h-28 w-56 object-contain sm:h-32 sm:w-64"
            />
            <h1 className={isDark ? "mt-5 text-2xl font-black tracking-tight text-white" : "mt-5 text-2xl font-black tracking-tight text-slate-950"}>
              Last Mile Margin
            </h1>
            <p className={isDark ? "mt-2 text-sm font-semibold text-slate-400" : "mt-2 text-sm font-semibold text-slate-600"}>
              Sign in to manage profit, claims, contracts, and daily history.
            </p>
            <button
              type="button"
              onClick={() => setShowFeatures(true)}
              className="mx-auto mt-4 flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-600 transition hover:bg-blue-500/20"
            >
              <Sparkles className="h-3.5 w-3.5" /> See what's inside
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-identifier" className={isDark ? "mb-2 block text-sm font-black text-white" : "mb-2 block text-sm font-black text-slate-950"}>Username or Email</label>
              <div className="relative">
                <Mail className={isDark ? "absolute left-4 top-3.5 h-5 w-5 text-slate-400" : "absolute left-4 top-3.5 h-5 w-5 text-slate-500"} />
                <input
                  id="login-identifier"
                  value={loginForm.identifier}
                  onChange={(event) => setLoginForm((current) => ({ ...current, identifier: event.target.value }))}
                  className={inputClass}
                  placeholder="Enter your username or email"
                  type="text"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className={isDark ? "mb-2 block text-sm font-black text-white" : "mb-2 block text-sm font-black text-slate-950"}>Password</label>
              <div className="relative">
                <Lock className={isDark ? "absolute left-4 top-3.5 h-5 w-5 text-slate-400" : "absolute left-4 top-3.5 h-5 w-5 text-slate-500"} />
                <input
                  id="login-password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  className={`${inputClass} pr-12`}
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className={isDark ? "absolute right-4 top-3.5 text-slate-400" : "absolute right-4 top-3.5 text-slate-500"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className={isDark ? "flex items-center gap-3 text-sm font-semibold text-slate-400" : "flex items-center gap-3 text-sm font-semibold text-slate-600"}>
                <input
                  checked={loginForm.remember}
                  onChange={(event) => setLoginForm((current) => ({ ...current, remember: event.target.checked }))}
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setLoginError("Password reset can be enabled in Supabase Auth after the production email sender is configured.")}
                className="text-sm font-bold text-blue-600"
              >
                Forgot password?
              </button>
            </div>

            {loginError && (
              <div
                role="alert"
                className={
                  isDark
                    ? "rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-300"
                    : "rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-600"
                }
              >
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className={`rounded-xl p-3 text-xs ${isDark ? "bg-white/5 text-slate-400" : "bg-white/65 text-slate-600"}`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <p className="font-bold">Secure Supabase login is enabled.</p>
              </div>
              <p className="mt-2">Enter the email or username connected to your account.</p>
            </div>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Just getting started?{" "}
            <a
              href="https://contractor-launch-hub.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-blue-600 hover:underline"
            >
              Set up your company first →
            </a>
          </p>
        </section>
        </div>
      </main>

      </div>
    </div>
  );
}

export default LoginPage;
