import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import type { GroupsWorkspaceModel } from '../hooks/useGroupsWorkspace';
import { groupsWorkspaceStyles as s } from '../styles/groupsWorkspace.styles';

type Props = {
  model: GroupsWorkspaceModel;
};

export function GroupTreeList({ model }: Props) {
  const {
    colors,
    treeQuery,
    flatRows,
    selectedGroupId,
    setSelectedGroupId,
    labelForType,
    openCreate,
  } = model;

  if (treeQuery.isLoading) {
    return <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />;
  }

  if (treeQuery.isError) {
    return (
      <ClayView depth={2} color={colors.card} style={{ borderRadius: 14, padding: 16 }}>
        <AppText variant="body" style={{ color: colors.text }}>
          Could not load groups. Check your connection and groups permission.
        </AppText>
      </ClayView>
    );
  }

  if (flatRows.length === 0) {
    return (
      <ClayView depth={2} color={colors.card} style={{ borderRadius: 14, padding: 18 }}>
        <AppText variant="body" style={{ marginBottom: 12, lineHeight: 22 }}>
          No groups yet. Create departments, teams, classes, subjects, or series — then link members.
        </AppText>
        <PressClay onPress={openCreate}>
          <ClayView depth={3} color={colors.primary + '22'} style={{ alignSelf: 'flex-start', padding: 12, borderRadius: 12 }}>
            <AppText variant="label" style={{ color: colors.primary }}>
              + Create first group
            </AppText>
          </ClayView>
        </PressClay>
      </ClayView>
    );
  }

  return (
    <View>
      {flatRows.map((row) => {
        const active = selectedGroupId === row.id;
        return (
          <PressClay key={row.id} onPress={() => setSelectedGroupId(row.id)}>
            <ClayView
              depth={active ? 4 : 2}
              color={active ? colors.primary + '20' : colors.card}
              style={[
                s.treeRow,
                {
                  marginLeft: row.depth * 14,
                  borderWidth: active ? 1 : 0,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Icon
                name={row.children?.length ? 'folder' : 'people'}
                size={20}
                color={active ? colors.primary : colors.subtle}
              />
              <View style={{ flex: 1 }}>
                <AppText variant="body" weight={active ? 'bold' : 'medium'} numberOfLines={1}>
                  {row.name}
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <View style={[s.typePill, { backgroundColor: colors.background }]}>
                    <AppText variant="caption" style={{ color: colors.subtle, fontSize: 11 }}>
                      {labelForType(row.type)}
                    </AppText>
                  </View>
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    {row.memberCount} members
                  </AppText>
                </View>
              </View>
              <Icon name="chevron-right" size={18} color={colors.subtle} />
            </ClayView>
          </PressClay>
        );
      })}
    </View>
  );
}
