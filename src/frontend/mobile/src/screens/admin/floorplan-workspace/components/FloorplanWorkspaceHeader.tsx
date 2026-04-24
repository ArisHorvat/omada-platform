import React from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';
import { AppButton, AppText, Icon } from '@/src/components/ui';
import type { FloorplanWorkspaceModel } from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';

type Props = {
  model: FloorplanWorkspaceModel;
};

export function FloorplanWorkspaceHeader({ model }: Props) {
  const { colors, horizontalPad, goToWorkflowChoice, savingGeo, hasUnsavedChanges, handleSaveGeoJson } = model;

  return (
    <View style={{ paddingHorizontal: horizontalPad, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Pressable
          onPress={goToWorkflowChoice}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          hitSlop={12}
        >
          <Icon name="arrow-back" size={22} color={colors.text} />
          <AppText variant="h2" weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>
            Floorplan extraction
          </AppText>
        </Pressable>
        <TouchableOpacity onPress={goToWorkflowChoice} hitSlop={12} style={{ paddingVertical: 4 }}>
          <AppText variant="caption" style={{ color: colors.primary }}>
            Workflow
          </AppText>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <AppButton
          title={savingGeo ? 'Saving…' : 'Save'}
          onPress={handleSaveGeoJson}
          disabled={!hasUnsavedChanges || savingGeo}
          style={{ paddingHorizontal: 14, minWidth: 88 }}
        />
      </View>
      <AppText variant="caption" style={{ color: colors.subtle }}>
        Run AI on a clear exported image, then refine rooms and pins — workspace tabs below (mobile) or on the left
        (tablet).
      </AppText>
    </View>
  );
}
