import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { eventTypesApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { CreateEventTypeRequest } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import {
  DEFAULT_EVENT_TYPE_COLOR,
  normalizeEventTypeColor,
} from '@/src/constants/eventTypeColors';
import { alertAction, confirmAction } from '@/src/utils/confirmAction';

export function useEventTypesWorkspace() {
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_EVENT_TYPE_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(DEFAULT_EVENT_TYPE_COLOR);

  const typesQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.eventTypes(orgId),
    queryFn: () => unwrap(eventTypesApi.getAll()),
    enabled: !!orgId,
  });

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.eventTypes(orgId) });
    await queryClient.invalidateQueries({ queryKey: ['event-types', orgId] });
  }, [orgId, queryClient]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const req = CreateEventTypeRequest.fromJS({
        name: newName.trim(),
        colorHex: normalizeEventTypeColor(newColor),
      });
      return unwrap(eventTypesApi.create(req));
    },
    onSuccess: async () => {
      setNewName('');
      setNewColor(DEFAULT_EVENT_TYPE_COLOR);
      await invalidate();
    },
    onError: (e: Error) => {
      alertAction({ title: 'Could not add event type', message: e.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error('No event type selected');
      const req = CreateEventTypeRequest.fromJS({
        name: editName.trim(),
        colorHex: normalizeEventTypeColor(editColor),
      });
      return unwrap(eventTypesApi.update(editingId, req));
    },
    onSuccess: async () => {
      setEditingId(null);
      await invalidate();
    },
    onError: (e: Error) => {
      alertAction({ title: 'Could not update event type', message: e.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => unwrap(eventTypesApi.delete(id)),
    onSuccess: async () => {
      setEditingId(null);
      await invalidate();
    },
    onError: (e: Error) => {
      const inUse = e.message.toLowerCase().includes('in use') || e.message.toLowerCase().includes('used by');
      alertAction({
        title: inUse ? 'Event type is in use' : 'Could not delete event type',
        message: inUse
          ? 'This type is linked to schedule events or room configurations. Reassign those events to another type, or remove the type from affected rooms in Floorplans, then try again.'
          : e.message,
      });
    },
  });

  const startEdit = useCallback(
    (id: string, name: string, color?: string | null) => {
      setEditingId(id);
      setEditName(name);
      setEditColor(normalizeEventTypeColor(color));
    },
    [],
  );

  const confirmDelete = useCallback(
    (id: string, name: string) => {
      confirmAction({
        title: 'Delete event type',
        message: `Delete "${name}"? This cannot be undone. Deletion is blocked while schedule events or rooms still reference this type — update those first.`,
        confirmText: 'Delete type',
        destructive: true,
        onConfirm: () => deleteMutation.mutate(id),
      });
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
    refetch: typesQuery.refetch,
  };
}

export type EventTypesWorkspaceModel = ReturnType<typeof useEventTypesWorkspace>;
