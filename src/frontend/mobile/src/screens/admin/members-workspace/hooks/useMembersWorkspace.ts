import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Share } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';

import { orgAdminApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import {
  InviteMemberItemDto,
  InviteMembersRequest,
  UpdateOrganizationMemberRequest,
} from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useDebounce } from '@/src/hooks';

const PAGE_SIZE = 30;

export const useMembersWorkspace = () => {
  const queryClient = useQueryClient();
  const { organization, refreshOrganization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [pendingInvites, setPendingInvites] = useState<InviteMemberItemDto[]>([]);

  const orgQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.current(orgId),
    queryFn: () => unwrap(orgAdminApi.getCurrent()),
    enabled: !!orgId,
  });

  const rolesQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.roles(orgId),
    queryFn: () => unwrap(orgAdminApi.getRoles()),
    enabled: !!orgId,
  });

  const roles = rolesQuery.data ?? [];
  const inviteableRoles = useMemo(
    () => roles.filter((r) => r.name?.toLowerCase() !== 'admin').map((r) => r.name ?? ''),
    [roles]
  );

  useEffect(() => {
    if (!inviteRole && inviteableRoles.length > 0) {
      setInviteRole(inviteableRoles[0]);
    }
  }, [inviteableRoles, inviteRole]);

  const membersQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.members(orgId, debouncedSearch, roleFilter),
    queryFn: () =>
      unwrap(
        orgAdminApi.getMembers(1, PAGE_SIZE, debouncedSearch || null, roleFilter, undefined)
      ),
    enabled: !!orgId,
  });

  const members = membersQuery.data?.items ?? [];
  const totalMembers = membersQuery.data?.totalCount ?? 0;
  const org = orgQuery.data ?? organization;

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['orgAdmin', orgId] });
    await refreshOrganization();
  }, [orgId, queryClient, refreshOrganization]);

  const inviteMutation = useMutation({
    mutationFn: async (items: InviteMemberItemDto[]) => {
      const req = InviteMembersRequest.fromJS({ members: items });
      return unwrap(orgAdminApi.inviteMembers(req));
    },
    onSuccess: async (count) => {
      setPendingInvites([]);
      setEmailInput('');
      await invalidate();
      Alert.alert('Invites sent', `${count} member(s) added to the organization.`);
    },
    onError: (e: Error) => Alert.alert('Invite failed', e.message),
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({
      userId,
      roleId,
      isActive,
    }: {
      userId: string;
      roleId?: string;
      isActive?: boolean;
    }) => {
      const req = UpdateOrganizationMemberRequest.fromJS({ roleId, isActive });
      return unwrap(orgAdminApi.updateMember(userId, req));
    },
    onSuccess: invalidate,
    onError: (e: Error) => Alert.alert('Update failed', e.message),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => unwrap(orgAdminApi.regenerateInviteCode()),
    onSuccess: async () => {
      await invalidate();
      Alert.alert('Invite code regenerated', 'Share the new code with your team.');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const addPendingInvite = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    const role = inviteRole || inviteableRoles[0] || 'Member';
    if (pendingInvites.some((p) => p.email?.toLowerCase() === email)) return;
    setPendingInvites((prev) => [
      ...prev,
      InviteMemberItemDto.fromJS({ email, roleName: role }),
    ]);
    setEmailInput('');
  };

  const sendInvites = () => {
    if (pendingInvites.length === 0) {
      Alert.alert('No invites', 'Add at least one email to the invite list.');
      return;
    }
    inviteMutation.mutate(pendingInvites);
  };

  const copyInviteLink = async () => {
    if (!org?.inviteLink) return;
    await Clipboard.setStringAsync(org.inviteLink);
    Alert.alert('Copied', 'Invite link copied to clipboard.');
  };

  const shareInviteLink = async () => {
    if (!org?.inviteLink) return;
    await Share.share({
      message: `Join ${org.name} on Omada: ${org.inviteLink}\nCode: ${org.inviteCode}`,
    });
  };

  return {
    org,
    roles,
    inviteableRoles,
    members,
    totalMembers,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    emailInput,
    setEmailInput,
    inviteRole,
    setInviteRole,
    pendingInvites,
    setPendingInvites,
    addPendingInvite,
    sendInvites,
    isInviting: inviteMutation.isPending,
    updateMemberRole: (userId: string, roleId: string) =>
      updateMemberMutation.mutate({ userId, roleId }),
    deactivateMember: (userId: string) =>
      updateMemberMutation.mutate({ userId, isActive: false }),
    reactivateMember: (userId: string) =>
      updateMemberMutation.mutate({ userId, isActive: true }),
    regenerateInviteCode: () => regenerateMutation.mutate(),
    copyInviteLink,
    shareInviteLink,
    isLoading: membersQuery.isLoading,
    refetch: membersQuery.refetch,
  };
};
