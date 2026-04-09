import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { CreateNewsRequest, PagedResponseOfNewsItemDto, UpdateNewsRequest } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

export const useNewsApi = () => {
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;

  const newsQuery = useQuery({
    queryKey: QUERY_KEYS.news.paginated(orgId!, 1, 50),
    queryFn: async () =>
      await unwrap<PagedResponseOfNewsItemDto>(newsApi.getAll(1, 50, undefined, undefined)),
  });

  const invalidateNews = () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.news.all(orgId!) });
      newsQuery.refetch();
  };

  const createNews = useMutation({
    mutationFn: async (request: CreateNewsRequest) => await unwrap(newsApi.create(request)),
    onSuccess: invalidateNews,
    onError: (err: any) => Alert.alert('Post Failed', err.message),
  });

  const updateNews = useMutation({
    mutationFn: async ({ id, request }: { id: string, request: UpdateNewsRequest }) => 
        await unwrap(newsApi.update(id, request)),
    onSuccess: invalidateNews,
    onError: (err: any) => Alert.alert('Update Failed', err.message),
  });

  const deleteNews = useMutation({
    mutationFn: async (id: string) => await unwrap(newsApi.delete(id)),
    onSuccess: invalidateNews,
    onError: (err: any) => Alert.alert('Delete Failed', err.message),
  });

  return {
    items: newsQuery.data?.items || [],
    isLoading: newsQuery.isLoading,
    isFetching: newsQuery.isFetching,
    refetch: newsQuery.refetch,
    createNews,
    updateNews,
    deleteNews
  };
};