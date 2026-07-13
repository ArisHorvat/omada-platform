import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/src/api/queryKeys';
import { scrapedHostAliasesApi } from '@/src/api/scrapedHostAliasesApi';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

export function useScrapedHostAliases(orgId: string) {
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();

  const aliasesQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.scrapedHostAliases(orgId),
    queryFn: () => scrapedHostAliasesApi.list(),
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const linkMutation = useMutation({
    mutationFn: (input: { scrapedLabel: string; hostUserId: string; hostDisplayName: string }) =>
      scrapedHostAliasesApi.link(input.scrapedLabel, input.hostUserId, input.hostDisplayName),
    onSuccess: async (aliases) => {
      queryClient.setQueryData(QUERY_KEYS.orgAdmin.scrapedHostAliases(orgId), aliases);
      await queryClient.invalidateQueries({ queryKey: ['scraped-import-resolution'] });
      await queryClient.invalidateQueries({ queryKey: ['orgAdmin', orgId, 'offerings'] });
      await queryClient.invalidateQueries({ queryKey: ['timetable'] });
      if (organization?.id) {
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedule.all(organization.id) });
      }
    },
    onError: (error: Error) => {
      Alert.alert('Could not save mapping', error.message || 'Try again.');
    },
  });

  const linkPendingToMember = useCallback(
    async (scrapedLabel: string, member: { userId: string; displayName: string }) => {
      await linkMutation.mutateAsync({
        scrapedLabel,
        hostUserId: member.userId,
        hostDisplayName: member.displayName,
      });
    },
    [linkMutation],
  );

  const pendingAliases = (aliasesQuery.data ?? []).filter(
    (a) => !a.hostUserId && !!a.pendingDisplayName?.trim(),
  );

  const linkedAliases = (aliasesQuery.data ?? []).filter((a) => !!a.hostUserId);

  return {
    aliases: aliasesQuery.data ?? [],
    pendingAliases,
    linkedAliases,
    isLoading: aliasesQuery.isLoading,
    isSaving: linkMutation.isPending,
    linkPendingToMember,
    refetch: aliasesQuery.refetch,
  };
}
