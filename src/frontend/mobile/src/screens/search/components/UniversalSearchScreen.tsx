import React, { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageContainer } from '@/src/components/layout/PageContainer';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { SearchBar } from '@/src/screens/widgets/dashboard/components/SearchBar';
import {
  AppText,
  ClayView,
  Icon,
  IconName,
  ProgressiveImage,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { AnimatedItem, PressClay } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';
import { useThemeColors } from '@/src/hooks';
import { useDashboardLogic } from '@/src/screens/widgets/dashboard/hooks/useDashboardLogic';
import type { SearchHitDto, SearchResultGroupDto } from '@/src/api/generatedClient';
import { useUniversalSearch } from '../hooks/useUniversalSearch';
import { createUniversalSearchStyles } from '../styles/universalSearch.styles';

const SEARCH_TYPE_ICONS: Record<string, IconName> = {
  users: 'group',
  rooms: 'meeting-room',
  news: 'campaign',
  tasks: 'check-circle',
  schedule: 'calendar-today',
  groups: 'domain',
  grades: 'analytics',
};

function navigateToHit(router: ReturnType<typeof useRouter>, hit: SearchHitDto) {
  const [path, queryString] = hit.route.split('?');
  if (queryString) {
    const params = Object.fromEntries(new URLSearchParams(queryString));
    router.push({ pathname: path as never, params } as never);
    return;
  }
  router.push(path as never);
}

function SearchHitRow({
  hit,
  onPress,
  colors,
  styles,
}: {
  hit: SearchHitDto;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
  styles: ReturnType<typeof createUniversalSearchStyles>;
}) {
  const iconName = SEARCH_TYPE_ICONS[hit.type] ?? 'search';

  return (
    <PressClay onPress={onPress}>
      <ClayView depth={8} puffy={12} color={colors.card} style={styles.hitRow}>
        {hit.imageUrl ? (
          <View style={styles.avatar}>
            <ProgressiveImage source={{ uri: hit.imageUrl }} style={{ width: 44, height: 44 }} resizeMode="cover" />
          </View>
        ) : (
          <View style={[styles.hitIconWrap, { backgroundColor: colors.primaryContainer }]}>
            <Icon name={iconName} size={22} color={colors.primary} />
          </View>
        )}
        <View style={styles.hitTextWrap}>
          <AppText weight="bold" numberOfLines={1} style={styles.hitTitle}>
            {hit.title}
          </AppText>
          {hit.subtitle ? (
            <AppText variant="caption" numberOfLines={1} style={styles.hitSubtitle}>
              {hit.subtitle}
            </AppText>
          ) : null}
        </View>
        <Icon name="chevron-right" size={20} color={colors.subtle} />
      </ClayView>
    </PressClay>
  );
}

function ResultSection({
  group,
  index,
  router,
  colors,
  styles,
}: {
  group: SearchResultGroupDto;
  index: number;
  router: ReturnType<typeof useRouter>;
  colors: ReturnType<typeof useThemeColors>;
  styles: ReturnType<typeof createUniversalSearchStyles>;
}) {
  const overflow = group.totalCount > (group.items?.length ?? 0);

  return (
    <AnimatedItem index={index} animation={ClayAnimations.SlideInFlow(index)}>
      <View style={styles.sectionHeader}>
        <AppText weight="bold" style={styles.sectionTitle}>
          {group.label}
        </AppText>
        {overflow ? (
          <AppText variant="caption" style={styles.sectionCount}>
            {group.totalCount} results
          </AppText>
        ) : null}
      </View>
      {(group.items ?? []).map((hit) => (
        <SearchHitRow
          key={`${hit.type}-${hit.id}`}
          hit={hit}
          colors={colors}
          styles={styles}
          onPress={() => navigateToHit(router, hit)}
        />
      ))}
    </AnimatedItem>
  );
}

export default function UniversalSearchScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createUniversalSearchStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const { data, config } = useDashboardLogic();
  const { debouncedQuery, shouldSearch, groups, isLoading, isError, error, refetch } =
    useUniversalSearch(query);

  const matchedApps = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (q.length < 1) return [];
    return data.allWidgets.filter((id) => {
      const def = config.definitions[id];
      if (!def) return false;
      return def.name.toLowerCase().includes(q) || def.category.toLowerCase().includes(q);
    });
  }, [data.allWidgets, debouncedQuery, config.definitions]);

  const hasAnyResults = matchedApps.length > 0 || groups.length > 0;
  const showEmpty = shouldSearch && !isLoading && !isError && !hasAnyResults;
  const showHint = !shouldSearch;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <PageContainer>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerTop}>
            <ClayBackButton />
            <AppText variant="h3" weight="bold">
              Search
            </AppText>
            <View style={{ width: 44 }} />
          </View>
          <SearchBar
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search apps, grades, people..."
          />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {showHint ? (
            <ClayView depth={10} puffy={16} color={colors.card} style={styles.hintCard}>
              <AppText weight="bold">Find anything in your organization</AppText>
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 8 }}>
                Search people, rooms, news, tasks, schedule events, groups, grades, and apps. Type at
                least 2 characters to search across your workspace.
              </AppText>
            </ClayView>
          ) : null}

          {shouldSearch && isLoading ? (
            <View style={{ marginTop: 16 }}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} style={styles.skeletonRow} />
              ))}
            </View>
          ) : null}

          {isError ? (
            <WidgetErrorState
              message={error instanceof Error ? error.message : 'Search is unavailable. Please try again.'}
              onRetry={() => refetch()}
            />
          ) : null}

          {matchedApps.length > 0 ? (
            <AnimatedItem index={0} animation={ClayAnimations.SlideInFlow(0)}>
              <View style={styles.sectionHeader}>
                <AppText weight="bold" style={styles.sectionTitle}>
                  Apps
                </AppText>
              </View>
              <View style={styles.appGrid}>
                {matchedApps.map((id) => {
                  const def = config.definitions[id];
                  if (!def) return null;
                  return (
                    <PressClay key={id} onPress={() => router.push(`/${id}` as never)}>
                      <ClayView depth={5} puffy={10} color={colors.card} style={styles.appItem}>
                        <View style={[styles.appIconBox, { backgroundColor: def.bg }]}>
                          <Icon name={def.icon as IconName} size={26} color={def.iconColor} />
                        </View>
                        <AppText variant="caption" weight="bold" numberOfLines={2} style={styles.appName}>
                          {def.name}
                        </AppText>
                      </ClayView>
                    </PressClay>
                  );
                })}
              </View>
            </AnimatedItem>
          ) : null}

          {groups.map((group, index) => (
            <ResultSection
              key={group.type}
              group={group}
              index={index + 1}
              router={router}
              colors={colors}
              styles={styles}
            />
          ))}

          {showEmpty ? (
            <WidgetEmptyState
              icon="search-off"
              title="No results"
              description={`Nothing matched "${debouncedQuery}". Try a different spelling or keyword.`}
            />
          ) : null}
        </ScrollView>
      </PageContainer>
    </View>
  );
}
