import { subHours } from "date-fns";
import type { PrismaClient } from "@prisma/client";
import { env } from "@/src/config/env";
import { articleHash } from "@/src/ingestion/hash";
import { scoreArticle } from "@/src/ingestion/ranking";
import { newsSources } from "@/src/ingestion/sources/catalog";
import { fetchGithubTrending } from "@/src/ingestion/sources/githubTrendingSource";
import { fetchRssSource } from "@/src/ingestion/sources/rssSource";
import { fetchXSearchSource } from "@/src/ingestion/sources/xSearchSource";
import type { IngestedArticle, NewsSourceConfig } from "@/src/ingestion/types";
import { logger } from "@/src/logging/logger";

export interface IngestionResult {
  seen: number;
  stored: number;
}

export class NewsIngestor {
  constructor(private readonly db: PrismaClient) {}

  async ingestRecent(): Promise<IngestionResult> {
    const refreshRun = await this.db.refreshRun.create({ data: { status: "RUNNING" } });
    const cutoff = subHours(new Date(), env.MORNING_BRIEF_LOOKBACK_HOURS);
    try {
      const batches = await runWithConcurrency(newsSources, 4, (source) => this.fetchSourceSafely(source));
      const articles = batches.flat().filter((article) => {
        return !article.publishedAt || article.publishedAt >= cutoff;
      });

      let stored = 0;
      for (const article of articles) {
        const didStore = await this.persist(article);
        if (didStore) stored += 1;
      }

      await this.db.refreshRun.update({
        where: { id: refreshRun.id },
        data: { status: "COMPLETED", finishedAt: new Date(), articlesSeen: articles.length, articlesStored: stored }
      });

      return { seen: articles.length, stored };
    } catch (error) {
      await this.db.refreshRun.update({
        where: { id: refreshRun.id },
        data: { status: "FAILED", finishedAt: new Date(), error: error instanceof Error ? error.message : String(error) }
      });
      throw error;
    }
  }

  private async fetchSourceSafely(source: NewsSourceConfig): Promise<IngestedArticle[]> {
    try {
      if (source.kind === "github-trending") return await fetchGithubTrending(source);
      if (source.kind === "x-search") return await fetchXSearchSource(source);
      return await fetchRssSource(source);
    } catch (error) {
      logger.warn(`Failed to fetch ${source.name}`, error);
      return [];
    }
  }

  private async persist(article: IngestedArticle): Promise<boolean> {
    const source = await this.db.source.upsert({
      where: { name: article.sourceName },
      update: { url: newsSources.find((item) => item.name === article.sourceName)?.url ?? article.url },
      create: {
        name: article.sourceName,
        url: newsSources.find((item) => item.name === article.sourceName)?.url ?? article.url,
        category: article.category
      }
    });

    const scored = scoreArticle(article);
    const contentHash = articleHash(article.title, article.url);

    const existing = await this.db.article.findFirst({
      where: { OR: [{ url: article.url }, { contentHash }] },
      select: { id: true }
    });

    if (existing) return false;

    await this.db.article.create({
      data: {
        sourceId: source.id,
        category: article.category,
        title: article.title,
        url: article.url,
        author: article.author,
        publishedAt: article.publishedAt,
        rawSummary: article.rawSummary,
        contentHash,
        relevanceScore: scored.relevanceScore,
        importanceScore: scored.relevanceScore,
        isMarketing: scored.isMarketing,
        isLowValue: scored.isLowValue,
        tags: JSON.stringify(scored.tags)
      }
    });

    return true;
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function runNext(): Promise<void> {
    const current = index;
    index += 1;
    if (current >= items.length) return;
    results[current] = await worker(items[current]);
    await runNext();
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runNext));
  return results;
}
