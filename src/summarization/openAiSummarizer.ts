import OpenAI from "openai";
import { z } from "zod";
import { env } from "@/src/config/env";
import { logger } from "@/src/logging/logger";
import type { CandidateArticle, GeneratedBrief } from "@/src/summarization/types";

const briefSchema = z.object({
  title: z.string(),
  overview: z.string(),
  sections: z.object({
    ai: z.array(sectionItemSchema()).max(5),
    development: z.array(sectionItemSchema()).max(5),
    cybersecurity: z.array(sectionItemSchema()).max(5),
    trendingTools: z.array(sectionItemSchema()).max(8),
    learning: z.array(sectionItemSchema()).max(8)
  }),
  linkedin: z.object({
    articles: z.array(contentIdeaSchema()).length(3),
    posts: z.array(contentIdeaSchema()).length(3)
  }),
  alerts: z.array(z.object({
    title: z.string(),
    body: z.string(),
    severity: z.enum(["info", "important", "critical"])
  }))
});

function sectionItemSchema() {
  return z.object({
    articleId: z.string().optional(),
    title: z.string(),
    summary: z.string(),
    whyItMatters: z.string(),
    url: z.string().optional(),
    tags: z.array(z.string())
  });
}

function contentIdeaSchema() {
  return z.object({
    title: z.string(),
    angle: z.string()
  });
}

export class OpenAiSummarizer {
  private readonly client?: OpenAI;

  constructor() {
    this.client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : undefined;
  }

  async generate(candidates: CandidateArticle[]): Promise<GeneratedBrief> {
    if (!this.client) {
      return fallbackBrief(candidates);
    }

    try {
      const response = await this.client.chat.completions.create({
        model: env.OPENAI_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You generate terse, high-signal morning briefings for a senior software engineer and team lead. Remove duplicates, marketing announcements, low-value roundups, and minor posts. Prioritize AI engineering, Next.js, React, TypeScript, Node.js backend development, startup/product development, cybersecurity, and Hack The Box learning."
          },
          {
            role: "user",
            content: JSON.stringify({
              instructions: {
                output: "Strict JSON matching title, overview, sections, linkedin, alerts.",
                sectionLimits: {
                  ai: 5,
                  development: 5,
                  cybersecurity: 5,
                  trendingTools: 8,
                  learning: 8
                },
                linkedinIdeas: "Exactly 3 articles and exactly 3 posts.",
                alertCriteria: "Only major AI model releases, critical vulnerabilities, and important developer tooling releases."
              },
              candidates: candidates.map((candidate) => ({
                id: candidate.id,
                category: candidate.category,
                title: candidate.title,
                url: candidate.url,
                source: candidate.source,
                summary: candidate.summary,
                relevanceScore: candidate.relevanceScore,
                publishedAt: candidate.publishedAt
              }))
            })
          }
        ]
      });

      const content = response.choices[0]?.message.content;
      if (!content) throw new Error("OpenAI returned an empty briefing.");
      return briefSchema.parse(JSON.parse(content));
    } catch (error) {
      logger.warn("OpenAI summarization failed; using deterministic fallback brief", error);
      return fallbackBrief(candidates);
    }
  }
}

function fallbackBrief(candidates: CandidateArticle[]): GeneratedBrief {
  const byCategory = (category: string) =>
    candidates
      .filter((candidate) => candidate.category === category)
      .slice(0, 5)
      .map((candidate) => ({
        articleId: candidate.id,
        title: candidate.title,
        summary: candidate.summary || "New update detected from a tracked source.",
        whyItMatters: "Review this because it matches your configured engineering and security interests.",
        url: candidate.url,
        tags: [candidate.source]
      }));

  return {
    title: "Today's Morning Brief",
    overview: "OpenAI API key is not configured, so this deterministic brief ranks recent articles without LLM synthesis.",
    sections: {
      ai: byCategory("AI"),
      development: byCategory("DEVELOPMENT"),
      cybersecurity: byCategory("CYBERSECURITY"),
      trendingTools: candidates.filter((candidate) => candidate.category === "TRENDING_TOOLS").slice(0, 8).map((candidate) => ({
        articleId: candidate.id,
        title: candidate.title,
        summary: candidate.summary || "Tool or repository worth reviewing.",
        whyItMatters: "Potentially useful for engineering, product, or automation workflows.",
        url: candidate.url,
        tags: [candidate.source]
      })),
      learning: [
        {
          title: "MCP Protocol",
          summary: "Track how agent tooling is standardizing context and tool access.",
          whyItMatters: "It is increasingly relevant to AI engineering workflows.",
          tags: ["ai engineering", "agents"]
        },
        {
          title: "Security release triage",
          summary: "Practice turning CVE announcements into exploitability and remediation notes.",
          whyItMatters: "This sharpens team lead incident judgment.",
          tags: ["cybersecurity", "htb"]
        }
      ]
    },
    linkedin: {
      articles: [
        { title: "How I Triage AI Engineering News Without Drowning in Noise", angle: "Explain the signal filters behind your daily workflow." },
        { title: "What Team Leads Should Watch in Modern TypeScript Tooling", angle: "Connect framework releases to delivery risk." },
        { title: "From CVE Headlines to Engineering Action", angle: "Show a practical vulnerability triage checklist." }
      ],
      posts: [
        { title: "The best engineering news is actionable, not loud.", angle: "Short reflection on signal over noise." },
        { title: "One AI tool I am evaluating this week", angle: "Invite discussion around practical adoption." },
        { title: "Security learning compounds when you write incident notes.", angle: "Tie HTB practice to team readiness." }
      ]
    },
    alerts: []
  };
}
