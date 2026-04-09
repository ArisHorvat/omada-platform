import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/context/AuthContext';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { NewsItemDto } from '@/src/api/generatedClient'; // <-- Import the DTO
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

export const useNewsData = () => {
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;

  // Type the items properly
  const { data: items = [], isLoading, isFetching, refetch } = useQuery<NewsItemDto[]>({
    queryKey: QUERY_KEYS.news.all(orgId!),
    queryFn: async () => { return []; }, 
    enabled: !!orgId,
  });

  const deleteMutation = useMutation({
     mutationFn: async (id: string) => { return; },
     onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.news.all(orgId!) }),
     onError: () => Alert.alert("Error", "Failed to delete post")
  });

  const handleDelete = (id: string) => {
    Alert.alert("Delete Post", "Are you sure you want to remove this?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(id) }
    ]);
  };

  return { 
    items, 
    loading: isLoading, 
    refreshing: isFetching, 
    onRefresh: async () => { await refetch(); }, 
    handleDelete 
  };
};