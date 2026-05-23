import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  ClayView,
  ImageScrimGradient,
  ProgressiveImage,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { resolveMediaUrl } from '@/src/screens/widgets/map/utils/resolveMediaUrl';
import { NewsType } from '@/src/api/generatedClient';
import { ArticleAttachmentsSection } from './ArticleAttachmentsSection';
import { NewsArticleContent } from '../utils/newsArticleContent';
import { NEWS_CATEGORY_SHORT, newsCategoryAccent } from '../utils/newsLabels';
import { useArticleData } from '../hooks/useArticleData';

const typeMeta = (type: NewsType, colors: ReturnType<typeof useThemeColors>) => {
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

interface ArticlePanelProps {
  articleId: string | undefined;
}

export function ArticlePanel({ articleId }: ArticlePanelProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(), []);
  const { article, articleBody, attachments, articleQuery, isMarkingAsRead } = useArticleData(articleId);

  const meta = useMemo(() => (article ? typeMeta(article.type, colors) : null), [article, colors]);
  const categoryAccent = article ? newsCategoryAccent(article.category, colors) : colors.primary;

  if (!articleId) {
    return (
      <View style={styles.centered}>
        <WidgetEmptyState title="Select an article" description="Choose a story from the list to read it here." icon="article" />
      </View>
    );
  }

  if (articleQuery.isLoading) {
    return (
      <View style={{ paddingHorizontal: 18, marginTop: 12, flex: 1 }}>
        <Skeleton height={200} borderRadius={20} />
        <View style={{ height: 14 }} />
        <Skeleton height={16} width="55%" borderRadius={10} />
        <View style={{ height: 10 }} />
        <Skeleton height={30} width="92%" borderRadius={10} />
      </View>
    );
  }

  if (articleQuery.isError) {
    return (
      <View style={styles.centered}>
        <WidgetErrorState message="Could not load this article." onRetry={() => articleQuery.refetch()} />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.centered}>
        <WidgetEmptyState title="Article not found" icon="campaign" />
      </View>
    );
  }

  return (
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
  );
}

function createStyles() {
  return StyleSheet.create({
    centered: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 18,
    },
    scrollInner: {
      paddingBottom: 32,
      paddingTop: 8,
    },
    container: {
      paddingHorizontal: 18,
    },
    cover: {
      borderRadius: 20,
      overflow: 'hidden',
      height: 240,
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
}
