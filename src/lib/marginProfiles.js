// Per-company margin profiles.
//
// The workspace has a global margin-factor config (appSettings.marginFactors).
// Owners can also define company-specific overrides keyed by customer name in
// appSettings.companyMarginProfiles. resolveCompanyMarginFactors() picks the
// right one for a given route/company, ALWAYS falling back to the global config
// so anything without a company-specific profile behaves exactly as before.

const CONTRACT_STORAGE_KEY = "finalMileContracts";

// Unique customer/company names from the user's saved contracts. Used to
// populate the company selector in Settings → Margin Factors.
export function readCompanyNames() {
  if (typeof window === "undefined") return [];
  try {
    const rows = JSON.parse(window.localStorage.getItem(CONTRACT_STORAGE_KEY) || "[]");
    const names = (Array.isArray(rows) ? rows : [])
      .map((r) => (r && typeof r.customer === "string" ? r.customer.trim() : ""))
      .filter((name) => name && !/customer name needed/i.test(name));
    return [...new Set(names)];
  } catch {
    return [];
  }
}

// Resolve the margin-factor config to use for a route/company.
// `context` can be a company name ("Lowe's") or a free-text route/scenario name
// ("Lowe's Appliance Delivery") — we match a configured company whose name
// appears in it. Falls back to the global config when there's no match.
export function resolveCompanyMarginFactors(appSettings, context) {
  const globalFactors = appSettings?.marginFactors || {};
  const profiles = appSettings?.companyMarginProfiles || {};
  if (!context || !profiles || typeof profiles !== "object") return globalFactors;

  // Exact match first
  if (profiles[context]) return profiles[context];

  // Fuzzy: a configured company name that appears in the route/scenario name
  const haystack = String(context).toLowerCase();
  const match = Object.keys(profiles).find((company) => company && haystack.includes(company.toLowerCase()));
  return match ? profiles[match] : globalFactors;
}
