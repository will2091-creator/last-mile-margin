// Error monitoring — Sentry, loaded only when VITE_SENTRY_DSN is configured.
//
// The SDK is dynamically imported so it ships as a separate chunk that is never
// fetched for deployments without a DSN (the default). Set VITE_SENTRY_DSN in
// the environment to turn it on; nothing else changes.

let sentry = null;

export async function initErrorReporting() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || sentry) return;
  try {
    const Sentry = await import("@sentry/react");
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || "production",
      // Conservative defaults — error reporting only, no session replay/profiling
      // unless explicitly turned up later.
      tracesSampleRate: 0,
      sendDefaultPii: false,
    });
    sentry = Sentry;
  } catch (err) {
    // Monitoring must never break the app.
    console.warn("Error reporting failed to initialize:", err);
  }
}

// Report a caught error. No-op until Sentry is initialized (or if no DSN).
export function reportError(error, context) {
  if (!sentry) return;
  try {
    sentry.captureException(error, context ? { extra: context } : undefined);
  } catch {
    /* swallow — never let reporting throw */
  }
}
