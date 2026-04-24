import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { FloorplanPolygonEditorOverlay } from '@/src/screens/admin/components/FloorplanPolygonEditorOverlay';
import { FloorplanPoiEditorOverlay } from '@/src/screens/admin/components/FloorplanPoiEditorOverlay';
import type { FloorplanWorkspaceModel } from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';
import { FloorplanViewer } from '@/src/screens/widgets/map/components/FloorplanViewer';

type Props = {
  model: FloorplanWorkspaceModel;
};

export function FloorplanFloorplanViewerBlock({ model }: Props) {
  const {
    colors,
    isWideLayout,
    mapColumnWidth,
    previewHeightRatio,
    floorplanMapHeight,
    mapGesturesEnabled,
    previewImageUrl,
    floorplanLoading,
    activeFloor,
    displayGeoJson,
    showPolygonLayer,
    showPoiLayer,
    geoDoc,
    editMode,
    selectedRoomIndex,
    onMoveVertex,
    activeTab,
    placePoiKind,
    onAddPoiAt,
    setPlacePoiKind,
    setSelectedPoiIndex,
    setSelectedRoomIndex,
    setEditMode,
    setActiveTab,
    selectedPoiIndex,
    onMovePoi,
    isVectorMode,
  } = model;

  return (
    <>
      {previewImageUrl ? (
        <View style={{ position: 'relative', flexGrow: isWideLayout ? 0 : 1 }}>
          {floorplanLoading && activeFloor?.floorplanId ? (
            <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 5 }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}
          <FloorplanViewer
            layoutWidth={mapColumnWidth}
            imageUrl={previewImageUrl}
            isDark={colors.isDark}
            heightRatio={previewHeightRatio}
            gesturesEnabled={mapGesturesEnabled}
            vectorMode={isVectorMode}
            onTapNormalized={activeTab === 'pins' && placePoiKind != null ? onAddPoiAt : undefined}
          >
            {showPolygonLayer ? (
              <FloorplanPolygonEditorOverlay
                geoJsonData={displayGeoJson}
                width={mapColumnWidth}
                height={floorplanMapHeight}
                colors={colors}
                selectedFeatureIndex={selectedRoomIndex}
                editMode={editMode}
                onMoveVertex={onMoveVertex}
                isVectorMode={isVectorMode}
                interactive
                onSelectRoom={(fi) => {
                  setPlacePoiKind(null);
                  setSelectedPoiIndex(null);
                  setSelectedRoomIndex(fi);
                  setEditMode(true);
                  setActiveTab('rooms');
                }}
                onDeselectRoom={() => setSelectedRoomIndex(null)}
              />
            ) : null}
            {showPoiLayer ? (
              <FloorplanPoiEditorOverlay
                pois={geoDoc?.pois ?? []}
                placeKind={placePoiKind}
                selectedPoiIndex={selectedPoiIndex}
                onMovePoi={onMovePoi}
                onSelectPoi={(idx) => {
                  setSelectedPoiIndex(idx);
                  if (idx !== null) setActiveTab('pins');
                }}
                width={mapColumnWidth}
                height={floorplanMapHeight}
              />
            ) : null}
          </FloorplanViewer>
        </View>
      ) : (
        <AppText variant="body" style={{ color: colors.subtle, textAlign: 'center', paddingVertical: 28 }}>
          Choose an image to preview it here. Create a floor or run extraction to attach it to a level.
        </AppText>
      )}
    </>
  );
}
