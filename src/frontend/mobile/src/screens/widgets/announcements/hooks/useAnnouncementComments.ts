import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  announcementsApi,
  type AnnouncementCommentDto,
} from '@/src/api/announcementsApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import {
  appendCommentToCache,
  bumpPostCommentCount,
} from '../utils/announcementQueryCache';

function unwrapAxios<T>(res: { data?: { isSuccess?: boolean; data?: T; error?: { message?: string } } }): T {
  const body = res.data;
  if (body?.isSuccess === false) {
    throw new Error(body.error?.message || 'Request failed');
  }
  if (body?.data == null) {
    throw new Error('Empty response');
  }
  return body.data;
}

export function useAnnouncementComments(
  postId: string,
  channelId: string,
  orgId: string,
  enabled: boolean,
) {
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: QUERY_KEYS.announcements.comments(orgId, postId),
    queryFn: async () => unwrapAxios(await announcementsApi.getPostComments(postId)),
    enabled: enabled && !!postId,
  });

  const addComment = useMutation({
    mutationFn: async (content: string) =>
      unwrapAxios(await announcementsApi.createComment(postId, content)),
    onSuccess: (comment: AnnouncementCommentDto) => {
      const added = appendCommentToCache(queryClient, orgId, postId, comment);
      if (added) bumpPostCommentCount(queryClient, orgId, channelId, postId);
    },
  });

  return {
    comments: commentsQuery.data ?? [],
    isLoading: commentsQuery.isLoading,
    addComment: addComment.mutateAsync,
    isAdding: addComment.isPending,
  };
}
