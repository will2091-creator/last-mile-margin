import { useEffect, useRef, useState } from "react";
import lastMileMarginLogo from "../assets/last-mile-margin-logo-transparent.svg";
import lastMileMarginLogoDark from "../assets/last-mile-margin-logo-transparent-dark.svg";
import loginRoadLakeTruck from "../assets/login-road-lake-truck-branded.jpg";
import FeatureShowcase from "./FeatureShowcase";
import { ArrowRight, Building2, CheckCircle2, Clock, Eye, EyeOff, Lock, Mail, ShieldCheck, X } from "lucide-react";

function LoginPage({ onLogin, onSignUp, isDark, setAppSettings }) {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [loginForm, setLoginForm] = useState({ identifier: "", password: "", remember: false });
  const [signupForm, setSignupForm] = useState({ email: "", password: "", confirm: "", companyName: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupDone, setSignupDone] = useState(null); // null | { needsConfirmation, email }
  const firstFieldRef = useRef(null);
  const cardRef = useRef(null);
  const triggerRef = useRef(null);

  const toggleTheme = () => {
    setAppSettings((current) => ({
      ...current,
      themeMode: current.themeMode === "dark" ? "light" : "dark",
    }));
  };

  const openModal = (startMode = "signin") => {
    triggerRef.current = document.activeElement;
    setFormError("");
    setMode(startMode);
    setSignupDone(null);
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const switchMode = (next) => {
    setFormError("");
    setSignupDone(null);
    setShowPassword(false);
    setShowConfirm(false);
    setMode(next);
    setTimeout(() => firstFieldRef.current?.focus(), 60);
  };

  // Focus trap + Escape + scroll lock
  useEffect(() => {
    if (!showModal) return;
    const focusTimer = setTimeout(() => firstFieldRef.current?.focus(), 60);
    const onKey = (event) => {
      if (event.key === "Escape") { closeModal(); return; }
      if (event.key === "Tab" && cardRef.current) {
        const nodes = cardRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
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
  }, [showModal]);

  const handleSignIn = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    const result = await onLogin({ identifier: loginForm.identifier, password: loginForm.password });
    setIsSubmitting(false);
    if (!result?.ok) setFormError(result?.error || "Could not sign in. Check your email and password.");
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setFormError("");
    if (signupForm.password !== signupForm.confirm) {
      setFormError("Passwords don't match.");
      return;
    }
    if (signupForm.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    setIsSubmitting(true);
    const result = await onSignUp({
      email: signupForm.email.trim(),
      password: signupForm.password,
      companyName: signupForm.companyName.trim(),
    });
    setIsSubmitting(false);
    if (!result?.ok) {
      setFormError(result?.error || "Could not create account. Please try again.");
      return;
    }
    if (result.needsConfirmation) {
      setSignupDone({ needsConfirmation: true, email: result.email });
    }
    // needsConfirmation: false → App re-renders logged-in automatically
  };

  // Shared style tokens
  const inputClass = isDark
    ? "w-full rounded-xl border border-white/10 bg-slate-950/70 py-3.5 pl-11 pr-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500"
    : "w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-500";
  const inputNoIconClass = isDark
    ? "w-full rounded-xl border border-white/10 bg-slate-950/70 py-3.5 px-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500"
    : "w-full rounded-xl border border-slate-200 bg-white py-3.5 px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-500";
  const cardClass = isDark
    ? "border-white/10 bg-slate-950/95 text-white shadow-2xl shadow-black/60"
    : "border-white/60 bg-white text-slate-950 shadow-2xl shadow-slate-950/30";
  const labelClass = isDark ? "mb-2 block text-sm font-black text-white" : "mb-2 block text-sm font-black text-slate-950";
  const mutedText = isDark ? "text-slate-400" : "text-slate-600";
  const closeBtn = isDark
    ? "absolute right-4 top-4 rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:bg-white/10"
    : "absolute right-4 top-4 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-100";

  return (
    <>
      <FeatureShowcase isDark={isDark} onSignIn={() => openModal("signin")} onSignUp={() => openModal("signup")} onToggleTheme={toggleTheme} />

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <div
            aria-hidden="true"
            onClick={closeModal}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `linear-gradient(rgba(2,6,23,0.85), rgba(2,6,23,0.9)), url(${loginRoadLakeTruck})` }}
          />

          <section ref={cardRef} className={`relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border p-6 sm:p-7 ${cardClass}`}>
            <button type="button" onClick={closeModal} aria-label="Close" className={closeBtn}>
              <X className="h-4 w-4" />
            </button>

            {/* Logo + mode tabs */}
            <div className="mb-6 text-center">
              <img
                src={isDark ? lastMileMarginLogoDark : lastMileMarginLogo}
                alt="Last Mile Margin"
                className="mx-auto h-20 w-44 object-contain sm:h-24 sm:w-52"
              />

              {/* Sign in / Create account tabs */}
              {!signupDone && (
                <div className={`mt-4 flex rounded-xl p-1 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                  {[["signin", "Sign in"], ["signup", "Create account"]].map(([m, label]) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => switchMode(m)}
                      className={`flex-1 rounded-lg py-2 text-sm font-black transition ${
                        mode === m
                          ? isDark ? "bg-blue-600 text-white shadow" : "bg-white text-slate-950 shadow"
                          : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── EMAIL CONFIRMATION STATE ── */}
            {signupDone?.needsConfirmation && (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                </div>
                <h2 id="auth-modal-title" className="text-xl font-black">Check your email</h2>
                <p className={`mt-2 text-sm ${mutedText}`}>
                  We sent a confirmation link to <span className="font-bold">{signupDone.email}</span>. Click it to activate your account, then come back and sign in.
                </p>
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white hover:bg-blue-500"
                >
                  Go to sign in <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ── SIGN IN FORM ── */}
            {!signupDone && mode === "signin" && (
              <>
                <h1 id="auth-modal-title" className="sr-only">Sign in to your workspace</h1>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label htmlFor="login-identifier" className={labelClass}>Email</label>
                    <div className="relative">
                      <Mail className={`absolute left-4 top-3.5 h-5 w-5 ${mutedText}`} />
                      <input
                        ref={firstFieldRef}
                        id="login-identifier"
                        value={loginForm.identifier}
                        onChange={(e) => setLoginForm((c) => ({ ...c, identifier: e.target.value }))}
                        className={inputClass}
                        placeholder="you@example.com"
                        type="email"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="login-password" className={labelClass}>Password</label>
                    <div className="relative">
                      <Lock className={`absolute left-4 top-3.5 h-5 w-5 ${mutedText}`} />
                      <input
                        id="login-password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm((c) => ({ ...c, password: e.target.value }))}
                        className={`${inputClass} pr-12`}
                        placeholder="Your password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className={`absolute right-4 top-3.5 ${mutedText}`}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className={`flex items-center gap-3 text-sm font-semibold ${mutedText}`}>
                      <input
                        checked={loginForm.remember}
                        onChange={(e) => setLoginForm((c) => ({ ...c, remember: e.target.checked }))}
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormError("Password reset can be enabled in Supabase Auth after the production email sender is configured.")}
                      className={`text-sm font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {formError && (
                    <div role="alert" className={isDark ? "rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-300" : "rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-600"}>
                      {formError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-70 ${isDark ? "bg-blue-600 hover:bg-blue-500" : "bg-slate-950 hover:bg-slate-800"}`}
                  >
                    {isSubmitting ? "Signing in…" : "Sign in"}
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className={`rounded-xl p-3 text-xs ${isDark ? "bg-white/5 text-slate-400" : "bg-slate-50 text-slate-600"}`}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <p className="font-bold">Secure Supabase login is enabled.</p>
                    </div>
                  </div>
                </form>

                <p className={`mt-5 text-center text-sm ${mutedText}`}>
                  No account?{" "}
                  <button type="button" onClick={() => switchMode("signup")} className={`font-bold ${isDark ? "text-blue-400 hover:underline" : "text-blue-600 hover:underline"}`}>
                    Create one free →
                  </button>
                </p>
              </>
            )}

            {/* ── COMING SOON (sign-up disabled) ── */}
            {!signupDone && mode === "signup" && (
              <div className="py-4 text-center">
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${isDark ? "bg-blue-500/10" : "bg-blue-50"}`}>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
                <h2 id="auth-modal-title" className="mt-5 text-2xl font-black tracking-tight">
                  Coming Soon
                </h2>
                <p className={`mt-3 text-sm font-semibold leading-relaxed ${mutedText}`}>
                  We're putting the finishing touches on sign-ups.<br />
                  Check back very soon — it's almost ready.
                </p>

                <div className={`mt-6 rounded-2xl border p-4 text-left ${isDark ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50"}`}>
                  <p className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>When sign-ups open</p>
                  <ul className="mt-3 space-y-2">
                    {[
                      "3-day free trial, card required",
                      "$99/month — locked for your first 12 months",
                      "Full AI-powered profit & claims tools",
                    ].map((item) => (
                      <li key={item} className={`flex items-start gap-2.5 text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-sm font-black transition ${isDark ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                >
                  Already have an account? Sign in →
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

export default LoginPage;
