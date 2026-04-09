import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Icon, Skeleton, WidgetEmptyState, WidgetErrorState } from '@/src/components/ui';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useNewsLogic } from '../hooks/useNewsLogic';

export const NewsBento = () => {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const { data, isLoading, isError, refetch } = useNewsLogic({
    orgId,
    page: 1,
    pageSize: 10,
    enabled: !!orgId,
  });

  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <View style={styles.wrap}>
        <Skeleton width={28} height={28} borderRadius={14} />
        <Skeleton width="70%" height={18} style={{ marginTop: 10 }} />
        <Skeleton width="86%" height={12} style={{ marginTop: 8 }} />
      </View>
    );
  }

  if (isError) {
    return <WidgetErrorState message="News unavailable." onRetry={() => void refetch()} />;
  }

  if (items.length === 0) {
    return <WidgetEmptyState title="No posts" icon="campaign" />;
  }

  const latest = items[0];
  const unreadCount = items.length;

  return (
    <View style={styles.wrap}>
      <View style={styles.iconBubble}>
        <Icon name="campaign" size={18} />
      </View>
      <AppText variant="h3" weight="bold" numberOfLines={1} style={{ marginTop: 8 }}>
        {unreadCount > 1 ? `${unreadCount} New Posts` : 'New Post'}
      </AppText>
      <AppText variant="caption" numberOfLines={2} style={{ marginTop: 6 }}>
        {latest.title}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
