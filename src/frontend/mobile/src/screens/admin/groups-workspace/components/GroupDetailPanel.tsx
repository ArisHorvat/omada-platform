import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppButton, AppText, ClayView } from '@/src/components/ui';
import { WidePanePlaceholder } from '@/src/components/layout';
import { useBreakpoint } from '@/src/hooks';
import type { GroupsWorkspaceModel } from '../hooks/useGroupsWorkspace';
import { SubGroupsSection } from './SubGroupsSection';
import { GroupMembersSection } from './GroupMembersSection';
import { groupsWorkspaceStyles as s } from '../styles/groupsWorkspace.styles';

type Props = {
  model: GroupsWorkspaceModel;
};

export function GroupDetailPanel({ model }: Props) {
  const { isWideShell } = useBreakpoint();
  const {
    colors,
    copy,
    selectedGroupId,
    detail,
    detailQuery,
    membersQuery,
    labelForType,
    openEdit,
    confirmDelete,
    openCreate,
  } = model;

  if (!selectedGroupId) {
    if (isWideShell) {
      return (
        <WidePanePlaceholder
          icon="account-tree"
          title={copy.selectGroupTitle}
          description={copy.selectGroupDescription}
        />
      );
    }

    return (
      <ClayView depth={2} color={colors.card} style={{ borderRadius: 16, padding: 20, marginTop: 16 }}>
        <AppText variant="body" style={{ color: colors.subtle, lineHeight: 22 }}>
          {copy.selectGroupDescription}
        </AppText>
      </ClayView>
    );
  }

  if (detailQuery.isLoading) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />;
  }

  if (!detail) return null;

  const members = membersQuery.data?.items ?? [];
  const totalMemberCount = membersQuery.data?.totalCount ?? detail.memberCount;
  const directMemberCount = detail.directMemberCount ?? totalMemberCount;

  return (
    <ClayView depth={3} color={colors.card} style={s.detailPanel}>
      <View style={s.detailHeader}>
        <AppText variant="caption" style={{ color: colors.subtle }}>
          {labelForType(detail.type)}
          {detail.parentName ? ` · ${detail.parentName}` : ''}
        </AppText>
        <AppText variant="h2" weight="bold" style={{ marginTop: 4 }} numberOfLines={3}>
          {detail.name}
        </AppText>
        {detail.managerName ? (
          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
            Lead: {detail.managerName}
          </AppText>
        ) : null}
        <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6 }}>
          {copy.membersCountBreakdown(totalMemberCount, directMemberCount)}
          {totalMemberCount > directMemberCount ? ` · ${copy.membersRollupHint}` : ''}
        </AppText>
      </View>

      <View style={s.detailActions}>
        <AppButton title="Edit" variant="outline" onPress={openEdit} style={s.detailActionBtn} />
        <AppButton title={copy.subGroupButton} variant="outline" onPress={openCreate} style={s.detailActionBtn} />
        <AppButton title="Delete" variant="outline" onPress={confirmDelete} style={s.detailActionBtn} />
      </View>

      <View style={s.detailSections}>
        {detail.children.length > 0 ? <SubGroupsSection subGroups={detail.children} model={model} /> : null}
        <GroupMembersSection
          model={model}
          members={members}
          totalCount={totalMemberCount}
          directCount={directMemberCount}
          loading={membersQuery.isLoading}
        />
      </View>
    </ClayView>
  );
}
