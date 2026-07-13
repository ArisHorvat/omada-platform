import React from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';
import { AppButton, AppText, Icon } from '@/src/components/ui';
import type { FloorplanWorkspaceModel } from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';
import { LOCATION_WORKSPACE_COPY } from '@/src/screens/admin/floorplan-workspace/utils/locationLabels';

type Props = {
  model: FloorplanWorkspaceModel;
};

export function FloorplanWorkspaceHeader({ model }: Props) {
  const {
    colors,
    horizontalPad,
    goToWorkflowChoice,
    savingGeo,
    publishingRooms,
    activeFloor,
    activeBuilding,
    geoDoc,
    hasUnsavedChanges,
    handleSaveGeoJsonAndPublishRooms,
    savePublishNotice,
  } = model;
  const savePublishBusy = savingGeo || publishingRooms;

  return (
    <View style={{ paddingHorizontal: horizontalPad, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Pressable
          onPress={goToWorkflowChoice}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}
          hitSlop={12}
        >
          <Icon name="arrow-back" size={22} color={colors.text} />
          <View style={{ flexShrink: 1 }}>
            <AppText variant="h2" weight="bold" numberOfLines={1}>
              Floorplan editor
            </AppText>
            {activeBuilding && activeFloor ? (
              <AppText variant="caption" style={{ color: colors.subtle }} numberOfLines={1}>
                {activeBuilding.name} · Level {activeFloor.levelNumber}
              </AppText>
            ) : null}
          </View>
        </Pressable>
        <TouchableOpacity onPress={goToWorkflowChoice} hitSlop={12} style={{ paddingVertical: 4 }}>
          <AppText variant="caption" style={{ color: colors.primary }}>
            {LOCATION_WORKSPACE_COPY.mapEditorBack}
          </AppText>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <AppButton
          title={
            publishingRooms ? 'Publishing…' : savingGeo ? 'Saving…' : hasUnsavedChanges ? 'Save & publish' : 'Publish'
          }
          onPress={handleSaveGeoJsonAndPublishRooms}
          disabled={savePublishBusy || !activeFloor?.floorplanId || !geoDoc}
          style={{ paddingHorizontal: 14, minWidth: 88 }}
        />
      </View>
      <AppText variant="caption" style={{ color: colors.subtle }}>
        Refine rooms and pins for this level. Use Setup to change the image or run AI.
      </AppText>
      {savePublishNotice ? (
        <AppText
          variant="caption"
          weight="bold"
          style={{ color: colors.primary, marginTop: 8, lineHeight: 18 }}
        >
          {savePublishNotice}
        </AppText>
      ) : null}
    </View>
  );
}
