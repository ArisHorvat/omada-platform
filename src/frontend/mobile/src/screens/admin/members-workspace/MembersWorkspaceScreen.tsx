import React, { useMemo, useState } from 'react';
import { View, ScrollView, TextInput, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { AppButton, AppText, ClayView, Icon, SegmentedControl, WidgetEmptyState, Toast } from '@/src/components/ui';
import { ProgressiveImage } from '@/src/components/ui/ProgressiveImage';
import { PressClay } from '@/src/components/animations/PressClay';
import { OptionPickerSheet } from '@/src/components/filters/OptionPickerSheet';
import { useThemeColors } from '@/src/hooks';
import type { OrganizationMemberDto } from '@/src/api/generatedClient';
import { resolveMediaUrl } from '@/src/utils/resolveMediaUrl';
import { useMembersWorkspace } from './hooks/useMembersWorkspace';
import { filterAssignableRoles } from './utils/memberRoles';
import { createMembersWorkspaceStyles } from './styles/members-workspace.styles';
import { confirmAction } from '@/src/utils/confirmAction';

export default function MembersWorkspaceScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createMembersWorkspaceStyles(colors), [colors]);
  const [tab, setTab] = useState<'members' | 'invite'>('members');
  const [inviteRolePickerOpen, setInviteRolePickerOpen] = useState(false);
  const [memberRoleFilterOpen, setMemberRoleFilterOpen] = useState(false);

  const {
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
    isInviting,
    updateMemberRole,
    deactivateMember,
    approveMember,
    deleteMember,
    regenerateInviteCode,
    copyInviteLink,
    copyInviteCode,
    copyToastVisible,
    copyToastMessage,
    setCopyToastVisible,
    shareInviteLink,
    isLoading,
    refetch,
  } = useMembersWorkspace();

  const assignableRoles = useMemo(() => filterAssignableRoles(roles), [roles]);
  const memberFilterRoles = useMemo(
    () => roles.filter((r) => r.id && r.name && r.name.toLowerCase() !== 'admin'),
    [roles],
  );
  const memberRoleFilterOptions = useMemo(
    () =>
      memberFilterRoles.map((r) => ({
        value: r.id!,
        label: r.name!,
        subtitle: `${r.memberCount ?? 0} member${r.memberCount === 1 ? '' : 's'}`,
      })),
    [memberFilterRoles],
  );
  const selectedMemberRoleFilterLabel = useMemo(() => {
    if (!roleFilter) return 'All roles';
    return memberFilterRoles.find((r) => r.id === roleFilter)?.name ?? 'All roles';
  }, [memberFilterRoles, roleFilter]);
  const inviteRoleOptions = useMemo(
    () => inviteableRoles.map((name) => ({ value: name, label: name })),
    [inviteableRoles],
  );
  const hasSearch = search.trim().length > 0;
  const hasRoleFilter = !!roleFilter;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageContainer fullBleed>
          <ScreenHeader
            title="People & invites"
            subtitle={`${totalMembers} member${totalMembers === 1 ? '' : 's'}`}
          />

          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <SegmentedControl
              options={['Members', 'Invite']}
              selectedIndex={tab === 'members' ? 0 : 1}
              onChange={(i) => setTab(i === 0 ? 'members' : 'invite')}
            />
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          >
            {tab === 'invite' ? (
              <>
                <View style={styles.clayShell}>
                  <ClayView depth={4} puffy={10} color={colors.card} contentOverflow="hidden" style={styles.clayInner}>
                    <AppText weight="bold">Organization invite</AppText>
                    <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6, lineHeight: 18 }}>
                      Share the code or link so people can join {org?.name ?? 'your organization'}.
                    </AppText>

                    <View style={styles.inviteHero}>
                      <ClayView
                        depth={3}
                        puffy={0}
                        color={colors.primaryContainer}
                        contentOverflow="hidden"
                        style={styles.inviteHeroInner}
                      >
                        <AppText variant="caption" weight="bold" style={{ color: colors.subtle, letterSpacing: 1 }}>
                          INVITE CODE
                        </AppText>
                        <Pressable
                          onPress={copyInviteCode}
                          disabled={!org?.inviteCode}
                          style={({ pressed }) => [styles.inviteCodeRow, pressed && { opacity: 0.85 }]}
                        >
                          <AppText weight="bold" style={[styles.inviteCodeText, { color: colors.primary }]}>
                            {org?.inviteCode ?? '— — — —'}
                          </AppText>
                          <View
                            style={[
                              styles.inviteCodeCopyBtn,
                              !org?.inviteCode && { opacity: 0.4 },
                            ]}
                          >
                            <Icon name="content-copy" size={22} color={colors.primary} />
                          </View>
                        </Pressable>
                        <AppText variant="caption" style={{ color: colors.subtle, marginTop: 8 }}>
                          Tap the code or copy icon to copy
                        </AppText>
                      </ClayView>
                    </View>

                    <View style={styles.inviteActionRow}>
                      <AppButton
                        title="Copy link"
                        variant="outline"
                        onPress={copyInviteLink}
                        style={styles.inviteActionBtn}
                        disabled={!org?.inviteLink}
                      />
                      <AppButton
                        title="Share"
                        onPress={shareInviteLink}
                        style={styles.inviteActionBtn}
                        disabled={!org?.inviteLink}
                      />
                    </View>

                    <Pressable
                      onPress={regenerateInviteCode}
                      style={({ pressed }) => [styles.inviteRegenerateRow, pressed && { opacity: 0.7 }]}
                    >
                      <Icon name="refresh" size={18} color={colors.subtle} />
                      <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
                        Regenerate code
                      </AppText>
                    </Pressable>
                  </ClayView>
                </View>

                <View style={[styles.clayShell, { marginTop: 4 }]}>
                  <ClayView depth={4} puffy={10} color={colors.card} contentOverflow="hidden" style={styles.clayInner}>
                    <AppText weight="bold">Invite by email</AppText>
                    <TextInput
                      value={emailInput}
                      onChangeText={setEmailInput}
                      placeholder="colleague@company.com"
                      placeholderTextColor={colors.subtle}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={[styles.input, { color: colors.text }]}
                    />
                    <RoleSelectField
                      label="Role"
                      value={inviteRole || inviteableRoles[0] || 'Select role'}
                      onPress={() => setInviteRolePickerOpen(true)}
                      colors={colors}
                      styles={styles}
                    />
                    <AppButton title="Add to list" variant="outline" onPress={addPendingInvite} style={{ marginTop: 12 }} />
                  </ClayView>
                </View>

                {pendingInvites.map((item) => (
                  <View key={item.email} style={styles.pendingShell}>
                    <ClayView depth={3} puffy={8} color={colors.card} contentOverflow="hidden" style={styles.pendingInner}>
                      <View style={{ flex: 1 }}>
                        <AppText weight="bold">{item.email}</AppText>
                        <AppText variant="caption" style={{ color: colors.subtle }}>
                          {item.roleName}
                        </AppText>
                      </View>
                      <Pressable onPress={() => setPendingInvites((prev) => prev.filter((p) => p.email !== item.email))}>
                        <Icon name="close" size={20} color={colors.subtle} />
                      </Pressable>
                    </ClayView>
                  </View>
                ))}

                {pendingInvites.length > 0 ? (
                  <AppButton
                    title={isInviting ? 'Sending…' : `Send ${pendingInvites.length} invite(s)`}
                    onPress={sendInvites}
                    disabled={isInviting}
                    style={{ marginTop: 16 }}
                  />
                ) : null}
              </>
            ) : (
              <>
                <View style={styles.searchShell}>
                  <ClayView depth={3} puffy={6} color={colors.card} contentOverflow="hidden" style={styles.searchInner}>
                    <TextInput
                      value={search}
                      onChangeText={setSearch}
                      placeholder="Search members…"
                      placeholderTextColor={colors.subtle}
                      style={styles.searchInput}
                    />
                  </ClayView>
                </View>

                <RoleSelectField
                  label="Role"
                  value={selectedMemberRoleFilterLabel}
                  onPress={() => setMemberRoleFilterOpen(true)}
                  colors={colors}
                  styles={styles}
                />

                {isLoading ? (
                  <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
                ) : null}

                {!isLoading && members.length > 0 ? (
                  <AppText variant="caption" style={[styles.resultsHint, { color: colors.subtle }]}>
                    {hasSearch || hasRoleFilter
                      ? `${members.length} result${members.length === 1 ? '' : 's'}`
                      : `Showing ${members.length} of ${totalMembers}`}
                    {hasRoleFilter ? ` · ${selectedMemberRoleFilterLabel}` : ''}
                  </AppText>
                ) : null}

                {!isLoading && members.length === 0 ? (
                  <WidgetEmptyState
                    title={
                      hasSearch || hasRoleFilter ? 'No matching members' : 'No members yet'
                    }
                    description={
                      hasSearch || hasRoleFilter
                        ? 'Try a different search or role filter.'
                        : 'Invite people from the Invite tab to grow your organization.'
                    }
                    icon="group"
                  />
                ) : null}

                {members.map((member) => (
                  <MemberRow
                    key={member.userId}
                    member={member}
                    roles={assignableRoles}
                    colors={colors}
                    styles={styles}
                    onChangeRole={updateMemberRole}
                    onDeactivate={deactivateMember}
                    onApprove={approveMember}
                    onDelete={deleteMember}
                  />
                ))}
              </>
            )}
          </ScrollView>
        </PageContainer>
        <Toast
          visible={copyToastVisible}
          message={copyToastMessage}
          type="success"
          onHide={() => setCopyToastVisible(false)}
        />
        <OptionPickerSheet
          isVisible={inviteRolePickerOpen}
          onClose={() => setInviteRolePickerOpen(false)}
          title="Invite role"
          options={inviteRoleOptions}
          selected={inviteRole || null}
          onSelect={(value) => value && setInviteRole(value)}
          includeAllOption={false}
          height={Math.min(420, 120 + inviteRoleOptions.length * 62)}
        />
        <OptionPickerSheet
          isVisible={memberRoleFilterOpen}
          onClose={() => setMemberRoleFilterOpen(false)}
          title="Filter by role"
          options={memberRoleFilterOptions}
          selected={roleFilter}
          onSelect={setRoleFilter}
          includeAllOption
          allLabel="All roles"
          height={Math.min(520, 120 + memberRoleFilterOptions.length * 62)}
        />
      </SafeAreaView>
    </View>
  );
}

function MemberRow({
  member,
  roles,
  colors,
  styles,
  onChangeRole,
  onDeactivate,
  onApprove,
  onDelete,
}: {
  member: OrganizationMemberDto;
  roles: { id?: string; name?: string }[];
  colors: ReturnType<typeof useThemeColors>;
  styles: ReturnType<typeof createMembersWorkspaceStyles>;
  onChangeRole: (userId: string, roleId: string) => void;
  onDeactivate: (userId: string) => void;
  onApprove: (userId: string, roleId: string) => void;
  onDelete: (userId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [approvePickerOpen, setApprovePickerOpen] = useState(false);
  const displayName = `${member.firstName} ${member.lastName}`.trim();
  const initial = (member.firstName?.charAt(0) || member.email?.charAt(0) || '?').toUpperCase();
  const avatarUri = resolveMediaUrl(member.avatarUrl);
  const isCodeRequest = !!member.requiresAdminApproval && !member.isActive;
  const isEmailPending = !member.isActive && !member.requiresAdminApproval;

  const roleOptions = useMemo(
    () =>
      roles
        .filter((r) => r.id && r.name)
        .map((r) => ({ value: r.id!, label: r.name! })),
    [roles],
  );

  const currentRoleLabel = member.roleName ?? 'Member';

  const confirmRoleChange = (roleId: string, roleName: string, onConfirm: () => void) => {
    if (roleId === member.roleId) return;
    confirmAction({
      title: 'Change role',
      message: `Change ${displayName}'s role from ${currentRoleLabel} to ${roleName}?`,
      confirmText: 'Change role',
      onConfirm,
    });
  };

  const handleSelectRole = (roleId: string | null) => {
    if (!roleId || !member.userId) return;
    const roleName = roles.find((r) => r.id === roleId)?.name ?? 'Member';
    confirmRoleChange(roleId, roleName, () => onChangeRole(member.userId!, roleId));
  };

  const handleApproveWithRole = (roleId: string | null) => {
    if (!roleId || !member.userId) return;
    const roleName = roles.find((r) => r.id === roleId)?.name ?? 'Member';
    confirmAction({
      title: 'Approve join request',
      message: `Approve ${displayName} as ${roleName}? They will gain access to this organization.`,
      confirmText: 'Approve',
      onConfirm: () => onApprove(member.userId!, roleId),
    });
  };

  return (
    <>
      <PressClay onPress={() => setExpanded((v) => !v)}>
        <View style={[styles.memberShell, { opacity: member.isActive ? 1 : 0.65 }]}>
          <ClayView depth={4} puffy={8} color={colors.card} contentOverflow="hidden" style={styles.memberInner}>
            <View style={styles.memberRow}>
              {avatarUri ? (
                <ProgressiveImage source={{ uri: avatarUri }} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View style={styles.avatarFallback}>
                  <AppText weight="bold" style={{ color: colors.onPrimary }}>
                    {initial}
                  </AppText>
                </View>
              )}
              <View style={styles.memberMeta}>
                <AppText weight="bold" numberOfLines={1}>
                  {displayName}
                </AppText>
                <AppText variant="caption" style={{ color: colors.subtle }} numberOfLines={1}>
                  {member.email}
                </AppText>
                <AppText variant="caption" style={{ color: colors.primary, marginTop: 2 }}>
                  {member.roleName}
                </AppText>
              </View>
              {!member.isActive ? (
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  {isCodeRequest ? 'Requested' : 'Invited'}
                </AppText>
              ) : (
                <Icon name={expanded ? 'expand-less' : 'expand-more'} size={22} color={colors.subtle} />
              )}
            </View>

            {expanded ? (
              <View style={{ marginTop: 14, gap: 8 }}>
                {isCodeRequest ? (
                  <>
                    <AppText variant="caption" style={{ color: colors.subtle }}>
                      This person joined with the organization code and needs approval.
                    </AppText>
                    <AppButton
                      title="Approve and assign role"
                      size="sm"
                      onPress={() => setApprovePickerOpen(true)}
                    />
                  </>
                ) : null}

                {member.isActive ? (
                  <>
                    <RoleSelectField
                      label="Role"
                      value={currentRoleLabel}
                      onPress={() => setRolePickerOpen(true)}
                      colors={colors}
                      styles={styles}
                    />
                    <AppButton
                      title="Deactivate"
                      variant="outline"
                      size="sm"
                      onPress={() =>
                        confirmAction({
                          title: 'Deactivate member',
                          message: `Deactivate ${displayName}? They will lose access until reactivated.`,
                          confirmText: 'Deactivate',
                          destructive: true,
                          onConfirm: () => onDeactivate(member.userId!),
                        })
                      }
                    />
                  </>
                ) : isEmailPending ? (
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    Waiting for them to accept the email invite.
                  </AppText>
                ) : null}

                {!isCodeRequest || member.isActive ? (
                  <AppButton
                    title="Remove from organization"
                    variant="outline"
                    size="sm"
                    onPress={() =>
                      confirmAction({
                        title: 'Remove member',
                        message: `Remove ${displayName} from this organization? Their user account will remain, but they will lose access here.`,
                        confirmText: 'Remove',
                        destructive: true,
                        onConfirm: () => onDelete(member.userId!),
                      })
                    }
                  />
                ) : (
                  <AppButton
                    title="Decline request"
                    variant="outline"
                    size="sm"
                    onPress={() =>
                      confirmAction({
                        title: 'Decline join request',
                        message: `Decline ${displayName}'s request to join this organization?`,
                        confirmText: 'Decline',
                        destructive: true,
                        onConfirm: () => onDelete(member.userId!),
                      })
                    }
                  />
                )}
              </View>
            ) : null}
          </ClayView>
        </View>
      </PressClay>

      <OptionPickerSheet
        isVisible={rolePickerOpen}
        onClose={() => setRolePickerOpen(false)}
        title="Change role"
        options={roleOptions}
        selected={member.roleId ?? null}
        onSelect={handleSelectRole}
        includeAllOption={false}
        height={Math.min(480, 120 + roleOptions.length * 62)}
      />
      <OptionPickerSheet
        isVisible={approvePickerOpen}
        onClose={() => setApprovePickerOpen(false)}
        title="Assign role"
        options={roleOptions}
        selected={member.roleId ?? null}
        onSelect={handleApproveWithRole}
        includeAllOption={false}
        height={Math.min(480, 120 + roleOptions.length * 62)}
      />
    </>
  );
}

function RoleSelectField({
  label,
  value,
  onPress,
  colors,
  styles,
}: {
  label: string;
  value: string;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
  styles: ReturnType<typeof createMembersWorkspaceStyles>;
}) {
  return (
    <View style={{ marginTop: 4 }}>
      <AppText variant="caption" weight="bold" style={{ color: colors.subtle, marginBottom: 8, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </AppText>
      <PressClay onPress={onPress}>
        <View style={styles.selectField}>
          <ClayView
            depth={4}
            puffy={0}
            color={colors.background}
            contentOverflow="hidden"
            style={styles.selectFieldInner}
          >
            <View style={styles.selectFieldRow}>
              <AppText weight="bold" style={styles.selectFieldLabel} numberOfLines={1}>
                {value}
              </AppText>
              <Icon name="expand-more" size={24} color={colors.subtle} />
            </View>
          </ClayView>
        </View>
      </PressClay>
    </View>
  );
}
