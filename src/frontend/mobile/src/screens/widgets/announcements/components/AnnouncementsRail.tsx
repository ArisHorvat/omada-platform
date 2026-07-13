import React from 'react';
import { View } from 'react-native';

import { AppText, Icon, Skeleton } from '@/src/components/ui';
import { useQuery } from '@tanstack/react-query';
import { announcementsApi, getChannelUnreadCount } from '@/src/api/announcementsApi';
import { unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

interface AnnouncementsRailProps {
  accentColor: string;
}

export const AnnouncementsRail: React.FC<AnnouncementsRailProps> = ({ accentColor }) => {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const { data: channels, isLoading } = useQuery({
    queryKey: QUERY_KEYS.announcements.channels(orgId),
    enabled: !!orgId,
    queryFn: async () => unwrap(await announcementsApi.getChannels()),
  });

  const unreadTotal = (channels ?? []).reduce((sum, c) => sum + getChannelUnreadCount(c), 0);

  if (isLoading) {
    return <Skeleton width={48} height={14} borderRadius={8} />;
  }

  return (
    <View style={{ alignItems: 'center', marginTop: 4 }}>
      <Icon name="campaign" size={22} color={accentColor} />
      <AppText variant="caption" weight="bold" style={{ color: accentColor, marginTop: 6 }}>
        {unreadTotal > 0 ? `${unreadTotal} new` : 'Open'}
      </AppText>
    </View>
  );
};
