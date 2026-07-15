# Budgii

A mobile-first React + Vite + TypeScript app for household budget tracking,
backed by a FastAPI + PostgreSQL API for accounts, household sync, expenses,
receipts, settings, invitations, and AI receipt analysis.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run preview  # preview the production build
```

Open in a narrow window or device toolbar — the UI is framed to a 375–440px phone
width and centered as a device mockup on larger screens.

To run the full stack:

```bash
cp .env.backend.example .env.backend
cp .env.frontend.example .env.frontend
docker compose up --build
```

The frontend runs on `:8080`, the API on `:8001`, and Postgres remains private
on the Docker network. The stack also starts recurring and push workers.

Leave `INVITE_EMAIL_PROVIDER=log` until a real `INVITE_EMAIL_API_KEY` is set.
Leave `PUSH_PROVIDER=log` until FCM credentials are configured and tested.
Set `AUTH_LINK_BASE` to the public frontend origin so password reset and email
verification links open the right app.
Auth endpoints are rate-limited by default; tune `AUTH_RATE_LIMIT_REQUESTS` and
`AUTH_RATE_LIMIT_WINDOW_SECONDS` per environment.

The server stacks include:

- `recurring-worker`: applies due recurring expenses hourly
- `push-worker`: dispatches eligible push notifications every five minutes

```bash
docker compose logs -f recurring-worker push-worker
```

Set `BUDGII_DEV_SEED=true` to load the full mock dataset when the API starts.
The local dev login is `dev@mjproductions.app` / `password`. To fully reset and
reseed the local Docker dev database:

```bash
budgii-api/scripts/reset_dev_db.sh --yes
```

See [ROADMAP.md](ROADMAP.md) for current status and priorities.

## Checks

GitHub Actions runs the same frontend and backend gates on pushes and pull requests.

```bash
npm run hooks:install
npm run precommit

npm run lint
npm run format:check
npm run build

docker compose exec -T api scripts/lint.sh
docker compose exec -T -e RECEIPT_OCR_PROVIDER=deterministic api python -m pytest
```

To run due recurring transactions manually, for example from a cron/scheduler:

```bash
docker compose run --rm --entrypoint python api scripts/apply_recurring.py
docker compose run --rm --entrypoint python api scripts/apply_recurring.py --date 2026-07-09
```

To dispatch eligible push notifications manually:

```bash
docker compose run --rm --entrypoint python api scripts/dispatch_push_notifications.py
```

To test the same scheduler loop locally:

```bash
docker compose run --rm --entrypoint python api scripts/run_scheduler.py recurring --once
docker compose run --rm --entrypoint python api scripts/run_scheduler.py push --once
```

## Desktop app (Electron)

```bash
npm run electron:dev:app  # Budgii app — Vite + Electron (hot reload)
npm run electron:dev:qa   # Budgii QA studio — iframe + sidebar + annotations
npm run electron:start:app
npm run electron:dist:app # distributable installer (.dmg / .nsis / .AppImage)
```

## Mobile app (Capacitor)

Android builds require JDK 21. On macOS the Android scripts resolve it with
`/usr/libexec/java_home -v 21`.

```bash
npm run cap:build
npm run cap:ios
npm run cap:android
npm run cap:android:run -- --target emulator-5554
npm run android:build:debug
```

The Electron shell lives in [electron/](electron/): `main-app.cjs` / `main-qa.cjs`,
`preload.cjs`, and `dev-app.cjs` / `dev-qa.cjs` dev launchers.
The app uses a **hash router** and **relative asset base** so the same build runs both in
the browser and from `file://` inside Electron. Packaging is configured under the `build`
field in `package.json` (electron-builder); output goes to `release/`.

macOS builds are unsigned unless you have a Developer ID certificate — to ship one,
configure code signing per https://electron.build/code-signing.

## Stack

React 18 · Vite 5 · TypeScript · Tailwind CSS · React Router 6 · Zustand ·
FastAPI · PostgreSQL · Docker Compose · lucide-react icons. `localStorage` is
now a cache/offline layer for app state, while server-owned data flows through
the API when `VITE_API_ENABLED=true`.

## Structure

```
src/
  app/router.tsx            # hash routes for the app bundle
  components/
    ui/                     # Card, ActionButton, SegmentedControl, Chip, ProgressRing,
                            # ProgressBar, FormField, ToggleRow, SelectRow, Modal, etc.
    layout/                 # AppShell, TopBar, BottomNav, FloatingActionButton
    finance/                # TransactionRow, CategoryBreakdownRow, CarouselCard, ExpenseEditor
    receipts/               # ReceiptThumbnail, ReceiptItemRow, ReceiptItemEditor
    deals/                  # DealWatchlistCard, DealReportRow, DealSwipeCard
  data/seed.ts              # offline fallback categories/tags/members/budget/deals
  store/
    appStore.ts             # Zustand store + all actions, persisted to localStorage
    selectors.ts            # period filtering + totals by category/tag/member, daily chart
    lookups.ts              # id -> entity resolvers
  types/index.ts            # data model
  utils/                    # money, dates, budget status, ids, navigation, colors
  pages/                    # one file per screen
```

## Screens

MVP 1.0: Login, Home, Add Expense, Scan Receipt, Receipt Results, Item Detail,
Transactions, Reports & Budget, Spending Breakdown, Set Up Budget, Categories & Tags,
Family Members, Settings.

Backend-backed flows: account settings, invitations, family members, spending
alerts, recurring transactions, Deal Watchlist, Today's Deal Report, Deal Cards
(swipe), Shopping List, receipts, and expenses.

## Key behaviors

- **Budget ring** turns green / orange / red via `getBudgetStatus(spent, limit, warning)`.
- **Receipt flow**: upload → API analysis → `needs_review` → edit items →
  confirm creates normalized expenses.
- **Reports** recompute live from hydrated normalized expenses and receipt data.
- **Deal agent**: watchlist and deal report data can be generated by the backend
  when API mode is enabled.
- App state persists across refresh; authenticated API mode hydrates and syncs
  household data from the backend.
