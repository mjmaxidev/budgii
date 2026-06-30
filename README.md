# Smart Budget Tracker

A mobile-first React + Vite + TypeScript Electron app for household budget tracking
with AI receipt breakdown (mocked) and a Deal Watchlist agent (Milestone 2, mock data).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run preview  # preview the production build
```

Open in a narrow window or device toolbar — the UI is framed to a 375–440px phone
width and centered as a device mockup on larger screens.

## Desktop app (Electron)

```bash
npm run electron:dev:app  # Budgii app — Vite + Electron (hot reload)
npm run electron:dev:qa   # Budgii QA studio — iframe + sidebar + annotations
npm run electron:start:app
npm run electron:dist:app # distributable installer (.dmg / .nsis / .AppImage)
```

The Electron shell lives in [electron/](electron/): `main-app.cjs` / `main-qa.cjs`,
`preload.cjs`, and `dev-app.cjs` / `dev-qa.cjs` dev launchers.
The app uses a **hash router** and **relative asset base** so the same build runs both in
the browser and from `file://` inside Electron. Packaging is configured under the `build`
field in `package.json` (electron-builder); output goes to `release/`.

macOS builds are unsigned unless you have a Developer ID certificate — to ship one,
configure code signing per https://electron.build/code-signing.

## Stack

React 18 · Vite 5 · TypeScript · Tailwind CSS · React Router 6 · Zustand (+ localStorage
persistence) · lucide-react icons. No backend; OCR/AI and the deal agent are deterministic
local mocks.

## Structure

```
src/
  app/router.tsx            # all routes, wrapped in MobileFrame
  components/
    ui/                     # Card, ActionButton, SegmentedControl, Chip, ProgressRing,
                            # ProgressBar, FormField, ToggleRow, SelectRow, Modal, etc.
    layout/                 # MobileFrame, AppShell, TopBar, BottomNav, FloatingActionButton
    finance/                # TransactionRow, CategoryBreakdownRow, CarouselCard, ExpenseEditor
    receipts/               # ReceiptThumbnail, ReceiptItemRow, ReceiptItemEditor
    deals/                  # DealWatchlistCard, DealReportRow, DealSwipeCard
  data/seed.ts              # demo categories/tags/members/expenses/budget/deals
  store/
    appStore.ts             # Zustand store + all actions, persisted to localStorage
    selectors.ts            # period filtering + totals by category/tag/member, daily chart
    lookups.ts              # id -> entity resolvers
  types/index.ts            # data model
  utils/                    # money, dates, budget status, id, cn, mockAi (OCR mock)
  pages/                    # one file per screen
```

## Screens

MVP 1.0: Login, Home, Add Expense, Scan Receipt, Receipt Results, Item Detail,
Transactions, Reports & Budget, Spending Breakdown, Set Up Budget, Categories & Tags,
Family Members, Settings.

Milestone 2 (mock data): Deal Watchlist, Today's Deal Report, Deal Cards (swipe),
Shopping List.

## Key behaviors

- **Budget ring** turns green / orange / red via `getBudgetStatus(spent, limit, warning)`.
- **Receipt flow**: upload → `addReceiptFromImage` (status `analyzing`) → mock OCR
  (`utils/mockAi.ts`) → `needs_review` → edit items → `confirmReceiptItems` creates
  expenses. Real OCR plugs into `mockExtractReceiptItems`.
- **Reports** recompute live from store data on every expense/receipt change.
- **Deal agent**: `mockRunDailyDealCheck` (UI shows "Next report: 7:00 AM"). The future
  web-search / agent integration point is commented in `store/appStore.ts`.
- All data persists across refresh (localStorage). Reset via Settings → Reset Demo Data.
```
