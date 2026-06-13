import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { AdminTextField, AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import type { FloorplanWorkspaceModel } from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';

type Props = {
  model: FloorplanWorkspaceModel;
};

export function FloorplanSetupTab({ model }: Props) {
  const {
    colors,
    workspaceIntent,
    createLevelChoiceLocked,
    activeBuilding,
    activeFloor,
    newFloorLevel,
    setNewFloorLevel,
    setCreateLevelChoiceLocked,
    pickingImage,
    savingNewFloor,
    uploading,
    pendingFloorAsset,
    handleChooseFloorplanImage,
    handleCreateFloor,
    handleRunExtraction,
    confirmCreateBuildingAndLevel,
  } = model;

  const [showImageTips, setShowImageTips] = useState(false);
  const creatingNewLevel = workspaceIntent === 'create' && !activeFloor;
  const lockedContext = !!(activeBuilding && (activeFloor || creatingNewLevel));

  return (
    <>
      {lockedContext ? (
        <ClayView
          depth={3}
          color={colors.background}
          style={{ borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: colors.border }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Icon name="location-city" size={20} color={colors.primary} />
            <AppText weight="bold" style={{ flex: 1 }} numberOfLines={1}>
              {activeBuilding?.name}
            </AppText>
          </View>
          <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 20 }}>
            {activeFloor
              ? `Editing level ${activeFloor.levelNumber}. Upload or replace the floorplan image for this level only.`
              : `Adding a new level to this location. Confirm the level number, then choose an image.`}
          </AppText>
        </ClayView>
      ) : null}

      {creatingNewLevel ? (
        <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
            New level number
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <AdminTextField
              value={newFloorLevel}
              onChangeText={(t) => {
                if (!createLevelChoiceLocked) setNewFloorLevel(t);
              }}
              editable={!createLevelChoiceLocked}
              keyboardType="numeric"
              placeholder="1"
              containerStyle={{ marginBottom: 0, minWidth: 100, flexGrow: 0 }}
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
                title="Confirm level"
                variant="secondary"
                onPress={confirmCreateBuildingAndLevel}
                style={{ minWidth: 120 }}
              />
            )}
          </View>
          {createLevelChoiceLocked ? (
            <AppText variant="caption" style={{ color: colors.primary, marginTop: 8 }}>
              Level {newFloorLevel} locked — pick an image next.
            </AppText>
          ) : null}
        </ClayView>
      ) : null}

      <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <AppText variant="label" style={{ color: colors.subtle, marginBottom: 6 }}>
          Floorplan image
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12, lineHeight: 18 }}>
          Choose a clear CAD export (PNG). AI room detection is optional — you can also draw rooms manually in the
          Rooms tab.
        </AppText>

        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <AppButton
            title={pickingImage ? 'Opening…' : 'Choose image'}
            onPress={handleChooseFloorplanImage}
            variant="secondary"
            style={{ flex: 1, minWidth: 140 }}
            disabled={pickingImage || (creatingNewLevel && !createLevelChoiceLocked)}
          />
          {creatingNewLevel ? (
            <AppButton
              title={savingNewFloor ? 'Creating…' : 'Add level with image'}
              onPress={handleCreateFloor}
              style={{ flex: 1, minWidth: 140 }}
              disabled={
                !pendingFloorAsset ||
                savingNewFloor ||
                pickingImage ||
                !createLevelChoiceLocked
              }
            />
          ) : null}
          <AppButton
            title={uploading ? 'Working…' : 'Run AI (optional)'}
            onPress={handleRunExtraction}
            variant="outline"
            style={{ flex: 1, minWidth: 140 }}
            disabled={!activeFloor?.id || uploading || !pendingFloorAsset || pickingImage}
          />
        </View>

        <TouchableOpacity
          onPress={() => setShowImageTips((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: showImageTips ? 6 : 2 }}
          hitSlop={8}
        >
          <Icon name={showImageTips ? 'expand-less' : 'expand-more'} size={18} color={colors.subtle} />
          <AppText variant="caption" style={{ color: colors.subtle }}>
            {showImageTips ? 'Hide' : 'Show'} image tips
          </AppText>
        </TouchableOpacity>
        {showImageTips ? (
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10, paddingLeft: 4, lineHeight: 18 }}>
            High-resolution PNG, black walls on white, minimal skew. AI runs on the API when configured.
          </AppText>
        ) : null}

        <AppText variant="caption" weight="bold" style={{ color: colors.text }}>
          {pendingFloorAsset
            ? `Selected: ${pendingFloorAsset.fileName}`
            : activeFloor
              ? 'No new image selected.'
              : 'Pick a level number first, then choose an image.'}
        </AppText>
      </ClayView>
    </>
  );
}
