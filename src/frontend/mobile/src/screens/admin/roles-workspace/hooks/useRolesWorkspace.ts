import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminApi, orgAdminApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import {
  CreateOrganizationRoleRequest,
  UpdateRolePermissionsRequest,
  WidgetPermissionDto,
} from '@/src/api/generatedClient';
import { useAuth } from '@/src/context/AuthContext';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import type { PermissionLevel } from '@/src/constants/permissions';

const LEVELS: PermissionLevel[] = ['view', 'edit', 'admin'];

export const useRolesWorkspace = () => {
  const queryClient = useQueryClient();
  const { activeSession } = useAuth();
  const { organization, refreshOrganization } = useCurrentOrganization();
  const orgId = activeSession?.orgId ?? '';

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [localPermissions, setLocalPermissions] = useState<Record<string, PermissionLevel>>({});

  const rolesQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.roles(orgId),
    queryFn: () => unwrap(orgAdminApi.getRoles()),
    enabled: !!orgId,
  });

  const widgetsQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.widgets(orgId),
    queryFn: () => unwrap(adminApi.getWidgets()),
    enabled: !!orgId,
  });

  const roleDetailQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.roleDetail(orgId, selectedRoleId ?? ''),
    queryFn: () => unwrap(orgAdminApi.getRoleDetail(selectedRoleId!)),
    enabled: !!orgId && !!selectedRoleId,
  });

  const roles = rolesQuery.data ?? [];
  const widgets = widgetsQuery.data ?? [];
  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  useEffect(() => {
    if (roles.length === 0) {
      setSelectedRoleId(null);
      return;
    }
    if (!selectedRoleId || !roles.some((r) => r.id === selectedRoleId)) {
      setSelectedRoleId(roles[0]?.id ?? null);
    }
  }, [roles, selectedRoleId]);

  useEffect(() => {
    if (!roleDetailQuery.data?.permissions) return;
    const map: Record<string, PermissionLevel> = {};
    for (const p of roleDetailQuery.data.permissions) {
      if (p.widgetKey && p.accessLevel) {
        map[p.widgetKey] = p.accessLevel as PermissionLevel;
      }
    }
    setLocalPermissions(map);
  }, [roleDetailQuery.data]);

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['orgAdmin', orgId] });
    await refreshOrganization();
  }, [orgId, queryClient, refreshOrganization]);

  const createRoleMutation = useMutation({
    mutationFn: async (name: string) => {
      const req = CreateOrganizationRoleRequest.fromJS({ name });
      return unwrap(orgAdminApi.createRole(req));
    },
    onSuccess: async (role) => {
      setNewRoleName('');
      await invalidate();
      if (role.id) setSelectedRoleId(role.id);
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const savePermissionsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRoleId) throw new Error('No role selected');
      const permissions = Object.entries(localPermissions).map(([widgetKey, accessLevel]) =>
        WidgetPermissionDto.fromJS({ widgetKey, accessLevel })
      );
      const req = UpdateRolePermissionsRequest.fromJS({ permissions });
      return unwrap(orgAdminApi.updateRolePermissions(selectedRoleId, req));
    },
    onSuccess: async () => {
      await invalidate();
      Alert.alert('Saved', 'Role permissions updated.');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => unwrap(orgAdminApi.deleteRole(roleId)),
    onSuccess: async () => {
      setSelectedRoleId(null);
      await invalidate();
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const cyclePermission = (widgetKey: string) => {
    setLocalPermissions((prev) => {
      const current = prev[widgetKey];
      if (!current) return { ...prev, [widgetKey]: 'view' };
      const idx = LEVELS.indexOf(current);
      if (idx === LEVELS.length - 1) {
        const next = { ...prev };
        delete next[widgetKey];
        return next;
      }
      return { ...prev, [widgetKey]: LEVELS[idx + 1] };
    });
  };

  return {
    roles,
    widgets,
    selectedRoleId,
    setSelectedRoleId,
    selectedRole,
    localPermissions,
    cyclePermission,
    newRoleName,
    setNewRoleName,
    createRole: () => {
      const name = newRoleName.trim();
      if (!name) return;
      createRoleMutation.mutate(name);
    },
    savePermissions: () => savePermissionsMutation.mutate(),
    deleteRole: (roleId: string) => deleteRoleMutation.mutate(roleId),
    isSaving: savePermissionsMutation.isPending,
    isCreating: createRoleMutation.isPending,
    isDeleting: deleteRoleMutation.isPending,
    isLoading: rolesQuery.isLoading || widgetsQuery.isLoading,
    isRoleDetailLoading: roleDetailQuery.isLoading,
    refetch: async () => {
      await Promise.all([rolesQuery.refetch(), widgetsQuery.refetch(), roleDetailQuery.refetch()]);
    },
  };
};
