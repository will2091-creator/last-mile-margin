# Contractor Launch Hub — Build Plan

**Decision (2026-06-07):** Standalone product, **separate repo**, pointed at the **same Supabase project** as Final Mile Margin (`eptoyxshbwglnnklqebl`), with **shared accounts and auto-SSO** that funnels a contractor into FMM once setup is complete.

Source of truth today: the single-file prototype `contractor-launch-hub.html` (~4,200 lines) + brand SVGs. Fully client-side, localStorage-backed, no auth. This plan turns it into a real product.

---

## The core architectural insight

**Launch Hub is where accounts are born; FMM inherits them.**

- FMM login today is effectively closed (a `usernameEmailMap` of known users in `src/App.jsx`). It assumes the account already exists and a workspace is already provisioned.
- Launch Hub must do real **signup** (email verification, password reset) for strangers, then provision the shared records so that when they cross over, FMM "just works."
- Therefore FMM needs a **one-time change**: accept any authenticated user and auto-provision their workspace (a `profiles` row, a default `app_state`, and an `owner` row in `team_memberships`) on first sign-in. Without this, a CLH-originated user lands in FMM with no workspace.

Everything else hangs off that.

---

## Phase 0 — Lock two decisions (no code)

1. **Domain strategy.** Recommend one parent domain with subdomains:
   - `launch.finalmilemargin.com` → Contractor Launch Hub
   - `app.finalmilemargin.com` → Final Mile Margin

   Subdomains of a shared parent are what make **auto-SSO clean** (a session cookie scoped to `.finalmilemargin.com` is readable by both). If they end up on unrelated domains, SSO falls back to a token-handoff redirect (works, slightly less seamless). This choice drives Phase 7.
2. **Confirm same Supabase project** (yes per decision) → CLH reuses `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` for project `eptoyxshbwglnnklqebl`.

---

## Phase 1 — Scaffold the new repo

Mirror FMM's toolchain so the two products feel like siblings and code can be shared:

- Vite + React 19, `lucide-react`, `framer-motion` (already used in the prototype's visual language).
- Copy FMM's `src/lib/supabaseClient.js` singleton pattern verbatim (same env var names, same project).
- Hash-based tab routing like FMM (the prototype already switches pages by hash — keep that model, no react-router).
- Drop in the existing `brand/*.svg`.
- New Vercel project, same Supabase env vars.

**Bulk of the work lives here:** porting the prototype's 10 screens from vanilla-JS string templates to React components. Split the prototype's two halves:
- **Pure data** (lessons, 75-step curriculum, checklist categories, form seeds, template seeds, official sources, state resources) → lift almost verbatim into `src/data/*.js` modules. This is the valuable, correct content; don't rewrite it.
- **Render functions** (`renderDashboard`, `renderLearning`, etc.) → React components consuming that data.

> **Free win:** the React rewrite eliminates the prototype's unescaped-`innerHTML` XSS exposure — React escapes interpolated values by default. No separate fix needed.

---

## Phase 2 — Auth (the front door)

- Supabase Auth **email/password** (matches FMM) **plus a real signup flow**: email verification, password reset. This is net-new vs. FMM, which only logs in.
- On signup, create the shared `profiles` row immediately so the identity exists for both apps.
- Reuse FMM's `onAuthStateChange` session-persistence pattern for protected routes.

---

## Phase 3 — Data model (new tables, same project, owner-scoped RLS)

Follow FMM's **hybrid** pattern (jsonb blob for freeform progress + normalized tables for things that need files/queries). Prefix everything `clh_` to keep it cleanly separated from FMM's tables in the shared DB.

- **`clh_launch_state`** (jsonb, mirrors FMM's `app_state`): the wizard step, checklist completion map, lesson progress, business/operation/insurance profile. One row per user, `owner_id` + RLS. Fast to build, flexible as content evolves.
- **`clh_documents`** (normalized, mirrors FMM's `documents`): real document metadata + `file_path` into Storage. RLS owner-scoped.
- **`clh_reminders`** (normalized): so reminders can later drive real notifications.
- **Completion flag:** `launch_complete boolean` + `launch_completed_at timestamptz` on the state row — this is what the funnel (Phase 7) reads.

All tables: `owner_id uuid references auth.users`, RLS enabled, owner-only CRUD — copy FMM's existing policy SQL.

---

## Phase 4 — Document Vault with real storage

Replace the prototype's "uploads are simulated" stub with a real **`clh-documents` Storage bucket**:
- Owner-scoped RLS, path `{user.id}/{timestamp}-{uuid}.{ext}`, signed URLs for viewing.
- Copy FMM's `src/lib/documentRepository.js` almost verbatim.

---

## Phase 5 — Content gaps (parallelizable, content not code)

1. **50-state filing URLs.** The prototype's `stateResources` has 8 states and every URL is an empty placeholder — yet "use your official state site directly" is the core value prop. Populate Secretary of State / business-registration / tax / state-DOT URLs for all 50 states. This is research-heavy and can run in parallel with the build.
2. **"Ask" feature.** Today it's a keyword if/else ladder. v1 can ship as-is (it's decent and personalized). v2: wire it to a real model — FMM already depends on `openai`, or use Claude — with the canned answers as fallback. Rename to "Guidance/Next Step" if it stays keyword-based, so it doesn't over-promise a chatbot.

---

## Phase 6 — The funnel + auto-SSO handoff

1. **Define "complete."** Decide the completion criteria (e.g. all *required* checklist items done, or a defined milestone set). Flip `launch_complete` when met.
2. **Handoff UX:** on completion, surface "Continue to Final Mile Margin."
3. **Auto-SSO mechanism** (depends on Phase 0):
   - **Shared-parent subdomains (recommended):** configure a cookie-based session storage adapter scoped to `.finalmilemargin.com`. Same session is valid on both subdomains → user lands in FMM already signed in.
   - **Separate domains (fallback):** redirect to FMM carrying the session, FMM route calls `supabase.auth.setSession()` to adopt it. Single-use, robust, slightly less magical.
4. **FMM-side provisioning change** (the critical dependency from the top): on first sign-in of a user with no workspace, auto-create `profiles` + default `app_state` + an `owner` `team_memberships` row, and stop gating login on the `usernameEmailMap`. Without this, the funnel dead-ends.

---

## Phase 7 — Deploy & verify

- CLH on its Vercel project + subdomain, FMM provisioning change shipped, end-to-end test: **sign up in CLH → complete setup → land in FMM logged in with a working empty workspace.**

---

## Risks / things to watch

- **FMM provisioning change is on the critical path.** The funnel cannot work until FMM accepts and provisions brand-new accounts. Plan this FMM-side work alongside CLH, not after.
- **Shared DB hygiene.** Two products in one Supabase project — the `clh_` prefix + strict RLS keeps them isolated, but every CLH table must have RLS from day one (the data is now multi-user, unlike the prototype).
- **Migration scope.** The React port of 10 content-rich screens is the largest single chunk of effort. The data lifts cleanly; the UI is the work.
- **Completion definition is a product decision**, not a technical one — needs your call before Phase 6.

---

## Suggested build order

1. Phase 0 decisions → 2. Scaffold + port data modules → 3. Auth/signup → 4. Tables + RLS → 5. Vault storage → (parallel: state-URL content) → 6. FMM provisioning change → 7. SSO handoff → 8. Deploy + E2E test.
