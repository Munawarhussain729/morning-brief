import type { ArticleCategory } from "@/src/shared/categories";

export interface NewsSourceConfig {
  name: string;
  url: string;
  category: ArticleCategory;
  kind: "rss" | "github-trending" | "x-search";
  query?: string;
}

export interface IngestedArticle {
  sourceName: string;
  category: ArticleCategory;
  title: string;
  url: string;
  author?: string;
  publishedAt?: Date;
  rawSummary?: string;
}
