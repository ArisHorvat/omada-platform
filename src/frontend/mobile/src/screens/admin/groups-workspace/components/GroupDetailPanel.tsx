import React from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { AppButton, AppFormField, AppText, ClayView, Icon, ProgressiveImage } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { WidePanePlaceholder } from '@/src/components/layout';
import { useBreakpoint } from '@/src/hooks';
import type { GroupsWorkspaceModel } from '../hooks/useGroupsWorkspace';
import { groupsWorkspaceStyles as s } from '../styles/groupsWorkspace.styles';

type Props = {
  model: GroupsWorkspaceModel;
};

export function GroupDetailPanel({ model }: Props) {
  const { isWideShell } = useBreakpoint();
  const {
    colors,
    selectedGroupId,
    detail,
    detailQuery,
    membersQuery,
    memberSearch,
    setMemberSearch,
    labelForType,
    openEdit,
    confirmDelete,
    openCreate,
    setAddMembersSheetOpen,
    setMoveSheetOpen,
    selectedMemberIds,
    toggleMemberSelection,
    removeMemberMutation,
    setSelectedMemberIds,
  } = model;

  if (!selectedGroupId) {
    if (isWideShell) {
      return (
        <WidePanePlaceholder
          icon="account-tree"
          title="Select a group"
          description="Choose a group in the tree to view members, edit structure, or move students between classes and teams."
        />
      );
    }

    return (
      <ClayView depth={2} color={colors.card} style={{ borderRadius: 16, padding: 20, marginTop: 16 }}>
        <AppText variant="body" style={{ color: colors.subtle, lineHeight: 22 }}>
          Select a group from the tree to view members, edit structure, or move students between classes and teams.
        </AppText>
      </ClayView>
    );
  }

  if (detailQuery.isLoading) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />;
  }

  if (!detail) return null;

  const members = membersQuery.data?.items ?? [];

  return (
    <ClayView depth={3} color={colors.card} style={{ borderRadius: 16, padding: 16, marginTop: 16 }}>
      <AppText variant="caption" style={{ color: colors.subtle }}>
        {labelForType(detail.type)}
        {detail.parentName ? ` · under ${detail.parentName}` : ''}
      </AppText>
      <AppText variant="h2" weight="bold" style={{ marginTop: 4, marginBottom: 4 }}>
        {detail.name}
      </AppText>
      {detail.managerName ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
          Lead: {detail.managerName}
        </AppText>
      ) : null}
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
        {detail.memberCount} members · {detail.childCount} sub-groups
      </AppText>

      <View style={s.actionRow}>
        <AppButton title="Edit" variant="outline" onPress={openEdit} style={{ minWidth: 88 }} />
        <AppButton title="Sub-group" variant="outline" onPress={openCreate} style={{ minWidth: 100 }} />
        <AppButton title="Delete" variant="outline" onPress={confirmDelete} style={{ minWidth: 88 }} />
      </View>

      {detail.children.length > 0 ? (
        <View style={{ marginBottom: 14 }}>
          <AppText variant="label" style={{ marginBottom: 8 }}>
            Sub-groups
          </AppText>
          {detail.children.map((c) => (
            <ClayView
              key={c.id}
              depth={1}
              color={colors.background}
              style={{ borderRadius: 12, padding: 10, marginBottom: 6 }}
            >
              <AppText variant="body">{c.name}</AppText>
              <AppText variant="caption" style={{ color: colors.subtle }}>
                {labelForType(c.type)} · {c.memberCount} members
              </AppText>
            </ClayView>
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <AppText variant="label">Members</AppText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <AppButton
            title={`Move (${selectedMemberIds.size})`}
            variant="outline"
            onPress={() => {
              if (selectedMemberIds.size === 0) {
                Alert.alert('Select members', 'Tap members below to select who to move.');
                return;
              }
              setMoveSheetOpen(true);
            }}
            style={{ paddingHorizontal: 10, minWidth: 0 }}
          />
          <AppButton
            title="Add"
            onPress={() => setAddMembersSheetOpen(true)}
            style={{ paddingHorizontal: 14, minWidth: 0 }}
          />
        </View>
      </View>

      <AppFormField
        value={memberSearch}
        onChangeText={setMemberSearch}
        placeholder="Filter members…"
        style={{ marginBottom: 10 }}
      />

      {membersQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : members.length === 0 ? (
        <AppText variant="caption" style={{ color: colors.subtle }}>
          No members in this group yet.
        </AppText>
      ) : (
        members.map((m) => {
          const selected = selectedMemberIds.has(m.userId);
          const initials = `${m.firstName?.[0] ?? ''}${m.lastName?.[0] ?? ''}`.toUpperCase();
          return (
            <PressClay key={m.userId} onPress={() => toggleMemberSelection(m.userId)}>
              <ClayView
                depth={selected ? 3 : 1}
                color={selected ? colors.primary + '16' : colors.background}
                style={[
                  s.memberRow,
                  selected ? { borderWidth: 1, borderColor: colors.primary } : undefined,
                ]}
              >
                {m.avatarUrl ? (
                  <ProgressiveImage source={{ uri: m.avatarUrl }} style={s.avatar} resizeMode="cover" />
                ) : (
                  <ClayView depth={2} color={colors.primary + '33'} style={s.avatar}>
                    <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
                      {initials}
                    </AppText>
                  </ClayView>
                )}
                <View style={{ flex: 1 }}>
                  <AppText variant="body" weight="medium">
                    {m.firstName} {m.lastName}
                  </AppText>
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    {m.roleName}
                    {m.roleInGroup ? ` · ${m.roleInGroup}` : ''}
                  </AppText>
                </View>
                <PressClay
                  onPress={() => {
                    Alert.alert('Remove member', `Remove ${m.firstName} from this group?`, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => removeMemberMutation.mutate(m.userId),
                      },
                    ]);
                  }}
                >
                  <Icon name="close" size={20} color={colors.subtle} />
                </PressClay>
              </ClayView>
            </PressClay>
          );
        })
      )}

      {selectedMemberIds.size > 0 ? (
        <AppButton
          title="Clear selection"
          variant="outline"
          onPress={() => setSelectedMemberIds(new Set())}
          style={{ marginTop: 8, alignSelf: 'flex-start' }}
        />
      ) : null}
    </ClayView>
  );
}
