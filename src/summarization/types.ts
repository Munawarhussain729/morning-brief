export interface CandidateArticle {
  id: string;
  category: string;
  title: string;
  url: string;
  source: string;
  summary?: string | null;
  relevanceScore: number;
  publishedAt?: Date | null;
}

export interface GeneratedBrief {
  title: string;
  overview: string;
  sections: {
    ai: GeneratedBriefItem[];
    development: GeneratedBriefItem[];
    cybersecurity: GeneratedBriefItem[];
    trendingTools: GeneratedBriefItem[];
    learning: GeneratedBriefItem[];
  };
  linkedin: {
    articles: GeneratedContentIdea[];
    posts: GeneratedContentIdea[];
  };
  alerts: GeneratedAlert[];
}

export interface GeneratedBriefItem {
  articleId?: string;
  title: string;
  summary: string;
  whyItMatters: string;
  url?: string;
  tags: string[];
}

export interface GeneratedContentIdea {
  title: string;
  angle: string;
}

export interface GeneratedAlert {
  title: string;
  body: string;
  severity: "info" | "important" | "critical";
}
