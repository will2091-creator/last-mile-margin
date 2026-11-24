import { useEffect, useState } from "react";

// Form state for a public tool. Starts from a shared link (?field=value) if there is
// one, else the numbers this visitor entered last time (localStorage), else defaults.
// Nothing is sent anywhere: the link is only built when the visitor copies it.
//
// Field values are strings, booleans, or arrays of strings (encoded "a,b" in links).

export function useToolState(storageKey, defaults) {
  const [values, setValues] = useState(() => readInitial(storageKey, defaults));

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(values));
    } catch {
      // Private mode / storage full: the tool still works, it just won't remember.
    }
  }, [storageKey, values]);

  // Drop the shared-link fields from the address bar once they're loaded, so a
  // reload shows the visitor's own edits rather than the original link.
  useEffect(() => {
    const url = new URL(window.location.href);
    let changed = false;
    for (const key of Object.keys(defaults)) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (changed) window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    // Run once on load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const reset = () => setValues({ ...defaults });
  const shareUrl = () => buildShareUrl(values, defaults);

  return { values, set, reset, shareUrl };
}

function coerce(raw, fallback) {
  if (typeof fallback === "boolean") return raw === "1" || raw === "true";
  if (Array.isArray(fallback)) return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20) : [];
  return String(raw).slice(0, 40);
}

function readInitial(storageKey, defaults) {
  if (typeof window === "undefined") return { ...defaults };

  const params = new URLSearchParams(window.location.search);
  const fromLink = {};
  for (const [key, fallback] of Object.entries(defaults)) {
    if (params.has(key)) fromLink[key] = coerce(params.get(key), fallback);
  }
  if (Object.keys(fromLink).length) return { ...defaults, ...fromLink };

  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) || "null");
    if (saved && typeof saved === "object") {
      const kept = {};
      for (const [key, fallback] of Object.entries(defaults)) {
        const value = saved[key];
        const sameShape = Array.isArray(fallback) ? Array.isArray(value) : typeof value === typeof fallback;
        if (sameShape) kept[key] = value;
      }
      return { ...defaults, ...kept };
    }
  } catch {
    // Corrupt or blocked storage: fall back to defaults.
  }
  return { ...defaults };
}

function buildShareUrl(values, defaults) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    const fallback = defaults[key];
    if (Array.isArray(value)) {
      if (value.join(",") !== (fallback || []).join(",")) params.set(key, value.join(","));
    } else if (typeof value === "boolean") {
      if (value !== fallback) params.set(key, value ? "1" : "0");
    } else if (String(value) !== String(fallback)) {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ""}`;
}
