// The only value routed through signup and email confirmation is an opaque draft ID.
const prefix = "lmm.pending-tool.v1.";
const lifetime = 7 * 86400000;
const validId = (value) => /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value || "");

export function readDraft(id) {
  if (!validId(id)) return null;
  try {
    const draft = JSON.parse(localStorage.getItem(prefix + id));
    if (draft?.id === id && draft.expires > Date.now()) return draft;
    localStorage.removeItem(prefix + id);
  } catch { /* Storage unavailable or draft expired. */ }
  return null;
}

export function editingDraft() {
  const id = new URLSearchParams(location.search).get("editResult");
  const draft = readDraft(id);
  return draft && location.pathname.replace(/\/$/, "") === "/tools/" + draft.source && !draft.owner ? draft : null;
}

export function pruneDrafts() {
  try {
    Object.keys(localStorage).filter(key => key.startsWith(prefix)).forEach(key => readDraft(key.slice(prefix.length)));
  } catch { /* Free tools also work without persistent storage. */ }
}

export function visitId(source) {
  const key = "lmm.tool-visit." + source;
  let id = sessionStorage.getItem(key);
  if (!validId(id)) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function prepareDraft(source, payload, example) {
  pruneDrafts();
  const visit = visitId(source);
  const previous = readDraft(sessionStorage.getItem(prefix + source));
  if (previous && JSON.stringify(previous.payload) === JSON.stringify(payload)) return previous;
  const draft = { id: crypto.randomUUID(), source, visit, payload, example, expires: Date.now() + lifetime };
  localStorage.setItem(prefix + draft.id, JSON.stringify(draft));
  sessionStorage.setItem(prefix + source, draft.id);
  return draft;
}

export function bindDraft(id, userId) {
  const draft = readDraft(id);
  if (!draft || (draft.owner && draft.owner !== userId)) throw new Error("Open the draft in the original browser and account.");
  localStorage.setItem(prefix + id, JSON.stringify({ ...draft, owner: userId }));
}

export function forgetDraft(id) { localStorage.removeItem(prefix + id); }

export function resumeId() {
  const id = new URLSearchParams(location.search).get("resume");
  return validId(id) ? id : null;
}

export function returnUrl() {
  const id = resumeId();
  return location.origin + (id ? "/?resume=" + id : "/");
}
