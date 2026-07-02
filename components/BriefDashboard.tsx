"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  Bug,
  CalendarDays,
  Clock3,
  Code2,
  ExternalLink,
  Lightbulb,
  Moon,
  Newspaper,
  RefreshCw,
  Search,
  ShieldAlert,
  Sun,
  Target,
  TrendingUp,
  Wrench,
  X,
  type LucideIcon
} from "lucide-react";

type ArticleSource = {
  name: string;
  url: string;
  category: string;
};

type Article = {
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

type BriefItem = {
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

type ContentIdea = {
  id: string;
  kind: string;
  title: string;
  angle: string;
};

type DailyBrief = {
  id: string;
  briefDate: string;
  title: string;
  overview: string;
  model: string;
  items: BriefItem[];
  ideas: ContentIdea[];
};

type BriefResponse = {
  brief: DailyBrief | null;
  history: Array<{ id: string; briefDate: string; title: string; overview: string }>;
};

const sections = [
  { key: "AI", title: "AI", subtitle: "Models, agents, research and product moves", icon: Brain },
  { key: "DEVELOPMENT", title: "Development", subtitle: "Frameworks, languages, platforms and tooling", icon: Code2 },
  { key: "CYBERSECURITY", title: "Cybersecurity", subtitle: "Vulnerabilities, incidents and defensive signals", icon: Bug },
  { key: "TRENDING_TOOLS", title: "Trending Tools", subtitle: "Products, repositories and workflow upgrades", icon: Wrench },
  { key: "LEARNING", title: "Learning", subtitle: "What to practice or study next", icon: BookOpen }
];

const allSectionsKey = "ALL";
const allSourcesKey = "__all_sources__";

export function BriefDashboard() {
  const [data, setData] = useState<BriefResponse>({ brief: null, history: [] });
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState(allSectionsKey);
  const [activeSource, setActiveSource] = useState(allSourcesKey);
  const [selectedItem, setSelectedItem] = useState<BriefItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    void loadBrief();
  }, []);

  const allItems = data.brief?.items ?? [];
  const sectionCounts = useMemo(() => {
    return sections.reduce<Record<string, number>>((counts, section) => {
      counts[section.key] = allItems.filter((item) => item.section === section.key).length;
      return counts;
    }, {});
  }, [allItems]);

  const allSourceNames = useMemo(() => {
    const names = new Set<string>();
    allItems.forEach((item) => {
      if (item.article?.source?.name) names.add(item.article.source.name);
    });
    return Array.from(names).sort();
  }, [allItems]);

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allItems.forEach((item) => {
      const name = item.article?.source?.name ?? "";
      counts[name] = (counts[name] ?? 0) + 1;
    });
    return counts;
  }, [allItems]);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allItems.filter((item) => {
      const tags = safeTags(item.tags).join(" ");
      const source = item.article?.source?.name ?? "";
      const matchesSection = activeSection === allSectionsKey || item.section === activeSection;
      const matchesSource = activeSource === allSourcesKey || source === activeSource;
      const matchesQuery = !needle || `${item.title} ${item.summary} ${item.whyItMatters} ${tags} ${source}`.toLowerCase().includes(needle);
      return matchesSection && matchesSource && matchesQuery;
    });
  }, [activeSection, activeSource, allItems, query]);

  const metrics = useMemo(() => {
    const sourceNames = new Set(allItems.map((item) => item.article?.source?.name).filter(Boolean));
    const urgentItems = allItems.filter((item) => isUrgent(item)).length;
    return [
      { label: "Signals", value: allItems.length, helper: "ranked updates", icon: Newspaper },
      { label: "Sources", value: sourceNames.size, helper: "platforms scanned", icon: Target },
      { label: "Watchlist", value: urgentItems, helper: "security or launch risks", icon: ShieldAlert },
      { label: "Ideas", value: data.brief?.ideas.length ?? 0, helper: "content prompts", icon: Lightbulb }
    ];
  }, [allItems, data.brief?.ideas.length]);

  async function loadBrief() {
    const response = await fetch("/api/brief", { cache: "no-store" });
    setData(await response.json());
  }

  async function refresh() {
    setIsRefreshing(true);
    try {
      if (window.morningBrief?.refresh) {
        await window.morningBrief.refresh();
      } else {
        await fetch("/api/refresh", { method: "POST" });
      }
      await loadBrief();
    } finally {
      setIsRefreshing(false);
    }
  }

  async function openUrl(url?: string | null) {
    if (!url) return;
    if (window.morningBrief?.openExternal) {
      await window.morningBrief.openExternal(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="min-h-screen px-4 pb-8 pt-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden self-start rounded-3xl border border-black/10 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10 lg:sticky lg:top-5 lg:block">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-signal dark:text-teal-300">Morning Brief</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Stay ahead of the race</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Your daily operating view for AI, software, security and tools without checking ten platforms.
            </p>
          </div>

          <nav className="space-y-2">
            <SectionButton
              active={activeSection === allSectionsKey}
              count={allItems.length}
              icon={TrendingUp}
              title="All Signals"
              onClick={() => setActiveSection(allSectionsKey)}
            />
            {sections.map((section) => (
              <SectionButton
                key={section.key}
                active={activeSection === section.key}
                count={sectionCounts[section.key] ?? 0}
                icon={section.icon}
                title={section.title}
                onClick={() => setActiveSection(section.key)}
              />
            ))}
          </nav>

          <div className="mt-6 border-t border-black/10 pt-5 dark:border-white/10">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <CalendarDays size={16} />
              Recent Briefs
            </div>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {data.history.slice(0, 6).map((brief) => (
                <div key={brief.id} className="rounded-2xl bg-black/[0.03] px-3 py-2 dark:bg-white/10">
                  <p className="font-medium text-graphite dark:text-white">{formatDate(brief.briefDate)}</p>
                  <p className="line-clamp-2 text-xs leading-5">{brief.title}</p>
                </div>
              ))}
              {data.history.length === 0 ? <p>No brief history yet.</p> : null}
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="sticky top-0 z-20 -mx-2 mb-5 flex items-center gap-3 bg-mist/80 px-2 py-3 backdrop-blur dark:bg-ink/80">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search updates, sources, tags..."
                className="h-12 w-full rounded-2xl border border-black/10 bg-white/85 pl-11 pr-4 text-sm outline-none ring-signal/20 transition focus:ring-4 dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <button
              type="button"
              title="Refresh"
              onClick={refresh}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-signal px-4 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
              disabled={isRefreshing}
            >
              <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              title="Toggle theme"
              onClick={() => setDarkMode((value) => !value)}
              className="grid h-12 w-12 place-items-center rounded-2xl border border-black/10 bg-white/85 dark:border-white/10 dark:bg-white/10"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <header className="overflow-hidden rounded-[2rem] border border-black/10 bg-white/75 shadow-mac backdrop-blur dark:border-white/10 dark:bg-white/10">
            <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-8">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {data.brief ? formatDate(data.brief.briefDate) : "No brief generated yet"}
                </p>
                <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                  {data.brief?.title ?? "Run your first refresh"}
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700 dark:text-slate-200">
                  {data.brief?.overview ??
                    "Add your OpenAI key, run refresh, and Morning Brief will collect, rank, summarize, and store the latest updates."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {metrics.map((metric) => (
                  <MetricCard key={metric.label} {...metric} />
                ))}
              </div>
            </div>
          </header>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            <MobileFilter active={activeSection === allSectionsKey} label="All" count={allItems.length} onClick={() => setActiveSection(allSectionsKey)} />
            {sections.map((section) => (
              <MobileFilter
                key={section.key}
                active={activeSection === section.key}
                label={section.title}
                count={sectionCounts[section.key] ?? 0}
                onClick={() => setActiveSection(section.key)}
              />
            ))}
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <SourceTab
              active={activeSource === allSourcesKey}
              label="All Sources"
              count={allItems.length}
              onClick={() => setActiveSource(allSourcesKey)}
            />
            {allSourceNames.map((name) => (
              <SourceTab
                key={name}
                active={activeSource === name}
                label={name}
                count={sourceCounts[name] ?? 0}
                onClick={() => setActiveSource(name)}
              />
            ))}
          </div>

          <section className="mt-7">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-signal dark:text-teal-300">Priority Cards</p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight">{activeSectionTitle(activeSection)}</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Showing {filteredItems.length} of {allItems.length} updates
              </p>
            </div>

            {filteredItems.length === 0 ? (
              <EmptyState hasBrief={Boolean(data.brief)} onRefresh={refresh} isRefreshing={isRefreshing} />
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredItems.map((item) => (
                  <BriefCard key={item.id} item={item} onOpen={() => setSelectedItem(item)} onOpenUrl={openUrl} />
                ))}
              </div>
            )}
          </section>

          <LinkedInIdeas ideas={data.brief?.ideas ?? []} />
        </section>
      </div>

      <DetailDrawer item={selectedItem} onClose={() => setSelectedItem(null)} onOpenUrl={openUrl} />
    </main>
  );
}

function SectionButton({
  active,
  count,
  icon: Icon,
  title,
  onClick
}: {
  active: boolean;
  count: number;
  icon: LucideIcon;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition ${
        active ? "bg-signal text-white shadow-sm" : "text-graphite hover:bg-white/80 dark:text-slate-200 dark:hover:bg-white/10"
      }`}
    >
      <Icon size={18} />
      <span className="flex-1 font-medium">{title}</span>
      <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/10"}`}>{count}</span>
    </button>
  );
}

function SourceTab({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition ${
        active
          ? "border-signal bg-signal/10 text-signal dark:border-teal-300 dark:bg-teal-300/10 dark:text-teal-300"
          : "border-black/10 bg-white/60 text-slate-600 hover:bg-white/90 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
      }`}
    >
      {label} <span className="opacity-75">{count}</span>
    </button>
  );
}

function MobileFilter({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
        active ? "border-signal bg-signal text-white" : "border-black/10 bg-white/75 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
      }`}
    >
      {label} <span className="opacity-75">{count}</span>
    </button>
  );
}

function MetricCard({ label, value, helper, icon: Icon }: { label: string; value: number; helper: string; icon: LucideIcon }) {
  return (
    <article className="rounded-3xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/10">
      <div className="mb-4 flex items-center justify-between">
        <Icon size={18} className="text-signal dark:text-teal-300" />
        <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{helper}</p>
    </article>
  );
}

function BriefCard({ item, onOpen, onOpenUrl }: { item: BriefItem; onOpen: () => void; onOpenUrl: (url?: string | null) => void }) {
  const tags = safeTags(item.tags);
  const sourceName = item.article?.source?.name ?? "Generated brief";
  const publishedAt = item.article?.publishedAt ?? item.article?.fetchedAt;
  const section = sections.find((entry) => entry.key === item.section);
  const Icon = section?.icon ?? Newspaper;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group cursor-pointer rounded-[1.75rem] border border-black/10 bg-white/80 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-signal/30 hover:shadow-mac dark:border-white/10 dark:bg-white/10"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-signal/10 text-signal dark:bg-teal-300/10 dark:text-teal-300">
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{sourceName}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Clock3 size={13} />
              {publishedAt ? formatDate(publishedAt) : "Recent update"}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">#{item.rank}</span>
      </div>

      <h4 className="text-lg font-semibold leading-7 tracking-tight group-hover:text-signal dark:group-hover:text-teal-300">{item.title}</h4>
      <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">{item.summary}</p>

      {item.article?.rawSummary && !item.summary.includes(item.article.rawSummary.slice(0, 80)) ? (
        <div className="mt-4 rounded-2xl bg-black/[0.03] p-3 text-sm leading-6 text-slate-600 dark:bg-white/10 dark:text-slate-300">
          <span className="font-semibold text-slate-700 dark:text-slate-100">Source context: </span>
          {excerpt(item.article.rawSummary, 520)}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl bg-amberline/10 p-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
        <span className="font-semibold text-amberline">Why it matters: </span>
        {item.whyItMatters}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {tags.slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-full bg-black/5 px-3 py-1 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">
            {tag}
          </span>
        ))}
        <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-signal dark:text-teal-300">
          Details <ArrowUpRight size={15} />
        </span>
      </div>
    </button>
  );
}

function DetailDrawer({ item, onClose, onOpenUrl }: { item: BriefItem | null; onClose: () => void; onOpenUrl: (url?: string | null) => void }) {
  const tags = item ? safeTags(item.tags) : [];
  const articleTags = item?.article ? safeTags(item.article.tags) : [];
  const source = item?.article?.source;

  if (!item) return null;

  return (
    <dialog open className="fixed inset-0 z-50 h-full w-full max-w-none bg-ink/35 p-0 backdrop-blur-sm" aria-label="Brief item details">
      <button type="button" className="absolute inset-0 h-full w-full cursor-default" aria-label="Close details" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white p-6 shadow-mac dark:bg-ink sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-signal dark:text-teal-300">{sectionLabel(item.section)}</p>
            <h3 className="mt-3 text-3xl font-semibold leading-tight tracking-tight">{item.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/10 dark:border-white/10">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <DetailFact label="Source" value={source?.name ?? "Generated brief"} />
          <DetailFact label="Published" value={formatDate(item.article?.publishedAt ?? item.article?.fetchedAt)} />
          <DetailFact label="Relevance" value={formatScore(item.article?.relevanceScore)} />
        </div>

        <section className="mt-7 rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Executive Summary</p>
          <p className="mt-3 text-base leading-8 text-slate-800 dark:text-slate-100">{item.summary}</p>
        </section>

        <section className="mt-4 rounded-3xl border border-amberline/20 bg-amberline/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amberline">Why This Deserves Attention</p>
          <p className="mt-3 text-base leading-8 text-slate-800 dark:text-slate-100">{item.whyItMatters}</p>
        </section>

        {item.article?.rawSummary ? (
          <section className="mt-4 rounded-3xl border border-black/10 p-5 dark:border-white/10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Original Context</p>
            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">{item.article.rawSummary}</p>
          </section>
        ) : null}

        <section className="mt-5">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Tags</p>
          <div className="flex flex-wrap gap-2">
            {[...new Set([...tags, ...articleTags])].map((tag) => (
              <span key={tag} className="rounded-full bg-black/5 px-3 py-1.5 text-sm text-slate-700 dark:bg-white/10 dark:text-slate-200">
                {tag}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void onOpenUrl(item.url ?? item.article?.url)}
            className="inline-flex items-center gap-2 rounded-2xl bg-signal px-5 py-3 text-sm font-semibold text-white"
          >
            Open Source <ExternalLink size={16} />
          </button>
          {source?.url ? (
            <button
              type="button"
              onClick={() => void onOpenUrl(source.url)}
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold dark:border-white/10"
            >
              Visit Publisher
            </button>
          ) : null}
        </div>
      </aside>
    </dialog>
  );
}

function DetailFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/10">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-graphite dark:text-white">{value}</p>
    </div>
  );
}

function LinkedInIdeas({ ideas }: { ideas: ContentIdea[] }) {
  if (ideas.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb size={20} className="text-amberline" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amberline">Content Ideas</p>
          <h3 className="text-2xl font-semibold tracking-tight">Turn today&apos;s signal into output</h3>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {ideas.map((idea) => (
          <article key={idea.id} className="rounded-[1.5rem] border border-black/10 bg-white/75 p-5 shadow-sm dark:border-white/10 dark:bg-white/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-signal dark:text-teal-300">{idea.kind === "ARTICLE" ? "Article" : "Post"}</p>
            <h4 className="mt-2 text-base font-semibold tracking-normal">{idea.title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{idea.angle}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ hasBrief, isRefreshing, onRefresh }: { hasBrief: boolean; isRefreshing: boolean; onRefresh: () => void }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-black/15 bg-white/60 p-8 text-center dark:border-white/15 dark:bg-white/10">
      <h3 className="text-xl font-semibold">{hasBrief ? "No matching cards" : "No brief generated yet"}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
        {hasBrief ? "Try another section, source, or search term." : "Run a refresh to collect, rank, summarize and store today's most important updates."}
      </p>
      {!hasBrief ? (
        <button type="button" onClick={onRefresh} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-signal px-5 py-3 text-sm font-semibold text-white" disabled={isRefreshing}>
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          Run refresh
        </button>
      ) : null}
    </div>
  );
}

function safeTags(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

function activeSectionTitle(key: string): string {
  if (key === allSectionsKey) return "All daily signals";
  return sections.find((section) => section.key === key)?.title ?? "Daily signals";
}

function sectionLabel(key: string): string {
  return sections.find((section) => section.key === key)?.title ?? key;
}

function formatDate(value?: string | null): string {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatScore(value?: number): string {
  if (typeof value !== "number") return "Not scored";
  return `${Math.round(value * 10) / 10}/10`;
}

function excerpt(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

function isUrgent(item: BriefItem): boolean {
  const text = `${item.section} ${item.title} ${item.summary} ${item.whyItMatters} ${item.tags}`.toLowerCase();
  return /critical|zero-day|0-day|rce|cve-|breach|incident|launch|release|breaking/.test(text);
}
