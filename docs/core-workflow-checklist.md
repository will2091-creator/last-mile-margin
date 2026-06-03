# Core Workflow Lock-In Checklist

Use this checklist before building the mobile app. A workflow is locked in when a real user can start it, finish it, and see the result in the right place without guessing.

## Status Key

- Not Started: not built or not tested.
- Mocked: works visually, but uses mock/local-only data.
- Working: works in the app with expected behavior.
- Needs Backend: needs database, file storage, auth, or server logic.
- Locked: tested with real examples and ready to keep stable.

## 1. Ask My Business

- [ ] Ask a plain-English business question.
- [ ] Ask works with typos, like "bread even" for "break even."
- [ ] Answer uses current claims, teams, profitability, contracts, and settings data.
- [ ] Answer gives a short summary and useful next actions.
- [ ] "Open" button sends the user to the correct page.
- [ ] Recent questions save and show the question that was asked.
- [ ] OpenAI backend answers when `OPENAI_API_KEY` is configured.
- [ ] Local fallback answers when OpenAI is unavailable.
- [ ] Real business questions tested:
  - [ ] How much do I need to make to break even?
  - [ ] Which claim should I dispute first?
  - [ ] Which team is costing me the most?
  - [ ] Why is profit down?
  - [ ] Which contract looks risky?

Current status: Working / Needs real examples.

## 2. AI Intake

- [ ] User can paste a claim email.
- [ ] User can paste route sheet data.
- [ ] User can paste contract terms.
- [ ] User can attach/upload a file.
- [ ] Analyze creates the right draft type.
- [ ] Mixed notes create multiple drafts only when needed.
- [ ] Claim draft saves to Claims.
- [ ] Route draft fills Profitability.
- [ ] Contract draft saves to Contracts.
- [ ] Saved intake appears in daily history or activity.
- [ ] AI result shows confidence and missing evidence.
- [ ] Empty/unclear input gives a helpful message.
- [ ] Real examples tested:
  - [ ] Real claim email.
  - [ ] Real route sheet.
  - [ ] Real contract/rate card.
  - [ ] Screenshot/PDF placeholder.

Current status: Working / Needs real file handling.

## 3. Claims Workflow

- [ ] New claim can be created manually.
- [ ] New claim can be created from Intake.
- [ ] Claim appears in Needs Review.
- [ ] Claim can move to In Progress.
- [ ] Claim can move to Resolved.
- [ ] Claim amount updates dashboard exposure.
- [ ] Claim risk updates based on amount/settings.
- [ ] Claim preventability is clear.
- [ ] Missing evidence is visible.
- [ ] Dispute-ready claims are easy to identify.
- [ ] Full claim log shows all claims.
- [ ] Claim can be edited.
- [ ] Claim can be deleted when needed.
- [ ] Real claims tested:
  - [ ] Property damage.
  - [ ] Cargo damage.
  - [ ] Penalty/missed window.
  - [ ] Missing evidence claim.

Current status: Working / Needs full QA pass.

## 4. Profitability Workflow

- [ ] User can enter route revenue.
- [ ] User can enter labor costs.
- [ ] User can enter fuel/truck/insurance/maintenance costs.
- [ ] User can enter claims/chargeback reserve.
- [ ] Net profit calculates correctly.
- [ ] Margin percent calculates correctly.
- [ ] Negative profit numbers show red.
- [ ] Positive profit numbers show green.
- [ ] Route can be saved.
- [ ] Saved route appears in history.
- [ ] Intake route draft fills the calculator correctly.
- [ ] Ask My Business can answer break-even using these numbers.
- [ ] Real route examples tested:
  - [ ] Profitable route.
  - [ ] Losing route.
  - [ ] High-mileage route.
  - [ ] High-labor route.

Current status: Working / Needs real route validation.

## 5. Daily Dashboard Workflow

- [ ] Dashboard loads the correct current page after refresh.
- [ ] Day/Week/Month/Qtr/Year selector changes dashboard metrics.
- [ ] Day Net Profit is readable in light and dark mode.
- [ ] Day Revenue is readable in light and dark mode.
- [ ] Day Claims reflects current exposure.
- [ ] Day Costs reflects route cost inputs.
- [ ] Widgets can be rearranged in Settings.
- [ ] Hidden widgets stay hidden.
- [ ] Dashboard presets work.
- [ ] Save Snapshot saves the current day.
- [ ] Daily History can reload saved snapshots.
- [ ] Main dashboard buttons navigate correctly.

Current status: Working / Needs full button sweep.

## 6. Document Vault / Compliance Workflow

- [ ] User can upload documents from the Document Vault.
- [ ] Uploaded document appears at the top of the vault.
- [ ] Uploaded document can be categorized.
- [ ] Category counts update.
- [ ] Document status is visible.
- [ ] Expiration date is visible.
- [ ] Expiring documents are flagged.
- [ ] Missing documents are flagged.
- [ ] Expired documents are flagged.
- [ ] Document preview opens.
- [ ] Compliance Risk Panel reflects document status.
- [ ] Real documents tested:
  - [ ] Certificate of Insurance.
  - [ ] Cargo insurance.
  - [ ] DOT inspection.
  - [ ] Driver medical card.
  - [ ] W-9 / EIN / LLC paperwork.
  - [ ] Rate card.

Current status: Mocked / Needs backend file storage.

## 7. Contracts Workflow

- [ ] Contract can be selected.
- [ ] All Contracts view works.
- [ ] Contract rates are visible.
- [ ] Contract margin is visible.
- [ ] Contract risk is visible.
- [ ] Contract claims exposure is visible.
- [ ] Intake contract draft saves to Contracts.
- [ ] Contract can send user to related Claims.
- [ ] Contract can send user to related Profitability.
- [ ] Real contracts/rate cards tested:
  - [ ] Flat route pay.
  - [ ] Per-stop pay.
  - [ ] Install/accessorial pay.
  - [ ] Renewal date.

Current status: Working / Needs real rate card validation.

## 8. Teams / Driver Workflow

- [ ] Team list shows active teams.
- [ ] Driver and helper data are visible.
- [ ] Photo status is visible.
- [ ] Team compliance score is visible.
- [ ] Claims roll up to the right team/driver.
- [ ] At-risk teams are easy to identify.
- [ ] Team photo upload/readiness flow works.
- [ ] Team details connect back to Claims and Compliance.
- [ ] Real examples tested:
  - [ ] Missing photo.
  - [ ] High exposure driver.
  - [ ] At-risk team.
  - [ ] Clean team.

Current status: Working / Needs full QA pass.

## 9. Settings Workflow

- [ ] Theme mode changes the full app.
- [ ] Accent color changes key UI elements.
- [ ] Dashboard widgets can be shown/hidden.
- [ ] Dashboard widgets can be reordered.
- [ ] Dashboard layout presets work.
- [ ] Claim risk thresholds change claim risk behavior.
- [ ] Settings persist after refresh.
- [ ] Settings do not break pages in dark mode.
- [ ] Settings are understandable to a non-technical user.

Current status: Working / Needs wording polish.

## 10. Reports Workflow

- [ ] Reports page summarizes claims, teams, and profitability.
- [ ] Filters work.
- [ ] Export buttons do what they say or clearly state mock behavior.
- [ ] Report activity appears in Recent Activity where expected.
- [ ] Reports navigate back to source pages.
- [ ] Real report examples tested:
  - [ ] Profitability report.
  - [ ] Claims report.
  - [ ] Compliance report.
  - [ ] Team performance report.

Current status: Mocked / Needs export/backend decision.

## 11. Button And Navigation Sweep

- [ ] Every sidebar tab opens the correct page.
- [ ] Every "Open" button opens the correct page.
- [ ] Every "View" button opens a useful detail view.
- [ ] Every "Save" button saves something visible.
- [ ] Every "Upload" button opens a file picker or upload area.
- [ ] Every "Analyze" button creates a result or clear error.
- [ ] Every "Reset" button only resets the intended section.
- [ ] Every delete action is clear and reversible where needed.
- [ ] Refresh keeps the user on the same page.
- [ ] Mobile-size layout does not overlap or hide key controls.

Current status: In Progress.

## 12. Backend Readiness

- [ ] Decide database provider.
- [ ] Add user accounts/auth.
- [ ] Store claims in backend.
- [ ] Store teams/drivers in backend.
- [ ] Store route/day snapshots in backend.
- [ ] Store settings per company/user.
- [ ] Store uploaded documents in backend file storage.
- [ ] Connect OpenAI calls through secure server endpoints.
- [ ] Add audit log for key changes.
- [ ] Add role permissions.
- [ ] Add backup/export plan.

Current status: Not Started / Required before production.

## 13. Mobile App Readiness

- [ ] Web core workflows are locked.
- [ ] Backend storage is chosen.
- [ ] User roles are defined.
- [ ] Mobile-first feature list is finalized.
- [ ] Driver/admin workflows are separated.
- [ ] Upload/photo workflow is tested on phone-sized screens.
- [ ] AI Intake works with mobile file/photo input.
- [ ] Claims review works on mobile.
- [ ] Daily dashboard works on mobile.
- [ ] Ask My Business works on mobile.

Current status: Planning only.

## Weekly QA Routine

Run this every week before adding major new features:

1. Add one claim from Intake.
2. Move that claim through the Claims board.
3. Enter one route and save the day.
4. Ask one break-even question.
5. Upload one document.
6. Change one dashboard setting.
7. Refresh the page and confirm the app stays where it should.
8. Switch to dark mode and scan for unreadable text.
9. Click every main action button on the active workflow.
10. Write down anything confusing before building the next feature.

## Next Recommended Pass

- [ ] Test Ask My Business with 10 real questions.
- [ ] Test AI Intake with 3 real documents or emails.
- [ ] Run the full button/navigation sweep.
- [ ] Decide which mock features need backend storage first.
- [ ] Clean up unclear wording that makes the app feel fake or confusing.
