export type BriefSection = {
  key: string;
  title: string;
  subtitle: string;
  accent: string;
};

export const allSectionsKey = 'ALL';

export const sections: BriefSection[] = [
  {
    key: 'AI',
    title: 'AI',
    subtitle: 'Models, agents, research and product moves',
    accent: '#14b8a6',
  },
  {
    key: 'DEVELOPMENT',
    title: 'Development',
    subtitle: 'Frameworks, languages, platforms and tooling',
    accent: '#3b82f6',
  },
  {
    key: 'CYBERSECURITY',
    title: 'Cybersecurity',
    subtitle: 'Vulnerabilities, incidents and defensive signals',
    accent: '#ef4444',
  },
  {
    key: 'TRENDING_TOOLS',
    title: 'Trending Tools',
    subtitle: 'Products, repositories and workflow upgrades',
    accent: '#f59e0b',
  },
  {
    key: 'LEARNING',
    title: 'Learning',
    subtitle: 'What to practice or study next',
    accent: '#8b5cf6',
  },
];

export function sectionTitle(key: string): string {
  if (key === allSectionsKey) {
    return 'All daily signals';
  }

  return sections.find(section => section.key === key)?.title ?? key;
}

export function sectionAccent(key: string): string {
  return sections.find(section => section.key === key)?.accent ?? '#14b8a6';
}
