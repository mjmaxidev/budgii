# Budgii Roadmap

Budgii has a working React/Electron/Capacitor client and FastAPI/Postgres backend. The current priority is proving the production and mobile paths rather than adding more local-only features.

## Working now

- Email/password authentication, sessions, verification, password reset, and Google web sign-in
- Household roles, personas, invitations, profile management, and API permissions
- Synced budgets, categories, tags, income, recurring transactions, alerts, watchlists, deals, and shopping lists
- Server-owned expenses, receipts, receipt items, OCR analysis, and receipt-image storage
- OpenAI receipt OCR with deterministic development fallback
- Push device registration, FCM provider, native token capture, preferences, quiet hours, and dispatch worker
- Recurring transaction worker and background-job status
- Android Capacitor project, camera support, deep-link handling, and mobile release checklist
- One shared Docker Compose stack driven by `.env.backend` and `.env.frontend`

## Next

### 1. Validate mobile integrations

- Test FCM delivery on physical Android and iOS devices
- Finish Apple Sign-In identifiers, capabilities, and native flow
- Complete Google sign-in QA on web and mobile
- Host Android and Apple association files on `budgii.com.au`
- Verify invite, verification, and password-reset deep links end to end

### 2. Deploy safely

- Deploy the API, frontend, Postgres, and receipt volume
- Configure `budgii.com.au` and `api.budgii.com.au` with TLS
- Store production secrets outside Git
- Automate database backups and perform a restore test
- Add error tracking, metrics, alerts, and migration/runbook documentation

### 3. Release mobile apps

- Configure Android upload signing and Play App Signing
- Configure the Apple team, provisioning profiles, and App Store Connect
- Finalize icons, splash screens, screenshots, store copy, and privacy labels
- Test camera, push, OAuth, deep links, and account recovery on real devices
- Produce signed Android and iOS release builds

### 4. Harden existing features

- Test OpenAI OCR against a representative real-receipt set
- Add OCR cost/rate-limit handling and duplicate-receipt detection
- Productionize invite email delivery and bounce/error visibility
- QA restricted household roles and disabled-state messaging
- Add frontend end-to-end coverage for authentication, expenses, receipts, and invites

### 5. Legal and data lifecycle

- Publish privacy policy and terms
- Define account and household deletion behavior
- Define receipt-image retention and deletion
- Document data export and support processes

## Later

- Real retailer deal providers and price history
- Multi-household switching
- Offline mutation queue and richer conflict resolution
- Budget history and rollover
- Full internationalization and currency conversion
- Server-side reporting and large-dataset pagination

## Release gate

Before inviting real users, Budgii must have a live production deployment, backups with a tested restore, managed secrets, real-device push/OAuth/deep-link QA, signed mobile builds, monitoring, and published legal/data-retention policies.
