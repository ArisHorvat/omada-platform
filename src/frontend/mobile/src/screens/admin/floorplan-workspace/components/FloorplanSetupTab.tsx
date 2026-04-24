import React from 'react';
import { ActivityIndicator, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import type { FloorplanWorkspaceModel } from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';
import { createFloorplanWorkspaceStyles } from '@/src/screens/admin/floorplan-workspace/styles/floorplanWorkspaceScreen.styles';

type Props = {
  model: FloorplanWorkspaceModel;
};

export function FloorplanSetupTab({ model }: Props) {
  const {
    colors,
    workspaceIntent,
    createLevelChoiceLocked,
    buildings,
    buildingsQuery,
    floors,
    floorsQuery,
    selectedBuildingId,
    setSelectedBuildingId,
    selectedFloorId,
    setSelectedFloorId,
    newFloorLevel,
    setNewFloorLevel,
    setCreateLevelChoiceLocked,
    pickingImage,
    savingNewFloor,
    uploading,
    pendingFloorAsset,
    activeFloor,
    floorplanLoading,
    extractedPolygons,
    rawFeatureCount,
    displayGeoJson,
    showRawGeoJson,
    setShowRawGeoJson,
    handleChooseFloorplanImage,
    handleCreateFloor,
    handleRunExtraction,
    confirmCreateBuildingAndLevel,
    isVectorMode,
    setIsVectorMode,
  } = model;

  const styles = createFloorplanWorkspaceStyles(colors);

  return (
    <>
      <ClayView depth={3} color={colors.background} style={{ borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: colors.border }}>
        <AppText variant="caption" weight="bold" style={{ color: colors.text, marginBottom: 4 }}>
          {workspaceIntent === 'create' ? 'New floor workflow' : 'Edit existing floorplan'}
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle }}>
          {workspaceIntent === 'create'
            ? 'Confirm building and level, pick a floorplan image, then add the new level to the building. After it exists, you can run AI room detection (optional).'
            : 'Pick building and floor, choose an image to preview it, then run extraction. Use “Workflow” in the header to switch modes.'}
        </AppText>
      </ClayView>
      <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <AppText variant="label" style={{ color: colors.subtle, marginBottom: 10 }}>
          Location
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
          Building
        </AppText>
        {(() => {
          const lockBuildingForCreate = workspaceIntent === 'create' && createLevelChoiceLocked;
          return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {buildings.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => {
                    if (!lockBuildingForCreate) setSelectedBuildingId(b.id!);
                  }}
                  disabled={lockBuildingForCreate}
                  style={{ marginRight: 8, opacity: lockBuildingForCreate && selectedBuildingId !== b.id ? 0.45 : 1 }}
                >
                  <ClayView
                    depth={selectedBuildingId === b.id ? 2 : 5}
                    color={selectedBuildingId === b.id ? colors.primary : colors.background}
                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
                  >
                    <AppText style={{ color: selectedBuildingId === b.id ? '#fff' : colors.text }}>{b.name}</AppText>
                  </ClayView>
                </TouchableOpacity>
              ))}
            </ScrollView>
          );
        })()}
        {!buildings.length && !buildingsQuery.isLoading ? (
          <AppText variant="caption" style={{ color: colors.subtle }}>
            No buildings in this organization yet.
          </AppText>
        ) : null}

        {workspaceIntent === 'edit' ? (
          <>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
              Floor
            </AppText>
            {!floors.length && !floorsQuery.isLoading ? (
              <AppText variant="caption" style={{ color: colors.subtle }}>
                No levels for this building yet. Use “Create a new floor” in Workflow to add one.
              </AppText>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {floors.map((f) => (
                  <TouchableOpacity key={f.id} onPress={() => setSelectedFloorId(f.id!)} style={{ marginRight: 8 }}>
                    <ClayView
                      depth={selectedFloorId === f.id ? 2 : 5}
                      color={selectedFloorId === f.id ? colors.primary : colors.background}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
                    >
                      <AppText style={{ color: selectedFloorId === f.id ? '#fff' : colors.text }}>
                        {`Level ${f.levelNumber}`}
                      </AppText>
                    </ClayView>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            {selectedBuildingId && !floors.length && !floorsQuery.isLoading ? (
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 8 }}>
                No floors yet. Switch to “Create a new floor” workflow or create one below.
              </AppText>
            ) : null}
          </>
        ) : (
          <>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
              New floor level
            </AppText>
            {floors.length > 0 ? (
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
                Existing levels:{' '}
                {[...floors]
                  .sort((a, b) => a.levelNumber - b.levelNumber)
                  .map((f) => f.levelNumber)
                  .join(', ')}
                . Your new level must be different.
              </AppText>
            ) : (
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
                No floors for this building yet — this will be the first level.
              </AppText>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <TextInput
                value={newFloorLevel}
                onChangeText={(t) => {
                  if (!createLevelChoiceLocked) setNewFloorLevel(t);
                }}
                editable={!createLevelChoiceLocked}
                keyboardType="numeric"
                style={{
                  minWidth: 72,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  color: colors.text,
                  backgroundColor: colors.card,
                  opacity: createLevelChoiceLocked ? 0.75 : 1,
                }}
              />
              {createLevelChoiceLocked ? (
                <AppButton
                  title="Change level"
                  variant="outline"
                  onPress={() => setCreateLevelChoiceLocked(false)}
                  style={{ minWidth: 120 }}
                />
              ) : (
                <AppButton
                  title="Confirm building & level"
                  variant="secondary"
                  onPress={confirmCreateBuildingAndLevel}
                  disabled={!selectedBuildingId}
                  style={{ minWidth: 120 }}
                />
              )}
            </View>
            {createLevelChoiceLocked ? (
              <AppText variant="caption" style={{ color: colors.primary, marginTop: 8 }}>
                Level {newFloorLevel} locked — you can pick or change the image without editing the level.
              </AppText>
            ) : null}
          </>
        )}
      </ClayView>

      <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
          Floorplan image & processing
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
          {workspaceIntent === 'create'
            ? 'Preview your image first. Add the new level (uploads this image) so the server can store it — then you may run AI room detection, or skip it and draw rooms manually. AI needs Map Admin and the Python AiService (AiService:BaseUrl).'
            : 'Preview your image first. Changing the image clears room outlines here until you run AI extraction or save new geometry. Extraction needs Map Admin and the Python AiService (AiService:BaseUrl).'}
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
          Tips: export PNG/PDF→PNG from CAD (not a screen photo), high resolution, black walls on white, straight scan.
        </AppText>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <AppButton
            title={
              pickingImage
                ? 'Opening…'
                : workspaceIntent === 'create'
                  ? '1 · Choose image'
                  : 'Choose image'
            }
            onPress={handleChooseFloorplanImage}
            variant="secondary"
            style={{ flex: 1, minWidth: 150 }}
            disabled={pickingImage || (workspaceIntent === 'create' && !createLevelChoiceLocked)}
          />
          {workspaceIntent !== 'edit' ? (
            <AppButton
              title={savingNewFloor ? 'Creating…' : '2 · Add level to building'}
              onPress={handleCreateFloor}
              style={{ flex: 1, minWidth: 150 }}
              disabled={
                !selectedBuildingId ||
                !pendingFloorAsset ||
                savingNewFloor ||
                pickingImage ||
                !createLevelChoiceLocked
              }
            />
          ) : null}
          <AppButton
            title={uploading ? 'Working…' : workspaceIntent === 'create' ? '3 · Run AI (optional)' : 'Run AI extraction'}
            onPress={handleRunExtraction}
            variant="outline"
            style={{ flex: 1, minWidth: 150 }}
            disabled={!selectedFloorId || uploading || !pendingFloorAsset || pickingImage}
          />
          <AppButton
            title={isVectorMode ? 'Map view · on' : 'Toggle Map View'}
            onPress={() => setIsVectorMode((v) => !v)}
            variant={isVectorMode ? 'secondary' : 'outline'}
            style={{ flex: 1, minWidth: 150 }}
          />
        </View>
        <AppText variant="caption" style={{ color: colors.subtle, marginTop: 10 }}>
          {pendingFloorAsset
            ? `Selected: ${pendingFloorAsset.fileName}`
            : workspaceIntent === 'create'
              ? 'No file yet — choose an image, add the level, then optionally run AI.'
              : 'No file selected — choose an image to preview. Old room shapes clear when you pick a new image until you extract or redraw.'}
        </AppText>
        <ClayView depth={2} color={colors.background} style={{ borderRadius: 12, padding: 12, marginTop: 12 }}>
          <AppText variant="caption" weight="bold" style={{ color: colors.text, marginBottom: 4 }}>
            Selected level flow
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle }}>
            {activeFloor
              ? `Level ${activeFloor.levelNumber} is selected. Choose an image to preview it, then run extraction to update that level.`
              : workspaceIntent === 'create'
                ? 'After you add the level (step 2), it becomes selected and you can run AI on the same image file, or skip AI and edit rooms by hand.'
                : 'Pick a floor above to attach the image and extraction to a level.'}
          </AppText>
        </ClayView>
      </ClayView>

      <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
          Extraction summary
        </AppText>
        {!activeFloor ? (
          <AppText variant="body" style={{ color: colors.subtle }}>
            Select a floor to see status.
          </AppText>
        ) : !activeFloor.floorplanId ? (
          <AppText variant="body" style={{ color: colors.subtle }}>
            No floorplan record yet. Run extraction above.
          </AppText>
        ) : floorplanLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color={colors.primary} />
            <AppText variant="body" style={{ color: colors.subtle }}>
              Loading floorplan data…
            </AppText>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <ClayView
                depth={2}
                color={colors.background}
                style={{ borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, flexGrow: 1, minWidth: 120 }}
              >
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  Valid polygons
                </AppText>
                <AppText variant="h2" weight="bold" style={{ marginTop: 4 }}>
                  {extractedPolygons.length}
                </AppText>
              </ClayView>
              <ClayView
                depth={2}
                color={colors.background}
                style={{ borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, flexGrow: 1, minWidth: 120 }}
              >
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  GeoJSON features
                </AppText>
                <AppText variant="h2" weight="bold" style={{ marginTop: 4 }}>
                  {rawFeatureCount}
                </AppText>
              </ClayView>
            </View>
            {extractedPolygons.length === 0 ? (
              <AppText variant="caption" style={{ color: colors.subtle }}>
                No polygon features to render yet.
              </AppText>
            ) : null}
            <TouchableOpacity
              onPress={() => setShowRawGeoJson((v) => !v)}
              style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              hitSlop={8}
            >
              <Icon name={showRawGeoJson ? 'expand-less' : 'expand-more'} size={16} color={colors.subtle} />
              <AppText variant="caption" style={{ color: colors.subtle }}>
                {showRawGeoJson ? 'Hide' : 'Show'} raw GeoJSON (advanced)
              </AppText>
            </TouchableOpacity>
            {showRawGeoJson && !!displayGeoJson ? (
              <ClayView depth={1} color={colors.background} style={{ borderRadius: 8, padding: 8, marginTop: 8, maxHeight: 140 }}>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                  <AppText variant="caption" style={styles.monoGeoJson}>
                    {displayGeoJson.length > 4000 ? `${displayGeoJson.slice(0, 4000)}…` : displayGeoJson}
                  </AppText>
                </ScrollView>
              </ClayView>
            ) : null}
          </>
        )}
      </ClayView>
    </>
  );
}
