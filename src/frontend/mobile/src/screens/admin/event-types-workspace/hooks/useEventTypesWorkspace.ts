import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { eventTypesApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { CreateEventTypeRequest } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

const DEFAULT_COLOR = '#3b82f6';

export function useEventTypesWorkspace() {
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(DEFAULT_COLOR);

  const typesQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.eventTypes(orgId),
    queryFn: () => unwrap(eventTypesApi.getAll()),
    enabled: !!orgId,
  });

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.eventTypes(orgId) });
  }, [orgId, queryClient]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const req = CreateEventTypeRequest.fromJS({
        name: newName.trim(),
        colorHex: newColor.trim() || DEFAULT_COLOR,
      });
      return unwrap(eventTypesApi.create(req));
    },
    onSuccess: async () => {
      setNewName('');
      setNewColor(DEFAULT_COLOR);
      await invalidate();
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error('No event type selected');
      const req = CreateEventTypeRequest.fromJS({
        name: editName.trim(),
        colorHex: editColor.trim() || DEFAULT_COLOR,
      });
      return unwrap(eventTypesApi.update(editingId, req));
    },
    onSuccess: async () => {
      setEditingId(null);
      await invalidate();
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => unwrap(eventTypesApi.delete(id)),
    onSuccess: async () => {
      setEditingId(null);
      await invalidate();
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const startEdit = useCallback(
    (id: string, name: string, color?: string | null) => {
      setEditingId(id);
      setEditName(name);
      setEditColor(color?.trim() || DEFAULT_COLOR);
    },
    [],
  );

  const confirmDelete = useCallback(
    (id: string, name: string) => {
      Alert.alert('Delete event type', `Remove "${name}"? Events using it may need reassignment.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ]);
    },
    [deleteMutation],
  );

  return {
    types: typesQuery.data ?? [],
    loading: typesQuery.isLoading,
    newName,
    setNewName,
    newColor,
    setNewColor,
    editingId,
    editName,
    setEditName,
    editColor,
    setEditColor,
    startEdit,
    cancelEdit: () => setEditingId(null),
    createType: () => createMutation.mutate(),
    saveEdit: () => updateMutation.mutate(),
    confirmDelete,
    isSaving: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}

export type EventTypesWorkspaceModel = ReturnType<typeof useEventTypesWorkspace>;
