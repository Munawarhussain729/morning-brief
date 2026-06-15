import { startOfDay, subHours } from "date-fns";
import type { PrismaClient } from "@prisma/client";
import { env } from "@/src/config/env";
import { OpenAiSummarizer } from "@/src/summarization/openAiSummarizer";
import type { CandidateArticle, GeneratedBrief, GeneratedBriefItem } from "@/src/summarization/types";

type BriefSection = "AI" | "DEVELOPMENT" | "CYBERSECURITY" | "TRENDING_TOOLS" | "LEARNING";

const sectionMap: Record<string, BriefSection> = {
  ai: "AI",
  development: "DEVELOPMENT",
  cybersecurity: "CYBERSECURITY",
  trendingTools: "TRENDING_TOOLS",
  learning: "LEARNING"
};

export class BriefService {
  constructor(
    private readonly db: PrismaClient,
    private readonly summarizer = new OpenAiSummarizer()
  ) {}

  async generateToday(): Promise<string> {
    const candidates = await this.db.article.findMany({
      where: {
        fetchedAt: { gte: subHours(new Date(), env.MORNING_BRIEF_LOOKBACK_HOURS) },
        isMarketing: false,
        isLowValue: false
      },
      include: { source: true },
      orderBy: [{ relevanceScore: "desc" }, { publishedAt: "desc" }],
      take: 80
    });

    const candidateArticles: CandidateArticle[] = candidates.map((article) => ({
      id: article.id,
      category: article.category,
      title: article.title,
      url: article.url,
      source: article.source.name,
      summary: article.rawSummary,
      relevanceScore: article.relevanceScore,
      publishedAt: article.publishedAt
    }));

    const generated = this.removeUnknownArticleIds(
      await this.summarizer.generate(candidateArticles),
      new Set(candidateArticles.map((article) => article.id))
    );

    const briefDate = startOfDay(new Date());
    const brief = await this.db.dailyBrief.upsert({
      where: { briefDate },
      update: {
        title: generated.title,
        overview: generated.overview,
        model: env.OPENAI_MODEL,
        items: { deleteMany: {} },
        ideas: { deleteMany: {} }
      },
      create: {
        briefDate,
        title: generated.title,
        overview: generated.overview,
        model: env.OPENAI_MODEL
      }
    });

    await this.createItems(brief.id, generated.sections.ai, "ai");
    await this.createItems(brief.id, generated.sections.development, "development");
    await this.createItems(brief.id, generated.sections.cybersecurity, "cybersecurity");
    await this.createItems(brief.id, generated.sections.trendingTools, "trendingTools");
    await this.createItems(brief.id, generated.sections.learning, "learning");

    await this.db.contentIdea.createMany({
      data: [
        ...generated.linkedin.articles.map((idea) => ({ briefId: brief.id, kind: "ARTICLE", title: idea.title, angle: idea.angle })),
        ...generated.linkedin.posts.map((idea) => ({ briefId: brief.id, kind: "POST", title: idea.title, angle: idea.angle }))
      ]
    });

    return brief.id;
  }

  async getLatestBrief() {
    return this.db.dailyBrief.findFirst({
      orderBy: { briefDate: "desc" },
      include: {
        items: {
          orderBy: [{ section: "asc" }, { rank: "asc" }],
          include: {
            article: {
              include: {
                source: true
              }
            }
          }
        },
        ideas: { orderBy: { createdAt: "asc" } }
      }
    });
  }

  async getHistory() {
    return this.db.dailyBrief.findMany({
      orderBy: { briefDate: "desc" },
      take: 30,
      select: { id: true, briefDate: true, title: true, overview: true, createdAt: true }
    });
  }

  private async createItems(briefId: string, items: GeneratedBriefItem[], key: keyof typeof sectionMap): Promise<void> {
    await this.db.briefItem.createMany({
      data: items.map((item, index) => ({
        briefId,
        articleId: item.articleId,
        section: sectionMap[key],
        rank: index + 1,
        title: item.title,
        summary: item.summary,
        whyItMatters: item.whyItMatters,
        url: item.url,
        tags: JSON.stringify(item.tags)
      }))
    });
  }

  private removeUnknownArticleIds(generated: GeneratedBrief, candidateIds: Set<string>): GeneratedBrief {
    const normalizeItems = (items: GeneratedBriefItem[]) =>
      items.map((item) => ({
        ...item,
        articleId: item.articleId && candidateIds.has(item.articleId) ? item.articleId : undefined
      }));

    return {
      ...generated,
      sections: {
        ai: normalizeItems(generated.sections.ai),
        development: normalizeItems(generated.sections.development),
        cybersecurity: normalizeItems(generated.sections.cybersecurity),
        trendingTools: normalizeItems(generated.sections.trendingTools),
        learning: normalizeItems(generated.sections.learning)
      }
    };
  }
}
