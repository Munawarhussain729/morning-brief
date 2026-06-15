import type { IngestedArticle, NewsSourceConfig } from "@/src/ingestion/types";
import { withRetry } from "@/src/ingestion/retry";

export async function fetchGithubTrending(source: NewsSourceConfig): Promise<IngestedArticle[]> {
  const html = await withRetry(async () => {
    const response = await fetch(source.url, {
      headers: { "User-Agent": "MorningBrief/0.1" }
    });
    if (!response.ok) throw new Error(`GitHub Trending failed: ${response.status}`);
    return response.text();
  });

  const matches = Array.from(html.matchAll(/<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g));

  return matches.slice(0, 15).map((match) => {
    const repoPath = match[1].trim();
    const title = match[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return {
      sourceName: source.name,
      category: source.category,
      title,
      url: `https://github.com${repoPath}`,
      publishedAt: new Date(),
      rawSummary: "Repository trending on GitHub today."
    };
  });
}
