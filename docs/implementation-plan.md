# Implementation Plan

## News Aggregation Pipeline

1. Load source configs from `src/ingestion/sources/catalog.ts`.
2. Fetch each source with bounded concurrency.
3. Retry transient failures.
4. Normalize titles, URLs, summaries, source names, categories, and timestamps.
5. Drop articles outside the configured lookback window.
6. Score each article against user interests and criticality signals.
7. Persist new articles only, using URL and content hashes for deduplication.

## LLM Summarization Workflow

1. Query the top recent, non-marketing, non-low-value articles.
2. Send a compact candidate payload to OpenAI.
3. Instruct the model to remove duplicates, noise, and marketing announcements.
4. Require structured JSON with:
   - Top 5 AI updates
   - Top 5 development updates
   - Top 5 cybersecurity updates
   - Trending tools
   - Suggested learning
   - 3 LinkedIn article ideas
   - 3 LinkedIn post ideas
   - Alert-worthy items
5. Validate the JSON with Zod.
6. Store the generated daily brief and content ideas in SQLite.

## Error Handling

- Source fetch failures are logged and do not fail the whole refresh.
- Refresh runs are persisted with status, counts, and error details.
- OpenAI output is schema-validated.
- Missing API key falls back to deterministic local ranking.

## Testing Strategy

- Unit-test scoring and filtering.
- Unit-test hash stability.
- Add integration tests for refresh orchestration with mocked sources.
- Add UI tests for search, refresh, and history rendering.
