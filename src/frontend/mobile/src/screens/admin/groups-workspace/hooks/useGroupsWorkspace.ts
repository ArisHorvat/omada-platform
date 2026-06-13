import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useThemeColors } from '@/src/hooks';
import { alertAction, confirmAction } from '@/src/utils/confirmAction';

import { getGroupCopy } from '../utils/groupLabels';
import {
  buildTypeLabelMap,
  canonicalGroupTypeKey,
  typeKeysMatchingFilter,
} from '../utils/groupTypeLabels';
import { collectDescendantIds, collectExpandableIds, countTreeNodes, filterGroupTree } from '../utils/groupTreeUtils';

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
  const { organization } = useCurrentOrganization();
  const orgId = activeSession?.orgId ?? '';

  const copy = useMemo(
    () => getGroupCopy(organization?.organizationType),
    [organization?.organizationType],
  );

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [treeSearch, setTreeSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expansionInitialized, setExpansionInitialized] = useState(false);
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
    staleTime: 0,
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

  const treeNodes = treeQuery.data ?? [];

  const flatRows = useMemo(() => flattenTree(treeNodes), [treeNodes]);

  const totalGroupCount = useMemo(() => countTreeNodes(treeNodes), [treeNodes]);

  const typeLabelByKey = useMemo(
    () => buildTypeLabelMap((typesQuery.data ?? []) as GroupTypeOptionDto[]),
    [typesQuery.data],
  );

  const labelForType = useCallback(
    (type: string) => typeLabelByKey.get(type.toLowerCase()) ?? type,
    [typeLabelByKey],
  );

  const { nodes: filteredTree, expandIds: searchExpandIds } = useMemo(
    () =>
      filterGroupTree(treeNodes, treeSearch, typeFilter, labelForType, typeKeysMatchingFilter),
    [treeNodes, treeSearch, typeFilter, labelForType],
  );

  useEffect(() => {
    setExpansionInitialized(false);
    setExpandedIds(new Set());
  }, [orgId]);

  useEffect(() => {
    if (!treeNodes.length || expansionInitialized) return;
    setExpandedIds(new Set(treeNodes.filter((n) => n.children?.length).map((n) => n.id)));
    setExpansionInitialized(true);
  }, [treeNodes, expansionInitialized]);

  useEffect(() => {
    if (!treeSearch.trim() && !typeFilter) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      for (const id of searchExpandIds) next.add(id);
      return next;
    });
  }, [treeSearch, typeFilter, searchExpandIds]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(collectExpandableIds(treeNodes)));
  }, [treeNodes]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const invalidateGroups = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['groups', orgId] });
    await queryClient.invalidateQueries({ queryKey: ['groups', 'departments'] });
  }, [queryClient, orgId]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(groupsApi.deleteGroup(id)),
    onSuccess: async () => {
      setSelectedGroupId(null);
      setSelectedMemberIds(new Set());
      await invalidateGroups();
    },
    onError: (e) => {
      alertAction({ title: 'Delete failed', message: getApiErrorMessage(e) });
    },
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
      alertAction({ title: 'Moved', message: `${count} member(s) moved successfully.` });
    },
    onError: (e) => {
      alertAction({ title: 'Move failed', message: getApiErrorMessage(e) });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ userId, placementGroupId }: { userId: string; placementGroupId: string }) =>
      unwrap(groupsApi.removeMember(selectedGroupId!, userId, placementGroupId)),
    onSuccess: async () => {
      await invalidateGroups();
    },
    onError: (e) => {
      alertAction({ title: 'Remove failed', message: getApiErrorMessage(e) });
    },
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
    const { name, childCount } = detailQuery.data;
    confirmAction({
      title: copy.deleteTitle,
      message: copy.deleteMessage(name, childCount),
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => deleteMutation.mutate(selectedGroupId),
    });
  }, [selectedGroupId, detailQuery.data, deleteMutation, copy]);

  const confirmRemoveMember = useCallback(
    (userId: string, firstName: string, placementGroupId: string, placementGroupName?: string) => {
      confirmAction({
        title: copy.removeMemberTitle,
        message: copy.removeMemberMessage(firstName, placementGroupName),
        confirmText: 'Remove',
        destructive: true,
        onConfirm: () => removeMemberMutation.mutate({ userId, placementGroupId }),
      });
    },
    [copy, removeMemberMutation],
  );

  const confirmMoveMembers = useCallback(() => {
    if (selectedMemberIds.size === 0) {
      alertAction({ title: copy.moveMembersTitle, message: copy.moveMembersMessage });
      return;
    }
    setMoveSheetOpen(true);
  }, [selectedMemberIds.size, copy]);

  const searchDirectoryUsers = useCallback(async (q: string) => {
    const res = await unwrap(usersApi.getDirectory(1, 25, q || null, null, null, null));
    return res.items ?? [];
  }, []);

  return {
    colors,
    insets,
    orgId,
    copy,
    treeQuery,
    typesQuery,
    detailQuery,
    membersQuery,
    treeNodes,
    filteredTree,
    flatRows,
    totalGroupCount,
    typeCatalog: (typesQuery.data ?? []) as GroupTypeOptionDto[],
    labelForType,
    selectedGroupId,
    setSelectedGroupId,
    memberSearch,
    setMemberSearch,
    treeSearch,
    setTreeSearch,
    typeFilter,
    setTypeFilter,
    expandedIds,
    toggleExpanded,
    expandAll,
    collapseAll,
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
    confirmRemoveMember,
    confirmMoveMembers,
    deleteMutation,
    moveMutation,
    removeMemberMutation,
    invalidateGroups,
    searchDirectoryUsers,
    detail: detailQuery.data as GroupDetailDto | undefined,
  };
}

export type GroupsWorkspaceModel = ReturnType<typeof useGroupsWorkspace>;
