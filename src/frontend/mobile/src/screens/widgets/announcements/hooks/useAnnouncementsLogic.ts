import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';

import { useAuth } from '@/src/context/AuthContext';
import { unwrap } from '@/src/api';
import {
  announcementsApi,
  isCourseChannel,
  isGeneralChannel,
  isGroupChannel,
  type AnnouncementChannelView,
  type AnnouncementPostDto,
  CreateAnnouncementPostRequest,
} from '@/src/api/announcementsApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { normalizeGuid } from '@/src/screens/widgets/announcements/utils/announcementIds';
import {
  appendAnnouncementPost,
  clearChannelUnreadCount,
} from '@/src/screens/widgets/announcements/utils/announcementQueryCache';
import { announcementViewState } from '@/src/screens/widgets/announcements/utils/announcementViewState';

export function useAnnouncementsLogic() {
  const { activeSession } = useAuth();
  const queryClient = useQueryClient();
  const orgId = activeSession?.orgId ?? '';

  const [selectedChannelId, setSelectedChannelIdState] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const setSelectedChannelId = (id: string | null) => {
    setSelectedChannelIdState(id ? normalizeGuid(id) : null);
  };

  const channelsQuery = useQuery({
    queryKey: QUERY_KEYS.announcements.channels(orgId),
    queryFn: async () => unwrap(await announcementsApi.getChannels()),
    enabled: !!orgId,
  });

  const channels = channelsQuery.data ?? [];

  useEffect(() => {
    if (!selectedChannelId && channels.length > 0) {
      const general = channels.find(isGeneralChannel);
      setSelectedChannelId(general?.id ?? channels[0].id ?? null);
    }
  }, [channels, selectedChannelId]);

  useEffect(() => {
    setExpandedPostId(null);
  }, [selectedChannelId]);

  useEffect(() => {
    announcementViewState.setViewingChannelId(selectedChannelId);
    return () => announcementViewState.setViewingChannelId(null);
  }, [selectedChannelId]);

  const selectedChannel = useMemo(
    () => channels.find((c) => normalizeGuid(c.id) === selectedChannelId) ?? null,
    [channels, selectedChannelId],
  );

  const postsQuery = useQuery({
    queryKey: QUERY_KEYS.announcements.posts(orgId, selectedChannelId ?? ''),
    queryFn: async () =>
      unwrap(await announcementsApi.getChannelPosts(selectedChannelId!, 1, 100)),
    enabled: !!orgId && !!selectedChannelId,
    staleTime: 30_000,
    refetchOnMount: 'always',
    structuralSharing: false,
  });

  const posts = postsQuery.data?.items ?? [];

  const markChannelReadMutation = useMutation({
    mutationFn: async (channelId: string) => {
      await announcementsApi.markChannelRead(channelId);
    },
    onSuccess: (_data, channelId) => {
      clearChannelUnreadCount(queryClient, orgId, channelId);
    },
  });

  useEffect(() => {
    if (!selectedChannelId || !orgId) return;
    clearChannelUnreadCount(queryClient, orgId, selectedChannelId);
    markChannelReadMutation.mutate(selectedChannelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mark read when channel opens only
  }, [selectedChannelId, orgId]);

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!selectedChannelId) throw new Error('Select a channel');
      const trimmedTitle = title.trim();
      const trimmedContent = content.trim();
      if (!trimmedTitle) throw new Error('Enter a title');
      if (!trimmedContent) throw new Error('Enter announcement text');

      const request = new CreateAnnouncementPostRequest({
        title: trimmedTitle,
        content: trimmedContent,
      });
      return unwrap(await announcementsApi.createPost(selectedChannelId, request));
    },
    onSuccess: (post) => {
      setTitle('');
      setContent('');
      appendAnnouncementPost(queryClient, orgId, post);
      if (selectedChannelId) {
        clearChannelUnreadCount(queryClient, orgId, selectedChannelId);
        void markChannelReadMutation.mutateAsync(selectedChannelId);
      }
    },
  });

  const handlePublish = () => {
    if (publishMutation.isPending) return;
    publishMutation.mutate();
  };

  const groupedChannels = useMemo(
    () => ({
      general: channels.filter(isGeneralChannel),
      groups: channels.filter(isGroupChannel),
      courses: channels.filter(isCourseChannel),
    }),
    [channels],
  );

  const totalUnread = useMemo(
    () => channels.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),
    [channels],
  );

  const togglePostExpanded = (postId: string) => {
    setExpandedPostId((prev) => (prev === postId ? null : postId));
  };

  return {
    orgId,
    channels,
    groupedChannels,
    totalUnread,
    selectedChannel,
    selectedChannelId,
    setSelectedChannelId,
    posts,
    postsDataUpdatedAt: postsQuery.dataUpdatedAt,
    expandedPostId,
    togglePostExpanded,
    isLoading: channelsQuery.isLoading || postsQuery.isLoading,
    isError: channelsQuery.isError || postsQuery.isError,
    refetch: () => {
      void channelsQuery.refetch();
      void postsQuery.refetch();
    },
    title,
    setTitle,
    content,
    setContent,
    handlePublish,
    isPublishing: publishMutation.isPending,
    publishError: publishMutation.error,
  };
}

export type { AnnouncementChannelView, AnnouncementPostDto };
