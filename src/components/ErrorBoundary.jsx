import React from "react";
import logo from "../assets/last-mile-margin-logo.png";
import logoDark from "../assets/last-mile-margin-logo-darkmode.png";

// The boundary can render before the themed app shell mounts, so read the
// persisted theme straight from localStorage rather than threading isDark down.
function readDarkMode() {
  try {
    const raw = localStorage.getItem("finalMileSettings");
    return raw ? JSON.parse(raw).themeMode === "dark" : false;
  } catch {
    return false;
  }
}

// Catches render-time errors so a single bad component never blanks the whole
// app. `variant="screen"` is a full-page recovery (root); `variant="page"`
// is a compact card for an individual dashboard so the shell stays usable.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Surface for debugging; in production this is where you'd report to Sentry.
    console.error("ErrorBoundary caught an error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isPage = this.props.variant === "page";
    const isDark = readDarkMode();
    const detail =
      typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV
        ? String(this.state.error?.stack || this.state.error || "")
        : "";

    const card = (
      <div className={`w-full max-w-md rounded-2xl border p-8 text-center shadow-card ${isDark ? "border-white/10 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <img src={isDark ? logoDark : logo} alt="Last Mile Margin" className="mx-auto h-14 w-32 object-contain" />
        <h1 className={`mt-5 text-xl font-black ${isDark ? "text-white" : "text-slate-950"}`}>
          {isPage ? "This section hit a snag" : "Something went wrong"}
        </h1>
        <p className={`mt-2 text-sm font-semibold leading-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {isPage
            ? "We stopped rendering this page to keep the rest of the app working. Your saved data is safe."
            : "We hit an unexpected error and paused to keep your data safe. Your saved numbers are intact — reloading usually fixes it."}
        </p>
        <button
          onClick={isPage ? this.handleTryAgain : this.handleReload}
          className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
        >
          {isPage ? "Try again" : "Reload Last Mile Margin"}
        </button>
        {detail && (
          <pre className={`mt-4 max-h-40 overflow-auto rounded-lg p-3 text-left font-mono text-[11px] leading-5 ${isDark ? "bg-slate-950 text-red-400" : "bg-slate-50 text-red-600"}`}>
            {detail}
          </pre>
        )}
      </div>
    );

    if (isPage) {
      return <div className="flex min-h-[50vh] items-center justify-center p-4">{card}</div>;
    }

    return (
      <div className={`flex min-h-screen items-center justify-center p-6 ${isDark ? "bg-slate-950" : "bg-slate-100"}`}>{card}</div>
    );
  }
}
