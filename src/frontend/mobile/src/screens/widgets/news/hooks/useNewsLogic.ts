import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import apiClient from '@/src/api/apiClient';
import { API_BASE_URL } from '@/src/config/config';
import {
  NewsClient,
  type PagedResponseOfNewsItemDto,
  type ServiceResponseOfPagedResponseOfNewsItemDto,
  CreateNewsItemRequest,
  type ServiceResponseOfNewsItemDto,
  NewsCategory,
  NewsType,
} from '@/src/api/generatedClient';

export interface UseNewsLogicParams {
  orgId: string;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
  client?: NewsClient;
}

/**
 * Widget unread list hook.
 * - GET: /api/organizations/{orgId}/widgets/news (unread-only)
 * - POST: /api/news/{id}/read (marks read; clears unread badge via invalidation)
 * - POST: /api/organizations/{orgId}/widgets/news (publish)
 */
export const useNewsLogic = ({
  orgId,
  page = 1,
  pageSize = 20,
  enabled = true,
  client,
}: UseNewsLogicParams) => {
  const newsClient = useMemo(
    () => client ?? new NewsClient(API_BASE_URL, apiClient),
    [client]
  );

  const queryClient = useQueryClient();

  const query = useQuery<PagedResponseOfNewsItemDto>({
    queryKey: ['news', orgId, page, pageSize],
    enabled: enabled && !!orgId,
    queryFn: async () => {
      const response: ServiceResponseOfPagedResponseOfNewsItemDto =
        await newsClient.getWidgetNews(orgId, page, pageSize);

      if (response?.isSuccess === false) {
        throw new Error(response.error?.message || 'Failed to fetch news feed.');
      }
      if (!response?.data) {
        throw new Error('News feed response contained no data.');
      }
      return response.data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (newsItemId: string) => {
      if (!orgId) throw new Error('Organization id is required.');

      const res = await apiClient.post<{
        isSuccess?: boolean;
        data?: boolean;
        error?: { message?: string };
      }>(`/news/${newsItemId}/read`);

      if (res.data?.isSuccess === false) {
        throw new Error(res.data.error?.message || 'Failed to mark as read.');
      }

      return !!res.data?.data;
    },
    onSuccess: async () => {
      // Widget unread list is derived from /widgets/news (unread-only).
      await queryClient.invalidateQueries({ queryKey: ['news', orgId] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      content: string;
      coverImageUrl?: string;
      type?: NewsType;
      category?: NewsCategory;
    }) => {
      if (!orgId) throw new Error('Organization id is required.');

      const request = new CreateNewsItemRequest({
        title: payload.title,
        content: payload.content,
        coverImageUrl: payload.coverImageUrl,
        type: payload.type ?? NewsType.Announcement,
        category: payload.category ?? NewsCategory.General,
      });

      const res: ServiceResponseOfNewsItemDto = await newsClient.createWidgetNews(orgId, request);
      if (res?.isSuccess === false) {
        throw new Error(res.error?.message || 'Failed to publish news.');
      }
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['news', orgId] });
      await queryClient.invalidateQueries({ queryKey: ['news:feed'] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    markAsRead: markAsReadMutation.mutateAsync,
    isMarkingAsRead: markAsReadMutation.isPending,
    publishNews: publishMutation.mutateAsync,
    isPublishingNews: publishMutation.isPending,
  };
};