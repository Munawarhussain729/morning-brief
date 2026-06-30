import type { BriefItem } from './types';

export function safeTags(value?: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === 'string').slice(0, 8)
      : [];
  } catch {
    return [];
  }
}

export function formatDate(value?: string | null): string {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatScore(value?: number): string {
  if (typeof value !== 'number') {
    return 'Not scored';
  }

  return `${Math.round(value * 10) / 10}/10`;
}

export function isUrgent(item: BriefItem): boolean {
  const text = `${item.section} ${item.title} ${item.summary} ${item.whyItMatters} ${item.tags}`.toLowerCase();
  return /critical|zero-day|0-day|rce|cve-|breach|incident|launch|release|breaking/.test(text);
}
