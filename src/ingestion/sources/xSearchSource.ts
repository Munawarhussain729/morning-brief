import { env } from "@/src/config/env";
import type { IngestedArticle, NewsSourceConfig } from "@/src/ingestion/types";
import { withRetry } from "@/src/ingestion/retry";
import { logger } from "@/src/logging/logger";

interface XSearchResponse {
  data?: Array<{
    id: string;
    text: string;
    created_at?: string;
    author_id?: string;
  }>;
  includes?: {
    users?: Array<{
      id: string;
      name: string;
      username: string;
    }>;
  };
}

export async function fetchXSearchSource(source: NewsSourceConfig): Promise<IngestedArticle[]> {
  if (!env.X_BEARER_TOKEN) {
    logger.info(`Skipping ${source.name}; X_BEARER_TOKEN is not configured`);
    return [];
  }
  if (!source.query) throw new Error(`${source.name} is missing an X search query`);

  const url = new URL("https://api.x.com/2/tweets/search/recent");
  url.searchParams.set("query", source.query);
  url.searchParams.set("max_results", String(env.X_MAX_RESULTS));
  url.searchParams.set("tweet.fields", "created_at,author_id");
  url.searchParams.set("expansions", "author_id");
  url.searchParams.set("user.fields", "name,username");

  const payload = await withRetry(async () => {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.X_BEARER_TOKEN}`,
        "User-Agent": "MorningBrief/0.1"
      }
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`X recent search failed for ${source.name}: ${response.status} ${response.statusText} — ${body}`);
    }
    return response.json() as Promise<XSearchResponse>;
  });

  const usersById = new Map((payload.includes?.users ?? []).map((user) => [user.id, user]));

  return (payload.data ?? []).map((tweet) => {
    const user = tweet.author_id ? usersById.get(tweet.author_id) : undefined;
    const author = user ? `${user.name} (@${user.username})` : undefined;
    const url = user ? `https://x.com/${user.username}/status/${tweet.id}` : `https://x.com/i/web/status/${tweet.id}`;

    return {
      sourceName: source.name,
      category: source.category,
      title: summarizeTweet(tweet.text),
      url,
      author,
      publishedAt: tweet.created_at ? new Date(tweet.created_at) : undefined,
      rawSummary: tweet.text
    };
  });
}

function summarizeTweet(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 180) || "X update";
}
