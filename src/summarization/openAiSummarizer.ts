import OpenAI from "openai";
import { z } from "zod";
import { env } from "@/src/config/env";
import { logger } from "@/src/logging/logger";
import type {
	CandidateArticle,
	GeneratedBrief,
} from "@/src/summarization/types";

const briefSchema = z.object({
	title: z.string(),
	overview: z.string(),
	sections: z.object({
		ai: z.array(sectionItemSchema()).max(5),
		development: z.array(sectionItemSchema()).max(5),
		cybersecurity: z.array(sectionItemSchema()).max(5),
		trendingTools: z.array(sectionItemSchema()).max(8),
		learning: z.array(sectionItemSchema()).max(8),
	}),
	linkedin: z.object({
		articles: z.array(contentIdeaSchema()).length(3),
		posts: z.array(contentIdeaSchema()).length(3),
	}),
	alerts: z.array(
		z.object({
			title: z.string(),
			body: z.string(),
			severity: z.enum(["info", "important", "critical"]),
		}),
	),
});

function sectionItemSchema() {
	return z.object({
		articleId: z
			.string()
			.nullable()
			.optional()
			.transform((value) => value ?? undefined),
		title: z.string(),
		summary: z.string(),
		whyItMatters: z.string(),
		url: z
			.string()
			.nullable()
			.optional()
			.transform((value) => value ?? undefined),
		tags: z.array(z.string()),
	});
}

function contentIdeaSchema() {
	return z.object({
		title: z.string(),
		angle: z.string(),
	});
}

const sectionItemJsonSchema = {
	type: "object",
	additionalProperties: false,
	required: ["articleId", "title", "summary", "whyItMatters", "url", "tags"],
	properties: {
		articleId: { anyOf: [{ type: "string" }, { type: "null" }] },
		title: { type: "string" },
		summary: { type: "string" },
		whyItMatters: { type: "string" },
		url: { anyOf: [{ type: "string" }, { type: "null" }] },
		tags: {
			type: "array",
			items: { type: "string" },
		},
	},
};

const contentIdeaJsonSchema = {
	type: "object",
	additionalProperties: false,
	required: ["title", "angle"],
	properties: {
		title: { type: "string" },
		angle: { type: "string" },
	},
};

const alertJsonSchema = {
	type: "object",
	additionalProperties: false,
	required: ["title", "body", "severity"],
	properties: {
		title: { type: "string" },
		body: { type: "string" },
		severity: { type: "string", enum: ["info", "important", "critical"] },
	},
};

const briefResponseFormat = {
	type: "json_schema" as const,
	json_schema: {
		name: "morning_brief",
		strict: true,
		schema: {
			type: "object",
			additionalProperties: false,
			required: ["title", "overview", "sections", "linkedin", "alerts"],
			properties: {
				title: { type: "string" },
				overview: { type: "string" },
				sections: {
					type: "object",
					additionalProperties: false,
					required: [
						"ai",
						"development",
						"cybersecurity",
						"trendingTools",
						"learning",
					],
					properties: {
						ai: { type: "array", maxItems: 5, items: sectionItemJsonSchema },
						development: {
							type: "array",
							maxItems: 5,
							items: sectionItemJsonSchema,
						},
						cybersecurity: {
							type: "array",
							maxItems: 5,
							items: sectionItemJsonSchema,
						},
						trendingTools: {
							type: "array",
							maxItems: 8,
							items: sectionItemJsonSchema,
						},
						learning: {
							type: "array",
							maxItems: 8,
							items: sectionItemJsonSchema,
						},
					},
				},
				linkedin: {
					type: "object",
					additionalProperties: false,
					required: ["articles", "posts"],
					properties: {
						articles: {
							type: "array",
							minItems: 3,
							maxItems: 3,
							items: contentIdeaJsonSchema,
						},
						posts: {
							type: "array",
							minItems: 3,
							maxItems: 3,
							items: contentIdeaJsonSchema,
						},
					},
				},
				alerts: {
					type: "array",
					items: alertJsonSchema,
				},
			},
		},
	},
};

export class OpenAiSummarizer {
	private readonly client?: OpenAI;

	constructor() {
		this.client = env.OPENAI_API_KEY
			? new OpenAI({ apiKey: env.OPENAI_API_KEY })
			: undefined;
	}

	async generate(candidates: CandidateArticle[]): Promise<GeneratedBrief> {
		if (!this.client) {
			return fallbackBrief(
				candidates,
				"OpenAI API key is not configured, so this deterministic brief ranks recent articles without LLM synthesis.",
			);
		}

		try {
			const response = await this.client.chat.completions.create({
				model: env.OPENAI_MODEL,
				temperature: 0.2,
				response_format: briefResponseFormat,
				messages: [
					{
						role: "system",
						content:
							"You generate terse, high-signal morning briefings for a senior software engineer and team lead. Remove duplicates, marketing announcements, low-value roundups, and minor posts. Prioritize AI engineering, Next.js, React, TypeScript, Node.js backend development, startup/product development, cybersecurity, and Hack The Box learning. Return only data that matches the required schema. Use null for unavailable articleId or url values.",
					},
					{
						role: "user",
						content: JSON.stringify({
							instructions: {
								output:
									"Strict JSON matching title, overview, sections, linkedin, alerts.",
								summaryStyle:
									"For every news/tool item, write a concrete 2-3 sentence summary that includes what happened, who/what it affects, and the most relevant source detail. Do not write vague summaries like 'new update detected'.",
								sectionLimits: {
									ai: 5,
									development: 5,
									cybersecurity: 5,
									trendingTools: 8,
									learning: 8,
								},
								linkedinIdeas: "Exactly 3 articles and exactly 3 posts.",
								alertCriteria:
									"Only major AI model releases, critical vulnerabilities, and important developer tooling releases.",
							},
							candidates: candidates.map((candidate) => ({
								id: candidate.id,
								category: candidate.category,
								title: candidate.title,
								url: candidate.url,
								source: candidate.source,
								summary: candidate.summary,
								relevanceScore: candidate.relevanceScore,
								publishedAt: candidate.publishedAt,
							})),
						}),
					},
				],
			});

			const content = response.choices[0]?.message.content;
			if (!content) throw new Error("OpenAI returned an empty briefing.");
			return briefSchema.parse(JSON.parse(content));
		} catch (error) {
			logger.warn(
				"OpenAI summarization failed; using deterministic fallback brief",
				error,
			);
			return fallbackBrief(
				candidates,
				"OpenAI summarization failed, so this deterministic brief ranks recent articles without LLM synthesis.",
			);
		}
	}
}

function fallbackBrief(
	candidates: CandidateArticle[],
	overview: string,
): GeneratedBrief {
	const byCategory = (category: string) =>
		candidates
			.filter((candidate) => candidate.category === category)
			.slice(0, 5)
			.map((candidate) => ({
				articleId: candidate.id,
				title: candidate.title,
				summary: candidate.summary
					? `${candidate.summary}`
					: `${candidate.source} published this update. Open the source link for the full context while Morning Brief continues tracking related signals.`,
				whyItMatters: whyItMattersFor(candidate),
				url: candidate.url,
				tags: [candidate.source],
			}));

	return {
		title: "Today's Morning Brief",
		overview,
		sections: {
			ai: byCategory("AI"),
			development: byCategory("DEVELOPMENT"),
			cybersecurity: byCategory("CYBERSECURITY"),
			trendingTools: candidates
				.filter((candidate) => candidate.category === "TRENDING_TOOLS")
				.slice(0, 8)
				.map((candidate) => ({
					articleId: candidate.id,
					title: candidate.title,
					summary: candidate.summary
						? `${candidate.summary}`
						: `${candidate.source} surfaced this tool or repository as a current trend. Open the source link to inspect use cases, maturity, and fit for your workflow.`,
					whyItMatters: whyItMattersFor(candidate),
					url: candidate.url,
					tags: [candidate.source],
				})),
			learning: [
				{
					title: "MCP Protocol",
					summary:
						"Track how agent tooling is standardizing context and tool access.",
					whyItMatters:
						"It is increasingly relevant to AI engineering workflows.",
					tags: ["ai engineering", "agents"],
				},
				{
					title: "Security release triage",
					summary:
						"Practice turning CVE announcements into exploitability and remediation notes.",
					whyItMatters: "This sharpens team lead incident judgment.",
					tags: ["cybersecurity", "htb"],
				},
			],
		},
		linkedin: {
			articles: [
				{
					title: "How I Triage AI Engineering News Without Drowning in Noise",
					angle: "Explain the signal filters behind your daily workflow.",
				},
				{
					title: "What Team Leads Should Watch in Modern TypeScript Tooling",
					angle: "Connect framework releases to delivery risk.",
				},
				{
					title: "From CVE Headlines to Engineering Action",
					angle: "Show a practical vulnerability triage checklist.",
				},
			],
			posts: [
				{
					title: "The best engineering news is actionable, not loud.",
					angle: "Short reflection on signal over noise.",
				},
				{
					title: "One AI tool I am evaluating this week",
					angle: "Invite discussion around practical adoption.",
				},
				{
					title: "Security learning compounds when you write incident notes.",
					angle: "Tie HTB practice to team readiness.",
				},
			],
		},
		alerts: [],
	};
}

function whyItMattersFor(candidate: CandidateArticle): string {
	if (candidate.category === "CYBERSECURITY") {
		return "Useful for vulnerability awareness, defensive prioritization, and deciding what deserves deeper lab practice or team follow-up.";
	}
	if (candidate.category === "AI") {
		return "Relevant to AI engineering direction, agent workflows, model capability changes, or product opportunities worth evaluating.";
	}
	if (candidate.category === "DEVELOPMENT") {
		return "Relevant to framework, runtime, or tooling decisions that can affect delivery speed, architecture, or developer experience.";
	}
	return "Potentially useful for engineering, product, automation, or startup workflow experiments.";
}
