import React from 'react';

import { Pressable, ScrollView, View } from 'react-native';



import { AppText, ClayView, Icon } from '@/src/components/ui';

import { useThemeColors } from '@/src/hooks';

import type { AnnouncementChannelView } from '@/src/api/announcementsApi';

import {

  getChannelUnreadCount,

  isCourseChannel,

  isGeneralChannel,

  isGroupChannel,

} from '@/src/api/announcementsApi';

import { createAnnouncementsStyles } from '../styles/announcements.styles';



interface AnnouncementsChannelPanelProps {

  groupedChannels: {

    general: AnnouncementChannelView[];

    groups: AnnouncementChannelView[];

    courses: AnnouncementChannelView[];

  };

  selectedChannelId: string | null;

  onSelectChannel: (id: string) => void;

}



function ChannelSection({

  title,

  channels,

  selectedChannelId,

  onSelectChannel,

  styles,

  colors,

}: {

  title: string;

  channels: AnnouncementChannelView[];

  selectedChannelId: string | null;

  onSelectChannel: (id: string) => void;

  styles: ReturnType<typeof createAnnouncementsStyles>;

  colors: ReturnType<typeof useThemeColors>;

}) {

  if (channels.length === 0) return null;



  return (

    <View style={styles.channelSection}>

      <AppText variant="label" weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>

        {title}

      </AppText>

      {channels.map((channel) => {

        const active = channel.id === selectedChannelId;

        const unread = getChannelUnreadCount(channel);

        const hasUnread = unread > 0;



        return (

          <Pressable

            key={channel.id}

            onPress={() => onSelectChannel(channel.id!)}

            style={[

              styles.channelRow,

              active && styles.channelRowActive,

              hasUnread && !active && styles.channelRowUnread,

            ]}

          >

            <Icon

              name={

                isGeneralChannel(channel)

                  ? 'campaign'

                  : isGroupChannel(channel)

                    ? 'group'

                    : 'school'

              }

              size={20}

              color={hasUnread && !active ? colors.error : active ? colors.primary : colors.subtle}

            />

            <View style={{ flex: 1, marginLeft: 10 }}>

              <AppText variant="body" weight="bold" numberOfLines={1} style={{ color: colors.text }}>

                {channel.name}

              </AppText>

              {hasUnread ? (

                <AppText variant="caption" weight="bold" style={{ color: colors.error, marginTop: 2 }}>

                  {unread === 1 ? '1 unread announcement' : `${unread} unread announcements`}

                </AppText>

              ) : (

                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }}>

                  All caught up

                </AppText>

              )}

            </View>

          </Pressable>

        );

      })}

    </View>

  );

}



export function AnnouncementsChannelPanel({

  groupedChannels,

  selectedChannelId,

  onSelectChannel,

}: AnnouncementsChannelPanelProps) {

  const colors = useThemeColors();

  const styles = createAnnouncementsStyles(colors);



  return (

    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}>

      <ClayView depth={10} puffy={16} color={colors.card} style={{ padding: 20, borderRadius: 20, marginBottom: 16 }}>

        <View style={{ alignItems: 'center' }}>

          <View

            style={{

              width: 56,

              height: 56,

              borderRadius: 28,

              alignItems: 'center',

              justifyContent: 'center',

              backgroundColor: colors.primaryContainer,

            }}

          >

            <Icon name="campaign" size={28} color={colors.primary} />

          </View>

          <AppText variant="h3" weight="bold" style={{ color: colors.text, marginTop: 12 }}>

            Announcements

          </AppText>

          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6, textAlign: 'center' }}>

            Unread counts appear on each channel. Open a channel to mark announcements as read.

          </AppText>

        </View>

      </ClayView>



      <ChannelSection

        title="GENERAL"

        channels={groupedChannels.general}

        selectedChannelId={selectedChannelId}

        onSelectChannel={onSelectChannel}

        styles={styles}

        colors={colors}

      />

      <ChannelSection

        title="GROUPS & TEAMS"

        channels={groupedChannels.groups}

        selectedChannelId={selectedChannelId}

        onSelectChannel={onSelectChannel}

        styles={styles}

        colors={colors}

      />

      <ChannelSection

        title="COURSEWORK"

        channels={groupedChannels.courses}

        selectedChannelId={selectedChannelId}

        onSelectChannel={onSelectChannel}

        styles={styles}

        colors={colors}

      />

    </ScrollView>

  );

}

