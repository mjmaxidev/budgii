# Budgii — Claude Code Context

## Project

Budgii is a household budget tracking Electron + React app. It ships as two separate desktop apps from one codebase:

- **Budgii** — the end-user app (plain, phone-sized window, no QA tools)
- **Budgii QA** — a design/QA review studio that embeds the app in a phone bezel iframe with a sidebar nav and red-pen annotation overlay

## Tech Stack

- **React 18 + TypeScript** (strict)
- **Vite 5** — two entry points: `index.html` (app) and `qa.html` (QA studio)
- **React Router v6** (`createHashRouter` — required for Electron `file://`)
- **Tailwind CSS v3** with a custom design token set (`bg`, `ink`, `muted`, `primary`, `line`, `surface`, etc.)
- **Zustand** for global app state (`src/store/appStore.ts`)
- **Electron 42** with `electron-builder` for packaging
- **`base: './'`** in vite.config.ts — required for Electron file:// URL loading

## Architecture

### Two separate bundles

```
index.html  →  src/main.tsx         →  app router + pages (QA-unaware)
qa.html     →  src/qa/qa-main.tsx   →  QAShell (iframe + sidebar + annotation)
```

The QA studio embeds the real app in an `<iframe src="./index.html#/path">`. Navigation happens via `frame.contentWindow.location.hash`. They share `localStorage` (same origin).

### Key directories

```
src/
  app/          router.tsx (app routes only), AppLayout.tsx
  pages/        all app screen components
  components/
    ui/          shared design system (ActionButton, Card, Modal, etc.)
    layout/      AppShell.tsx (per-screen shell with TopBar + BottomNav)
    dev/         AnnotationLayer.tsx (red-pen overlay — QA only)
  store/         appStore.ts (Zustand)
  qa/            QAShell, PageNavSidebar, pageManifest, tools (QA-only code)
electron/
  main-app.cjs   Electron main for the app (390×844, phone window)
  main-qa.cjs    Electron main for QA (1080×1000, wide window)
  dev-app.cjs    Dev launcher — Vite on 5173 + app Electron
  dev-qa.cjs     Dev launcher — Vite on 5174 + QA Electron
  preload.cjs    Exposes window.budgetApp.isElectron
scripts/
  build-app-variant.cjs  Swaps main/appId/productName in package.json before electron-builder
```

### AnnotationLayer

`AnnotationProvider` now takes a `pageKey: string` prop (NOT `window.location.hash`). `QAShell` owns the current page path and passes it down, so annotation marks are keyed per app page even though the overlay lives in the QA window.

### AppShell

All per-screen layout lives in `AppShell`. Bottom button bars must use `absolute inset-x-0 bottom-0` (NOT `fixed`) to stay inside the phone frame when embedded in the QA bezel.

### Routing

- Hash-based (`createHashRouter`) — required for Electron
- App router: only app routes. No `/qa` branch, no `MobileFrame`, no QA concerns.
- QA sidebar nav is driven by `src/qa/pageManifest.ts` (pure data — no component imports).

## Electron Setup

### App IDs (distinct so both can run simultaneously)

- App: `app.mjproductions.budgii`
- QA: `app.mjproductions.budgii.qa`

### Scripts

| Script               | What it does                                |
| -------------------- | ------------------------------------------- |
| `electron:dev:app`   | Vite dev server + app Electron (hot reload) |
| `electron:dev:qa`    | Vite dev server + QA Electron (hot reload)  |
| `electron:start:app` | Build once + launch app                     |
| `electron:start:qa`  | Build once + launch QA                      |
| `electron:dist:app`  | Build `Budgii` distributable                |
| `electron:dist:qa`   | Build `Budgii QA` distributable             |

`build-app-variant.cjs` swaps `package.json` `main`, `productName`, and `appId` per variant and restores the file after the build.

## Key Decisions & Patterns

- **No comment noise** — comments only for non-obvious WHY (invariants, workarounds), never WHAT.
- **No `fixed` positioning in app pages** — use `absolute` inside `AppShell`'s relative container.
- **`pageManifest.ts` is hand-maintained** — intentionally duplicates the router page list to avoid QA importing app code. Update both when adding/renaming app pages.
- **`electron-builder` output** goes to `release/` (not `dist/`).
- **`dist/`** is Vite's web bundle output (committed to `.gitignore`).
- **Hybrid API + local cache** — when `VITE_API_ENABLED=true`, accounts, households, personas, invites, expenses, receipts, receipt items, profile, notifications, and OCR flows go through the FastAPI backend. `localStorage` remains the Zustand cache/offline fallback for synced config and local-only state.
- **Server-owned vs synced state** — expenses, receipts, receipt items, personas, invites, and user profile are server-owned; categories, tags, budget, income, recurring transactions, alerts, watchlist, deals, and shopping list sync through JSONB chunks.
- **Electron is a wrapper over the same app bundle** — it loads the React app, which may run in API mode or offline/local mode based on env.
- The app's `base: './'` means the iframe `src="./index.html#/path"` resolves correctly in both dev and prod.

## Author

MJ Productions — dev@mjproductions.app
