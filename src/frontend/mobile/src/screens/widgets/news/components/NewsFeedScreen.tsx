import React, { useMemo, useState } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import {
  AppText,
  ClayView,
  Icon,
  ProgressiveImage,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { AnimatedItem, PressClay } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';
import { useThemeColors, useTabContentBottomPadding } from '@/src/hooks';
import { usePermission } from '@/src/context/PermissionContext';
import { newsApi, unwrap } from '@/src/api';
import type { NewsItemDto } from '@/src/api/generatedClient';
import { NewsCategory, NewsType, PagedResponseOfNewsItemDto } from '@/src/api/generatedClient';
import { FilterBottomSheet, OptionPickerSheet, type PickerOption } from '@/src/components/filters';
import {
  NEWS_CATEGORY_DETAIL,
  NEWS_CATEGORY_ORDER,
  NEWS_CATEGORY_SHORT,
  NEWS_TYPE_LABELS,
  NEWS_TYPE_ORDER,
} from '../utils/newsLabels';

const PAGE_SIZE = 20;

const typeMeta = (type: NewsType, colors: { error: string; tertiary: string; secondary?: string; primary: string }) => {
  switch (type) {
    case NewsType.Alert:
      return { label: 'alert', color: colors.error };
    case NewsType.Event:
      return { label: 'event', color: colors.tertiary };
    case NewsType.Info:
      return { label: 'info', color: colors.secondary ?? colors.primary };
    case NewsType.Announcement:
    default:
      return { label: 'announcement', color: colors.primary };
  }
};

export default function NewsFeedScreen() {
  const colors = useThemeColors();
  const tabBottomPad = useTabContentBottomPadding(24);
  const router = useRouter();
  const { can } = usePermission();

  // Applied filters drive fetching. Draft filters live in the sheet and only apply on Done.
  const [appliedType, setAppliedType] = useState<NewsType | null>(null);
  const [appliedCategory, setAppliedCategory] = useState<NewsCategory | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftType, setDraftType] = useState<NewsType | null>(null);
  const [draftCategory, setDraftCategory] = useState<NewsCategory | null>(null);

  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  const typeOptions: PickerOption<NewsType>[] = useMemo(
    () => NEWS_TYPE_ORDER.map((t) => ({ value: t, label: NEWS_TYPE_LABELS[t] })),
    [],
  );
  const categoryOptions: PickerOption<NewsCategory>[] = useMemo(
    () =>
      NEWS_CATEGORY_ORDER.map((c) => ({
        value: c,
        label: NEWS_CATEGORY_SHORT[c],
        subtitle: NEWS_CATEGORY_DETAIL[c],
      })),
    [],
  );

  const feedQuery = useInfiniteQuery({
    queryKey: ['news:feed', appliedType ?? 'all', appliedCategory ?? 'all'],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      // GET /api/News?Page=&PageSize=&type=&category= — omit type/category when null (show all).
      // Use ?? not || so enum value 0 (Announcement / General) is still sent.
      return unwrap<PagedResponseOfNewsItemDto>(
        newsApi.getAll(
          pageParam,
          PAGE_SIZE,
          appliedType ?? undefined,
          appliedCategory ?? undefined,
        ),
      );
    },
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.pageSize;
      if (loaded >= lastPage.totalCount) return undefined;
      return lastPage.page + 1;
    },
  });

  const items = useMemo(() => {
    const pages = feedQuery.data?.pages ?? [];
    return pages.flatMap((p: { items?: NewsItemDto[] | null }) => p.items ?? []) as NewsItemDto[];
  }, [feedQuery.data]);

  const totalCount = feedQuery.data?.pages?.[0]?.totalCount ?? 0;

  const openFilters = () => {
    setDraftType(appliedType);
    setDraftCategory(appliedCategory);
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setAppliedType(draftType);
    setAppliedCategory(draftCategory);
    setFilterOpen(false);
  };

  const resetDraft = () => {
    setDraftType(null);
    setDraftCategory(null);
  };

  const renderTypeBadge = (item: NewsItemDto) => {
    const meta = typeMeta(item.type, colors);
    return (
      <View style={[styles.badge, { backgroundColor: meta.color + 'E6' }]}>
        <AppText weight="bold" style={[styles.badgeText, { color: '#FFFFFF' }]}>
          {meta.label.toUpperCase()}
        </AppText>
      </View>
    );
  };

  const listHeader = (
    <View style={{ marginBottom: 8 }}>
      <View style={styles.filterRow}>
        <PressClay onPress={openFilters}>
          <ClayView depth={6} puffy={10} color={colors.card} style={styles.filterBtn}>
            <Icon name="tune" size={18} color={colors.primary} />
            <AppText weight="bold" style={{ marginLeft: 8 }}>
              Filters
            </AppText>
            <View style={{ marginLeft: 10 }}>
              <AppText variant="caption" style={{ color: colors.subtle }}>
                {appliedType ? NEWS_TYPE_LABELS[appliedType] : 'All types'} ·{' '}
                {appliedCategory ? NEWS_CATEGORY_SHORT[appliedCategory] : 'All topics'}
              </AppText>
            </View>
          </ClayView>
        </PressClay>
      </View>
      {totalCount > 0 ? (
        <AppText variant="caption" style={[styles.countLine, { color: colors.subtle }]}>
          {items.length} of {totalCount} article{totalCount === 1 ? '' : 's'}
          {feedQuery.hasNextPage ? ' · scroll for more' : ''}
        </AppText>
      ) : null}
    </View>
  );

  if (feedQuery.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ClayBackButton />
        <View style={styles.skeletonWrap}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <ClayView key={idx} depth={6} puffy={12} style={styles.skeletonCard}>
              <Skeleton height={92} borderRadius={16} />
              <View style={{ height: 12 }} />
              <Skeleton height={14} width="70%" borderRadius={8} />
              <View style={{ height: 8 }} />
              <Skeleton height={18} width="92%" borderRadius={10} />
            </ClayView>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (feedQuery.isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ClayBackButton />
        <View style={styles.errorWrap}>
          <WidgetErrorState message="Could not load news feed." onRetry={() => feedQuery.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <ClayBackButton />
        <AppText variant="h2" weight="bold" style={styles.headerTitle}>
          News & Alerts
        </AppText>
      </View>

      {items.length === 0 ? (
        <View style={{ flex: 1 }}>
          {listHeader}
          <View style={styles.emptyWrap}>
            <WidgetEmptyState title="No matches" description="Try another filter or check back later." icon="campaign" />
          </View>
        </View>
      ) : (
        <FlashList
          style={{ flex: 1 }}
          data={items}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={feedQuery.isRefetching && !feedQuery.isFetchingNextPage}
              onRefresh={() => feedQuery.refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <PressClay
              onPress={() =>
                router.push({
                  pathname: '/news-article',
                  params: { id: item.id },
                } as never)
              }
            >
              <ClayView depth={7} puffy={12} style={styles.card}>
                <View style={styles.row}>
                  {item.coverImageUrl ? (
                    <ProgressiveImage
                      source={{ uri: item.coverImageUrl }}
                      style={styles.thumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.thumbFallback}>
                      <Icon name="campaign" size={18} />
                    </View>
                  )}

                  <View style={styles.cardText}>
                    <View style={styles.badgeRow}>{renderTypeBadge(item)}</View>
                    <AppText variant="body" weight="bold" numberOfLines={2} style={styles.title}>
                      {item.title}
                    </AppText>
                    <AppText variant="caption" style={styles.date}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </AppText>
                  </View>
                </View>
              </ClayView>
            </PressClay>
          )}
          onEndReached={() => {
            if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
              feedQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            feedQuery.isFetchingNextPage ? (
              <View style={{ paddingVertical: 16 }}>
                <Skeleton height={18} width="60%" borderRadius={10} />
              </View>
            ) : null
          }
        />
      )}

      {can('news.create') ? (
        <AnimatedItem animation={ClayAnimations.FAB} style={{ position: 'absolute', bottom: tabBottomPad + 16, right: 20 }}>
          <PressClay onPress={() => router.push('/news-create-article' as never)}>
            <ClayView depth={15} puffy={20} color={colors.primary} style={styles.fab}>
              <Icon name="add" size={30} color="#FFF" />
            </ClayView>
          </PressClay>
        </AnimatedItem>
      ) : null}

      <FilterBottomSheet
        isVisible={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="News filters"
        onApply={applyFilters}
        onReset={resetDraft}
        height={540}
      >
        <AppText weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
          Type
        </AppText>
        <PressClay onPress={() => setTypePickerOpen(true)}>
          <ClayView depth={6} puffy={10} color={colors.card} style={styles.selectorChip}>
            <Icon name="category" size={18} color={colors.primary} />
            <AppText weight="bold" style={{ marginLeft: 8 }}>
              {draftType ? NEWS_TYPE_LABELS[draftType] : 'All'}
            </AppText>
            <View style={{ marginLeft: 'auto' }}>
              <Icon name="expand-more" size={22} color={colors.subtle} />
            </View>
          </ClayView>
        </PressClay>

        <View style={{ height: 14 }} />

        <AppText weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
          Topic
        </AppText>
        <PressClay onPress={() => setCategoryPickerOpen(true)}>
          <ClayView depth={6} puffy={10} color={colors.card} style={styles.selectorChip}>
            <Icon name="local-offer" size={18} color={colors.primary} />
            <AppText weight="bold" style={{ marginLeft: 8 }}>
              {draftCategory ? NEWS_CATEGORY_SHORT[draftCategory] : 'All'}
            </AppText>
            <View style={{ marginLeft: 'auto' }}>
              <Icon name="expand-more" size={22} color={colors.subtle} />
            </View>
          </ClayView>
        </PressClay>
      </FilterBottomSheet>

      <OptionPickerSheet
        isVisible={typePickerOpen}
        onClose={() => setTypePickerOpen(false)}
        title="Type"
        options={typeOptions}
        selected={draftType}
        onSelect={setDraftType}
        height={520}
      />

      <OptionPickerSheet
        isVisible={categoryPickerOpen}
        onClose={() => setCategoryPickerOpen(false)}
        title="Topic"
        options={categoryOptions}
        selected={draftCategory}
        onSelect={setDraftCategory}
        height={640}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#00000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  headerTitle: {
    marginLeft: 14,
    flex: 1,
  },
  filterRow: {
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  filterBtn: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countLine: {
    paddingHorizontal: 18,
    marginBottom: 4,
  },
  skeletonWrap: {
    padding: 20,
    gap: 16,
  },
  skeletonCard: {
    padding: 14,
    borderRadius: 20,
  },
  errorWrap: {
    marginTop: 80,
    paddingHorizontal: 20,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  card: {
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: '#00000020',
  },
  thumbFallback: {
    width: 68,
    height: 68,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000020',
  },
  cardText: {
    flex: 1,
  },
  badgeRow: {
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 2,
  },
  date: {
    marginTop: 8,
    opacity: 0.8,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorChip: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
