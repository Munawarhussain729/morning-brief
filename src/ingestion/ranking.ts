import { userInterestWeights } from "@/src/shared/categories";
import type { IngestedArticle } from "@/src/ingestion/types";

const marketingTerms = ["webinar", "limited time", "sponsored", "partner announcement", "case study"];
const lowValueTerms = ["weekly roundup", "newsletter", "podcast", "hiring", "event recap"];

export function scoreArticle(article: IngestedArticle): {
  relevanceScore: number;
  isMarketing: boolean;
  isLowValue: boolean;
  tags: string[];
} {
  const text = `${article.title} ${article.rawSummary ?? ""}`.toLowerCase();
  const tags: string[] = [];
  let score = 1;

  for (const [term, weight] of Object.entries(userInterestWeights)) {
    if (text.includes(term)) {
      score += weight;
      tags.push(term);
    }
  }

  if (article.category === "AI") score += 0.5;
  if (article.category === "CYBERSECURITY" && /\bcve-\d{4}-\d+\b/i.test(text)) score += 1.5;
  if (/\bcritical\b|\brce\b|\bzero[- ]day\b/i.test(text)) score += 1.25;
  if (/\brelease\b|\blaunch\b|\bga\b|\bstable\b/i.test(text)) score += 0.45;

  const isMarketing = marketingTerms.some((term) => text.includes(term));
  const isLowValue = lowValueTerms.some((term) => text.includes(term));

  if (isMarketing) score -= 1.25;
  if (isLowValue) score -= 0.75;

  return {
    relevanceScore: Math.max(0, Number(score.toFixed(2))),
    isMarketing,
    isLowValue,
    tags: Array.from(new Set(tags))
  };
}
