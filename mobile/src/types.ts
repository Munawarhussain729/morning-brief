export type ArticleSource = {
  name: string;
  url: string;
  category: string;
};

export type Article = {
  id: string;
  category: string;
  title: string;
  url: string;
  author?: string | null;
  publishedAt?: string | null;
  fetchedAt: string;
  rawSummary?: string | null;
  relevanceScore: number;
  importanceScore: number;
  tags: string;
  source?: ArticleSource | null;
};

export type BriefItem = {
  id: string;
  section: string;
  rank: number;
  title: string;
  summary: string;
  whyItMatters: string;
  url?: string | null;
  tags: string;
  article?: Article | null;
};

export type ContentIdea = {
  id: string;
  kind: string;
  title: string;
  angle: string;
};

export type DailyBrief = {
  id: string;
  briefDate: string;
  title: string;
  overview: string;
  model: string;
  items: BriefItem[];
  ideas: ContentIdea[];
};

export type BriefHistoryItem = {
  id: string;
  briefDate: string;
  title: string;
  overview: string;
};

export type BriefResponse = {
  brief: DailyBrief | null;
  history: BriefHistoryItem[];
};
