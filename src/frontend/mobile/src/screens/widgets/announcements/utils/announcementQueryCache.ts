import type { QueryClient } from '@tanstack/react-query';

import type {
  AnnouncementChannelView,
  AnnouncementCommentDto,
  AnnouncementPostDto,
} from '@/src/api/announcementsApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { guidsEqual, normalizeGuid } from './announcementIds';

type PostsPage = { items?: AnnouncementPostDto[]; totalCount?: number; page?: number; pageSize?: number };

export function bumpPostCommentCount(
  queryClient: QueryClient,
  orgId: string,
  channelId: string,
  postId: string,
  delta = 1,
) {
  const channelKey = normalizeGuid(channelId);
  const postKey = normalizeGuid(postId);
  queryClient.setQueryData<PostsPage>(
    QUERY_KEYS.announcements.posts(orgId, channelKey),
    (old) => {
      if (!old?.items) return old;
      return {
        ...old,
        items: old.items.map((p) =>
          guidsEqual(p.id, postKey)
            ? { ...p, commentCount: Math.max(0, (p.commentCount ?? 0) + delta) }
            : p,
        ),
      };
    },
  );
}

export function appendCommentToCache(
  queryClient: QueryClient,
  orgId: string,
  postId: string,
  comment: AnnouncementCommentDto,
): boolean {
  const postKey = normalizeGuid(postId);
  let added = false;
  queryClient.setQueryData<AnnouncementCommentDto[]>(
    QUERY_KEYS.announcements.comments(orgId, postKey),
    (old) => {
      if (old?.some((c) => guidsEqual(c.id, comment.id))) return old;
      added = true;
      return [...(old ?? []), comment];
    },
  );
  return added;
}

export function applyRealtimeComment(
  queryClient: QueryClient,
  orgId: string,
  channelId: string,
  comment: AnnouncementCommentDto,
) {
  const added = appendCommentToCache(queryClient, orgId, comment.postId, comment);
  if (added) bumpPostCommentCount(queryClient, orgId, channelId, comment.postId);
}

export function appendAnnouncementPost(
  queryClient: QueryClient,
  orgId: string,
  post: AnnouncementPostDto,
): boolean {
  const channelId = normalizeGuid(post.channelId);
  const postId = normalizeGuid(post.id);
  if (!channelId || !postId) return false;

  const normalizedPost = { ...post, id: postId, channelId };
  let added = false;

  queryClient.setQueryData<PostsPage>(
    QUERY_KEYS.announcements.posts(orgId, channelId),
    (old) => {
      if (old?.items?.some((p) => guidsEqual(p.id, postId))) return old;
      added = true;
      const items = [...(old?.items ?? []), normalizedPost];
      return {
        page: old?.page ?? 1,
        pageSize: old?.pageSize ?? 100,
        totalCount: (old?.totalCount ?? items.length - 1) + 1,
        items,
      };
    },
  );

  return added;
}

export function bumpChannelUnreadCount(
  queryClient: QueryClient,
  orgId: string,
  channelId: string,
  delta = 1,
) {
  const channelKey = normalizeGuid(channelId);
  queryClient.setQueryData<AnnouncementChannelView[]>(
    QUERY_KEYS.announcements.channels(orgId),
    (old) =>
      old?.map((c) =>
        guidsEqual(c.id, channelKey)
          ? { ...c, unreadCount: Math.max(0, (c.unreadCount ?? 0) + delta) }
          : c,
      ),
  );
}

export function clearChannelUnreadCount(
  queryClient: QueryClient,
  orgId: string,
  channelId: string,
) {
  const channelKey = normalizeGuid(channelId);
  queryClient.setQueryData<AnnouncementChannelView[]>(
    QUERY_KEYS.announcements.channels(orgId),
    (old) => old?.map((c) => (guidsEqual(c.id, channelKey) ? { ...c, unreadCount: 0 } : c)),
  );
}
