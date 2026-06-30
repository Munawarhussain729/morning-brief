import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { fetchBrief, refreshBrief } from './src/api';
import { allSectionsKey, sectionAccent, sections, sectionTitle } from './src/sections';
import type { BriefItem, BriefResponse, ContentIdea } from './src/types';
import { formatDate, formatScore, isUrgent, safeTags } from './src/utils';

type Palette = {
  background: string;
  card: string;
  cardAlt: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentSoft: string;
  danger: string;
  chip: string;
  shadow: string;
};

const lightPalette: Palette = {
  background: '#eef5f3',
  card: '#ffffff',
  cardAlt: '#f7fbfa',
  text: '#172026',
  muted: '#64748b',
  border: '#dbe4e2',
  accent: '#0f9f8f',
  accentSoft: '#dff7f4',
  danger: '#dc2626',
  chip: '#edf3f2',
  shadow: '#0f172a',
};

const darkPalette: Palette = {
  background: '#0f1720',
  card: '#17212b',
  cardAlt: '#111b24',
  text: '#f8fafc',
  muted: '#94a3b8',
  border: '#263443',
  accent: '#5eead4',
  accentSoft: '#123c39',
  danger: '#f87171',
  chip: '#233140',
  shadow: '#000000',
};

function App() {
  const prefersDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <AppContent prefersDarkMode={prefersDarkMode} />
    </SafeAreaProvider>
  );
}

function AppContent({ prefersDarkMode }: { prefersDarkMode: boolean }) {
  const safeAreaInsets = useSafeAreaInsets();
  const [darkMode, setDarkMode] = useState(prefersDarkMode);
  const [data, setData] = useState<BriefResponse>({ brief: null, history: [] });
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState(allSectionsKey);
  const [selectedItem, setSelectedItem] = useState<BriefItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = darkMode ? darkPalette : lightPalette;

  const loadBrief = useCallback(async () => {
    try {
      setError(null);
      setData(await fetchBrief());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load brief');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrief();
  }, [loadBrief]);

  const allItems = useMemo(() => data.brief?.items ?? [], [data.brief?.items]);

  const sectionCounts = useMemo(() => {
    return sections.reduce<Record<string, number>>((counts, section) => {
      counts[section.key] = allItems.filter(item => item.section === section.key).length;
      return counts;
    }, {});
  }, [allItems]);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return allItems.filter(item => {
      const tags = safeTags(item.tags).join(' ');
      const source = item.article?.source?.name ?? '';
      const matchesSection = activeSection === allSectionsKey || item.section === activeSection;
      const matchesQuery =
        !needle ||
        `${item.title} ${item.summary} ${item.whyItMatters} ${tags} ${source}`
          .toLowerCase()
          .includes(needle);

      return matchesSection && matchesQuery;
    });
  }, [activeSection, allItems, query]);

  const metrics = useMemo(() => {
    const sourceNames = new Set(allItems.map(item => item.article?.source?.name).filter(Boolean));
    const urgentItems = allItems.filter(item => isUrgent(item)).length;

    return [
      { label: 'Signals', value: allItems.length, helper: 'ranked updates' },
      { label: 'Sources', value: sourceNames.size, helper: 'platforms scanned' },
      { label: 'Watchlist', value: urgentItems, helper: 'risks or launches' },
      { label: 'Ideas', value: data.brief?.ideas.length ?? 0, helper: 'content prompts' },
    ];
  }, [allItems, data.brief?.ideas.length]);

  async function handleRefresh() {
    setIsRefreshing(true);

    try {
      setError(null);
      await refreshBrief();
      await loadBrief();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to refresh brief';
      setError(message);
      Alert.alert('Refresh failed', message);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function openUrl(url?: string | null) {
    if (!url) {
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: safeAreaInsets.top + 16,
            paddingBottom: safeAreaInsets.bottom + 28,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            tintColor={colors.accent}
            onRefresh={handleRefresh}
          />
        }
        ListHeaderComponent={
          <DashboardHeader
            activeSection={activeSection}
            allItemsCount={allItems.length}
            colors={colors}
            data={data}
            darkMode={darkMode}
            error={error}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            metrics={metrics}
            query={query}
            sectionCounts={sectionCounts}
            setActiveSection={setActiveSection}
            setDarkMode={setDarkMode}
            setQuery={setQuery}
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              colors={colors}
              hasBrief={Boolean(data.brief)}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          )
        }
        ListFooterComponent={
          <ContentIdeas colors={colors} ideas={data.brief?.ideas ?? []} />
        }
        renderItem={({ item }) => (
          <BriefCard
            colors={colors}
            item={item}
            onOpen={() => setSelectedItem(item)}
          />
        )}
      />

      <DetailModal
        colors={colors}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onOpenUrl={openUrl}
      />
    </View>
  );
}

function DashboardHeader({
  activeSection,
  allItemsCount,
  colors,
  data,
  darkMode,
  error,
  isLoading,
  isRefreshing,
  metrics,
  query,
  sectionCounts,
  setActiveSection,
  setDarkMode,
  setQuery,
  onRefresh,
}: {
  activeSection: string;
  allItemsCount: number;
  colors: Palette;
  data: BriefResponse;
  darkMode: boolean;
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  metrics: Array<{ label: string; value: number; helper: string }>;
  query: string;
  sectionCounts: Record<string, number>;
  setActiveSection: (section: string) => void;
  setDarkMode: (value: boolean) => void;
  setQuery: (value: string) => void;
  onRefresh: () => void;
}) {
  const refreshButtonStyle = {
    backgroundColor: colors.accent,
    opacity: isRefreshing ? 0.7 : 1,
  };

  return (
    <View>
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>Morning Brief</Text>
          <Text style={[styles.appTitle, { color: colors.text }]}>Stay ahead of the race</Text>
        </View>
        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            disabled={isRefreshing}
            onPress={onRefresh}
            style={[
              styles.iconButton,
              refreshButtonStyle,
            ]}>
            <Text style={styles.iconButtonText}>{isRefreshing ? '...' : 'Go'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDarkMode(!darkMode)}
            style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.iconButtonText, { color: colors.text }]}>{darkMode ? 'Sun' : 'Moon'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.searchIcon, { color: colors.muted }]}>Search</Text>
        <TextInput
          value={query}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="updates, sources, tags..."
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.text }]}
          onChangeText={setQuery}
        />
      </View>

      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {isLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.accent} />
            <Text style={[styles.mutedText, { color: colors.muted }]}>Loading your latest brief...</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.dateText, { color: colors.muted }]}>
              {data.brief ? formatDate(data.brief.briefDate) : 'No brief generated yet'}
            </Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              {data.brief?.title ?? 'Run your first refresh'}
            </Text>
            <Text style={[styles.heroCopy, { color: colors.muted }]}>
              {data.brief?.overview ??
                'Start the desktop or hosted backend, then refresh to collect, rank, summarize, and store today\'s most important updates.'}
            </Text>
          </>
        )}
      </View>

      {error ? (
        <View style={[styles.errorBox, { borderColor: colors.danger }]}>
          <Text style={[styles.errorTitle, { color: colors.danger }]}>Connection issue</Text>
          <Text style={[styles.errorCopy, { color: colors.muted }]}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.metricsGrid}>
        {metrics.map(metric => (
          <MetricCard key={metric.label} colors={colors} {...metric} />
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sectionScroller}>
        <SectionChip
          active={activeSection === allSectionsKey}
          colors={colors}
          count={allItemsCount}
          label="All"
          onPress={() => setActiveSection(allSectionsKey)}
        />
        {sections.map(section => (
          <SectionChip
            key={section.key}
            active={activeSection === section.key}
            colors={colors}
            count={sectionCounts[section.key] ?? 0}
            label={section.title}
            onPress={() => setActiveSection(section.key)}
          />
        ))}
      </ScrollView>

      <View style={styles.listIntro}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>Priority Cards</Text>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>{sectionTitle(activeSection)}</Text>
        </View>
        <Text style={[styles.countText, { color: colors.muted }]}>
          {allItemsCount} updates
        </Text>
      </View>

      <HistoryStrip colors={colors} history={data.history} />
    </View>
  );
}

function MetricCard({
  colors,
  helper,
  label,
  value,
}: {
  colors: Palette;
  helper: string;
  label: string;
  value: number;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.metricHelper, { color: colors.muted }]}>{helper}</Text>
    </View>
  );
}

function SectionChip({
  active,
  colors,
  count,
  label,
  onPress,
}: {
  active: boolean;
  colors: Palette;
  count: number;
  label: string;
  onPress: () => void;
}) {
  const chipTextStyle = {
    color: active ? '#ffffff' : colors.text,
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.sectionChip,
        {
          backgroundColor: active ? colors.accent : colors.chip,
          borderColor: active ? colors.accent : colors.border,
        },
      ]}>
      <Text style={[styles.sectionChipText, chipTextStyle]}>
        {label} {count}
      </Text>
    </Pressable>
  );
}

function HistoryStrip({
  colors,
  history,
}: {
  colors: Palette;
  history: BriefResponse['history'];
}) {
  if (history.length === 0) {
    return null;
  }

  return (
    <View style={styles.historyBlock}>
      <Text style={[styles.historyTitle, { color: colors.text }]}>Recent Briefs</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {history.slice(0, 8).map(brief => (
          <View
            key={brief.id}
            style={[styles.historyCard, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
            <Text style={[styles.historyDate, { color: colors.accent }]}>{formatDate(brief.briefDate)}</Text>
            <Text numberOfLines={2} style={[styles.historyCopy, { color: colors.muted }]}>
              {brief.title}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function BriefCard({
  colors,
  item,
  onOpen,
}: {
  colors: Palette;
  item: BriefItem;
  onOpen: () => void;
}) {
  const tags = safeTags(item.tags);
  const sourceName = item.article?.source?.name ?? 'Generated brief';
  const publishedAt = item.article?.publishedAt ?? item.article?.fetchedAt;
  const accent = sectionAccent(item.section);
  const whyLeadStyle = {
    color: colors.accent,
    fontWeight: '800' as const,
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={[
        styles.briefCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}>
      <View style={styles.cardMetaRow}>
        <View style={[styles.sectionPill, { backgroundColor: accent }]}>
          <Text style={styles.sectionPillText}>{sectionTitle(item.section)}</Text>
        </View>
        <Text style={[styles.rank, { color: colors.muted }]}>#{item.rank}</Text>
      </View>

      <Text style={[styles.sourceText, { color: colors.muted }]} numberOfLines={1}>
        {sourceName} - {publishedAt ? formatDate(publishedAt) : 'Recent update'}
      </Text>
      <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.cardSummary, { color: colors.muted }]} numberOfLines={4}>
        {item.summary}
      </Text>

      <View style={[styles.whyBox, { backgroundColor: colors.accentSoft }]}>
        <Text style={[styles.whyText, { color: colors.text }]} numberOfLines={3}>
          <Text style={whyLeadStyle}>Why it matters: </Text>
          {item.whyItMatters}
        </Text>
      </View>

      <View style={styles.tagsRow}>
        {tags.slice(0, 4).map(tag => (
          <View key={tag} style={[styles.tag, { backgroundColor: colors.chip }]}>
            <Text style={[styles.tagText, { color: colors.muted }]}>{tag}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

function ContentIdeas({
  colors,
  ideas,
}: {
  colors: Palette;
  ideas: ContentIdea[];
}) {
  if (ideas.length === 0) {
    return null;
  }

  return (
    <View style={styles.ideasBlock}>
      <Text style={[styles.eyebrow, { color: colors.accent }]}>Content Ideas</Text>
      <Text style={[styles.sectionHeading, { color: colors.text }]}>Turn signal into output</Text>
      {ideas.map(idea => (
        <View
          key={idea.id}
          style={[styles.ideaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.ideaKind, { color: colors.accent }]}>
            {idea.kind === 'ARTICLE' ? 'Article' : 'Post'}
          </Text>
          <Text style={[styles.ideaTitle, { color: colors.text }]}>{idea.title}</Text>
          <Text style={[styles.ideaAngle, { color: colors.muted }]}>{idea.angle}</Text>
        </View>
      ))}
    </View>
  );
}

function EmptyState({
  colors,
  hasBrief,
  isRefreshing,
  onRefresh,
}: {
  colors: Palette;
  hasBrief: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <View style={[styles.emptyState, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {hasBrief ? 'No matching cards' : 'No brief generated yet'}
      </Text>
      <Text style={[styles.emptyCopy, { color: colors.muted }]}>
        {hasBrief
          ? 'Try another section or search term.'
          : 'Run a refresh to generate today\'s mobile brief from the existing backend.'}
      </Text>
      {!hasBrief ? (
        <Pressable
          accessibilityRole="button"
          disabled={isRefreshing}
          onPress={onRefresh}
          style={[styles.primaryButton, { backgroundColor: colors.accent }]}>
          <Text style={styles.primaryButtonText}>{isRefreshing ? 'Refreshing...' : 'Run refresh'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function DetailModal({
  colors,
  item,
  onClose,
  onOpenUrl,
}: {
  colors: Palette;
  item: BriefItem | null;
  onClose: () => void;
  onOpenUrl: (url?: string | null) => void;
}) {
  const tags = item ? safeTags(item.tags) : [];
  const articleTags = item?.article ? safeTags(item.article.tags) : [];
  const source = item?.article?.source;

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={Boolean(item)}>
      {item ? (
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleBlock}>
              <Text style={[styles.eyebrow, { color: colors.accent }]}>{sectionTitle(item.section)}</Text>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{item.title}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.closeText, { color: colors.text }]}>Close</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.factGrid}>
              <DetailFact colors={colors} label="Source" value={source?.name ?? 'Generated brief'} />
              <DetailFact
                colors={colors}
                label="Published"
                value={formatDate(item.article?.publishedAt ?? item.article?.fetchedAt)}
              />
              <DetailFact colors={colors} label="Relevance" value={formatScore(item.article?.relevanceScore)} />
            </View>

            <DetailSection colors={colors} label="Executive Summary" text={item.summary} />
            <DetailSection colors={colors} label="Why This Deserves Attention" text={item.whyItMatters} highlighted />

            {item.article?.rawSummary ? (
              <DetailSection colors={colors} label="Original Context" text={item.article.rawSummary} />
            ) : null}

            <Text style={[styles.detailLabel, { color: colors.muted }]}>Tags</Text>
            <View style={styles.tagsRow}>
              {[...new Set([...tags, ...articleTags])].map(tag => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.chip }]}>
                  <Text style={[styles.tagText, { color: colors.muted }]}>{tag}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onOpenUrl(item.url);
                }}
                style={[styles.primaryButton, { backgroundColor: colors.accent }]}>
                <Text style={styles.primaryButtonText}>Open Source</Text>
              </Pressable>
              {source?.url ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    onOpenUrl(source.url);
                  }}
                  style={[styles.secondaryButton, { borderColor: colors.border }]}>
                  <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Visit Publisher</Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </View>
      ) : null}
    </Modal>
  );
}

function DetailFact({
  colors,
  label,
  value,
}: {
  colors: Palette;
  label: string;
  value: string;
}) {
  return (
    <View style={[styles.factCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.factLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.factValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function DetailSection({
  colors,
  highlighted,
  label,
  text,
}: {
  colors: Palette;
  highlighted?: boolean;
  label: string;
  text: string;
}) {
  return (
    <View
      style={[
        styles.detailSection,
        {
          backgroundColor: highlighted ? colors.accentSoft : colors.card,
          borderColor: highlighted ? colors.accent : colors.border,
        },
      ]}>
      <Text style={[styles.detailLabel, { color: highlighted ? colors.accent : colors.muted }]}>
        {label}
      </Text>
      <Text style={[styles.detailText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  topActions: {
    flexDirection: 'row',
    gap: 10,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 4,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    minWidth: 52,
    paddingHorizontal: 12,
  },
  iconButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  searchBox: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  searchIcon: {
    fontSize: 12,
    fontWeight: '800',
    marginRight: 10,
    textTransform: 'uppercase',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 52,
  },
  hero: {
    borderRadius: 30,
    borderWidth: 1,
    marginBottom: 14,
    padding: 22,
  },
  loadingBlock: {
    alignItems: 'center',
    gap: 12,
    minHeight: 120,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 38,
  },
  heroCopy: {
    fontSize: 16,
    lineHeight: 25,
    marginTop: 12,
  },
  mutedText: {
    fontSize: 14,
  },
  errorBox: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  errorCopy: {
    fontSize: 13,
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    borderRadius: 22,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    padding: 16,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 30,
    fontWeight: '900',
    marginTop: 8,
  },
  metricHelper: {
    fontSize: 12,
    marginTop: 3,
  },
  sectionScroller: {
    gap: 8,
    paddingBottom: 18,
  },
  sectionChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionChipText: {
    fontSize: 14,
    fontWeight: '800',
  },
  listIntro: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 4,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  historyBlock: {
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },
  historyCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 10,
    padding: 12,
    width: 180,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 5,
  },
  historyCopy: {
    fontSize: 13,
    lineHeight: 18,
  },
  briefCard: {
    borderRadius: 28,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 14,
    padding: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  cardMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sectionPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  rank: {
    fontSize: 13,
    fontWeight: '900',
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 27,
  },
  cardSummary: {
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
  },
  whyBox: {
    borderRadius: 18,
    marginTop: 14,
    padding: 12,
  },
  whyText: {
    fontSize: 14,
    lineHeight: 21,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ideasBlock: {
    marginTop: 10,
  },
  ideaCard: {
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
  },
  ideaKind: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ideaTitle: {
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 23,
    marginTop: 6,
  },
  ideaAngle: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: 26,
    borderStyle: 'dashed',
    borderWidth: 1,
    padding: 26,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  emptyCopy: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 18,
    justifyContent: 'center',
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 22,
  },
  modalTitleBlock: {
    flex: 1,
    paddingRight: 12,
  },
  modalTitle: {
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginTop: 6,
  },
  closeButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  closeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  modalContent: {
    padding: 18,
    paddingBottom: 36,
  },
  factGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  factCard: {
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: '30%',
    flexGrow: 1,
    padding: 12,
  },
  factLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  factValue: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 6,
  },
  detailSection: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  detailText: {
    fontSize: 16,
    lineHeight: 25,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '900',
  },
});

export default App;
