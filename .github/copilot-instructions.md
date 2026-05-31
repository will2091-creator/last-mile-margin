# Copilot Instructions

- This is a single-page React + Vite dashboard app. The entire UI is composed from `src/App.jsx`, and `src/main.jsx` only bootstraps `App` into `#root`.
- `App.jsx` currently contains nearly all logic, state, and screen sections in one file: dashboard navigation, profitability calculator, compliance, claims, teams, and settings.
- The app uses React hooks and memoized calculations: `useState` for local UI state and `useMemo` for derived values like `results`, `grade`, and `risks`.
- The profitability calculator is formula-driven and lives in `src/App.jsx` inside `results` + `getGrade()`. Changes to business logic should preserve the existing numeric model and risk labels.
- Styling is Tailwind CSS v4 via `src/index.css` with `@import "tailwindcss"`; class names are used directly in JSX rather than CSS modules.
- Charts use `recharts`, icons use `lucide-react`, and page motion uses `framer-motion`.
- The app has no backend API or persistence layer; all data is in React state only (e.g. `teams`, `claims`, `savedScenarios`, `appSettings`). Avoid adding assumptions about server-side storage.
- Theme state is local only: `appSettings.themeMode` and `appSettings.accentColor` are not persisted outside the current session.
- Navigation is tab-based and conditional in `App.jsx` via `activeTab`; each tab renders a dedicated dashboard component defined inside the same file.
- Common reusable UI helpers are defined in `src/App.jsx`: `Card`, `Field`, `Section`, `MetricCard`, `Row`, `StatusBadge`, `CostPieChart`, and `ProfitTrendChart`.

## Workflow
- `npm install` to install dependencies.
- `npm run dev` starts Vite dev server.
- `npm run build` builds production assets.
- `npm run preview` serves the built app locally.
- `npm run lint` runs ESLint across the repo.

## Best-fit edits
- If you add a new feature, prefer keeping it in `src/App.jsx` unless you explicitly split it into a new component file and update imports.
- For new dashboard data, follow the existing pattern of local arrays and derived summaries rather than introducing external state managers.
- Use the existing `currency` and `number` formatters defined at the top of `App.jsx` for UI consistency.
- Keep the dashboard nav item pattern with `navItems` and `activeTab` if adding a new app section.

## Project-specific notes
- The app is intentionally minimal and self-contained; there is no `tests/` folder and no test runner configured.
- The only source of styling configuration is Vite + `@tailwindcss/vite` plugin, so do not expect separate PostCSS or CSS module files.
- `package.json` uses `type: "module"`, so any new JS files should use ES module syntax.
