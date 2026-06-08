import { useEffect, useRef, useState } from "react";
import lastMileMarginLogo from "../assets/last-mile-margin-logo-transparent.svg";
import lastMileMarginLogoDark from "../assets/last-mile-margin-logo-transparent-dark.svg";
import loginRoadLakeTruck from "../assets/login-road-lake-truck-branded.jpg";
import FeatureShowcase from "./FeatureShowcase";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, X } from "lucide-react";

function LoginPage({ onLogin, isDark, setAppSettings }) {
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ identifier: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const identifierRef = useRef(null);
  const cardRef = useRef(null);
  const triggerRef = useRef(null);

  const toggleTheme = () => {
    setAppSettings((current) => ({
      ...current,
      themeMode: current.themeMode === "dark" ? "light" : "dark",
    }));
  };

  const openLogin = () => {
    triggerRef.current = document.activeElement;
    setLoginError("");
    setShowLogin(true);
  };
  const closeLogin = () => setShowLogin(false);

  // While the modal is open: focus the first field, trap Tab inside the dialog, close on
  // Escape, lock background scroll, and restore focus to the trigger when it closes.
  useEffect(() => {
    if (!showLogin) return;
    const focusTimer = setTimeout(() => identifierRef.current?.focus(), 60);
    const onKey = (event) => {
      if (event.key === "Escape") {
        setShowLogin(false);
        return;
      }
      if (event.key === "Tab" && cardRef.current) {
        const nodes = cardRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      triggerRef.current?.focus?.();
    };
  }, [showLogin]);

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

  const inputClass = isDark
    ? "w-full rounded-xl border border-white/10 bg-slate-950/70 py-3.5 pl-11 pr-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500"
    : "w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-500";
  const cardClass = isDark
    ? "border-white/10 bg-slate-950/95 text-white shadow-2xl shadow-black/60"
    : "border-white/60 bg-white text-slate-950 shadow-2xl shadow-slate-950/30";

  return (
    <>
      {/* The product preview IS the landing page. Sign-in pops up on demand. */}
      <FeatureShowcase isDark={isDark} onSignIn={openLogin} onToggleTheme={toggleTheme} />

      {showLogin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
        >
          {/* Branded backdrop + dark scrim; click to dismiss */}
          <div
            aria-hidden="true"
            onClick={closeLogin}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `linear-gradient(rgba(2,6,23,0.85), rgba(2,6,23,0.9)), url(${loginRoadLakeTruck})` }}
          />

          <section ref={cardRef} className={`relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border p-6 sm:p-7 ${cardClass}`}>
            <button
              type="button"
              onClick={closeLogin}
              aria-label="Close sign in"
              className={
                isDark
                  ? "absolute right-4 top-4 rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:bg-white/10"
                  : "absolute right-4 top-4 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-100"
              }
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-6 text-center">
              <img
                src={isDark ? lastMileMarginLogoDark : lastMileMarginLogo}
                alt="Last Mile Margin"
                className="mx-auto h-20 w-44 object-contain sm:h-24 sm:w-52"
              />
              <h1 id="login-modal-title" className={isDark ? "mt-3 text-2xl font-black tracking-tight text-white" : "mt-3 text-2xl font-black tracking-tight text-slate-950"}>
                Sign in to your workspace
              </h1>
              <p className={isDark ? "mt-1.5 text-sm font-semibold text-slate-400" : "mt-1.5 text-sm font-semibold text-slate-600"}>
                Manage profit, claims, contracts, and daily history.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-identifier" className={isDark ? "mb-2 block text-sm font-black text-white" : "mb-2 block text-sm font-black text-slate-950"}>Username or Email</label>
                <div className="relative">
                  <Mail className={isDark ? "absolute left-4 top-3.5 h-5 w-5 text-slate-400" : "absolute left-4 top-3.5 h-5 w-5 text-slate-500"} />
                  <input
                    ref={identifierRef}
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
                  className={isDark ? "text-sm font-bold text-blue-400" : "text-sm font-bold text-blue-600"}
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
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-70 ${isDark ? "bg-blue-600 hover:bg-blue-500" : "bg-slate-950 hover:bg-slate-800"}`}
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className={`rounded-xl p-3 text-xs ${isDark ? "bg-white/5 text-slate-400" : "bg-slate-50 text-slate-600"}`}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <p className="font-bold">Secure Supabase login is enabled.</p>
                </div>
                <p className="mt-2">Enter the email or username connected to your account.</p>
              </div>
            </form>

            <p className={isDark ? "mt-5 text-center text-sm text-slate-400" : "mt-5 text-center text-sm text-slate-600"}>
              Just getting started?{" "}
              <a
                href="https://contractor-launch-hub.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className={isDark ? "font-bold text-blue-400 hover:underline" : "font-bold text-blue-600 hover:underline"}
              >
                Set up your company first →
              </a>
            </p>
          </section>
        </div>
      )}
    </>
  );
}

export default LoginPage;
