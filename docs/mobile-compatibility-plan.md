# Mobile Compatibility Plan

Final Mile Margin should stay one product with two front ends:

- Web: owner/admin command center.
- Mobile: driver/dispatcher field app.

## Shared Backend

Both apps should use the same Supabase project:

- Auth: same user accounts.
- Roles: `profiles` and `team_memberships`.
- Claims: `claims`.
- Evidence files: `claim-evidence` storage bucket plus `claim_evidence`.
- Documents: `documents` storage bucket plus `documents`.
- Expense receipts: `documents` storage bucket plus `documents` rows categorized as `Expense Receipts`.
- App settings/history: `app_state` for owner/admin web state.
- Mobile check-ins: `route_checkins`.

## First Mobile Workflows

1. Sign in with Supabase.
2. Read team role from `team_memberships`.
3. Show open claims assigned to the signed-in user/workspace.
4. Update claim status from the field.
5. Save route check-in notes.
6. Upload claim evidence photos to Supabase Storage.
7. Upload gas, tools, maintenance, parking/toll, and other receipts as expense documents.

## Compatibility Rules

- Do not create separate mobile-only claim IDs. Mobile should use `claims.app_claim_id` when showing the claim number.
- Every mobile write should include `owner_id` and `user_id` where available.
- Mobile should not store business truth in local-only storage except temporary drafts.
- Web dashboard should remain the place for settings, contracts, reports, and financial tuning.
- Mobile should stay field-focused: check-ins, photos, claim notes, simple status changes.

## Next Backend Gaps

- Make sure `route_checkins` exists in Supabase.
- Confirm `claim_evidence` table and `claim-evidence` bucket exist.
- Confirm the `documents` bucket and `documents` table exist before using mobile receipt uploads.
- Add signed URL preview support for uploaded files.
- Tighten RLS so dispatchers/drivers only see allowed workspace records.
- Decide whether drivers can close claims or only move them to Under Review.

## Mobile App Location

The Expo starter app lives in:

`mobile/`

Run it from the repo root after installing mobile dependencies:

```bash
npm install --prefix mobile
npm run mobile:dev
```
