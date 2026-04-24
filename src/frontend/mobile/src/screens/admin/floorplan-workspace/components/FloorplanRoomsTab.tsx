import React, { useMemo } from 'react';
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { AppButton, AppText, ClayView } from '@/src/components/ui';
import type { FloorplanWorkspaceModel } from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';
import type { EditableFloorFeature } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import {
  addPlaceholderRoom,
  insertVertexOnLongestEdge,
  removeRoomAt,
  simplifyRoomRing,
  updateFeatureName,
} from '@/src/screens/admin/utils/floorplanGeoJsonEdit';

type IndexedFloorFeature = { feat: EditableFloorFeature; roomIndex: number };

function groupFloorplanRegions(rooms: EditableFloorFeature[]): {
  rooms: IndexedFloorFeature[];
  doors: IndexedFloorFeature[];
  windows: IndexedFloorFeature[];
} {
  const roomsOut: IndexedFloorFeature[] = [];
  const doorsOut: IndexedFloorFeature[] = [];
  const windowsOut: IndexedFloorFeature[] = [];

  rooms.forEach((feat, roomIndex) => {
    const n = (feat.roomName || '').toLowerCase();
    if (n.includes('wall')) return;
    const item: IndexedFloorFeature = { feat, roomIndex };
    if (n.includes('door')) doorsOut.push(item);
    else if (n.includes('window')) windowsOut.push(item);
    else roomsOut.push(item);
  });

  return { rooms: roomsOut, doors: doorsOut, windows: windowsOut };
}

type Props = {
  model: FloorplanWorkspaceModel;
};

export function FloorplanRoomsTab({ model }: Props) {
  const {
    colors,
    activeFloor,
    geoDoc,
    floorplanLoading,
    isWideLayout,
    editMode,
    setEditMode,
    selectedRoomIndex,
    setSelectedRoomIndex,
    setGeoDoc,
    setPlacePoiKind,
    setSelectedPoiIndex,
    setActiveTab,
    hasUnsavedChanges,
    savingGeo,
    handleDiscard,
  } = model;

  const { rooms: roomsSection, doors: doorsSection, windows: windowsSection } = useMemo(
    () => (geoDoc ? groupFloorplanRegions(geoDoc.rooms) : { rooms: [], doors: [], windows: [] }),
    [geoDoc],
  );

  const hasListableRegions =
    roomsSection.length + doorsSection.length + windowsSection.length > 0;

  if (!activeFloor?.floorplanId || !geoDoc || floorplanLoading) {
    return (
      <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <AppText variant="body" style={{ color: colors.subtle }}>
          {!activeFloor?.floorplanId ? 'Select a floor with a floorplan record to edit rooms.' : 'Loading floorplan…'}
        </AppText>
      </ClayView>
    );
  }

  return (
    <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
      <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
        Rooms & polygons
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
        {isWideLayout
          ? 'List and tools on the left; map stays on the right. Use Save in the header when you are done.'
          : 'Map is pinned above. Edit names and corners here, then save from the header.'}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <AppButton
          title={editMode ? 'Done adjusting' : 'Adjust polygons'}
          variant={editMode ? 'outline' : 'secondary'}
          onPress={() => {
            setEditMode((v) => !v);
            if (editMode) setSelectedRoomIndex(null);
          }}
          style={{ flexGrow: 1, minWidth: 140 }}
        />
        <AppButton
          title="Add room"
          variant="outline"
          onPress={() => {
            setGeoDoc((prev) => {
              const next = addPlaceholderRoom(prev ?? { rooms: [], pois: [] });
              setSelectedRoomIndex(next.rooms.length - 1);
              return next;
            });
            setEditMode(true);
          }}
          style={{ flexGrow: 1, minWidth: 120 }}
        />
      </View>

      <View
        style={{
          flexDirection: isWideLayout ? 'row' : 'column',
          gap: 14,
          alignItems: 'stretch',
        }}
      >
        <View style={{ flex: isWideLayout ? 0.42 : 1, minWidth: isWideLayout ? 160 : undefined }}>
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
            Regions
          </AppText>
          <ScrollView nestedScrollEnabled style={{ maxHeight: isWideLayout ? 380 : 220 }} showsVerticalScrollIndicator>
            {geoDoc.rooms.length === 0 ? (
              <AppText variant="caption" style={{ color: colors.subtle }}>
                No rooms yet. Run extraction (Setup) or tap “Add room”.
              </AppText>
            ) : !hasListableRegions ? (
              <AppText variant="caption" style={{ color: colors.subtle }}>
                Only wall regions are present (walls are hidden here). Add or rename polygons in Setup / extraction.
              </AppText>
            ) : (
              <>
                {roomsSection.length > 0 ? (
                  <>
                    <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
                      Rooms
                    </AppText>
                    {roomsSection.map(({ feat, roomIndex }) => (
                      <TouchableOpacity
                        key={feat.key}
                        onPress={() => {
                          setSelectedRoomIndex(roomIndex);
                          setPlacePoiKind(null);
                          setSelectedPoiIndex(null);
                          setActiveTab('rooms');
                          if (!editMode) setEditMode(true);
                        }}
                        activeOpacity={0.85}
                        style={{ marginBottom: 8 }}
                      >
                        <ClayView
                          depth={selectedRoomIndex === roomIndex ? 2 : 5}
                          color={selectedRoomIndex === roomIndex ? colors.primary : colors.background}
                          style={{ borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 }}
                        >
                          <AppText
                            numberOfLines={2}
                            style={{ color: selectedRoomIndex === roomIndex ? '#fff' : colors.text }}
                            weight="bold"
                          >
                            {feat.roomName?.trim() || `Room ${roomIndex + 1}`}
                          </AppText>
                        </ClayView>
                      </TouchableOpacity>
                    ))}
                  </>
                ) : null}

                {doorsSection.length > 0 ? (
                  <>
                    <AppText
                      variant="caption"
                      style={{ color: colors.subtle, marginBottom: 8, marginTop: roomsSection.length > 0 ? 14 : 0 }}
                    >
                      Doors
                    </AppText>
                    {doorsSection.map(({ feat, roomIndex }) => (
                      <TouchableOpacity
                        key={feat.key}
                        onPress={() => {
                          setSelectedRoomIndex(roomIndex);
                          setPlacePoiKind(null);
                          setSelectedPoiIndex(null);
                          setActiveTab('rooms');
                          if (!editMode) setEditMode(true);
                        }}
                        activeOpacity={0.85}
                        style={{ marginBottom: 8 }}
                      >
                        <ClayView
                          depth={selectedRoomIndex === roomIndex ? 2 : 5}
                          color={selectedRoomIndex === roomIndex ? colors.primary : colors.background}
                          style={{ borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 }}
                        >
                          <AppText
                            numberOfLines={2}
                            style={{ color: selectedRoomIndex === roomIndex ? '#fff' : colors.text }}
                            weight="bold"
                          >
                            {feat.roomName?.trim() || `Door ${roomIndex + 1}`}
                          </AppText>
                        </ClayView>
                      </TouchableOpacity>
                    ))}
                  </>
                ) : null}

                {windowsSection.length > 0 ? (
                  <>
                    <AppText
                      variant="caption"
                      style={{ color: colors.subtle, marginBottom: 8, marginTop: roomsSection.length + doorsSection.length > 0 ? 14 : 0 }}
                    >
                      Windows
                    </AppText>
                    {windowsSection.map(({ feat, roomIndex }) => (
                      <TouchableOpacity
                        key={feat.key}
                        onPress={() => {
                          setSelectedRoomIndex(roomIndex);
                          setPlacePoiKind(null);
                          setSelectedPoiIndex(null);
                          setActiveTab('rooms');
                          if (!editMode) setEditMode(true);
                        }}
                        activeOpacity={0.85}
                        style={{ marginBottom: 8 }}
                      >
                        <ClayView
                          depth={selectedRoomIndex === roomIndex ? 2 : 5}
                          color={selectedRoomIndex === roomIndex ? colors.primary : colors.background}
                          style={{ borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 }}
                        >
                          <AppText
                            numberOfLines={2}
                            style={{ color: selectedRoomIndex === roomIndex ? '#fff' : colors.text }}
                            weight="bold"
                          >
                            {feat.roomName?.trim() || `Window ${roomIndex + 1}`}
                          </AppText>
                        </ClayView>
                      </TouchableOpacity>
                    ))}
                  </>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          {selectedRoomIndex != null && geoDoc.rooms[selectedRoomIndex] ? (
            <>
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
                Room details
              </AppText>
              <TextInput
                value={geoDoc.rooms[selectedRoomIndex].roomName}
                onChangeText={(t) =>
                  setGeoDoc((prev) =>
                    prev && selectedRoomIndex != null ? updateFeatureName(prev, selectedRoomIndex, t) : prev,
                  )
                }
                placeholder="Room name"
                placeholderTextColor={colors.subtle}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  color: colors.text,
                  backgroundColor: colors.card,
                }}
              />
              <View style={{ marginTop: 12, gap: 8 }}>
                <AppButton
                  title="Simplify corners"
                  variant="outline"
                  onPress={() =>
                    setGeoDoc((d) =>
                      d && selectedRoomIndex != null ? simplifyRoomRing(d, selectedRoomIndex) : d,
                    )
                  }
                />
                <AppButton
                  title="Add corner"
                  variant="outline"
                  onPress={() =>
                    setGeoDoc((d) =>
                      d && selectedRoomIndex != null ? insertVertexOnLongestEdge(d, selectedRoomIndex) : d,
                    )
                  }
                />
                <AppButton title="Deselect room" variant="outline" onPress={() => setSelectedRoomIndex(null)} />
                <AppButton
                  title="Remove region"
                  variant="outline"
                  onPress={() => {
                    const rm = selectedRoomIndex;
                    setGeoDoc((prev) => (prev && rm != null ? removeRoomAt(prev, rm) : prev));
                    setSelectedRoomIndex(null);
                  }}
                />
              </View>
            </>
          ) : (
            <AppText variant="caption" style={{ color: colors.subtle, paddingVertical: 12 }}>
              Select a room from the list or tap a polygon on the map.
            </AppText>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <AppButton
          title="Discard"
          variant="outline"
          onPress={handleDiscard}
          disabled={!hasUnsavedChanges || savingGeo}
          style={{ flex: 1 }}
        />
      </View>
    </ClayView>
  );
}
