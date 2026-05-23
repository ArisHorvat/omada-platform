import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { FloorplanPolygonEditorOverlay } from '@/src/screens/admin/components/FloorplanPolygonEditorOverlay';
import { FloorplanPoiEditorOverlay } from '@/src/screens/admin/components/FloorplanPoiEditorOverlay';
import type { FloorplanWorkspaceModel } from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';
import { FloorplanViewer } from '@/src/screens/widgets/map/components/FloorplanViewer';
import { FloorplanMapLegendPanel } from '@/src/screens/widgets/map/components/FloorplanMapLegendPanel';

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
    outlineTraceActive,
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
    shellTraceDraft,
    roomTraceDraft,
    doorPlacement,
    appendOutlineDraftTap,
    onDoorPlacementTap,
    onTranslateWholeFeature,
    onNudgeEdgeRelease,
  } = model;

  const mapAuthoringTap =
    activeTab === 'pins' && placePoiKind != null
      ? onAddPoiAt
      : shellTraceDraft != null || roomTraceDraft != null
        ? appendOutlineDraftTap
        : doorPlacement != null
          ? onDoorPlacementTap
          : undefined;

  const blockPolygonHitTesting =
    shellTraceDraft != null || roomTraceDraft != null || doorPlacement != null;

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
            outlineTraceActive={outlineTraceActive}
            vectorMode={isVectorMode}
            onTapNormalized={mapAuthoringTap}
            onOutlineTraceDrag={
              shellTraceDraft != null || roomTraceDraft != null ? appendOutlineDraftTap : undefined
            }
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
                /** Keep authoring geometry/labels aligned with “map view off”; background still uses vector toggle. */
                isVectorMode={false}
                interactive={!blockPolygonHitTesting}
                shellTraceDraftPoints={shellTraceDraft ?? undefined}
                roomTraceDraftPoints={roomTraceDraft ?? undefined}
                onTranslateWholeFeature={onTranslateWholeFeature}
                onNudgeEdgeRelease={onNudgeEdgeRelease}
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
          <FloorplanMapLegendPanel
            colors={colors}
            mode="admin"
            wideLayout={isWideLayout}
            style={{
              position: 'absolute',
              bottom: 8,
              zIndex: 4,
              maxHeight: isWideLayout ? 200 : 150,
              ...(isWideLayout
                ? { right: 8, width: Math.min(420, Math.max(280, mapColumnWidth - 16)) }
                : { left: 8, right: 8 }),
            }}
          />
        </View>
      ) : (
        <AppText variant="body" style={{ color: colors.subtle, textAlign: 'center', paddingVertical: 28 }}>
          Choose an image to preview it here. Create a floor or run extraction to attach it to a level.
        </AppText>
      )}
    </>
  );
}
