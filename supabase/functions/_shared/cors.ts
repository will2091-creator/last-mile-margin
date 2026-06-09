// Shared CORS handling for the browser-facing edge functions.
//
// Restricts Access-Control-Allow-Origin to known app origins instead of "*".
// Override the allowlist with the ALLOWED_ORIGINS secret (comma-separated);
// the defaults are the production domains. Native callers (the mobile app)
// send no Origin header and aren't subject to CORS, so they're unaffected.

const DEFAULT_ORIGINS = [
  "https://finalmilemargin.com",
  "https://www.finalmilemargin.com",
  "https://last-mile-margin.vercel.app",
];

function allowedOrigins(): string[] {
  const fromEnv = (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_ORIGINS;
}

// Returns CORS headers echoing the request's origin when it's allowed (plus
// localhost for dev), otherwise the first configured origin.
export function corsHeadersFor(req: Request): Record<string, string> {
  const list = allowedOrigins();
  const origin = req.headers.get("Origin") || "";
  const isLocalhost = /^http:\/\/localhost(:\d+)?$/.test(origin);
  const allowOrigin = list.includes(origin) || isLocalhost ? origin : list[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
