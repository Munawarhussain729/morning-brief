# Folder Structure

```text
morning-brief/
  app/                         Next.js app router, API routes, layout, pages
  components/                  Reusable React UI components
  desktop/                     Electron main and preload processes
  prisma/                      SQLite schema and migrations
  scripts/                     CLI and packaging helpers
  src/
    briefs/                    Daily brief orchestration and persistence
    config/                    Environment parsing and runtime config
    db/                        Prisma client lifecycle
    ingestion/
      sources/                 Source catalog and per-source adapters
      hash.ts                  Stable article hashing
      ingestor.ts              Fetch, filter, score, and persist pipeline
      ranking.ts               User-interest ranking heuristics
      retry.ts                 Retry helper for transient source failures
    logging/                   Application logging
    notifications/             macOS notification policies
    scheduler/                 Daily and manual refresh jobs
    shared/                    Shared category and ranking constants
    startup/                   macOS launch-at-login services
    summarization/             OpenAI summarization contract and fallback
  tests/
    unit/                      Unit tests for scoring, hashing, and services
  docs/                        Architecture, roadmap, startup, and plans
```

The boundaries are intentionally boring: ingestion does not know about UI, summarization does not own persistence, and Electron only coordinates desktop lifecycle concerns.
