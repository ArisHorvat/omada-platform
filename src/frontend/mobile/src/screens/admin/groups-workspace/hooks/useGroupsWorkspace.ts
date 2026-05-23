import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { groupsApi, getApiErrorMessage, unwrap, usersApi } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import type {
  GroupDetailDto,
  GroupTreeNodeDto,
  GroupTypeOptionDto,
} from '@/src/api/generatedClient';
import { MoveGroupMembersRequest } from '@/src/api/generatedClient';
import { useAuth } from '@/src/context/AuthContext';
import { useThemeColors } from '@/src/hooks';

const MEMBER_PAGE_SIZE = 30;

export type GroupFormMode = 'create' | 'edit' | null;

export type FlatGroupRow = {
  id: string;
  name: string;
  type: string;
  parentGroupId?: string;
  memberCount: number;
  children: GroupTreeNodeDto[];
  depth: number;
};

function flattenTree(nodes: GroupTreeNodeDto[], depth = 0): FlatGroupRow[] {
  const out: FlatGroupRow[] = [];
  for (const node of nodes) {
    out.push({
      id: node.id,
      name: node.name,
      type: node.type,
      parentGroupId: node.parentGroupId,
      memberCount: node.memberCount,
      children: node.children,
      depth,
    });
    if (node.children?.length) out.push(...flattenTree(node.children, depth + 1));
  }
  return out;
}

export function useGroupsWorkspace() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeSession } = useAuth();
  const orgId = activeSession?.orgId ?? '';

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [formMode, setFormMode] = useState<GroupFormMode>(null);
  const [moveSheetOpen, setMoveSheetOpen] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [addMembersSheetOpen, setAddMembersSheetOpen] = useState(false);

  const treeQuery = useQuery({
    queryKey: QUERY_KEYS.groups.tree(orgId),
    queryFn: () => unwrap(groupsApi.getTree()),
    enabled: !!orgId,
  });

  const typesQuery = useQuery({
    queryKey: QUERY_KEYS.groups.types(orgId),
    queryFn: () => unwrap(groupsApi.getTypes()),
    enabled: !!orgId,
  });

  const detailQuery = useQuery({
    queryKey: QUERY_KEYS.groups.detail(orgId, selectedGroupId ?? ''),
    queryFn: () => unwrap(groupsApi.getById(selectedGroupId!)),
    enabled: !!orgId && !!selectedGroupId,
  });

  const membersQuery = useQuery({
    queryKey: QUERY_KEYS.groups.members(orgId, selectedGroupId ?? '', memberSearch),
    queryFn: () =>
      unwrap(
        groupsApi.getMembers(
          selectedGroupId!,
          1,
          MEMBER_PAGE_SIZE,
          memberSearch.trim() || null,
        ),
      ),
    enabled: !!orgId && !!selectedGroupId,
  });

  const flatRows = useMemo(
    () => flattenTree(treeQuery.data ?? []),
    [treeQuery.data],
  );

  const typeLabelByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of typesQuery.data ?? []) map.set(t.key.toLowerCase(), t.label);
    return map;
  }, [typesQuery.data]);

  const labelForType = useCallback(
    (type: string) => typeLabelByKey.get(type.toLowerCase()) ?? type,
    [typeLabelByKey],
  );

  const invalidateGroups = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['groups', orgId] });
    await queryClient.invalidateQueries({ queryKey: ['groups', 'departments'] });
  }, [queryClient, orgId]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(groupsApi.deleteGroup(id)),
    onSuccess: async () => {
      setSelectedGroupId(null);
      await invalidateGroups();
    },
    onError: (e) => Alert.alert('Delete failed', getApiErrorMessage(e)),
  });

  const moveMutation = useMutation({
    mutationFn: (targetGroupId: string) =>
      unwrap(
        groupsApi.moveMembers(
          new MoveGroupMembersRequest({
            sourceGroupId: selectedGroupId!,
            targetGroupId,
            userIds: [...selectedMemberIds],
          }),
        ),
      ),
    onSuccess: async (count) => {
      setSelectedMemberIds(new Set());
      setMoveSheetOpen(false);
      await invalidateGroups();
      Alert.alert('Moved', `${count} member(s) moved successfully.`);
    },
    onError: (e) => Alert.alert('Move failed', getApiErrorMessage(e)),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => unwrap(groupsApi.removeMember(selectedGroupId!, userId)),
    onSuccess: async () => {
      await invalidateGroups();
    },
    onError: (e) => Alert.alert('Remove failed', getApiErrorMessage(e)),
  });

  const toggleMemberSelection = useCallback((userId: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  const goBack = useCallback(() => router.back(), [router]);

  const openCreate = useCallback(() => {
    setFormMode('create');
  }, []);

  const openEdit = useCallback(() => {
    if (!selectedGroupId) return;
    setFormMode('edit');
  }, [selectedGroupId]);

  const confirmDelete = useCallback(() => {
    if (!selectedGroupId || !detailQuery.data) return;
    Alert.alert(
      'Delete group',
      `Delete "${detailQuery.data.name}" and all nested sub-groups? Members will be unlinked from this branch.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(selectedGroupId),
        },
      ],
    );
  }, [selectedGroupId, detailQuery.data, deleteMutation]);

  const searchDirectoryUsers = useCallback(async (q: string) => {
    const res = await unwrap(usersApi.getDirectory(1, 25, q || null, null, null, null));
    return res.items ?? [];
  }, []);

  return {
    colors,
    insets,
    orgId,
    treeQuery,
    typesQuery,
    detailQuery,
    membersQuery,
    flatRows,
    typeCatalog: (typesQuery.data ?? []) as GroupTypeOptionDto[],
    labelForType,
    selectedGroupId,
    setSelectedGroupId,
    memberSearch,
    setMemberSearch,
    formMode,
    setFormMode,
    moveSheetOpen,
    setMoveSheetOpen,
    addMembersSheetOpen,
    setAddMembersSheetOpen,
    selectedMemberIds,
    setSelectedMemberIds,
    toggleMemberSelection,
    goBack,
    openCreate,
    openEdit,
    confirmDelete,
    deleteMutation,
    moveMutation,
    removeMemberMutation,
    invalidateGroups,
    searchDirectoryUsers,
    detail: detailQuery.data as GroupDetailDto | undefined,
  };
}

export type GroupsWorkspaceModel = ReturnType<typeof useGroupsWorkspace>;
