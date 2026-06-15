export const articleCategories = ["AI", "DEVELOPMENT", "CYBERSECURITY", "TECH", "TRENDING_TOOLS"] as const;

export type ArticleCategory = (typeof articleCategories)[number];

export const userInterestWeights = {
  "ai engineering": 1.4,
  agents: 1.35,
  mcp: 1.35,
  openai: 1.3,
  anthropic: 1.25,
  "next.js": 1.3,
  nextjs: 1.3,
  react: 1.25,
  typescript: 1.25,
  node: 1.2,
  bun: 1.15,
  startup: 1.15,
  product: 1.15,
  cybersecurity: 1.3,
  cve: 1.35,
  owasp: 1.25,
  "hack the box": 1.3,
  htb: 1.3,
  nmap: 1.2
} as const;

export const categoryLabels: Record<ArticleCategory, string> = {
  AI: "AI",
  DEVELOPMENT: "Development",
  CYBERSECURITY: "Cybersecurity",
  TECH: "Tech",
  TRENDING_TOOLS: "Trending Tools"
};
