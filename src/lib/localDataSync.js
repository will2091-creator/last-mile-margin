// Several features keep their data in this browser's localStorage: contracts,
// contract charge rules, imports, compliance docs, receipts, and reminders. On
// their own those never reached the user's account, so switching devices or
// clearing the browser silently lost them. App bundles them into the synced
// app_state blob (as `localData`) and writes them back on sign-in.
//
// It also remembers which account the browser's data belongs to, so a second
// person signing in on the same computer starts clean instead of inheriting
// (and uploading) the previous user's workspace.

export const SYNCED_LOCAL_KEYS = [
  "finalMileRollupRows", // contracts
  "finalMileContractChargeRules",
  "finalMileContractCustomCharges",
  "finalMileOnboardingImports",
  "finalMileComplianceDocs",
  "finalMileReceipts",
  "finalMileReminders",
];

const OWNER_KEY = "finalMileLocalOwner";
// Keys that describe the browser session, not a user's workspace.
const KEEP_ON_SWITCH = new Set(["finalMileLoggedIn", OWNER_KEY]);

const safeGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export function readSyncedLocalData() {
  const data = {};
  for (const key of SYNCED_LOCAL_KEYS) {
    const raw = safeGet(key);
    if (raw === null) continue;
    try {
      data[key] = JSON.parse(raw);
    } catch {
      /* skip unreadable entries */
    }
  }
  return data;
}

// Cheap change detector: the raw strings of every synced key.
export function syncedLocalFingerprint() {
  return SYNCED_LOCAL_KEYS.map((key) => safeGet(key) ?? "").join("\u0001");
}

// Writes the account's copy into localStorage. Returns true if anything changed,
// so the caller knows mounted pages need to re-read.
export function applySyncedLocalData(localData) {
  if (!localData || typeof localData !== "object") return false;
  let changed = false;
  for (const key of SYNCED_LOCAL_KEYS) {
    if (!Object.hasOwn(localData, key)) continue;
    const next = JSON.stringify(localData[key]);
    if (safeGet(key) === next) continue;
    try {
      localStorage.setItem(key, next);
      changed = true;
    } catch {
      /* ignore quota */
    }
  }
  return changed;
}

// Claims this browser's local data for `userId`. If it belonged to a different
// account, wipes that workspace first and returns true. Data with no recorded
// owner (saved before this existed) is adopted by whoever signs in first.
export function claimLocalDataFor(userId) {
  if (!userId) return false;
  const previousOwner = safeGet(OWNER_KEY);
  let switched = false;
  if (previousOwner && previousOwner !== userId) {
    try {
      const keys = [];
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key?.startsWith("finalMile") && !KEEP_ON_SWITCH.has(key)) keys.push(key);
      }
      keys.forEach((key) => localStorage.removeItem(key));
    } catch {
      /* ignore */
    }
    switched = true;
  }
  try {
    localStorage.setItem(OWNER_KEY, userId);
  } catch {
    /* ignore */
  }
  return switched;
}
