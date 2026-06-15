# Development Roadmap

## Phase 1: Foundation

- Scaffold Electron, Next.js, TypeScript, Tailwind, Prisma, SQLite.
- Implement source catalog and RSS ingestion.
- Add ranking, filtering, persistence, and daily brief generation.
- Build the first desktop UI with search, refresh, dark mode, and history.

## Phase 2: Quality

- Add integration tests with a test SQLite database.
- Add source health tracking and per-source backoff.
- Add richer deduplication with title similarity and canonical URLs.
- Add settings UI for refresh time, source toggles, and launch-at-login.

## Phase 3: Intelligence

- Add custom user interest tuning.
- Add per-brief feedback and improve future ranking.
- Add deeper GitHub Trending and Product Hunt adapters.
- Add CVE feeds from NVD/CISA KEV and severity-aware security alerts.

## Phase 4: Distribution

- Add signing and notarization.
- Add auto-update.
- Add onboarding and keychain-backed API key storage.
- Add packaged database migration flow.
