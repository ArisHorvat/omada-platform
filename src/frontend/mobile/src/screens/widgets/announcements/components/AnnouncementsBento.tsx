import React from 'react';

import { StyleSheet, View } from 'react-native';



import { AppText, Icon, Skeleton, WidgetEmptyState, WidgetErrorState } from '@/src/components/ui';

import { useQuery } from '@tanstack/react-query';

import { announcementsApi, getChannelUnreadCount } from '@/src/api/announcementsApi';

import { unwrap } from '@/src/api';

import { QUERY_KEYS } from '@/src/api/queryKeys';

import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

import { useThemeColors } from '@/src/hooks';

import type { BaseWidgetProps } from '@/src/constants/widgets.registry';



interface AnnouncementsBentoProps {

  accentColor: string;

  size?: BaseWidgetProps['size'];

}



export const AnnouncementsBento: React.FC<AnnouncementsBentoProps> = ({ accentColor, size }) => {

  const { organization } = useCurrentOrganization();

  const orgId = organization?.id ?? '';

  const colors = useThemeColors();

  const isLarge = size === 'large' || size === 'wide';



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

        <Skeleton width={28} height={28} borderRadius={14} />

        <Skeleton width="70%" height={18} style={{ marginTop: 10 }} />

        <Skeleton width="86%" height={12} style={{ marginTop: 8 }} />

      </View>

    );

  }



  if (isError) {

    return <WidgetErrorState message="Announcements unavailable." onRetry={() => void refetch()} />;

  }



  if (channelCount === 0) {

    return (

      <WidgetEmptyState

        title="No channels"

        description="Join a course or group to see updates."

        icon="campaign"

        style={styles.empty}

      />

    );

  }



  return (

    <View style={styles.wrap}>

      <View style={[styles.iconBubble, { backgroundColor: `${accentColor}22` }]}>

        <Icon name="campaign" size={isLarge ? 20 : 16} color={accentColor} />

      </View>

      <AppText

        variant={isLarge ? 'h3' : 'body'}

        weight="bold"

        numberOfLines={2}

        style={{ marginTop: 6, color: colors.text }}

      >

        {unreadTotal > 0

          ? unreadTotal === 1

            ? '1 unread announcement'

            : `${unreadTotal} unread announcements`

          : 'All caught up'}

      </AppText>

      <AppText variant="caption" numberOfLines={2} style={{ marginTop: 4, color: colors.subtle }}>

        {channelCount} {channelCount === 1 ? 'channel' : 'channels'}

      </AppText>

    </View>

  );

};



const styles = StyleSheet.create({

  wrap: { flex: 1, justifyContent: 'center', minHeight: 0 },

  empty: { minHeight: 72, paddingVertical: 6 },

  iconBubble: {

    width: 32,

    height: 32,

    borderRadius: 16,

    alignItems: 'center',

    justifyContent: 'center',

    alignSelf: 'flex-start',

  },

});


