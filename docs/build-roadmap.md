# Last Mile Margin Build Roadmap

## Current Priority

The app is past the rough idea stage. The next goal is to make the core workflows clean, consistent, and reliable before adding backend accounts, database, email importing, OCR, AI extraction, payments, permissions, and deployment.

## Recommended Build Order

1. Claims

   Claims should be the next major focus because they connect directly to money loss, drivers, contracts, Intake, risk, and reporting.

   Key work:
   - Add claim
   - Save claim as draft
   - Assign claim to driver
   - Set risk level
   - Review later
   - Mark resolved
   - Filter and search claims

2. Data Model Cleanup

   Before adding a real database, the app needs clear rules for what each thing means.

   Key decisions:
   - Driver vs team
   - Contract vs route
   - Claim vs intake draft
   - Saved day vs report
   - Which data belongs to company settings

3. Contracts

   Contracts should become easier to review and connect to claims, revenue, route terms, and risk.

   Key work:
   - Choose one contract at a time
   - View all contracts when needed
   - Edit contract terms
   - See risk/status near the top
   - Connect claims and revenue back to each contract

4. Intake

   Intake should become the front door for fast data entry.

   Key work:
   - Drop email, screenshot, PDF, route sheet, or notes
   - Extract draft data
   - Review before saving
   - Save to Claims, Contracts, Profitability, or Saved Days
   - Keep draft history

5. Saved Days

   Saved Days should make it easy to go back and review previous workdays.

   Key work:
   - Auto-save at midnight
   - Manual Save Day
   - View past days
   - Compare days
   - Restore or export a saved day

6. Settings

   Settings should control real behavior in the app, not just show empty tabs.

   Key work:
   - Company info
   - Drivers/employees
   - Claim risk thresholds
   - Default rates
   - Labels
   - Dashboard widgets
   - Notifications

7. Button Audit

   Every visible button should either work or be removed.

   Key work:
   - Test every page
   - Fix broken navigation
   - Remove placeholder buttons
   - Make dropdowns and filters functional
   - Confirm back/refresh behavior

8. Mobile and Small Screen Polish

   The layout should stay clean no matter how small the window gets.

   Key work:
   - Prevent numbers/text from overflowing boxes
   - Make tables usable on small screens
   - Clean up stacked cards
   - Make buttons wrap cleanly
   - Test dark mode and light mode

9. Backend, Accounts, and Database

   After the front-end workflows are clear, move from localStorage to real data storage.

   Recommended foundation:
   - Supabase
   - Real login/accounts
   - Company profiles
   - User roles
   - Database tables for claims, contracts, teams/drivers, saved days, settings, and intake drafts

10. Advanced Product Features

   Add these after the foundation is stable.

   Key work:
   - Email importing
   - OCR for screenshots and PDFs
   - AI extraction
   - Permissions
   - Stripe payments
   - Production deployment
   - Domain, backups, and monitoring

## Short Version

Recommended order from here:

1. Claims
2. Data model cleanup
3. Contracts
4. Intake
5. Saved Days
6. Settings
7. Full button audit
8. Mobile/responsive polish
9. Backend/accounts/database
10. AI/email/OCR/payments/deployment

## Product Direction

Keep the app simple for contractors. The main product idea should be:

> Put the messy stuff in once, review what the app found, and know where the money is going.

