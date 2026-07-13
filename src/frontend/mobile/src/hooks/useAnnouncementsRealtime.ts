import { useCallback, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';

import { announcementsApi } from '@/src/api/announcementsApi';
import { unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useOrganizationHub } from '@/src/hooks/useOrganizationHub';
import { guidsEqual } from '@/src/screens/widgets/announcements/utils/announcementIds';
import {
  parseAnnouncementCommentPayload,
  parseAnnouncementPostPayload,
} from '@/src/screens/widgets/announcements/utils/announcementRealtimePayload';
import {
  appendAnnouncementPost,
  applyRealtimeComment,
  bumpChannelUnreadCount,
  clearChannelUnreadCount,
} from '@/src/screens/widgets/announcements/utils/announcementQueryCache';
import { announcementViewState } from '@/src/screens/widgets/announcements/utils/announcementViewState';

export function useAnnouncementsRealtime(orgId: string, token: string | undefined) {
  const queryClient = useQueryClient();

  const userId = useMemo(() => {
    if (!token) return '';
    try {
      const decoded = jwtDecode<{ sub?: string; nameid?: string }>(token);
      return (decoded.sub || decoded.nameid || '').trim().toLowerCase();
    } catch {
      return '';
    }
  }, [token]);

  useEffect(() => {
    if (!orgId) return;
    void queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.announcements.channels(orgId),
      queryFn: async () => unwrap(await announcementsApi.getChannels()),
    });
  }, [orgId, queryClient]);

  const handleAnnouncementPost = useCallback(
    (payload: unknown) => {
      if (!orgId) return;

      const post = parseAnnouncementPostPayload(payload);
      if (!post?.id || !post.channelId) return;

      appendAnnouncementPost(queryClient, orgId, post);

      const isOwnPost = guidsEqual(post.authorId, userId);
      if (isOwnPost) return;

      const viewingChannelId = announcementViewState.getViewingChannelId();
      if (viewingChannelId && guidsEqual(viewingChannelId, post.channelId)) {
        clearChannelUnreadCount(queryClient, orgId, post.channelId);
        void announcementsApi.markChannelRead(post.channelId);
        return;
      }

      bumpChannelUnreadCount(queryClient, orgId, post.channelId);

      const channels = queryClient.getQueryData<{ id?: string }[]>(
        QUERY_KEYS.announcements.channels(orgId),
      );
      if (!channels?.length) {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.announcements.channels(orgId) });
      }
    },
    [orgId, queryClient, userId],
  );

  const handleAnnouncementComment = useCallback(
    (payload: unknown) => {
      if (!orgId) return;

      const comment = parseAnnouncementCommentPayload(payload);
      if (!comment?.postId) return;

      const viewingChannelId = announcementViewState.getViewingChannelId();
      if (viewingChannelId) {
        const cached = queryClient.getQueryData<{ items?: { id?: string; channelId?: string }[] }>(
          QUERY_KEYS.announcements.posts(orgId, viewingChannelId),
        );
        const post = cached?.items?.find((p) => guidsEqual(p.id, comment.postId));
        if (post?.channelId) {
          applyRealtimeComment(queryClient, orgId, post.channelId, comment);
          return;
        }
      }

      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.announcements.comments(orgId, comment.postId),
      });
    },
    [orgId, queryClient],
  );

  const handleAppForeground = useCallback(() => {
    if (!orgId) return;
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.announcements.channels(orgId) });
    const viewingChannelId = announcementViewState.getViewingChannelId();
    if (viewingChannelId) {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.announcements.posts(orgId, viewingChannelId),
      });
    }
  }, [orgId, queryClient]);

  useOrganizationHub(orgId, token, {
    onAnnouncementPost: handleAnnouncementPost,
    onAnnouncementComment: handleAnnouncementComment,
    onAppForeground: handleAppForeground,
  });
}
