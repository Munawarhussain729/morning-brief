import type { NewsSourceConfig } from "@/src/ingestion/types";

export const newsSources: NewsSourceConfig[] = [
  { name: "OpenAI News", url: "https://openai.com/news/rss.xml", category: "AI", kind: "rss" },
  { name: "Anthropic News", url: "https://www.anthropic.com/news/rss.xml", category: "AI", kind: "rss" },
  { name: "Google DeepMind Blog", url: "https://deepmind.google/discover/blog/rss.xml", category: "AI", kind: "rss" },
  { name: "Meta AI Blog", url: "https://ai.meta.com/blog/rss/", category: "AI", kind: "rss" },
  { name: "Hugging Face Blog", url: "https://huggingface.co/blog/feed.xml", category: "AI", kind: "rss" },
  { name: "Perplexity Blog", url: "https://www.perplexity.ai/hub/blog/rss.xml", category: "AI", kind: "rss" },
  { name: "Next.js Blog", url: "https://nextjs.org/feed.xml", category: "DEVELOPMENT", kind: "rss" },
  { name: "React Blog", url: "https://react.dev/rss.xml", category: "DEVELOPMENT", kind: "rss" },
  { name: "TypeScript Blog", url: "https://devblogs.microsoft.com/typescript/feed/", category: "DEVELOPMENT", kind: "rss" },
  { name: "Node.js Blog", url: "https://nodejs.org/en/feed/blog.xml", category: "DEVELOPMENT", kind: "rss" },
  { name: "Bun Blog", url: "https://bun.sh/blog/feed.xml", category: "DEVELOPMENT", kind: "rss" },
  { name: "Vercel Blog", url: "https://vercel.com/atom", category: "DEVELOPMENT", kind: "rss" },
  { name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews", category: "CYBERSECURITY", kind: "rss" },
  { name: "Hack The Box Blog", url: "https://www.hackthebox.com/blog/rss.xml", category: "CYBERSECURITY", kind: "rss" },
  { name: "OWASP Blog", url: "https://owasp.org/index.xml", category: "CYBERSECURITY", kind: "rss" },
  { name: "Nmap Releases", url: "https://nmap.org/changelog.xml", category: "CYBERSECURITY", kind: "rss" },
  { name: "Google Security Blog", url: "https://security.googleblog.com/feeds/posts/default", category: "CYBERSECURITY", kind: "rss" },
  { name: "Hacker News", url: "https://news.ycombinator.com/rss", category: "TECH", kind: "rss" },
  { name: "Product Hunt", url: "https://www.producthunt.com/feed", category: "TRENDING_TOOLS", kind: "rss" },
  { name: "GitHub Trending", url: "https://github.com/trending", category: "TRENDING_TOOLS", kind: "github-trending" },
  {
    name: "X AI Engineering",
    url: "https://x.com/search?q=ai%20engineering",
    category: "AI",
    kind: "x-search",
    query: '(("AI engineering" OR "LLM" OR "agents" OR "MCP" OR "OpenAI" OR "Anthropic") (launch OR release OR shipped OR research OR benchmark)) lang:en -is:retweet -is:reply'
  },
  {
    name: "X Developer Tooling",
    url: "https://x.com/search?q=developer%20tooling",
    category: "DEVELOPMENT",
    kind: "x-search",
    query: '(("Next.js" OR React OR TypeScript OR Node.js OR Bun OR Vercel) (release OR launch OR stable OR beta OR performance)) lang:en -is:retweet -is:reply'
  },
  {
    name: "X Cybersecurity",
    url: "https://x.com/search?q=cybersecurity",
    category: "CYBERSECURITY",
    kind: "x-search",
    query: '((CVE OR vulnerability OR "zero day" OR exploit OR ransomware) (critical OR patch OR disclosed OR detected)) lang:en -is:retweet -is:reply'
  }
];
