<img width="1183" height="821" alt="morning-brief" src="https://github.com/user-attachments/assets/1d0e0734-c8af-469f-95d1-982b72178121" />


# Morning Brief

Morning Brief is a macOS desktop app for staying current on AI, software development, cybersecurity, trending tools, and learning opportunities without checking multiple platforms every day.

The app collects updates from curated sources, ranks the highest-signal items, generates a daily briefing, and presents everything in a searchable card dashboard. Each card opens into a detail view with source context, summary, relevance, tags, and actions.

## Product Goals

- Help users avoid missing important industry shifts, launches, vulnerabilities, and developer tooling updates.
- Compress many sources into one focused daily workflow.
- Prioritize practical signal over noisy feeds, marketing posts, and low-value roundups.
- Provide enough context to decide whether an update deserves action, reading time, or sharing.

## Key Features

- Daily AI, development, cybersecurity, trending tools, and learning brief.
- Card-based dashboard with section filters, search, and signal metrics.
- Clickable detail drawer for every update with source metadata and full context.
- RSS and GitHub Trending ingestion with retry handling.
- Local SQLite persistence through Prisma.
- OpenAI-powered summarization and LinkedIn content idea generation.
- Electron desktop shell with macOS packaging support.
- Scheduled refresh support for daily brief generation.

## Tech Stack

- Next.js, React, TypeScript, and Tailwind CSS for the UI.
- Electron for the macOS desktop app.
- Prisma and SQLite for local storage.
- Node.js services for ingestion, ranking, summarization, scheduling, and notifications.
- OpenAI API for brief generation and content ideas.

## Getting Started

### Prerequisites

- Node.js 20 or newer.
- npm.
- An OpenAI API key for LLM-generated briefs.

### Install

```bash
npm install
cp .env.example .env
```

Update `.env` with your own values:

```bash
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="your-openai-api-key"
OPENAI_MODEL="gpt-4.1-mini"
X_BEARER_TOKEN="your-x-api-bearer-token"
X_MAX_RESULTS="25"
MORNING_BRIEF_REFRESH_CRON="0 7 * * *"
MORNING_BRIEF_TIMEZONE="Asia/Karachi"
MORNING_BRIEF_LOOKBACK_HOURS="24"
```

Never commit a real `.env` file or API key.

### Initialize The Database

```bash
npm run db:migrate
npm run db:generate
```

This creates the local SQLite database and generates the Prisma client.

### Run The App

```bash
npm run dev
```

This starts the Next.js dev server and launches the Electron desktop app after compiling the Electron entry point.

To run only the web app:

```bash
npm run dev:next
```

Then open `http://localhost:3000`.

## Mobile App

A React Native CLI mobile client is available in `mobile/`. It uses the existing Next.js API routes, so keep the desktop/web backend running and configure `mobile/src/config.ts` for your emulator or phone.

```bash
cd mobile
npm install
npm run android
# or
npm run ios
```

See `mobile/README.md` for physical device setup, release build notes, and API URL details.

## Generating A Brief

Run a refresh from the UI or use:

```bash
npm run refresh
```

The refresh flow:

1. Fetches articles from configured sources.
2. Skips unavailable feeds instead of failing the full run.
3. Scores, filters, and stores new articles.
4. Generates today's brief.
5. Stores cards and content ideas in SQLite.

If the dashboard says `No brief generated yet`, run a refresh and check the terminal for feed or API errors.

## Useful Commands

```bash
npm run dev              # Start Next.js and Electron
npm run dev:next         # Start only the Next.js app
npm run dev:electron     # Build and launch only Electron after Next.js is running
npm run refresh          # Ingest sources and generate today's brief
npm run db:migrate       # Apply Prisma migrations locally
npm run db:generate      # Generate Prisma client
npm run db:studio        # Open Prisma Studio
npm run typecheck        # Run TypeScript checks
npm test                 # Run Vitest tests
npm run build:next       # Build Next.js standalone output
npm run build:electron   # Compile Electron TypeScript
npm run build            # Full packaged production build
```

## Project Structure

```text
app/                  Next.js app routes and API endpoints
components/           React UI components
desktop/              Electron main and preload scripts
docs/                 Architecture and planning documents
prisma/               Prisma schema and migrations
scripts/              CLI scripts, including manual refresh
src/briefs/           Brief generation service
src/config/           Environment validation
src/db/               Prisma client setup
src/ingestion/        Sources, fetchers, ranking, hashing, retry logic
src/notifications/    Desktop notification helpers
src/scheduler/        Refresh scheduling
src/summarization/    OpenAI summarization flow and types
```

## Data Model

The app stores:

- `Source`: curated feed or platform metadata.
- `Article`: ingested update with ranking signals, summary, tags, and source relation.
- `DailyBrief`: one generated brief per day.
- `BriefItem`: user-facing card in a brief section.
- `ContentIdea`: LinkedIn article or post idea.
- `RefreshRun`: refresh status, counts, and errors.

SQLite does not support native Prisma enums, so category and section values are stored as strings and typed in the application layer.

## Environment Variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | SQLite database URL used by Prisma. | `file:./dev.db` |
| `OPENAI_API_KEY` | OpenAI API key for generated briefs. | none |
| `OPENAI_MODEL` | OpenAI model used for summarization. | `gpt-4.1-mini` |
| `X_BEARER_TOKEN` | X API bearer token for recent-search ingestion. If omitted, X sources are skipped. | none |
| `X_MAX_RESULTS` | Max tweets fetched per X source. X API supports 10-100. | `25` |
| `MORNING_BRIEF_REFRESH_CRON` | Daily refresh cron expression. | `0 7 * * *` |
| `MORNING_BRIEF_TIMEZONE` | Timezone for scheduled refresh. | `Asia/Karachi` |
| `MORNING_BRIEF_LOOKBACK_HOURS` | Article lookback window for brief candidates. | `24` |

## Troubleshooting

### Prisma Generate Fails With Datasource `url` Error

Use matching Prisma packages. This project uses Prisma 5.x:

```bash
npm install --save-dev prisma@5.22.0
npm install @prisma/client@5.22.0
npm run db:generate
```

### `DailyBrief` Table Does Not Exist

The database has not been initialized:

```bash
npm run db:migrate
```

### Electron Cannot Find The Main File

Compile the Electron entry point:

```bash
npm run build:electron
```

The `dev` script already runs this before launching Electron.

### No Brief Generated Yet

Run:

```bash
npm run refresh
```

If refresh fails, check:

- `OPENAI_API_KEY` is present and valid.
- The database migration has been applied.
- Network access is available for RSS and GitHub sources.
- Some individual feeds may return `403` or `404`; those should be skipped without blocking the full refresh.

### Next.js Warns About Multiple Lockfiles

Next.js may infer the wrong workspace root if parent directories contain extra lockfiles. Remove unused parent `package-lock.json` files or configure `outputFileTracingRoot` in `next.config.ts`.

## Documentation

- [System architecture](./docs/architecture.md)
- [Folder structure](./docs/folder-structure.md)
- [Development roadmap](./docs/roadmap.md)
- [Implementation plan](./docs/implementation-plan.md)
- [Startup automation](./docs/startup-automation.md)

## Security Notes

- Do not commit `.env` or real API keys.
- Treat generated summaries as assistance, not authoritative reporting.
- Open external links carefully; source feeds are third-party content.
