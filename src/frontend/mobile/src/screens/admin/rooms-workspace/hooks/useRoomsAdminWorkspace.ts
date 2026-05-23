import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { orgAdminApi, roomsApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { CreateRoomRequest } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useDebounce } from '@/src/hooks';
import { bumpOnboardingStep } from '../utils/onboarding';

export function useRoomsAdminWorkspace() {
  const queryClient = useQueryClient();
  const { organization, refreshOrganization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('10');
  const [location, setLocation] = useState('');

  const roomsQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.rooms(orgId, debouncedSearch),
    queryFn: async () => {
      if (debouncedSearch.trim()) {
        return unwrap(
          roomsApi.search(debouncedSearch.trim(), undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 1, 50),
        );
      }
      const all = await unwrap(roomsApi.getAll());
      return {
        items: all ?? [],
        totalCount: all?.length ?? 0,
        page: 1,
        pageSize: 50,
      };
    },
    enabled: !!orgId,
  });

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['orgAdmin', orgId, 'rooms'] });
  }, [orgId, queryClient]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const req = CreateRoomRequest.fromJS({
        name: name.trim(),
        capacity: Number(capacity) || 1,
        location: location.trim() || undefined,
      });
      return unwrap(roomsApi.create(req));
    },
    onSuccess: async () => {
      setName('');
      setLocation('');
      await invalidate();

      const current = await unwrap(orgAdminApi.getCurrent());
      const payload = {
        name: current.name,
        primaryColor: current.primaryColor,
        secondaryColor: current.secondaryColor,
        tertiaryColor: current.tertiaryColor,
        onboardingStep: bumpOnboardingStep(current.onboardingStep, 10),
      };
      await unwrap(orgAdminApi.updateCurrent(payload as never));
      await refreshOrganization();
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(roomsApi.delete(id)),
    onSuccess: invalidate,
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  return {
    rooms: roomsQuery.data?.items ?? [],
    totalCount: roomsQuery.data?.totalCount ?? 0,
    loading: roomsQuery.isLoading,
    search,
    setSearch,
    name,
    setName,
    capacity,
    setCapacity,
    location,
    setLocation,
    createRoom: () => createMutation.mutate(),
    deleteRoom: (id: string, roomName: string) =>
      Alert.alert('Delete room', `Remove "${roomName}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ]),
    isSaving: createMutation.isPending || deleteMutation.isPending,
  };
}
