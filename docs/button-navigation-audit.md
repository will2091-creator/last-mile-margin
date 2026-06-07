# Button and Navigation Audit

Date: June 4, 2026

Scope: web dashboard, grouped web routes, dashboard starter modals, forms, table actions, document vault, reports, Ask, settings, and mobile owner/driver navigation.

## Route Map

| Route | Component | Expected result | Status |
| --- | --- | --- | --- |
| `#/dashboard` | `src/pages/DashboardHome.jsx` | Dashboard command center or blank-workspace starter | Working |
| `#/ask` | `src/pages/AskBusinessDashboard.jsx` | Ask My Business assistant | Working, backend/API dependent for OpenAI answers |
| `#/intake` | `src/components/AiQuickIntake.jsx` | AI intake form and draft review | Working, backend/API dependent for AI extraction |
| `#/operations` | `src/pages/OperationsDashboard.jsx` | Operations Dispatch subtab | Working |
| `#/claims` | `src/pages/OperationsDashboard.jsx` -> `ClaimsDashboard` | Operations page with Claims subtab active | Fixed |
| `#/teams` | `src/pages/OperationsDashboard.jsx` -> `TeamsDashboard` | Operations page with Teams subtab active | Fixed |
| `#/compliance` | `src/pages/OperationsDashboard.jsx` -> `ComplianceDashboard` | Operations page with Compliance subtab active | Fixed |
| `#/finance` | `src/pages/FinanceDashboard.jsx` | Finance page with Profitability subtab active | Working |
| `#/profitability` | `src/pages/FinanceDashboard.jsx` -> `ProfitabilityDashboard` | Finance page with Profitability subtab active | Fixed |
| `#/receipts` | `src/pages/FinanceDashboard.jsx` -> `ReceiptsDashboard` | Finance page with Receipts subtab active | Fixed |
| `#/contracts` | `src/pages/FinanceDashboard.jsx` -> `ContractsDashboard` | Finance page with Contracts subtab active; blank users see first-contract setup panel | Fixed |
| `#/reports` | `src/pages/ReportsDashboard.jsx` | Reports page | Working |
| `#/settings` | `src/pages/SettingsDashboard.jsx` | Settings page | Working |
| Unknown hashes | `src/App.jsx` | Redirects cleanly to `#/dashboard` | Fixed |

## Web App Shell

| Clickable element | File/component | Current action | Expected action | Status |
| --- | --- | --- | --- | --- |
| Light/Dark Mode button | `src/App.jsx`, `src/pages/LoginPage.jsx` | Toggles `appSettings.themeMode` | Toggle app theme | Working |
| Sidebar Dashboard | `src/App.jsx` | `navigateToTab("Dashboard")` | Go to `#/dashboard` and active sidebar state | Working |
| Sidebar Ask | `src/App.jsx` | `navigateToTab("Ask")` | Go to `#/ask` | Working |
| Sidebar Intake | `src/App.jsx` | `navigateToTab("Intake")` | Go to `#/intake` | Working |
| Sidebar Operations | `src/App.jsx` | `navigateToTab("Operations")` | Go to `#/operations` | Working |
| Sidebar Finance | `src/App.jsx` | `navigateToTab("Finance")` | Go to `#/finance` | Working |
| Sidebar Reports | `src/App.jsx` | `navigateToTab("Reports")` | Go to `#/reports` | Working |
| Sidebar Settings | `src/App.jsx` | `navigateToTab("Settings")` | Go to `#/settings` | Working |
| Sign Out | `src/App.jsx` | Clears demo/session state and Supabase auth | Return to login | Working |
| Save Snapshot | `src/App.jsx` | Saves current day snapshot | Add entry to Daily History | Working |
| Daily History dropdown | `src/App.jsx` | Opens saved day list | Show saved days or clean empty state | Working |
| Daily History row | `src/App.jsx` | Loads saved day snapshot | Dashboard reflects selected snapshot | Working |
| Date dropdown | `src/App.jsx` | Opens calendar/range picker | Select date/range | Working |
| Calendar previous/next | `src/App.jsx` | Moves displayed month | Move month | Working |
| Calendar day | `src/App.jsx` | Selects date/range | Update global date range | Working |
| Today / This Week / Done | `src/App.jsx` | Updates/ closes date picker | Working date controls | Working |
| Mobile web bottom nav | `src/App.jsx` | Routes visible tabs | Touch-friendly mobile navigation | Added/fixed |

## Dashboard

| Clickable element | File/component | Current action | Expected action | Status |
| --- | --- | --- | --- | --- |
| Period chips Day/Week/Month/Qtr/Year | `src/pages/DashboardHome.jsx` | Updates dashboard period | Change metric period | Working |
| Open Operations | `src/pages/DashboardHome.jsx` | `navigateToTab("Operations")` | Go to Operations | Working |
| Add Contract | `src/pages/DashboardHome.jsx` | Opens contract modal | Open inline contract form on dashboard | Fixed |
| Add Team | `src/pages/DashboardHome.jsx` | Opens team modal | Open inline team form on dashboard | Working |
| Import Data | `src/pages/DashboardHome.jsx` | Opens import modal | Open inline import form | Working |
| Save Contract | `src/pages/DashboardHome.jsx` | Saves quick contract to local dashboard contract store | Persist contract and update dashboard totals | Fixed |
| Clear for Another | `src/pages/DashboardHome.jsx` | Clears saved contract form | Ready to add another contract | Working |
| Open Profitability | `src/pages/DashboardHome.jsx` | Routes to Finance/Profitability | Show saved contract in finance context | Working |
| Contract modal Close | `src/pages/DashboardHome.jsx` | Closes modal | Close without saving | Working |
| Save Team | `src/pages/DashboardHome.jsx` | Adds team to dashboard/operations state | Persist team in session/app state | Working |
| Open Operations from saved team | `src/pages/DashboardHome.jsx` | Routes to Operations | Show team readiness | Working |
| Import type cards | `src/pages/DashboardHome.jsx` | Selects import type | Set Contract Document/Claim Email/Receipt | Working |
| Save Import | `src/pages/DashboardHome.jsx` | Saves import; claims update claim metrics | Save starter import | Working |
| Open Full Intake | `src/pages/DashboardHome.jsx` | Routes by import type | Open relevant Intake/Operations/Finance area | Working |
| Dashboard metric/cards/View All/View Details | `src/pages/DashboardHome.jsx` | Routes to source page | Go to Claims, Profitability, Teams, Contracts, Reports, Compliance as labeled | Working |
| Blank demo starter buttons | `src/pages/DashboardHome.jsx` | Open starter modals | New account sees no fake data and can start setup | Fixed |
| Business Launch Center next action | `src/pages/DashboardHome.jsx`, `src/components/NextActionCard.jsx` | Opens setup modal or routes to needed tab | Guide user to next setup step | Added |
| Trend empty state | `src/pages/DashboardHome.jsx` | Shows saved-snapshot guidance when no trend exists | Avoid fake May trend history | Fixed |

## Operations

| Clickable element | File/component | Current action | Expected action | Status |
| --- | --- | --- | --- | --- |
| Dispatch subtab | `src/pages/OperationsDashboard.jsx` | `navigateToTab("Operations")` | Show Dispatch and URL `#/operations` | Fixed |
| Claims subtab | `src/pages/OperationsDashboard.jsx` | `navigateToTab("Claims")` | Show Claims and URL `#/claims` | Fixed |
| Teams subtab | `src/pages/OperationsDashboard.jsx` | `navigateToTab("Teams")` | Show Teams and URL `#/teams` | Fixed |
| Compliance subtab | `src/pages/OperationsDashboard.jsx` | `navigateToTab("Compliance")` | Show Compliance and URL `#/compliance` | Fixed |
| Open Claims metric | `src/pages/OperationsDashboard.jsx` | Opens Claims subtab | Route to Claims workflow | Working |
| High Risk metric | `src/pages/OperationsDashboard.jsx` | Opens Claims subtab | Route to Claims workflow | Working |
| Missing Photos metric | `src/pages/OperationsDashboard.jsx` | Opens Teams subtab | Route to Teams workflow | Working |
| Ready Teams metric | `src/pages/OperationsDashboard.jsx` | Opens Compliance subtab | Route to Compliance workflow | Working |
| Open Work | `src/pages/OperationsDashboard.jsx` | Routes to best next subtab | Jump to Claims/Teams/Compliance based on issue | Working |
| Manage Teams | `src/pages/OperationsDashboard.jsx` | Opens Teams subtab | Manage team readiness | Fixed |
| Operations setup empty-state Add Team | `src/pages/OperationsDashboard.jsx` | Routes to Teams subtab | Start dispatch workflow | Added |
| Operations setup Import Claim | `src/pages/OperationsDashboard.jsx` | Routes to Claims subtab | Start claims workflow | Added |
| Dispatch empty-state Add Team | `src/pages/OperationsDashboard.jsx` | Routes to Teams subtab | Add first route team | Added |

## Claims

| Clickable element | File/component | Current action | Expected action | Status |
| --- | --- | --- | --- | --- |
| Import Claim Email | `src/pages/ClaimsDashboard.jsx` | Opens import/drop panel | Import pasted or dropped claim text | Working |
| Add Claim | `src/pages/ClaimsDashboard.jsx` | Opens add claim form | Add claim manually | Fixed for blank accounts |
| Claim filters | `src/pages/ClaimsDashboard.jsx` | Update filtered claims | Filter board/table/intelligence | Working |
| Reset Filters | `src/pages/ClaimsDashboard.jsx` | Clears filters | Show all claims | Working |
| No claims Import Claim Email | `src/pages/ClaimsDashboard.jsx` | Opens claim email import panel | Start claim intake | Added |
| No claims Add Manual Claim | `src/pages/ClaimsDashboard.jsx` | Opens add claim form | Add first claim manually | Added |
| Filtered empty Reset Filters | `src/pages/ClaimsDashboard.jsx` | Clears filters from empty table state | Recover from no-result filters | Added |
| Drag/drop claim email | `src/pages/ClaimsDashboard.jsx` | Reads file/text and extracts draft | Build claim draft | Working with file/text fallback alerts |
| Extract Claim | `src/pages/ClaimsDashboard.jsx` | Parses pasted text into draft | Show editable draft | Working |
| Add to Review Queue | `src/pages/ClaimsDashboard.jsx` | Queues imported draft | Save for review | Fixed to allow Unassigned driver/team |
| Save as Claim | `src/pages/ClaimsDashboard.jsx` | Adds claim to board/table | Persist claim | Fixed to allow Unassigned driver/team |
| Clear Import | `src/pages/ClaimsDashboard.jsx` | Clears import draft/text | Reset import panel | Working |
| Review queued/imported claim | `src/pages/ClaimsDashboard.jsx` | Opens review modal | Review/edit status | Working |
| Dispute Packet | `src/pages/ClaimsDashboard.jsx` | Opens dispute packet modal | Show packet checklist | Working |
| Approve queued claim | `src/pages/ClaimsDashboard.jsx` | Adds queued claim | Save claim | Working |
| Ignore queued claim | `src/pages/ClaimsDashboard.jsx` | Removes queued item | Dismiss queue item | Working |
| Mark Open/Closed/Under Review | `src/pages/ClaimsDashboard.jsx` | Updates status | Move claim between boards | Working |
| Edit Claim | `src/pages/ClaimsDashboard.jsx` | Opens form with claim data | Update claim | Working |
| Delete Claim | `src/pages/ClaimsDashboard.jsx` | Opens confirm modal, then removes | Delete claim after confirmation | Working |
| Show/Hide Claim Log | `src/pages/ClaimsDashboard.jsx` | Toggles table | Show full claim log | Working |
| Export PDF Soon | `src/pages/ClaimsDashboard.jsx` | Disabled with tooltip | Not active until backend document generation exists | Intentionally disabled |

## Teams

| Clickable element | File/component | Current action | Expected action | Status |
| --- | --- | --- | --- | --- |
| Add Person | `src/pages/TeamsDashboard.jsx` | Opens person/team form | Add team member/assignment | Working |
| Empty-state Add Person / Add Route Team | `src/pages/TeamsDashboard.jsx` | Opens person/team form | Build first route team | Added |
| Save Person | `src/pages/TeamsDashboard.jsx` | Adds or updates person/team | Persist person and team slot | Working |
| Cancel/Close form | `src/pages/TeamsDashboard.jsx` | Closes form | Cancel edit/add | Working |
| Team status dropdowns | `src/pages/TeamsDashboard.jsx` | Updates selected team fields | Update readiness/compliance data | Working |
| Upload Photo | `src/pages/TeamsDashboard.jsx` | Reads local image and marks uploaded | Attach field photo locally/web | Working |
| Edit person | `src/pages/TeamsDashboard.jsx` | Opens form | Edit person assignment | Working |
| Delete person | `src/pages/TeamsDashboard.jsx` | Confirms then deletes | Remove person | Working |

## Finance

| Clickable element | File/component | Current action | Expected action | Status |
| --- | --- | --- | --- | --- |
| Profitability subtab | `src/pages/FinanceDashboard.jsx` | `navigateToTab("Profitability")` | Show Profitability and URL `#/profitability` | Fixed |
| Receipts subtab | `src/pages/FinanceDashboard.jsx` | `navigateToTab("Receipts")` | Show Receipts and URL `#/receipts` | Fixed |
| Contracts subtab | `src/pages/FinanceDashboard.jsx` | `navigateToTab("Contracts")` | Show Contracts and URL `#/contracts` | Fixed |
| Route Profit Check view chips | `src/pages/ProfitabilityDashboard.jsx` | Switch view | Change profitability view | Working |
| Contract selector | `src/pages/ProfitabilityDashboard.jsx` | Selects saved/new contract | Update route-profit contract context | Working |
| Save Contract | `src/pages/ProfitabilityDashboard.jsx` | Saves selected route-profit contract | Persist route contract | Working |
| Add Another | `src/pages/ProfitabilityDashboard.jsx` | Starts new route contract | New contract entry state | Working |
| Add Contract Row | `src/pages/ProfitabilityDashboard.jsx` | Adds rollup row | Add summary row | Working |
| Download Rollup | `src/pages/ProfitabilityDashboard.jsx` | Downloads rollup text export | Export rollup data | Working |
| Section edit buttons | `src/pages/ProfitabilityDashboard.jsx` | Opens section editor | Edit route input group | Working |
| Chart View buttons | `src/pages/ProfitabilityDashboard.jsx` | Opens chart modal | View chart details | Working |
| Rollup row click | `src/pages/ProfitabilityDashboard.jsx` | Opens row editor | Edit rollup row | Working |
| Rollup save/delete/cancel | `src/pages/ProfitabilityDashboard.jsx` | Saves or removes row | Manage row | Working |
| Contracts: Import Draft / Save Draft / Discard | `src/pages/ContractsDashboard.jsx` | Applies/discards imported contract draft | Manage intake draft | Working |
| Contracts: Select contract/rate card | `src/pages/ContractsDashboard.jsx` | Changes selected contract/card | Display selected contract | Working |
| Contracts: Edit/Save contract | `src/pages/ContractsDashboard.jsx` | Toggles edit mode/saves fields | Edit contract details | Working |
| Contracts: Tabs Rates/Claims/Teams/Notes | `src/pages/ContractsDashboard.jsx` | Switches contract detail panel | Show selected detail view | Working |
| Contracts: Open in Route Profit | `src/pages/ContractsDashboard.jsx` | Routes to Profitability | Use rate card in route profit | Working |
| Contracts: View Claims/Teams | `src/pages/ContractsDashboard.jsx` | Routes to Operations subtab | Show related workflow | Working |
| Receipts filter chips | `src/pages/ReceiptsDashboard.jsx` | Filters receipts | Show matching receipts | Working |
| Finance setup health next action | `src/pages/FinanceDashboard.jsx`, `src/components/SetupProgressPanel.jsx` | Routes to needed Finance/setup tab | Guide incomplete setup | Added |
| Finance workflow cards | `src/pages/FinanceDashboard.jsx` | Switch between Profitability, Receipts, Contracts | Explain and route grouped finance tabs | Added |
| Blank Contracts Create First Contract | `src/pages/ContractsDashboard.jsx` | Creates a local contract and opens edit mode | Start first contract/rate card without leaving page | Fixed |
| Blank Contracts Open Intake / Profit Calculator / Review Claims | `src/pages/ContractsDashboard.jsx` | Routes to Intake, Profitability, or Claims | Guide contract setup into related workflows | Added |
| Blank Contracts import setup contract | `src/pages/ContractsDashboard.jsx` | Imports dashboard setup contract into Contracts and opens edit mode | Reuse quick setup contracts instead of fake sample names | Added |
| Contracts KPI notes | `src/pages/ContractsDashboard.jsx` | Shows saved/needed data notes, not fake prior-period trends | Keep blank/new-account metrics honest | Fixed |
| Receipt empty-state Open Intake | `src/pages/ReceiptsDashboard.jsx` | Routes to Intake | Start receipt/intake workflow | Added |
| Receipt empty-state Review Mobile Setup | `src/pages/ReceiptsDashboard.jsx` | Routes to Settings | Review mobile upload setup | Added |
| Profitability empty-state Add Contract Row | `src/pages/ProfitabilityDashboard.jsx` | Opens existing rollup row editor | Add first contract profit row | Added |
| Profitability empty-state Start Blank Calculator | `src/pages/ProfitabilityDashboard.jsx` | Resets/opens blank route calculator | Run first route profit check | Added |

## Reports

| Clickable element | File/component | Current action | Expected action | Status |
| --- | --- | --- | --- | --- |
| Preview Profit Report | `src/pages/ReportsDashboard.jsx` | Opens preview modal | Preview report | Working |
| Report card Preview | `src/pages/ReportsDashboard.jsx` | Opens selected report preview | Preview report | Working |
| Report card Download PDF | `src/pages/ReportsDashboard.jsx` | Generates PDF download | Download PDF report | Fixed |
| Report readiness badges | `src/pages/ReportsDashboard.jsx` | Show requirements; disable unready reports | Prevent fake reports before setup data exists | Added |
| Reports Finish Setup / Open Dashboard | `src/pages/ReportsDashboard.jsx` | Routes to setup/dashboard | Guide blank reports state | Added |
| Preview modal Download PDF | `src/pages/ReportsDashboard.jsx` | Generates PDF download | Download selected report | Working |
| Preview modal Close | `src/pages/ReportsDashboard.jsx` | Closes modal | Close preview | Working |
| Filter dropdowns | `src/pages/ReportsDashboard.jsx` | Update report table filters | Filter report history | Working |
| Clear Filters | `src/pages/ReportsDashboard.jsx` | Resets filters | Show all matching reports | Working |
| View All Exports | `src/pages/ReportsDashboard.jsx` | Clears filters | Show all exports | Working |
| Report table Download | `src/pages/ReportsDashboard.jsx` | Generates PDF for row | Download PDF report | Working |

## Ask and Intake

| Clickable element | File/component | Current action | Expected action | Status |
| --- | --- | --- | --- | --- |
| Daily Briefing Open tab | `src/pages/AskBusinessDashboard.jsx` | Routes to suggested tab | Open relevant page | Working |
| AI mode prompt cards | `src/pages/AskBusinessDashboard.jsx` | Sends prebuilt question | Ask contextual business question | Working, OpenAI/API dependent |
| Ask data readiness checklist | `src/pages/AskBusinessDashboard.jsx`, `src/components/DataHealthChecklist.jsx` | Routes missing data items to setup tabs | Make missing data visible before asking | Added |
| Setup-aware suggested prompts | `src/pages/AskBusinessDashboard.jsx` | Sends setup/margin/team/claim prompts based on available data | Avoid generic suggestions in blank workspaces | Added |
| Ask button | `src/pages/AskBusinessDashboard.jsx` | Sends typed question | Return answer and next steps | Working, OpenAI/API dependent |
| Suggested prompt chips | `src/pages/AskBusinessDashboard.jsx` | Sends prompt | Return answer | Working |
| Recent question row | `src/pages/AskBusinessDashboard.jsx` | Restores question | Let user rerun/review question | Working |
| Intake drawer/open button | `src/components/AiQuickIntake.jsx` | Opens AI intake | Show intake panel | Working |
| Close Intake | `src/components/AiQuickIntake.jsx` | Closes panel | Close without saving | Working |
| Mock form buttons | `src/components/AiQuickIntake.jsx` | Loads mock text | Test intake with realistic forms | Working |
| Intake standalone source cards | `src/components/AiQuickIntake.jsx` | Informational, no save | Explain what can be pasted/uploaded | Added |
| Attach file | `src/components/AiQuickIntake.jsx` | Reads file into intake | Add file text | Working |
| Analyze Intake | `src/components/AiQuickIntake.jsx` | Builds drafts | Create claim/route/day drafts | Working, OpenAI/API dependent |
| Clear | `src/components/AiQuickIntake.jsx` | Clears input/drafts | Reset intake | Working |
| Apply Draft / Save to Claim / Save to Day | `src/components/AiQuickIntake.jsx` | Applies draft to app state | Save draft to correct workflow | Working |
| Open saved destination | `src/components/AiQuickIntake.jsx` | Routes to saved workflow | Show saved result | Working |
| Intake help toggle | `src/components/AiQuickIntake.jsx` | Shows/hides help | Explain intake behavior | Working |

## Compliance and Document Vault

| Clickable element | File/component | Current action | Expected action | Status |
| --- | --- | --- | --- | --- |
| Upload Documents | `src/components/ProfitPlatformWidgets.jsx` | Opens file picker and stores docs | Upload/record docs | Working, Supabase Storage dependent |
| Compliance setup Upload Documents | `src/pages/ComplianceDashboard.jsx` | Routes to Intake | Start compliance document intake | Added |
| Compliance setup Add Team / Review Claims | `src/pages/ComplianceDashboard.jsx` | Routes to Teams/Claims | Build required compliance context | Added |
| Category chips | `src/components/ProfitPlatformWidgets.jsx` | Filter vault docs | Show category | Working |
| Document row | `src/components/ProfitPlatformWidgets.jsx` | Opens preview modal | Preview doc | Working |
| Category dropdown | `src/components/ProfitPlatformWidgets.jsx` | Updates document category | Organize doc | Working |
| View | `src/components/ProfitPlatformWidgets.jsx` | Opens preview modal | Preview doc | Working |
| Preview backdrop / Close | `src/components/ProfitPlatformWidgets.jsx` | Closes modal | Close preview | Working |

## Settings

| Clickable element | File/component | Current action | Expected action | Status |
| --- | --- | --- | --- | --- |
| Settings tabs | `src/pages/SettingsDashboard.jsx` | Switch active settings section | Show selected section | Working |
| Restore Setup | `src/pages/SettingsDashboard.jsx` | Restores setup guidance flag in localStorage | Bring onboarding prompts back | Added |
| Reset Checklist | `src/pages/SettingsDashboard.jsx` | Clears setup wizard localStorage keys | Restart setup checklist | Added |
| Onboarding preset buttons | `src/pages/SettingsDashboard.jsx` | Applies dashboard layout presets | Owner daily, claims-heavy, finance, compliance views | Added |
| Save Preferences | `src/pages/SettingsDashboard.jsx` | Shows saved notice | Preferences are already stored through state/local persistence | Working |
| Company inputs/dropdowns | `src/pages/SettingsDashboard.jsx` | Update settings | Persist company/theme/accent | Working |
| Add Team Member | `src/pages/SettingsDashboard.jsx` | Saves pending invite if allowed | Create pending access record | Working, invite email backend later |
| Role dropdowns | `src/pages/SettingsDashboard.jsx` | Updates member role if allowed | Change role | Working, disabled for owners/non-managers |
| Show All / Hide All / Reset Order | `src/pages/SettingsDashboard.jsx` | Updates dashboard layout | Control widgets | Working |
| Dashboard presets | `src/pages/SettingsDashboard.jsx` | Applies preset widget layout | Reorder/show dashboard sections | Working |
| Up / Down | `src/pages/SettingsDashboard.jsx` | Reorders widget | Move dashboard widget | Working; edge buttons disabled |
| Widget toggles | `src/pages/SettingsDashboard.jsx` | Shows/hides widget | Control dashboard layout | Working |
| Benchmark toggle and inputs | `src/pages/SettingsDashboard.jsx` | Updates target values | Control profitability targets | Working |
| Claims thresholds | `src/pages/SettingsDashboard.jsx` | Updates thresholds | Control claim risk labels | Working |
| Accessorial inputs | `src/pages/SettingsDashboard.jsx` | Updates default charges | Control contract math defaults | Working |
| Label inputs | `src/pages/SettingsDashboard.jsx` | Updates custom labels | Rename common terms | Working |
| Employee toggles | `src/pages/SettingsDashboard.jsx` | Updates employee rules | Control employee workflow | Working |
| Notification toggles | `src/pages/SettingsDashboard.jsx` | Updates alert preferences | Control alerts | Working |
| View Layout | `src/pages/SettingsDashboard.jsx` | Opens Dashboard Layout tab | Jump to layout settings | Working |

## Login

| Clickable element | File/component | Current action | Expected action | Status |
| --- | --- | --- | --- | --- |
| Login theme toggle | `src/pages/LoginPage.jsx` | Toggles theme | Switch light/dark | Working |
| Password eye icon | `src/pages/LoginPage.jsx` | Shows/hides password | Toggle password visibility | Working |
| Remember me | `src/pages/LoginPage.jsx` | Toggles local form state | Capture preference | Working |
| Forgot password? | `src/pages/LoginPage.jsx` | Shows setup message | No dead reset link until email backend configured | Working placeholder |
| Sign In | `src/pages/LoginPage.jsx` | Demo or Supabase login | Authenticate user | Working, Supabase dependent for real users |

## Mobile App

| Clickable element | File/component | Current action | Expected action | Status |
| --- | --- | --- | --- | --- |
| Mobile Sign In | `mobile/src/screens/LoginScreen.js` | Supabase email/password login | Authenticate user | Working, Supabase dependent |
| Owner Mode | `mobile/App.js` | Sets mobile mode owner | Show owner tabs only | Working |
| Driver Mode | `mobile/App.js` | Sets mobile mode driver | Show driver tabs only | Working |
| Mobile mode pill | `mobile/App.js` | Returns to mode chooser | Switch owner/driver session view | Working |
| Mobile Sign Out | `mobile/App.js` | Supabase sign out | Return to login | Working |
| Mobile bottom Home | `mobile/App.js` | `setActiveTab("home")` | Show Home | Working |
| Mobile bottom Receipts | `mobile/App.js` | `setActiveTab("receipts")` | Show Receipts | Working |
| Mobile bottom Claims | `mobile/App.js` | `setActiveTab("claims")` | Show Claims | Working |
| Mobile bottom Check In | `mobile/App.js` | Driver-only tab | Show Check In | Working |
| Mobile bottom Evidence | `mobile/App.js` | Driver-only tab | Show Evidence | Working |
| Owner action cards | `mobile/src/screens/HomeScreen.js` | Navigate when actionable, show Info when not | Owner actions route correctly | Fixed |
| Claim status buttons | `mobile/src/screens/ClaimsScreen.js` | Updates claim status | Move claim through mobile states | Fixed current/busy disabled state |
| Check In save | `mobile/src/screens/CheckInScreen.js` | Saves check-in after validation | Require route/truck | Fixed |
| Receipts choose photo | `mobile/src/screens/ReceiptsScreen.js` | Opens image picker | Choose receipt image | Working |
| Receipts take camera/upload prompt | `mobile/src/screens/ReceiptsScreen.js` | Opens camera/library choices | Capture or choose receipt | Working |
| Analyze Receipt | `mobile/src/screens/ReceiptsScreen.js` | Calls receipt extraction API | Fill receipt fields from image | Working, OpenAI/API dependent |
| Upload Receipt | `mobile/src/screens/ReceiptsScreen.js` | Uploads receipt/doc record | Send receipt to Supabase/document vault | Working, Supabase dependent |
| Evidence upload | `mobile/src/screens/EvidenceScreen.js` | Uploads claim evidence photo | Send field evidence to Supabase | Working, Supabase dependent |

## Intentionally Disabled or Backend-Later

| Item | Reason |
| --- | --- |
| Claims Dispute Packet `Export PDF Soon` | Needs backend/server document generation before exporting claim packet PDFs. The button is disabled and has a tooltip. |
| Supabase invite emails | The browser can save pending invite records, but sending real invite emails needs a secure backend function/service key. |
| Ask / Intake / Receipt OCR AI | Requires an OpenAI API key with billing/quota and the deployed API routes. UI is wired; answers depend on backend/API availability. |
| Receipt and evidence uploads | Wired to Supabase/document storage; production persistence depends on Supabase policies/buckets staying configured. |
| Team photo 7-day deletion | Requires scheduled Supabase cleanup/retention job. Setup SQL exists separately. |

## Verification

- `npm run build` passed on June 4, 2026.
- Build found no broken imports or missing components.
- Browser automation could read the local app and verify the login surface. The in-app browser automation currently cannot fill forms because its virtual clipboard/storage support is unavailable, so form behavior was verified by source inspection plus build.
- Route and button handlers were inspected across every page/component listed above.
