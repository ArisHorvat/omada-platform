import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { AppButton, AppText, ClayView } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import type { GroupsWorkspaceModel } from '../hooks/useGroupsWorkspace';
import { groupsWorkspaceStyles as s } from '../styles/groupsWorkspace.styles';

type Props = {
  model: GroupsWorkspaceModel;
};

export function MoveMembersSheet({ model }: Props) {
  const {
    colors,
    moveSheetOpen,
    setMoveSheetOpen,
    flatRows,
    selectedGroupId,
    labelForType,
    moveMutation,
    selectedMemberIds,
  } = model;

  const [targetId, setTargetId] = useState<string | null>(null);

  const targets = flatRows.filter((r) => r.id !== selectedGroupId);

  return (
    <BottomSheet
      isVisible={moveSheetOpen}
      onClose={() => setMoveSheetOpen(false)}
      height={480}
      zIndexBase={250}
    >
      <View style={{ flex: 1, paddingBottom: 8 }}>
        <AppText variant="h3" weight="bold" style={{ marginBottom: 6 }}>
          Move members
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
          Move {selectedMemberIds.size} selected member(s) to another group. They will leave the current group.
        </AppText>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {targets.map((row) => {
            const active = targetId === row.id;
            return (
              <PressClay key={row.id} onPress={() => setTargetId(row.id)}>
                <ClayView
                  depth={active ? 3 : 1}
                  color={active ? colors.primary + '18' : colors.card}
                  style={[s.treeRow, { marginLeft: row.depth * 8 }]}
                >
                  <View style={{ flex: 1 }}>
                    <AppText variant="body" weight="medium" numberOfLines={1}>
                      {row.name}
                    </AppText>
                    <AppText variant="caption" style={{ color: colors.subtle }}>
                      {labelForType(row.type)} · {row.memberCount} members
                    </AppText>
                  </View>
                </ClayView>
              </PressClay>
            );
          })}
        </ScrollView>

        <AppButton
          title={moveMutation.isPending ? 'Moving…' : 'Confirm move'}
          onPress={() => targetId && moveMutation.mutate(targetId)}
          disabled={!targetId || moveMutation.isPending || selectedMemberIds.size === 0}
          style={{ marginTop: 12 }}
        />
      </View>
    </BottomSheet>
  );
}
