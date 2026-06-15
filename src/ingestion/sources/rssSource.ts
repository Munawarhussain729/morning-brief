import Parser from "rss-parser";
import type { IngestedArticle, NewsSourceConfig } from "@/src/ingestion/types";
import { withRetry } from "@/src/ingestion/retry";

const parser = new Parser({
  requestOptions: {
    headers: {
      "User-Agent": "MorningBrief/0.1 (+https://localhost)",
      Accept: "application/rss+xml, application/xml, text/xml, */*"
    }
  }
});

export async function fetchRssSource(source: NewsSourceConfig): Promise<IngestedArticle[]> {
  const feed = await withRetry(() => parser.parseURL(source.url));

  return feed.items.map((item) => ({
    sourceName: source.name,
    category: source.category,
    title: item.title?.trim() || "Untitled update",
    url: item.link || item.guid || source.url,
    author: item.creator || item.author,
    publishedAt: item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : undefined,
    rawSummary: stripHtml(item.contentSnippet || item.content || item.summary || "")
  }));
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1000);
}
