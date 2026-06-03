# Final Mile Margin Mobile

Mobile companion app for driver/team field work.

## First Mobile Workflows

- Driver or dispatcher signs in with the same Supabase account.
- User sees today snapshot: open claims, route exposure, assigned team role.
- User creates a route check-in.
- User uploads claim evidence or route photos.
- User reviews open claims and updates claim status.

## Run

From the repo root:

```bash
npm install --prefix mobile
npm run mobile:dev
```

The current scaffold reads Supabase from `app.json` `extra` values. For production, move those into Expo environment variables or EAS secrets.
