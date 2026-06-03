# Core Workflow QA Run - June 3, 2026

This is the first one-by-one pass through `docs/core-workflow-checklist.md`.

Status key:

- Pass: verified by code/build or existing working UI behavior.
- Partial: exists, but needs more real-world/manual testing.
- Mocked: works as a frontend/local mock only.
- Needs Backend: needs database, file storage, auth, or server production wiring.
- Not Tested: cannot be honestly marked complete in this pass.
- Needs Fix: found a concrete issue.

Baseline:

- Pass: `npm run build` completed successfully after the audit.
- Needs Fix: `npm run lint` fails with many existing lint issues. One real React hook ordering issue in AI Intake was fixed during this pass.
- Partial: browser/manual click testing was limited in this pass; the results below are mostly code/build verified.

## 1. Ask My Business

| Checklist item | Status | Notes |
| --- | --- | --- |
| Ask a plain-English business question. | Pass | Ask form calls `askBusiness`. |
| Ask works with typos, like "bread even." | Pass | Local fallback explicitly checks `bread even`. |
| Answer uses current claims, teams, profitability, contracts, and settings data. | Partial | Uses claims, teams, profitability, saved days, and dashboard widget settings. Contract-specific data is lighter. |
| Answer gives a short summary and useful next actions. | Pass | Returns title, summary, actions, and tab. |
| "Open" button sends the user to the correct page. | Pass | Calls `navigateToTab(latest.tab)`. |
| Recent questions save and show the question asked. | Pass | Conversation state stores recent questions. |
| OpenAI backend answers when `OPENAI_API_KEY` is configured. | Not Tested | Endpoint exists, but no API key is configured in this environment. |
| Local fallback answers when OpenAI is unavailable. | Pass | Verified API fallback response exists and UI has local fallback. |
| Real question: break even. | Pass | Covered by local fallback intent. |
| Real question: claim to dispute first. | Partial | Logic exists, needs real claim email examples. |
| Real question: team costing the most. | Pass | Uses team exposure rollup. |
| Real question: why profit is down. | Partial | Uses profitability snapshot, needs real route scenarios. |
| Real question: risky contract. | Partial | Generic contract answer exists, needs actual contract data integration. |

## 2. AI Intake

| Checklist item | Status | Notes |
| --- | --- | --- |
| User can paste a claim email. | Pass | Textarea intake and claim sample exist. |
| User can paste route sheet data. | Pass | Route sheet sample and parser exist. |
| User can paste contract terms. | Pass | Contract sample and parser exist. |
| User can attach/upload a file. | Partial | File input/drop works for placeholders; no real OCR/storage yet. |
| Analyze creates the right draft type. | Pass | Local parser separates claim, route, contract, and file. |
| Mixed notes create multiple drafts only when needed. | Partial | Logic guards false positives; needs more real mixed examples. |
| Claim draft saves to Claims. | Pass | `onAddClaim` path exists. |
| Route draft fills Profitability. | Pass | `onApplyRoute` path exists. |
| Contract draft saves to Contracts. | Pass | Saves `finalMileContractImportDraft`. |
| Saved intake appears in daily history or activity. | Partial | Save-to-day exists; recent intake is component-local, not global activity. |
| AI result shows confidence and missing evidence. | Pass | Draft confidence and claim intelligence panel exist. |
| Empty/unclear input gives helpful message. | Pass | Fallback message exists. |
| Real claim email tested. | Not Tested | Needs a real user example. |
| Real route sheet tested. | Not Tested | Needs a real user example. |
| Real contract/rate card tested. | Not Tested | Needs a real user example. |
| Screenshot/PDF placeholder tested. | Partial | Placeholder support exists; real OCR does not. |

## 3. Claims Workflow

| Checklist item | Status | Notes |
| --- | --- | --- |
| New claim can be created manually. | Pass | `+ Add Claim` form and `saveClaim` exist. |
| New claim can be created from Intake. | Pass | Intake calls `onAddClaim`. |
| Claim appears in Needs Review. | Pass | Under Review maps to Needs Review board. |
| Claim can move to In Progress. | Pass | Drag/drop and review actions set status to Open. |
| Claim can move to Resolved. | Pass | Closed maps to Resolved. |
| Claim amount updates dashboard exposure. | Pass | Claims are app state and dashboard uses same claims array. |
| Claim risk updates based on amount/settings. | Partial | Risk helper exists; manual overrides also exist. Needs threshold QA. |
| Claim preventability is clear. | Pass | Preventable field/filter exists. |
| Missing evidence is visible. | Pass | Claims intelligence includes missing evidence insight. |
| Dispute-ready claims are easy to identify. | Pass | Worth disputing metric and dispute packet actions exist. |
| Full claim log shows all claims. | Pass | Full Claim Log toggle exists. |
| Claim can be edited. | Pass | Edit form exists. |
| Claim can be deleted when needed. | Pass | Delete action and confirmation exist. |
| Real property damage claim tested. | Partial | Mock data covers wall damage; real example not tested. |
| Real cargo damage claim tested. | Partial | Mock data covers product damage; real example not tested. |
| Real penalty/missed window tested. | Not Tested | Needs real example. |
| Real missing evidence claim tested. | Partial | Mock missing photos are represented. |

## 4. Profitability Workflow

| Checklist item | Status | Notes |
| --- | --- | --- |
| User can enter route revenue. | Pass | Route profit fields exist. |
| User can enter labor costs. | Pass | Labor inputs exist. |
| User can enter fuel/truck/insurance/maintenance costs. | Pass | Cost inputs exist. |
| User can enter claims/chargeback reserve. | Pass | Claims/chargeback cost exists. |
| Net profit calculates correctly. | Partial | Formula builds; needs hand-checked real scenarios. |
| Margin percent calculates correctly. | Partial | Formula builds; needs hand-checked real scenarios. |
| Negative profit numbers show red. | Pass | Recent request implemented. |
| Positive profit numbers show green. | Pass | Recent request implemented. |
| Route can be saved. | Pass | Saved scenarios exist. |
| Saved route appears in history. | Pass | Saved scenarios list exists. |
| Intake route draft fills calculator correctly. | Pass | `applyRouteDraft` updates route fields. |
| Ask My Business can answer break-even using these numbers. | Pass | Uses `results.totalCost` and `results.totalRevenue`. |
| Real profitable route tested. | Not Tested | Needs real route data. |
| Real losing route tested. | Not Tested | Needs real route data. |
| Real high-mileage route tested. | Not Tested | Needs real route data. |
| Real high-labor route tested. | Not Tested | Needs real route data. |

## 5. Daily Dashboard Workflow

| Checklist item | Status | Notes |
| --- | --- | --- |
| Dashboard loads correct current page after refresh. | Pass | Hash routing reads current URL on load. |
| Day/Week/Month/Qtr/Year selector changes metrics. | Pass | Period multiplier drives cards. |
| Day Net Profit readable in light/dark. | Pass | Uses green value class. |
| Day Revenue readable in light/dark. | Pass | Dark-mode color was fixed to blue. |
| Day Claims reflects current exposure. | Pass | Uses claims exposure. |
| Day Costs reflects route cost inputs. | Pass | Uses dashboard revenue minus profit/snapshot costs. |
| Widgets can be rearranged in Settings. | Pass | Dashboard order controls exist. |
| Hidden widgets stay hidden. | Pass | Dashboard checks `widgets[key] !== false`. |
| Dashboard presets work. | Pass | Preset functions exist. |
| Save Snapshot saves current day. | Pass | `saveCurrentDay` writes saved day state/local storage. |
| Daily History can reload saved snapshots. | Pass | `loadSavedDay` exists. |
| Main dashboard buttons navigate correctly. | Partial | Code routes exist; needs manual click sweep. |

## 6. Document Vault / Compliance Workflow

| Checklist item | Status | Notes |
| --- | --- | --- |
| User can upload documents from Document Vault. | Pass | Upload button/file input added. |
| Uploaded document appears at top of vault. | Pass | Uploaded docs are prepended. |
| Uploaded document can be categorized. | Pass | Category dropdown updates local storage. |
| Category counts update. | Pass | Counts derive from vault documents. |
| Document status is visible. | Pass | Status badge is shown. |
| Expiration date is visible. | Pass | Expiration column is shown. |
| Expiring documents are flagged. | Pass | Expiring Soon status styling exists. |
| Missing documents are flagged. | Pass | Missing status styling exists. |
| Expired documents are flagged. | Pass | Expired status styling exists. |
| Document preview opens. | Pass | Row/View opens preview modal. |
| Compliance Risk Panel reflects document status. | Pass | Fixed during this pass so the panel reads the same local vault document state as the table. |
| Real COI tested. | Not Tested | Needs real document. |
| Real cargo insurance tested. | Not Tested | Needs real document. |
| Real DOT inspection tested. | Not Tested | Needs real document. |
| Real driver medical card tested. | Not Tested | Needs real document. |
| Real W-9/EIN/LLC tested. | Not Tested | Needs real document. |
| Real rate card tested. | Not Tested | Needs real document. |

## 7. Contracts Workflow

| Checklist item | Status | Notes |
| --- | --- | --- |
| Contract can be selected. | Pass | Contract selector/list exists. |
| All Contracts view works. | Pass | `ALL` view exists. |
| Contract rates are visible. | Pass | Rates tab and rate cards exist. |
| Contract margin is visible. | Pass | Margin display exists. |
| Contract risk is visible. | Pass | Risk display exists. |
| Contract claims exposure is visible. | Pass | Claims exposure rollup exists. |
| Intake contract draft saves to Contracts. | Pass | Contract import draft local storage flow exists. |
| Contract can send user to related Claims. | Pass | `navigateToTab("Claims")` action exists. |
| Contract can send user to Profitability. | Pass | Route profit handoff exists. |
| Real flat route pay tested. | Partial | Mock data exists; real rate card not tested. |
| Real per-stop pay tested. | Partial | Mock/config data exists; real rate card not tested. |
| Real install/accessorial pay tested. | Partial | Fields exist; real rate card not tested. |
| Real renewal date tested. | Partial | Mock renewal dates exist. |

## 8. Teams / Driver Workflow

| Checklist item | Status | Notes |
| --- | --- | --- |
| Team list shows active teams. | Pass | Teams dashboard renders people/team data. |
| Driver and helper data are visible. | Pass | Lead/helper rollups exist. |
| Photo status is visible. | Pass | Photo status fields and badges exist. |
| Team compliance score is visible. | Pass | Compliance score is displayed. |
| Claims roll up to right team/driver. | Pass | Claim driver/team rollup logic exists. |
| At-risk teams are easy to identify. | Pass | At Risk status and metrics exist. |
| Team photo upload/readiness flow works. | Partial | Status update flow exists; real photo file storage not backend-backed. |
| Team details connect back to Claims and Compliance. | Partial | Rollups exist; direct navigation is limited. |
| Real missing photo tested. | Partial | Mock missing photo represented. |
| Real high exposure driver tested. | Partial | Mock exposure represented. |
| Real at-risk team tested. | Partial | Mock at-risk status represented. |
| Real clean team tested. | Partial | Mock healthy status represented. |

## 9. Settings Workflow

| Checklist item | Status | Notes |
| --- | --- | --- |
| Theme mode changes full app. | Pass | App settings control light/dark. |
| Accent color changes key UI elements. | Partial | Accent preview/settings exist; not all UI consumes accent. |
| Dashboard widgets can be shown/hidden. | Pass | Toggles exist. |
| Dashboard widgets can be reordered. | Pass | Up/down controls exist. |
| Dashboard layout presets work. | Pass | Preset buttons exist. |
| Claim risk thresholds change risk behavior. | Partial | Settings exist; needs full claim-risk QA. |
| Settings persist after refresh. | Pass | Settings are stored in local storage. |
| Settings do not break pages in dark mode. | Partial | Recent dark-mode issues found/fixed; needs full scan. |
| Settings understandable to non-technical user. | Partial | Some wording is good; still needs polish pass. |

## 10. Reports Workflow

| Checklist item | Status | Notes |
| --- | --- | --- |
| Reports summarize claims, teams, and profitability. | Pass | Report cards/insights use app data. |
| Filters work. | Pass | Visible reports/exports are filtered. |
| Export buttons do what they say or clearly state mock behavior. | Partial | Downloads TXT; wording is clear, but export is frontend-only. |
| Report activity appears in Recent Activity where expected. | Mocked | Dashboard recent activity is static, not connected to report export events. |
| Reports navigate back to source pages. | Partial | Reports have previews/downloads, but limited source navigation. |
| Real profitability report tested. | Not Tested | Needs real export review. |
| Real claims report tested. | Not Tested | Needs real export review. |
| Real compliance report tested. | Not Tested | Needs real export review. |
| Real team performance report tested. | Not Tested | Needs real export review. |

## 11. Button And Navigation Sweep

| Checklist item | Status | Notes |
| --- | --- | --- |
| Every sidebar tab opens correct page. | Pass | Nav array maps each tab to slug. Ask is second tab. |
| Every "Open" button opens correct page. | Partial | Main code paths are present; needs manual click pass. |
| Every "View" button opens useful detail view. | Partial | Many do; some report/dashboard views are broad navigation. |
| Every "Save" button saves something visible. | Partial | Major saves do; needs manual sweep. |
| Every "Upload" button opens file picker/upload area. | Pass | Intake and Document Vault upload controls exist. |
| Every "Analyze" button creates result or clear error. | Pass | Intake Analyze has fallback/error messaging. |
| Every "Reset" button only resets intended section. | Partial | Claim filters/settings resets exist; needs manual sweep. |
| Every delete action clear/reversible where needed. | Partial | Claims/scenarios have confirmation; team delete needs manual check. |
| Refresh keeps user on same page. | Pass | Hash routing implemented. |
| Mobile-size layout does not overlap/hide key controls. | Not Tested | Needs viewport screenshots after desktop lock-in. |

## 12. Backend Readiness

| Checklist item | Status | Notes |
| --- | --- | --- |
| Decide database provider. | Not Started | Needed before production/mobile. |
| Add user accounts/auth. | Not Started | Current login is demo/local. |
| Store claims in backend. | Needs Backend | Current storage is local browser storage. |
| Store teams/drivers in backend. | Needs Backend | Current storage is local browser storage. |
| Store route/day snapshots in backend. | Needs Backend | Current storage is local browser storage. |
| Store settings per company/user. | Needs Backend | Current storage is local browser storage. |
| Store uploaded documents in backend file storage. | Needs Backend | Current upload stores metadata only. |
| Connect OpenAI through secure server endpoints. | Partial | Dev endpoint exists; needs production server/deployment. |
| Add audit log for key changes. | Not Started | Needed for real business use. |
| Add role permissions. | Not Started | Needed for admin/driver separation. |
| Add backup/export plan. | Not Started | Needed before production. |

## 13. Mobile App Readiness

| Checklist item | Status | Notes |
| --- | --- | --- |
| Web core workflows are locked. | Not Yet | This QA pass shows several partial/backend items. |
| Backend storage is chosen. | Not Started | Decide before mobile build. |
| User roles are defined. | Not Started | Needed for mobile scope. |
| Mobile-first feature list finalized. | Partial | Suggested list exists: dashboard, intake, upload, claims, Ask. |
| Driver/admin workflows separated. | Not Started | Needed before mobile app. |
| Upload/photo workflow tested on phone screens. | Not Tested | Needs mobile viewport QA. |
| AI Intake works with mobile file/photo input. | Not Tested | Needs device/mobile browser test. |
| Claims review works on mobile. | Not Tested | Needs mobile viewport QA. |
| Daily dashboard works on mobile. | Not Tested | Needs mobile viewport QA. |
| Ask My Business works on mobile. | Not Tested | Needs mobile viewport QA. |

## Issues Found During This Pass

1. Fixed: AI Intake called `useMemo` after an early collapsed-state return. The hook now runs before the early return.
2. Fixed: Compliance Risk Panel now reads the same local vault documents as the table, so uploaded/local document status can affect the score.
3. Needs Fix: Recent Activity is still mock/static and does not record report exports, document uploads, or all saves.
4. Needs Fix: Lint has many existing issues. The highest-signal categories are unused imports, server `process` globals, React hook dependency warnings, and shared exports triggering Fast Refresh warnings.
5. Needs Backend: Uploaded documents currently save metadata in local storage, not real file content.
6. Needs Backend: Claims, teams, settings, scenarios, and daily snapshots are local browser storage.

## Recommended Next Fix Order

1. Add a small global activity log for saves, uploads, exports, and claim status changes.
2. Do a manual click-through button sweep on Dashboard, Intake, Claims, Compliance, Reports, and Settings.
3. Decide backend provider and file storage before calling the app production/mobile-ready.
4. Run mobile viewport screenshots for Dashboard, Ask, Intake, Claims, and Document Vault.
