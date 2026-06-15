# System Architecture

Morning Brief is organized as a local-first desktop application.

## Runtime View

1. Electron launches at macOS login and opens the Morning Brief window.
2. Next.js renders the desktop UI inside Electron.
3. A scheduled Node.js refresh job fetches recent articles from RSS and source-specific adapters.
4. The ingestion pipeline normalizes, scores, filters, deduplicates, and stores articles in SQLite.
5. The summarization workflow sends the highest-signal candidate set to OpenAI.
6. The generated brief, learning recommendations, LinkedIn ideas, and alert-worthy items are stored in SQLite.
7. Electron raises macOS notifications for major AI releases, critical vulnerabilities, and important tooling releases.

## Core Modules

- `src/ingestion`: source catalog, fetch adapters, retry logic, ranking, and article persistence.
- `src/summarization`: OpenAI prompt contract, structured response validation, and no-key fallback.
- `src/briefs`: daily brief orchestration and query API.
- `src/scheduler`: daily refresh jobs and manual refresh entry point.
- `src/notifications`: macOS notification filtering.
- `src/startup`: login item configuration.
- `app`: Next.js routes and desktop UI.
- `electron`: Electron main and preload processes.

## Ranking Strategy

Articles are ranked by category and weighted keyword matches for:

- AI engineering, agents, MCP, OpenAI, Anthropic
- Next.js, React, TypeScript, Node.js, Bun
- Startup and product development
- Cybersecurity, CVEs, OWASP, Nmap, Hack The Box

Marketing and low-value recurring content is down-ranked before the LLM sees candidates. The LLM receives only a compact, scored candidate set and is instructed to remove duplicates and noise.

## Production Notes

- SQLite keeps history local and private.
- Prisma gives typed data access and migration history.
- `OPENAI_API_KEY` is optional in development; the app has a deterministic fallback brief.
- Electron login item settings handle macOS startup launch.
- Scheduled refresh uses `node-cron`; packaging can later be hardened with a LaunchAgent if needed.
