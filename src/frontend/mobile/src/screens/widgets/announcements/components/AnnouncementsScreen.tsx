import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageContainer } from '@/src/components/layout/PageContainer';
import { SplitPane } from '@/src/components/layout/SplitPane';
import {
  AppText,
  Icon,
  WidgetEmptyState,
  WidgetErrorState,
  Skeleton,
  BottomSheet,
} from '@/src/components/ui';
import { usePermission } from '@/src/context/PermissionContext';
import { useThemeColors, useTabContentBottomPadding, useBreakpoint } from '@/src/hooks';
import { AnnouncementChannelKind, getChannelUnreadCount } from '@/src/api/announcementsApi';
import { useAnnouncementsLogic } from '../hooks/useAnnouncementsLogic';
import { createAnnouncementsStyles } from '../styles/announcements.styles';
import { AnnouncementsChannelPanel } from './AnnouncementsChannelPanel';
import { AnnouncementPostCard } from './AnnouncementPostCard';
import { AnnouncementComposePanel } from './AnnouncementComposePanel';

function channelKindLabel(kind?: AnnouncementChannelKind): string {
  if (kind === AnnouncementChannelKind.Group) return 'Group channel';
  if (kind === AnnouncementChannelKind.CourseOffering) return 'Course channel';
  return 'Organization-wide';
}

export default function AnnouncementsScreen() {
  const colors = useThemeColors();
  const { can } = usePermission();
  const canPublish = can('announcements.post');
  const listBottomPad = useTabContentBottomPadding(32);
  const { isWideShell } = useBreakpoint();
  const {
    orgId,
    channels,
    groupedChannels,
    totalUnread,
    selectedChannel,
    selectedChannelId,
    setSelectedChannelId,
    posts,
    postsDataUpdatedAt,
    expandedPostId,
    togglePostExpanded,
    isLoading,
    isError,
    refetch,
    title,
    setTitle,
    content,
    setContent,
    handlePublish,
    isPublishing,
  } = useAnnouncementsLogic();

  const flatListRef = useRef<FlatList<(typeof posts)[number]>>(null);
  const styles = useMemo(() => createAnnouncementsStyles(colors), [colors]);
  const [channelsOpen, setChannelsOpen] = useState(false);

  useEffect(() => {
    if (posts.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [posts.length, selectedChannelId]);

  const mobileChannelPicker =
    !isWideShell && channels.length > 1 ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8, gap: 8 }}
      >
        {channels.map((channel) => {
          const active = channel.id === selectedChannelId;
          const unread = getChannelUnreadCount(channel);
          const hasUnread = unread > 0;
          return (
            <Pressable
              key={channel.id}
              onPress={() => setSelectedChannelId(channel.id!)}
              style={[
                styles.channelRow,
                { marginBottom: 0 },
                active && styles.channelRowActive,
                hasUnread && !active && styles.channelRowUnread,
              ]}
            >
              <AppText
                variant="caption"
                weight="bold"
                style={{ color: hasUnread && !active ? colors.error : active ? colors.primary : colors.text }}
              >
                {channel.name}
                {hasUnread ? ` (${unread})` : ''}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    ) : null;

  const channelPickerButton =
    !isWideShell && channels.length > 0 ? (
      <Pressable
        onPress={() => setChannelsOpen(true)}
        style={[
          styles.channelRow,
          { marginTop: 8, alignSelf: 'flex-start' },
          totalUnread > 0 && styles.channelRowUnread,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Choose announcement channel"
      >
        <Icon name="layers" size={18} color={totalUnread > 0 ? colors.error : colors.primary} />
        <AppText
          variant="caption"
          weight="bold"
          style={{ color: totalUnread > 0 ? colors.error : colors.primary, marginLeft: 6 }}
        >
          All channels ({channels.length})
          {totalUnread > 0 ? ` · ${totalUnread} unread` : ''}
        </AppText>
      </Pressable>
    ) : null;

  const composer = canPublish ? (
    <AnnouncementComposePanel
      title={title}
      content={content}
      onTitleChange={setTitle}
      onContentChange={setContent}
      onPublish={handlePublish}
      isPublishing={isPublishing}
    />
  ) : null;

  const thread = (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.threadHeader}>
          <View style={styles.threadTitleRow}>
            <Icon name="campaign" size={24} color={colors.primary} />
            <AppText variant="h3" weight="bold" style={{ marginLeft: 10, color: colors.text, flex: 1 }}>
              {selectedChannel?.name ?? 'Announcements'}
            </AppText>
          </View>
          {selectedChannel ? (
            <AppText variant="caption" style={styles.channelSubtitle}>
              {channelKindLabel(selectedChannel.kind)} · tap comments on a post to reply
            </AppText>
          ) : null}
          {channelPickerButton}
          {mobileChannelPicker}
        </View>

        {isLoading ? (
          <View style={{ padding: 16, gap: 10 }}>
            <Skeleton height={64} borderRadius={16} />
            <Skeleton height={64} borderRadius={16} />
          </View>
        ) : isError ? (
          <WidgetErrorState message="Could not load announcements." onRetry={() => void refetch()} />
        ) : posts.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <WidgetEmptyState
              title="No announcements yet"
              description="Posts in this channel will appear here. Members can comment on each announcement."
              icon="campaign"
            />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            style={{ flex: 1 }}
            data={posts}
            extraData={[posts, postsDataUpdatedAt, expandedPostId]}
            keyExtractor={(item) => item.id!}
            renderItem={({ item }) => (
              <AnnouncementPostCard
                post={item}
                expanded={expandedPostId === item.id}
                onToggle={() => togglePostExpanded(item.id!)}
                orgId={orgId}
              />
            )}
            contentContainerStyle={[styles.listContent, { paddingBottom: canPublish ? 12 : Math.max(20, listBottomPad) }]}
            showsVerticalScrollIndicator={isWideShell}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {composer}
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageContainer>
        {isWideShell ? (
          <SplitPane
            sidebar={
              <AnnouncementsChannelPanel
                groupedChannels={groupedChannels}
                selectedChannelId={selectedChannelId}
                onSelectChannel={setSelectedChannelId}
              />
            }
          >
            {thread}
          </SplitPane>
        ) : (
          thread
        )}

        {!isWideShell ? (
          <BottomSheet isVisible={channelsOpen} onClose={() => setChannelsOpen(false)} height={560}>
            <AnnouncementsChannelPanel
              groupedChannels={groupedChannels}
              selectedChannelId={selectedChannelId}
              onSelectChannel={(id) => {
                setSelectedChannelId(id);
                setChannelsOpen(false);
              }}
            />
          </BottomSheet>
        ) : null}
      </PageContainer>
    </SafeAreaView>
  );
}
