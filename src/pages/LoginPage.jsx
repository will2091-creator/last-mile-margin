import { useEffect, useRef, useState } from "react";
import lastMileMarginLogo from "../assets/last-mile-margin-logo-transparent.svg";
import lastMileMarginLogoDark from "../assets/last-mile-margin-logo-transparent-dark.svg";
import loginRoadLakeTruck from "../assets/login-road-lake-truck-branded.jpg";
import FeatureShowcase from "./FeatureShowcase";
import { supabase } from "../lib/supabaseClient";
import { ArrowRight, Bell, Building2, CheckCircle2, Clock, Eye, EyeOff, Lock, Mail, ShieldCheck, X } from "lucide-react";

// ── Coming Soon panel with waitlist email capture ──────────────────────────
function ComingSoon({ isDark, mutedText, onSignIn }) {
  const [email, setEmail]     = useState("");
  const [status, setStatus]   = useState("idle"); // idle | submitting | done | error
  const [errMsg, setErrMsg]   = useState("");

  const handleNotify = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("submitting");
    setErrMsg("");
    try {
      const { error } = await supabase.from("waitlist").insert({ email: email.trim().toLowerCase() });
      if (error) {
        // Unique constraint = already on the list — treat as success
        if (error.code === "23505") { setStatus("done"); return; }
        throw error;
      }
      setStatus("done");
    } catch (err) {
      setErrMsg("Couldn't save your email right now. Try again in a moment.");
      setStatus("error");
    }
  };

  const inputClass = isDark
    ? "flex-1 min-w-0 rounded-xl border border-white/10 bg-slate-950/70 py-3 pl-10 pr-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 placeholder:text-slate-500"
    : "flex-1 min-w-0 rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-500 placeholder:text-slate-400";

  return (
    <div className="py-4 text-center">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${isDark ? "bg-blue-500/10" : "bg-blue-50"}`}>
        <Clock className="h-8 w-8 text-blue-500" />
      </div>
      <h2 id="auth-modal-title" className="mt-5 text-2xl font-black tracking-tight">
        Coming Soon
      </h2>
      <p className={`mt-3 text-sm font-semibold leading-relaxed ${mutedText}`}>
        We're putting the finishing touches on sign-ups.<br />
        Enter your email and we'll notify you the moment we go live.
      </p>

      {/* Email notify form */}
      {status === "done" ? (
        <div className={`mt-6 flex items-center justify-center gap-2.5 rounded-2xl border py-4 text-sm font-black ${isDark ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          You're on the list — we'll email you when we launch!
        </div>
      ) : (
        <form onSubmit={handleNotify} className="mt-6">
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <Mail className={`absolute left-3 top-3 h-4 w-4 ${mutedText}`} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className={inputClass}
                autoComplete="email"
              />
            </div>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              <Bell className="h-4 w-4" />
              {status === "submitting" ? "Saving…" : "Notify me"}
            </button>
          </div>
          {status === "error" && (
            <p className={`mt-2 text-xs font-bold ${isDark ? "text-red-400" : "text-red-600"}`}>{errMsg}</p>
          )}
        </form>
      )}

      <div className={`mt-5 rounded-2xl border p-4 text-left ${isDark ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50"}`}>
        <p className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>When sign-ups open</p>
        <ul className="mt-3 space-y-2">
          {[
            "3-day free trial",
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
        onClick={onSignIn}
        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-sm font-black transition ${isDark ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
      >
        Already have an account? Sign in →
      </button>
    </div>
  );
}

// Google "G" mark (official 4-color logo)
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 009 18z"/>
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 013.68 9c0-.6.1-1.18.29-1.72V4.94H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.06l3.01-2.34z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 00.96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  );
}

// Flip to true once the Google OAuth provider is configured in Supabase.
// Hidden until then so the button can't error on click.
const GOOGLE_LOGIN_ENABLED = false;

function LoginPage({ onLogin, onSignUp, onGoogleLogin, onResetPassword, isDark, setAppSettings }) {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [loginForm, setLoginForm] = useState({ identifier: "", password: "", remember: false });
  const [signupForm, setSignupForm] = useState({ email: "", password: "", confirm: "", companyName: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState(""); // success/info messages (e.g. reset email sent)
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
    setFormNotice("");
    setMode(startMode);
    setSignupDone(null);
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const switchMode = (next) => {
    setFormError("");
    setFormNotice("");
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
    setFormNotice("");
    const result = await onLogin({ identifier: loginForm.identifier, password: loginForm.password });
    setIsSubmitting(false);
    if (!result?.ok) setFormError(result?.error || "Could not sign in. Check your email and password.");
  };

  const handleGoogle = async () => {
    setFormError("");
    setFormNotice("");
    setIsSubmitting(true);
    const result = await onGoogleLogin?.();
    // On success the browser navigates to Google, so we only reach here on error.
    if (!result?.ok) {
      setIsSubmitting(false);
      setFormError(result?.error || "Could not start Google sign-in. Please try again.");
    }
  };

  const handleForgotPassword = async () => {
    setFormError("");
    setFormNotice("");
    const email = loginForm.identifier.trim();
    if (!email) {
      setFormError("Enter your email above first, then tap “Forgot password.”");
      return;
    }
    setIsSubmitting(true);
    const result = await onResetPassword?.(email);
    setIsSubmitting(false);
    if (result?.ok) {
      // Generic message — don't reveal whether the email has an account.
      setFormNotice("If an account exists for that email, a password reset link is on its way. Check your inbox.");
    } else {
      setFormError(result?.error || "Couldn't send a reset link right now. Please try again.");
    }
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
  const googleBtnClass = isDark
    ? "flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-black text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
    : "flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70";
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
                  {[["signin", "Sign in"], ["signup", "Join the waitlist"]].map(([m, label]) => (
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

                {/* Google sign-in (hidden until the OAuth provider is configured) */}
                {GOOGLE_LOGIN_ENABLED && (
                  <>
                    <button type="button" onClick={handleGoogle} disabled={isSubmitting} className={googleBtnClass}>
                      <GoogleIcon />
                      Continue with Google
                    </button>
                    <div className="my-5 flex items-center gap-3">
                      <span className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>or</span>
                      <span className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
                    </div>
                  </>
                )}

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
                      onClick={handleForgotPassword}
                      disabled={isSubmitting}
                      className={`text-sm font-bold disabled:opacity-60 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {formError && (
                    <div role="alert" className={isDark ? "rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-300" : "rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-600"}>
                      {formError}
                    </div>
                  )}

                  {formNotice && (
                    <div role="status" className={isDark ? "rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-300" : "rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700"}>
                      {formNotice}
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
                      <p className="font-bold">Bank-level encryption. We never see your password.</p>
                    </div>
                  </div>
                </form>

                <p className={`mt-5 text-center text-sm ${mutedText}`}>
                  No account yet?{" "}
                  <button type="button" onClick={() => switchMode("signup")} className={`font-bold ${isDark ? "text-blue-400 hover:underline" : "text-blue-600 hover:underline"}`}>
                    Join the waitlist →
                  </button>
                </p>
              </>
            )}

            {/* ── COMING SOON (sign-up disabled) ── */}
            {!signupDone && mode === "signup" && (
              <ComingSoon isDark={isDark} mutedText={mutedText} onSignIn={() => switchMode("signin")} />
            )}
          </section>
        </div>
      )}
    </>
  );
}

export default LoginPage;
