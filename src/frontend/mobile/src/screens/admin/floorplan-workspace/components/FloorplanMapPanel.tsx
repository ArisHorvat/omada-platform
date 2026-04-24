import React from 'react';
import { View } from 'react-native';
import { AppButton, AppText, ClayView } from '@/src/components/ui';
import { FloorplanFloorplanViewerBlock } from '@/src/screens/admin/floorplan-workspace/components/FloorplanFloorplanViewerBlock';
import type { FloorplanWorkspaceModel } from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';
import { mapWebNoSelectStyle } from '@/src/screens/admin/floorplan-workspace/styles/floorplanWorkspaceScreen.styles';

type Props = {
  model: FloorplanWorkspaceModel;
  compactChrome?: boolean;
};

export function FloorplanMapPanel({ model, compactChrome = false }: Props) {
  const {
    colors,
    isWideLayout,
    activeTab,
    selectedPoiIndex,
    placePoiKind,
    hasRoomPolygons,
    isVectorMode,
    setIsVectorMode,
  } = model;
  const webNoSelect = mapWebNoSelectStyle();

  return (
    <ClayView
      depth={4}
      color={colors.card}
      style={{
        borderRadius: 14,
        padding: compactChrome ? 8 : 12,
        width: '100%',
        alignSelf: 'stretch',
        flex: isWideLayout ? 1 : 1,
        minHeight: 0,
        ...(webNoSelect ?? {}),
      }}
    >
      {!compactChrome ? (
        <>
          <AppText variant="label" style={{ color: colors.subtle, marginBottom: 4 }}>
            Floorplan preview
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
            {hasRoomPolygons
              ? 'Tap the map to select a room or place pins. Tools are in the tabs below (mobile) or on the left (tablet).'
              : 'The image you pick appears here first. Run AI extraction — room outlines appear after processing completes.'}
          </AppText>
        </>
      ) : activeTab === 'pins' ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
          {selectedPoiIndex != null
            ? 'Map is locked while a pin is selected. Deselect to pan and zoom again.'
            : placePoiKind != null
              ? 'Pan and pinch to position, then tap to place. Pick a pin type in the Pins tab to cancel.'
              : 'Pan, zoom, pick a pin type, then tap to place. Select a pin in the list or on the map to edit — the map locks while it is selected.'}
        </AppText>
      ) : null}
      {!compactChrome && hasRoomPolygons ? (
        <View style={{ marginBottom: 8, alignSelf: 'flex-start' }}>
          <AppButton
            title={isVectorMode ? 'Map view · on' : 'Toggle Map View'}
            onPress={() => setIsVectorMode((v) => !v)}
            variant={isVectorMode ? 'secondary' : 'outline'}
            style={{ minWidth: 160 }}
          />
        </View>
      ) : null}
      <FloorplanFloorplanViewerBlock model={model} />
    </ClayView>
  );
}
