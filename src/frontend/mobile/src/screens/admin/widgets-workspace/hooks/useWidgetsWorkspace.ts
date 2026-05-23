import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminApi, orgAdminApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { UpdateOrganizationEnabledWidgetsRequest } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { bumpOnboardingStep } from '../utils/onboarding';

export function useWidgetsWorkspace() {
  const queryClient = useQueryClient();
  const { organization, refreshOrganization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const catalogQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.widgets(orgId),
    queryFn: () => unwrap(adminApi.getWidgets()),
    enabled: !!orgId,
  });

  const orgQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.current(orgId),
    queryFn: () => unwrap(orgAdminApi.getCurrent()),
    enabled: !!orgId,
  });

  const enabledSet = useMemo(() => {
    const keys = orgQuery.data?.enabledWidgets ?? organization?.enabledWidgets ?? [];
    return new Set(keys.map((k) => k.toLowerCase()));
  }, [orgQuery.data?.enabledWidgets, organization?.enabledWidgets]);

  const [localEnabled, setLocalEnabled] = useState<Set<string> | null>(null);

  const activeEnabled = useMemo(() => {
    if (localEnabled) return localEnabled;
    return enabledSet;
  }, [enabledSet, localEnabled]);

  const toggleWidget = useCallback((key: string) => {
    const normalized = key.toLowerCase();
    setLocalEnabled((prev) => {
      const base = prev ? new Set(prev) : new Set(enabledSet);
      if (base.has(normalized)) {
        if (base.size <= 1) {
          Alert.alert('At least one widget', 'Your organization must keep at least one feature enabled.');
          return prev ?? base;
        }
        base.delete(normalized);
      } else {
        base.add(normalized);
      }
      return base;
    });
  }, [enabledSet]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const keys = Array.from(activeEnabled);
      const payload = UpdateOrganizationEnabledWidgetsRequest.fromJS({ enabledWidgetKeys: keys });
      return unwrap(orgAdminApi.updateEnabledWidgets(payload));
    },
    onSuccess: async () => {
      setLocalEnabled(null);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.current(orgId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organization(orgId) });
      await refreshOrganization();
      Alert.alert('Saved', 'Organization widget catalog updated.');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  return {
    widgets: catalogQuery.data ?? [],
    loading: catalogQuery.isLoading || orgQuery.isLoading,
    enabledSet: activeEnabled,
    toggleWidget,
    save: () => saveMutation.mutate(),
    isSaving: saveMutation.isPending,
    hasChanges: localEnabled !== null,
  };
}
