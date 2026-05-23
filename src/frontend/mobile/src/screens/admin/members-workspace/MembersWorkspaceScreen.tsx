import React, { useMemo, useState } from 'react';
import { View, ScrollView, TextInput, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { AppButton, AppText, ClayView, Icon, SegmentedControl, WidgetEmptyState } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { useThemeColors } from '@/src/hooks';
import type { OrganizationMemberDto } from '@/src/api/generatedClient';
import { useMembersWorkspace } from '../hooks/useMembersWorkspace';

export default function MembersWorkspaceScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tab, setTab] = useState<'members' | 'invite'>('members');

  const {
    org,
    roles,
    inviteableRoles,
    members,
    totalMembers,
    search,
    setSearch,
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
    reactivateMember,
    regenerateInviteCode,
    copyInviteLink,
    shareInviteLink,
    isLoading,
    refetch,
  } = useMembersWorkspace();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <PageContainer>
        <View style={styles.header}>
          <ClayBackButton />
          <View style={{ flex: 1 }}>
            <AppText variant="h3" weight="bold">
              People & invites
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle }}>
              {totalMembers} member{totalMembers === 1 ? '' : 's'}
            </AppText>
          </View>
        </View>

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
              <ClayView depth={6} puffy={16} color={colors.card} style={styles.card}>
                <AppText weight="bold">Organization invite</AppText>
                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6 }}>
                  Code: {org?.inviteCode ?? '—'}
                </AppText>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <AppButton title="Copy link" variant="outline" onPress={copyInviteLink} style={{ flex: 1 }} />
                  <AppButton title="Share" onPress={shareInviteLink} style={{ flex: 1 }} />
                </View>
                <AppButton
                  title="Regenerate code"
                  variant="outline"
                  onPress={regenerateInviteCode}
                  style={{ marginTop: 8 }}
                />
              </ClayView>

              <ClayView depth={6} puffy={16} color={colors.card} style={[styles.card, { marginTop: 14 }]}>
                <AppText weight="bold">Invite by email</AppText>
                <TextInput
                  value={emailInput}
                  onChangeText={setEmailInput}
                  placeholder="colleague@company.com"
                  placeholderTextColor={colors.subtle}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                />
                <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
                  ROLE
                </AppText>
                <View style={styles.chipRow}>
                  {inviteableRoles.map((role) => (
                    <Pressable key={role} onPress={() => setInviteRole(role)}>
                      <ClayView
                        depth={2}
                        color={inviteRole === role ? colors.primaryContainer : colors.background}
                        style={styles.chip}
                      >
                        <AppText variant="caption" weight={inviteRole === role ? 'bold' : 'regular'}>
                          {role}
                        </AppText>
                      </ClayView>
                    </Pressable>
                  ))}
                </View>
                <AppButton title="Add to list" variant="outline" onPress={addPendingInvite} style={{ marginTop: 12 }} />
              </ClayView>

              {pendingInvites.map((item) => (
                <ClayView key={item.email} depth={4} puffy={12} color={colors.card} style={styles.pendingRow}>
                  <View style={{ flex: 1 }}>
                    <AppText weight="bold">{item.email}</AppText>
                    <AppText variant="caption" style={{ color: colors.subtle }}>
                      {item.roleName}
                    </AppText>
                  </View>
                  <Pressable
                    onPress={() =>
                      setPendingInvites((prev) => prev.filter((p) => p.email !== item.email))
                    }
                  >
                    <Icon name="close" size={20} color={colors.subtle} />
                  </Pressable>
                </ClayView>
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
              <ClayView depth={4} puffy={8} color={colors.card} style={{ borderRadius: 14, marginBottom: 12 }}>
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search members…"
                  placeholderTextColor={colors.subtle}
                  style={{ padding: 10, color: colors.text }}
                />
              </ClayView>

              {members.length === 0 && !isLoading ? (
                <WidgetEmptyState title="No members found" description="Invite people to join your organization." icon="group" />
              ) : null}

              {members.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  roles={roles}
                  colors={colors}
                  onChangeRole={updateMemberRole}
                  onDeactivate={deactivateMember}
                  onReactivate={reactivateMember}
                />
              ))}
            </>
          )}
        </ScrollView>
      </PageContainer>
    </View>
  );
}

function MemberRow({
  member,
  roles,
  colors,
  onChangeRole,
  onDeactivate,
  onReactivate,
}: {
  member: OrganizationMemberDto;
  roles: { id?: string; name?: string }[];
  colors: ReturnType<typeof useThemeColors>;
  onChangeRole: (userId: string, roleId: string) => void;
  onDeactivate: (userId: string) => void;
  onReactivate: (userId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <PressClay onPress={() => setExpanded((v) => !v)}>
      <ClayView
        depth={6}
        puffy={12}
        color={colors.card}
        style={{
          borderRadius: 16,
          marginBottom: 10,
          opacity: member.isActive ? 1 : 0.65,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <AppText weight="bold">
              {member.firstName} {member.lastName}
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle }}>
              {member.email} · {member.roleName}
            </AppText>
          </View>
          {!member.isActive ? (
            <AppText variant="caption" style={{ color: colors.error }}>
              Inactive
            </AppText>
          ) : null}
        </View>

        {expanded ? (
          <View style={{ marginTop: 12, gap: 8 }}>
            <AppText variant="caption" style={{ color: colors.subtle }}>
              Change role
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {roles.map((role) =>
                role.id && role.name ? (
                  <Pressable key={role.id} onPress={() => onChangeRole(member.userId!, role.id!)}>
                    <ClayView
                      depth={2}
                      color={member.roleId === role.id ? colors.primaryContainer : colors.background}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
                    >
                      <AppText variant="caption">{role.name}</AppText>
                    </ClayView>
                  </Pressable>
                ) : null
              )}
            </View>
            {member.isActive ? (
              <AppButton title="Deactivate" variant="outline" size="sm" onPress={() => onDeactivate(member.userId!)} />
            ) : (
              <AppButton title="Reactivate" variant="outline" size="sm" onPress={() => onReactivate(member.userId!)} />
            )}
          </View>
        ) : null}
      </ClayView>
    </PressClay>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    header: { paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
    card: { borderRadius: 16 },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
      marginBottom: 12,
      backgroundColor: colors.background,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    pendingRow: {
      borderRadius: 12,
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
