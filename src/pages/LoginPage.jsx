import { useState } from "react";
import loginRoadLakeTruck from "../assets/login-road-lake-truck-branded.png?truck-logo-liftgate";
import lastMileMarginLogo from "../assets/last-mile-margin-logo-transparent.svg";
import lastMileMarginLogoDark from "../assets/last-mile-margin-logo-transparent-dark.svg";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";

function LoginPage({ onLogin, isDark, setAppSettings }) {
  const [loginForm, setLoginForm] = useState({
    identifier: "william.mckoy",
    password: "",
    remember: true,
  });
  const [showPassword, setShowPassword] = useState(false);
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
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-lg items-center px-5 py-10 lg:px-8">
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
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={isDark ? "mb-2 block text-sm font-black text-white" : "mb-2 block text-sm font-black text-slate-950"}>Username or Email</label>
              <div className="relative">
                <Mail className={isDark ? "absolute left-4 top-3.5 h-5 w-5 text-slate-400" : "absolute left-4 top-3.5 h-5 w-5 text-slate-500"} />
                <input
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
              <label className={isDark ? "mb-2 block text-sm font-black text-white" : "mb-2 block text-sm font-black text-slate-950"}>Password</label>
              <div className="relative">
                <Lock className={isDark ? "absolute left-4 top-3.5 h-5 w-5 text-slate-400" : "absolute left-4 top-3.5 h-5 w-5 text-slate-500"} />
                <input
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
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-600">
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
                <p className="font-bold">Real Supabase login is enabled.</p>
              </div>
              <p className="mt-2">Use your owner username after the Supabase Auth user is created.</p>
            </div>
          </form>
        </section>
      </main>

      </div>
    </div>
  );
}

export default LoginPage;
