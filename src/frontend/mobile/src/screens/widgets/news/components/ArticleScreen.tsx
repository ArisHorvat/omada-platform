import React, { useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { newsApi, unwrap } from '@/src/api';
import { useThemeColors } from '@/src/hooks';
import { AppText, ClayView, ImageScrimGradient, ProgressiveImage, Skeleton, WidgetEmptyState, WidgetErrorState } from '@/src/components/ui';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { NewsItemDto, NewsType, PagedResponseOfNewsItemDto } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { resolveMediaUrl } from '@/src/screens/widgets/map/utils/resolveMediaUrl';
import { useNewsLogic } from '../hooks/useNewsLogic';
import { ArticleAttachmentsSection } from './ArticleAttachmentsSection';
import { NewsArticleContent } from '../utils/newsArticleContent';
import { NEWS_CATEGORY_SHORT, newsCategoryAccent } from '../utils/newsLabels';
import type { ParsedArticleAttachment } from '../utils/splitArticleBodyAndAttachments';
import { splitArticleBodyAndAttachments } from '../utils/splitArticleBodyAndAttachments';

/** Must stay ≤ backend `PagedRequestValidator` max (100). */
const NEWS_PAGE_SIZE = 100;

function findArticleInFeedCaches(queryClient: ReturnType<typeof useQueryClient>, articleId: string): NewsItemDto | undefined {
  const rows = queryClient.getQueriesData<InfiniteData<{ items?: NewsItemDto[] | null }>>({ queryKey: ['news:feed'] });
  for (const [, data] of rows) {
    if (!data?.pages?.length) continue;
    for (const p of data.pages) {
      const found = p.items?.find((x) => x.id === articleId);
      if (found) return found;
    }
  }
  return undefined;
}

const typeMeta = (type: NewsType, colors: any) => {
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

export default function ArticleScreen() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const { markAsRead, isMarkingAsRead } = useNewsLogic({
    orgId,
    enabled: false,
  });

  const didMarkRead = useRef(false);

  useEffect(() => {
    if (!id || !orgId) return;
    if (didMarkRead.current) return;

    didMarkRead.current = true;
    void markAsRead(id).catch(() => {
      // If read marking fails, don't block the UI.
    });
  }, [id, orgId, markAsRead]);

  const articleQuery = useQuery({
    queryKey: ['news:article', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('Article not found.');

      const fromFeed = findArticleInFeedCaches(queryClient, id);
      if (fromFeed) return fromFeed;

      let page = 1;
      for (;;) {
        const paged = await unwrap<PagedResponseOfNewsItemDto>(
          newsApi.getAll(page, NEWS_PAGE_SIZE, undefined, undefined),
        );
        const found = (paged.items ?? []).find((x) => x.id === id);
        if (found) return found;

        const total = paged.totalCount ?? 0;
        const count = paged.items?.length ?? 0;
        if (count === 0 || page * NEWS_PAGE_SIZE >= total) {
          throw new Error('Article not found.');
        }
        page += 1;
      }
    },
  });

  const article = articleQuery.data;
  const meta = useMemo(() => (article ? typeMeta(article.type, colors) : null), [article, colors]);

  const { body: articleBody, attachments } = useMemo(() => {
    if (!article?.content) return { body: '', attachments: [] as ParsedArticleAttachment[] };
    return splitArticleBodyAndAttachments(article.content);
  }, [article?.content]);

  const categoryAccent = article ? newsCategoryAccent(article.category, colors) : colors.primary;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <ClayBackButton />
        <AppText variant="h2" weight="bold" style={styles.headerTitle}>
          News
        </AppText>
      </View>

      {articleQuery.isLoading ? (
        <View style={{ paddingHorizontal: 18, marginTop: 12 }}>
          <Skeleton height={220} borderRadius={20} />
          <View style={{ height: 14 }} />
          <Skeleton height={16} width="55%" borderRadius={10} />
          <View style={{ height: 10 }} />
          <Skeleton height={30} width="92%" borderRadius={10} />
          <View style={{ height: 12 }} />
          <Skeleton height={14} width="88%" borderRadius={10} />
          <View style={{ height: 10 }} />
          <Skeleton height={14} width="82%" borderRadius={10} />
        </View>
      ) : articleQuery.isError ? (
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 18 }}>
          <WidgetErrorState message="Could not load this article." onRetry={() => articleQuery.refetch()} />
        </View>
      ) : !article ? (
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 18 }}>
          <WidgetEmptyState title="Article not found" icon="campaign" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollInner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
          <ClayView depth={8} puffy={12} style={styles.cover}>
            {article.coverImageUrl ? (
              <ProgressiveImage
                source={{ uri: resolveMediaUrl(article.coverImageUrl) ?? article.coverImageUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.subtle + '20' }]} />
            )}

            <ImageScrimGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.75)']} />

            <View style={styles.coverText}>
              <View style={styles.badgeRow}>
                {meta ? (
                  <View style={[styles.typeBadge, { backgroundColor: meta.color + 'E6' }]}>
                    <AppText weight="bold" style={styles.typeBadgeText}>
                      {meta.label.toUpperCase()}
                    </AppText>
                  </View>
                ) : null}
                <View style={[styles.catBadge, { backgroundColor: categoryAccent + 'E6' }]}>
                  <AppText weight="bold" style={styles.catBadgeText}>
                    {NEWS_CATEGORY_SHORT[article.category].toUpperCase()}
                  </AppText>
                </View>
              </View>

              <AppText variant="h2" weight="bold" style={styles.coverTitle} numberOfLines={3}>
                {article.title}
              </AppText>
              <AppText variant="caption" style={styles.coverMeta}>
                {new Date(article.createdAt).toLocaleDateString()}
              </AppText>
              {article.authorName ? (
                <AppText variant="caption" style={[styles.coverMeta, { marginTop: 4 }]}>
                  {article.authorName}
                </AppText>
              ) : null}
            </View>
          </ClayView>

          <View style={{ height: 14 }} />

          <ClayView depth={6} puffy={10} style={styles.body}>
            <NewsArticleContent
              content={articleBody}
              textColor={colors.text}
              linkColor={colors.primary}
              borderColor={colors.border}
            />
            <ArticleAttachmentsSection attachments={attachments} />
            {isMarkingAsRead ? (
              <View style={{ marginTop: 14 }}>
                <Skeleton height={14} width="45%" borderRadius={10} />
              </View>
            ) : null}
          </ClayView>
          </View>
        </ScrollView>
      )}
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
    paddingBottom: 12,
    paddingTop: 6,
  },
  headerTitle: {
    marginLeft: 14,
  },
  scrollInner: {
    paddingBottom: 32,
  },
  container: {
    paddingHorizontal: 18,
  },
  cover: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 260,
    padding: 0,
  },
  coverText: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
  },
  badgeRow: {
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  catBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  catBadgeText: {
    color: '#FFFFFF',
    opacity: 0.95,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    opacity: 0.95,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  coverTitle: {
    color: '#FFFFFF',
  },
  coverMeta: {
    color: '#FFFFFF',
    opacity: 0.86,
    marginTop: 6,
  },
  body: {
    borderRadius: 20,
    padding: 16,
  },
});

