import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Icon, ProgressiveImage, Skeleton, WidgetEmptyState, WidgetErrorState } from '@/src/components/ui';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useNewsLogic } from '../hooks/useNewsLogic';
import type { NewsItemDto } from '@/src/api/generatedClient';
import { NewsType } from '@/src/api/generatedClient';

const typeLabel = (type: NewsType) => {
  switch (type) {
    case NewsType.Alert:
      return 'ALERT';
    case NewsType.Event:
      return 'EVENT';
    case NewsType.Info:
      return 'INFO';
    case NewsType.Announcement:
    default:
      return 'ANNOUNCEMENT';
  }
};

export const NewsCard = () => {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const { data, isLoading, isError, refetch } = useNewsLogic({
    orgId,
    page: 1,
    pageSize: 10,
    enabled: !!orgId,
  });

  const items = (data?.items ?? []).slice(0, 2);

  if (isLoading) {
    return (
      <View style={styles.wrap}>
        <View style={styles.row}>
          <Skeleton width={42} height={42} borderRadius={8} />
          <View style={{ flex: 1 }}>
            <Skeleton height={12} width="38%" />
            <Skeleton height={14} width="94%" style={{ marginTop: 8 }} />
          </View>
        </View>
        <View style={styles.row}>
          <Skeleton width={42} height={42} borderRadius={8} />
          <View style={{ flex: 1 }}>
            <Skeleton height={12} width="38%" />
            <Skeleton height={14} width="94%" style={{ marginTop: 8 }} />
          </View>
        </View>
      </View>
    );
  }

  if (isError) {
    return <WidgetErrorState message="Could not load latest posts." onRetry={() => void refetch()} />;
  }

  if (items.length === 0) {
    return (
      <WidgetEmptyState
        title="No updates"
        description="Check back for announcements."
        icon="campaign"
      />
    );
  }

  return (
    <View style={styles.wrap}>
      {items.map((post: NewsItemDto, idx: number) => (
        <View key={post.id} style={[styles.row, idx === items.length - 1 && { marginBottom: 0 }]}>
          {post.coverImageUrl ? (
            <ProgressiveImage source={{ uri: post.coverImageUrl }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={styles.thumbFallback}>
              <Icon name="campaign" size={18} />
            </View>
          )}
          <View style={styles.meta}>
            <AppText variant="caption" weight="bold" numberOfLines={1}>
              {typeLabel(post.type)}
            </AppText>
            <AppText variant="body" weight="bold" numberOfLines={1} style={{ marginTop: 2 }}>
              {post.title}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  thumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    marginRight: 10,
  },
  thumbFallback: {
    width: 42,
    height: 42,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  meta: {
    flex: 1,
  },
});
