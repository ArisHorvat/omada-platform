import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Icon, Skeleton, WidgetEmptyState, WidgetErrorState } from '@/src/components/ui';
import { useQuery } from '@tanstack/react-query';
import { announcementsApi, getChannelUnreadCount } from '@/src/api/announcementsApi';
import { unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

interface AnnouncementsHeroProps {
  accentColor: string;
}

export const AnnouncementsHero: React.FC<AnnouncementsHeroProps> = ({ accentColor }) => {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const { data: channels, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.announcements.channels(orgId),
    enabled: !!orgId,
    queryFn: async () => unwrap(await announcementsApi.getChannels()),
  });

  const unreadTotal = (channels ?? []).reduce((sum, c) => sum + getChannelUnreadCount(c), 0);
  const channelCount = channels?.length ?? 0;

  if (isLoading) {
    return (
      <View style={styles.wrap}>
        <Skeleton height={40} width="60%" borderRadius={12} />
        <Skeleton height={16} width="40%" style={{ marginTop: 12 }} />
      </View>
    );
  }

  if (isError) {
    return <WidgetErrorState message="Announcements unavailable." onRetry={() => void refetch()} />;
  }

  if (channelCount === 0) {
    return (
      <WidgetEmptyState
        title="No announcement channels"
        description="Join a course or group to see channel updates."
        icon="campaign"
        style={styles.empty}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Icon name="campaign" size={28} color={accentColor} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <AppText variant="h2" weight="bold" style={{ color: accentColor }} numberOfLines={1}>
            {unreadTotal > 0 ? `${unreadTotal} unread` : 'All caught up'}
          </AppText>
          <AppText variant="caption" style={{ color: accentColor, opacity: 0.8, marginTop: 4 }}>
            {channelCount} active {channelCount === 1 ? 'channel' : 'channels'}
          </AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', minHeight: 0 },
  empty: { minHeight: 88 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
