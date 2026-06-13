import React, { useEffect } from 'react';
import { View } from 'react-native';
import { AdminCompactField, AdminTextField, AppButton, AppText, ClayView } from '@/src/components/ui';
import type { FloorplanWorkspaceModel } from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';
import { LocationFloorRoomsPanel } from '@/src/screens/admin/floorplan-workspace/components/LocationFloorRoomsPanel';
import { LocationPinField } from '@/src/screens/admin/floorplan-workspace/components/LocationPinField';
import { LOCATION_WORKSPACE_COPY } from '@/src/screens/admin/floorplan-workspace/utils/locationLabels';

type Props = {
  model: FloorplanWorkspaceModel;
};

export function LocationDetailPanel({ model }: Props) {
  const {
    colors,
    floors,
    selectedBuildingId,
    selectedFloorId,
    activeFloor,
    activeBuilding,
    newBuildingName,
    setNewBuildingName,
    newBuildingLatitude,
    setNewBuildingLatitude,
    newBuildingLongitude,
    setNewBuildingLongitude,
    creatingBuilding,
    handleCreateBuilding,
    editBuildingName,
    setEditBuildingName,
    editBuildingShortCode,
    setEditBuildingShortCode,
    editBuildingAddress,
    setEditBuildingAddress,
    editBuildingLatitude,
    setEditBuildingLatitude,
    editBuildingLongitude,
    setEditBuildingLongitude,
    savingBuilding,
    handleSaveBuilding,
    newFloorLevel,
    setNewFloorLevel,
    savingNewFloor,
    handleCreateFloorWithoutImage,
    enterMapEditor,
    showNewLocationForm,
    setShowNewLocationForm,
  } = model;

  useEffect(() => {
    if (!activeBuilding) return;
    setEditBuildingName(activeBuilding.name ?? '');
    setEditBuildingShortCode(activeBuilding.shortCode ?? '');
    setEditBuildingAddress(activeBuilding.address ?? '');
    setEditBuildingLatitude(
      activeBuilding.latitude != null && !Number.isNaN(activeBuilding.latitude)
        ? String(activeBuilding.latitude)
        : '',
    );
    setEditBuildingLongitude(
      activeBuilding.longitude != null && !Number.isNaN(activeBuilding.longitude)
        ? String(activeBuilding.longitude)
        : '',
    );
  }, [
    activeBuilding?.id,
    activeBuilding?.name,
    activeBuilding?.shortCode,
    activeBuilding?.address,
    activeBuilding?.latitude,
    activeBuilding?.longitude,
    setEditBuildingAddress,
    setEditBuildingLatitude,
    setEditBuildingLongitude,
    setEditBuildingName,
    setEditBuildingShortCode,
  ]);

  if (!selectedBuildingId && !showNewLocationForm) {
    return (
      <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 16 }}>
        <AppText variant="body" style={{ color: colors.subtle, lineHeight: 22, marginBottom: 16 }}>
          {LOCATION_WORKSPACE_COPY.noBuildingSelected}
        </AppText>
        <AppButton
          title={LOCATION_WORKSPACE_COPY.newLocationButton}
          onPress={() => setShowNewLocationForm(true)}
          style={{ alignSelf: 'flex-start' }}
        />
      </ClayView>
    );
  }

  if (!selectedBuildingId && showNewLocationForm) {
    return (
      <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 16 }}>
        <AppText variant="label" style={{ color: colors.subtle, marginBottom: 10 }}>
          {LOCATION_WORKSPACE_COPY.newLocationButton}
        </AppText>
        <AdminTextField
          label="Name"
          value={newBuildingName}
          onChangeText={setNewBuildingName}
          placeholder="Location name (e.g. Main Hall, HQ Tower)"
          containerStyle={{ marginBottom: 4 }}
        />
        <LocationPinField
          latitude={newBuildingLatitude}
          longitude={newBuildingLongitude}
          onCoordinateChange={(lat, lng) => {
            setNewBuildingLatitude(lat);
            setNewBuildingLongitude(lng);
          }}
          onClear={() => {
            setNewBuildingLatitude('');
            setNewBuildingLongitude('');
          }}
        />
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
          <AppButton
            title={creatingBuilding ? 'Creating…' : 'Create location'}
            onPress={() => void handleCreateBuilding()}
            disabled={creatingBuilding || !newBuildingName.trim()}
          />
          <AppButton title="Cancel" variant="outline" onPress={() => setShowNewLocationForm(false)} />
        </View>
      </ClayView>
    );
  }

  const hasFloorplan = !!(activeFloor?.floorplanImageUrl || activeFloor?.floorplanId);

  return (
    <View>
      <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <AppText variant="label" style={{ color: colors.subtle, marginBottom: 10 }}>
          {LOCATION_WORKSPACE_COPY.buildingSection}
        </AppText>
        <AdminTextField
          label="Name"
          value={editBuildingName}
          onChangeText={setEditBuildingName}
          placeholder="Location name"
        />
        <AdminTextField
          label="Short code"
          value={editBuildingShortCode}
          onChangeText={setEditBuildingShortCode}
          placeholder="Optional"
        />
        <AdminTextField
          label="Address"
          value={editBuildingAddress}
          onChangeText={setEditBuildingAddress}
          placeholder="Optional"
        />
        <LocationPinField
          latitude={editBuildingLatitude}
          longitude={editBuildingLongitude}
          onCoordinateChange={(lat, lng) => {
            setEditBuildingLatitude(lat);
            setEditBuildingLongitude(lng);
          }}
          onClear={() => {
            setEditBuildingLatitude('');
            setEditBuildingLongitude('');
          }}
        />
        <AppButton
          title={savingBuilding ? 'Saving…' : 'Save location'}
          onPress={() => void handleSaveBuilding()}
          disabled={savingBuilding || !editBuildingName.trim()}
          style={{ alignSelf: 'flex-start', minWidth: 140, marginTop: 4 }}
        />
      </ClayView>

      <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
          {LOCATION_WORKSPACE_COPY.floorsSection}
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12, lineHeight: 18 }}>
          {LOCATION_WORKSPACE_COPY.addLevelWithoutImageHint}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <AdminCompactField
            value={newFloorLevel}
            onChangeText={setNewFloorLevel}
            keyboardType="numeric"
            placeholder="Level #"
            style={{ minWidth: 100, flexGrow: 0 }}
          />
          <AppButton
            title={savingNewFloor ? 'Adding…' : LOCATION_WORKSPACE_COPY.addLevelButton}
            onPress={handleCreateFloorWithoutImage}
            disabled={savingNewFloor || !selectedBuildingId}
            style={{ minWidth: 120 }}
          />
        </View>
        {floors.length > 0 ? (
          <AppText variant="caption" style={{ color: colors.subtle }}>
            Levels:{' '}
            {[...floors]
              .sort((a, b) => a.levelNumber - b.levelNumber)
              .map((f) => f.levelNumber)
              .join(', ')}
          </AppText>
        ) : (
          <AppText variant="caption" style={{ color: colors.subtle }}>
            No levels yet — add one to start placing rooms.
          </AppText>
        )}
      </ClayView>

      {selectedFloorId && activeFloor ? (
        <>
          {hasFloorplan ? (
            <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
                Floorplan on level {activeFloor.levelNumber}
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12, lineHeight: 18 }}>
                This level has a map image. Open the floorplan editor to trace rooms and place pins.
              </AppText>
              <AppButton
                title={LOCATION_WORKSPACE_COPY.openMapEditor}
                onPress={() => enterMapEditor('edit')}
                style={{ alignSelf: 'flex-start' }}
              />
            </ClayView>
          ) : (
            <>
              <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 0 }}>
                <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
                  Optional floorplan
                </AppText>
                <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12, lineHeight: 18 }}>
                  Upload a plan image when you want map-based room placement. Until then, use the room list below.
                </AppText>
                <AppButton
                  title={LOCATION_WORKSPACE_COPY.uploadFloorplanLater}
                  variant="outline"
                  onPress={() => enterMapEditor('edit')}
                  style={{ alignSelf: 'flex-start' }}
                />
              </ClayView>
              <LocationFloorRoomsPanel
                model={model}
                buildingId={selectedBuildingId}
                floorId={selectedFloorId}
                levelNumber={activeFloor.levelNumber}
              />
            </>
          )}
        </>
      ) : (
        <ClayView depth={3} color={colors.background} style={{ borderRadius: 12, padding: 14 }}>
          <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 20 }}>
            {LOCATION_WORKSPACE_COPY.noFloorSelected}
          </AppText>
        </ClayView>
      )}
    </View>
  );
}
