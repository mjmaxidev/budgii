# Budgii Product Roadmap

Last verified against the codebase on 2026-07-09.

This is the current product/release roadmap. It is intentionally stricter than
“the screen exists”: a feature is only production-ready when the frontend flow,
backend/API behavior, persistence, permissions, tests, and operational behavior
are all covered.

## Overall status

Budgii has moved from a local prototype into a real API-backed app. The core
budgeting, household, expense, receipt, settings, and reporting flows are wired.
The remaining work is mostly production hardening: schedulers, real provider
integrations, mobile release setup, stronger CI, better observability, and a few
feature-level polish gaps.

| Area                                              | Status                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| Frontend app shell, navigation, phone layout      | Done                                                                           |
| FastAPI backend, Postgres, auth, sync             | Done                                                                           |
| Normalized expenses, receipts, receipt items      | Done                                                                           |
| Household members, personas, invites, permissions | Mostly done                                                                    |
| Receipt image upload and OpenAI OCR path          | Mostly done                                                                    |
| Reports and insights from real data               | Mostly done                                                                    |
| AI Budget Coach                                   | Done — user-triggered aggregate spending guidance with deterministic fallback |
| Settings panel                                    | Mostly done                                                                    |
| Deals and watchlist                               | Prototype-real hybrid                                                          |
| Recurring transactions                            | Functional foundation                                                          |
| Notifications                                     | In-app notifications and push device registration done; push delivery not done |
| Mobile/Capacitor                                  | Started; release hardening needed                                              |
| Production deployment                             | Not done                                                                       |
| CI/release quality gates                          | Hosted CI config added; needs first remote run                                 |

## Done

### App foundation

- React 18, TypeScript, Vite, Tailwind, Zustand, and hash routing are in place.
- Electron app and QA studio entry points exist.
- Phone-width responsive layout is implemented and small-screen side borders were fixed.
- Main app routes are connected through `src/app/router.tsx`.
- QA studio page manifest exists separately from app routes.
- App lock/PIN is implemented locally and intentionally not synced.
- Demo-only tools are hidden unless `VITE_SHOW_DEMO_TOOLS=true` or API mode is off.

### Backend foundation

- FastAPI service runs under `/v1`.
- PostgreSQL, async SQLAlchemy, Alembic migrations, and Docker Compose are in place.
- Health endpoint exists.
- JWT access tokens and rotating refresh tokens are implemented.
- Email/password registration, login, refresh, logout storage, email verification, password reset, and account deletion exist.
- Apple/Google token verification endpoints exist on the backend.
- API mode is controlled by `VITE_API_ENABLED`.
- Frontend token restore and refresh-on-401 behavior exists.
- Production startup rejects weak/default JWT secrets when debug is off.
- CORS can be locked down via `CORS_ORIGINS`.

### Household, family, and access

- Household creation, list, join, bootstrap, invite creation, invite list, and invite revoke exist.
- Family members are backed by backend personas.
- Household members can be listed, updated, and removed.
- Admin/editor/viewer roles and editor levels exist.
- Permission-gated sync keys are implemented.
- Viewers can pull data and are blocked from writes/admin actions.
- Invite codes are single-use and expiring.
- Email delivery providers for invites are available through Resend/SendGrid env config.
- Dev invite email delivery logs links instead of sending.

### Sync and storage model

- JSONB document sync is implemented for config-like store keys.
- Sync chunks are split by key instead of one huge JSON blob.
- Revision conflict detection exists.
- Frontend debounced sync engine exists.
- `localStorage` remains as offline/cache storage.
- Server-owned entities are normalized instead of stored only in the blob:
  expenses, receipts, receipt items, personas, invites, and user profile.

### Expenses and transactions

- Manual expense create, edit, delete, and list are backed by normalized API endpoints in API mode.
- Transactions page reads hydrated normalized expenses.
- Transaction confirmation route exists for saved expenses.
- Category/tag/member chips resolve from hydrated store data.
- Pagination/load-more UX exists for large transaction histories.

### Budget and reports

- Budget setup is connected to synced store state and flushes to API in API mode.
- Home budget overview uses real expenses and budget state.
- Reports page, spending breakdown, monthly summary, budget comparison, and next-month planning compute from hydrated store data.
- Spending alert evaluation endpoint exists and is used by Home and Spending Alerts.

### Categories and tags

- Category and tag create/edit/delete flows exist.
- Categories/tags sync through JSONB sync.
- Deleting or changing categories/tags remaps dependent expenses, receipt items, budgets, recurring configs, and spending alerts.
- Normalized expenses and receipt items are patched through API when category/tag changes affect server-owned rows.

### Income

- Income tracking page exists.
- Income sources, income items, and ongoing incomes sync through JSONB sync.
- Reports include income data where relevant.

### Receipts and OCR

- Receipt photo upload endpoint stores files on the backend volume.
- Receipt file metadata is stored in Postgres.
- Receipt file serving endpoint exists with auth/household checks.
- Receipt create, update, delete, item create/update/delete, status, and analyze endpoints exist.
- Frontend scan flow supports native Capacitor camera on devices and file upload fallback.
- OpenAI receipt OCR provider exists behind `RECEIPT_OCR_PROVIDER=openai`.
- Deterministic OCR provider exists for tests/dev.
- Scan Receipt and Receipt Results share polling/hydration flow.
- Failed analysis stores and surfaces a clear `analysisError`.
- Receipt Results can retry analysis.
- OCR parser skips obvious non-item rows, handles numeric strings, merges duplicates, and fails clearly when no items are returned.
- Receipt History is backed by hydrated receipt data.

### Account settings

- Account Settings reads/writes backend user profile in API mode.
- Name and email updates persist through `PATCH /users/me`.
- Avatar upload stores a file on the backend volume and serves it through `GET /users/me/avatar`.
- Change password works for email/password accounts.
- Logout clears stored tokens/auth state.
- Delete account endpoint exists.

### Notifications

- Backend generates in-app notification data from spending alerts and deal data.
- Read state is persisted per user/household in `notification_read_states`.
- Mark-one and mark-all-read endpoints exist.
- Frontend Notifications page uses backend read state in API mode and local fallback offline.

### Deals, watchlist, and shopping list

- Watchlist, deal report, deal cards, and shopping list pages exist.
- Watchlist, deals, and shopping list sync through JSONB.
- Backend deal check endpoint updates synced watchlist/deal chunks.
- Frontend Deal Watchlist runs backend deal checks in API mode.
- Deal notifications are generated from backend deal data.

### Recurring transactions

- Recurring transaction settings UI exists.
- Recurring configs sync through JSONB.
- Backend apply endpoint reads due recurring configs and creates normalized expenses.
- Daily, weekly, biweekly, monthly, quarterly, and yearly rules are supported.
- Generated expense IDs are deterministic, so the same due date does not duplicate.
- Frontend applies due recurring transactions during API hydration.
- Backend tests cover idempotency and viewer write blocking.

### Data export and help

- Data Export can download CSV, HTML monthly report, and JSON backup from current hydrated store data.
- Export history is stored locally.
- Help page exists.

### Developer workflow

- Frontend lint, format check, and build scripts exist.
- Backend Ruff lint/format script exists.
- Backend pytest coverage exists for auth sessions, bootstrap, permissions, normalized finance, OCR, notifications, deals, email, config, and monitoring.
- `npm run precommit` runs frontend and backend checks.
- Git hook install script exists via `npm run hooks:install`.
- Dev database reset and mock seeding scripts exist.
- `.env.example`, `.env.production.example`, `budgii-api/.env.example`, and `budgii-api/.env.production.example` exist.

## Remaining and not production-ready

### P0 before any real users

| Item                        | Current state                                                                  | Needed                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Production deploy           | Docker/API/dev compose exists; no live production environment in repo          | Deploy API, managed Postgres or persistent disk, domain, TLS, production envs                                 |
| Production database backups | Not represented in code/docs                                                   | Automated backups, restore test, migration runbook                                                            |
| Secrets management          | Env examples exist                                                             | Real secret manager or deploy-provider secrets; rotate JWT/OAuth/email/OpenAI keys                            |
| Hosted CI                   | Local `scripts/precommit.sh` exists and GitHub Actions workflow has been added | First remote run must pass; decide whether to add pre-commit framework config or keep the existing shell hook |
| OAuth client wiring         | Backend verification exists                                                    | Frontend Apple/Google buttons, mobile/web client IDs, redirect/native setup, QA tests                         |
| Push notifications          | Backend stores per-user device tokens, has a log push provider, filters by type/quiet hours, Preferences requests browser permission, and server compose runs the dispatch worker | Real APNs/FCM provider, native token capture                                    |
| Mobile release setup        | Capacitor docs/config exist; Android native project is tracked; iOS is generated locally/gitignored | iOS/Android signing, Info.plist/manifest automation, push/camera/deep-link native config, release builds      |
| Legal/privacy basics        | Not present                                                                    | Privacy policy, terms, account/data deletion policy, receipt image retention policy                           |

### P1 feature hardening

| Feature                | What works                                                                                                                                                                                                               | What is missing                                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recurring transactions | Config UI, sync, backend apply, idempotent due expense creation, `startDate`, active/paused toggle, next due, last applied metadata, manual preview/apply controls, server compose scheduler services, and admin worker status | Good foundation                                                                                                                |
| Deals/watchlist        | Backend deterministic deal generation from watchlist data                                                                                                                                                                | Real retailer/product source, price history, affiliate/deep links, stale deal expiry, dedupe across stores, confidence/source labels                                                     |
| Receipt OCR            | Upload, OpenAI provider, deterministic provider, retry and failure surfacing                                                                                                                                             | More real receipt QA set, provider cost/rate-limit handling, background worker queue instead of inline/background task only, item tax/discount apportioning, receipt duplicate detection |
| Notifications          | In-app generated notifications, read state, per-user device token registration, push dispatch idempotency, type preferences, quiet hours, server compose dispatch scheduling, and admin worker status                     | Actual APNs/FCM delivery, native token capture, weekly summary generation/sending                                                                                  |
| Email invites          | Provider hooks exist                                                                                                                                                                                                     | Production provider key/domain verification, branded email QA, bounced email/error visibility                                                                                            |
| Family permissions     | Roles and API checks exist                                                                                                                                                                                               | Full UX pass for restricted users, clearer disabled controls/messages, account-holder transfer decision                                                                                  |
| Data export            | Local CSV/HTML/JSON download                                                                                                                                                                                             | API-side export option, import/restore path, PDF export if required, better escaping/sanitization for generated HTML                                                                     |
| Preferences            | Currency/language settings save/sync; notification master/type/quiet-hours settings save/sync; browser notification permission is requested from Preferences                                                              | Currency conversion/exchange rates not implemented; language switch does not provide full i18n; native APNs/FCM permission/token capture is not implemented                              |
| Budget setup           | Synced budget and category allocations                                                                                                                                                                                   | Budget history/versioning, rollovers, per-member budgets if desired                                                                                                                      |
| Income tracking        | Synced income data and reports                                                                                                                                                                                           | Normalized income API if advanced reporting/auditing is needed, recurring income scheduling beyond current ongoing config                                                                |
| Reports                | Computed from hydrated data                                                                                                                                                                                              | Server-side report APIs/caching for large datasets, exportable report snapshots, more empty/error states                                                                                 |
| Shopping list          | Synced list and watchlist-to-list flow                                                                                                                                                                                   | Real store inventory/prices, household collaboration conflict polish, reminders/push                                                                                                     |

### P2 polish and scale

| Area                           | Remaining details                                                                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Sync conflicts                 | Current strategy is key-level last-write-wins after re-pull; richer per-entity merge may be needed for busy households                          |
| Multi-household UI             | API supports multiple households; frontend effectively assumes one active household                                                             |
| Offline-first API mode         | `localStorage` cache exists, but offline mutation queue/conflict UX is not production-grade                                                     |
| Receipt storage                | Local Docker volume is fine for single-host deploy; object storage or shared volume is needed for multi-replica/serverless                      |
| Pagination/incremental hydrate | Expenses/receipts are hydrated into the store; very large accounts may need incremental loading/cache eviction                                  |
| Observability                  | Health, request IDs, and structured logs exist; Sentry/error tracking, metrics, alerting, and audit logs are not fully wired                    |
| Security hardening             | Auth basics, email verification, password reset, auth endpoint rate limiting, and session/device management UI exist; still need stronger distributed brute-force protection |
| Accessibility                  | Needs full keyboard/screen-reader/contrast audit across mobile-sized UI                                                                         |
| Performance                    | Needs production profiling on low-end mobile devices and large seeded datasets                                                                  |
| Test coverage                  | Backend tests are meaningful; frontend component/e2e tests are still missing                                                                    |
| App store readiness            | Needs icons/splash/screenshots, signing, privacy labels, store metadata, and release checklist                                                  |
| Documentation drift            | Initial localStorage-only wording was corrected in `AGENTS.md`, `CLAUDE.md`, and `docs/CAPACITOR.md`; keep docs updated as architecture changes |

## Page-by-page status

| Page                   | Backend/data status                                                                                                        | Production notes                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Login                  | API-backed email login and password reset                                                                                  | Add Apple/Google UI                                                       |
| Onboarding             | API-backed registration and household creation in API mode                                                                 | Phone auth is offline/prototype only; OAuth deferred                      |
| Verification           | API-backed email link request/confirm flow                                                                                 | SMS verification not implemented                                          |
| Home                   | Uses hydrated expenses/budget/profile; evaluates alerts in API mode                                                        | Depends on bootstrap hydration; push alerts not real                      |
| Add Expense            | API-backed create in API mode                                                                                              | Recurring option creates config but no scheduler UI feedback              |
| Add Expense Choice     | Navigation only                                                                                                            | Good                                                                      |
| Scan Receipt           | API upload/analyze in API mode; native camera on Capacitor                                                                 | Physical-device camera and native permissions need release QA             |
| Receipt Results        | API-backed receipt/item review and expense creation                                                                        | More real OCR QA and duplicate/tax/discount handling needed               |
| Receipt History        | Uses hydrated API receipt data                                                                                             | Large-history performance should be watched                               |
| Receipt Image Viewer   | Shows stored receipt image URL                                                                                             | Depends on authenticated file serving/cache behavior                      |
| Item Detail            | API-backed receipt item edit/delete in API mode                                                                            | Good foundation                                                           |
| Transactions           | Uses hydrated normalized expenses                                                                                          | Search/filter are local; server search can come later                     |
| Transaction Confirm    | Reads saved expense                                                                                                        | Good                                                                      |
| Reports                | Uses hydrated store data                                                                                                   | Server-side reports/caching later                                         |
| Spending Breakdown     | Uses hydrated store data                                                                                                   | Good foundation                                                           |
| Monthly Summary        | Uses expenses/income store data                                                                                            | Good foundation                                                           |
| Budget Comparison      | Uses expenses/income store data                                                                                            | Good foundation                                                           |
| Budget Setup           | Synced budget config                                                                                                       | Budget history/rollover not implemented                                   |
| Plan Next Month        | Uses current expenses/budget                                                                                               | Forecasting is local/simple                                               |
| Categories & Tags      | Synced config plus API patches for normalized dependents                                                                   | Good foundation                                                           |
| Family Members         | API-backed personas/member admin                                                                                           | Restricted-user UX needs full QA                                          |
| Family Invitation      | API-backed invites in API mode                                                                                             | Production email/domain QA needed                                         |
| Join Family            | API-backed code redemption in API mode                                                                                     | Native universal/app links not fully configured                           |
| Settings               | Real navigation hub                                                                                                        | Demo reset only appears when allowed                                      |
| Account Settings       | API-backed profile/avatar/password/logout/delete, email verification status, and active session revocation                  | Good foundation                                                           |
| Preferences            | Synced settings with browser notification permission and push type controls                                                 | Native APNs/FCM token capture, full i18n, and currency conversion missing |
| Income Tracking        | Synced JSONB config/data                                                                                                   | Not normalized                                                            |
| Recurring Transactions | Synced config + backend apply-on-hydration, visible schedule status, manual preview/apply controls, backend worker/CLI/server compose scheduler, and admin worker status | Good foundation                                                          |
| Spending Alerts        | Synced config + backend evaluation                                                                                         | Push delivery missing                                                     |
| Deal Watchlist         | Synced watchlist + backend deterministic deal check                                                                        | Real retailer integration missing                                         |
| Today's Deal Report    | Uses generated deal data                                                                                                   | Real source/expiry/confidence missing                                     |
| Deal Cards             | Uses generated deal data                                                                                                   | Good prototype UX; source still synthetic                                 |
| Shopping List          | Synced list                                                                                                                | Real prices/inventory missing                                             |
| Data Export            | Local download from hydrated store                                                                                         | No import/restore or server export                                        |
| Notifications          | API-backed generated notifications/read state                                                                              | Push notifications missing                                                |
| Help                   | Static content                                                                                                             | Keep updated as features mature                                           |

## Recommended next phases

### Phase A — Make the roadmap truthful in tooling

- Done: update `AGENTS.md`, `CLAUDE.md`, and `docs/CAPACITOR.md` to remove localStorage-only wording.
- Done: add hosted CI config for frontend and backend checks.
- Done: add frontend route smoke tests for the highest-value routes.

### Phase B — Production-grade recurring and notifications

- Done: add recurring `startDate`, `enabled`, `lastAppliedAt`, and computed `nextDueDate`.
- Done: add preview/apply-now controls.
- Done: add a backend scheduled job/worker for recurring expenses.
- Done: add push notification device registration, log provider, dispatch worker, type preferences, quiet hours, and browser permission UX.
- Done: add Docker Compose scheduler services for recurring expenses and push dispatch.
- Done: add persisted background job run status and an admin Settings page for worker failures.
- Add APNs/FCM delivery, native token capture, and weekly summary generation.

### Phase C — Real integrations

- Finish Apple/Google OAuth UI and mobile/web client setup.
- Productionize invite email delivery.
- Decide whether deal finder remains deterministic for MVP or gets a real retailer/provider integration.
- Add OpenAI OCR cost/rate-limit handling and a larger real-receipt QA fixture set.

### Phase D — Release readiness

- Deploy production API/database/storage.
- Add backups, monitoring, alerts, and error tracking.
- Complete mobile signing, deep links, camera permissions, store assets, privacy labels, and release checklist.
- Add legal/privacy docs and data retention policy.

## Definition of done for future features

A feature should not be marked production-ready until all of these are true:

- The page/UI flow is connected.
- Data persists across refresh, logout/login, and another device/session where applicable.
- API permissions are enforced and tested.
- Loading, empty, error, and restricted-user states are visible.
- The behavior works in API mode and has an intentional offline/local fallback if needed.
- Backend tests cover core success and failure paths.
- Frontend smoke/e2e coverage exists for critical flows.
- The roadmap/docs no longer describe the old behavior.
