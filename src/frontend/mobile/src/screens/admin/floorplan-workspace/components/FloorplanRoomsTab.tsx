import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppButton, AppText, ClayView, Icon, SegmentedControl, type IconName } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { roomsApi, unwrap } from '@/src/api';
import { CreateRoomRequest, type RoomDto } from '@/src/api/generatedClient';
import type { FloorplanWorkspaceModel } from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';
import type { EditableFloorFeature } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import {
  clearDoorLines,
  insertVertexOnLongestEdge,
  makeRoomRectangular,
  removeRoomAt,
  smoothOutlineChaikin,
  updateFeatureName,
  updateRoomIsBookable,
  updateRoomMapIconKey,
} from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import { FloorplanRoomMapGlyph } from '@/src/screens/widgets/map/components/FloorplanRoomMapGlyph';
import { FLOORPLAN_ROOM_MAP_ICON_PRESETS } from '@/src/screens/widgets/map/utils/floorplanRoomMapIcons';
import { isBuildingShellFeature } from '@/src/screens/widgets/map/utils/floorplanSemanticStyles';
import {
  ROOM_AMENITY_CATEGORY_GROUPS,
  ROOM_AMENITY_ICONS,
  ROOM_AMENITY_LABELS,
} from '@/src/screens/widgets/rooms/utils/roomAmenityTags';

type IndexedFloorFeature = { feat: EditableFloorFeature; roomIndex: number };

function amenitySetsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].map((x) => x.trim()).filter(Boolean).sort();
  const sb = [...b].map((x) => x.trim()).filter(Boolean).sort();
  return sa.every((v, i) => v === sb[i]);
}

const ROOM_TAB_SEGMENTS = ['Customize', 'Shape', 'Details'] as const;
type RoomTabSegment = (typeof ROOM_TAB_SEGMENTS)[number];

function categorizeFloorFeatures(rooms: EditableFloorFeature[]): {
  shell: IndexedFloorFeature[];
  rooms: IndexedFloorFeature[];
  /** Optional legacy polygons from extraction — hide in vector maps; admins can delete. */
  legacyOpenings: IndexedFloorFeature[];
} {
  const shellOut: IndexedFloorFeature[] = [];
  const roomsOut: IndexedFloorFeature[] = [];
  const legacyOut: IndexedFloorFeature[] = [];

  rooms.forEach((feat, roomIndex) => {
    const n = (feat.roomName || '').toLowerCase();
    if (n.includes('wall')) return;
    const item: IndexedFloorFeature = { feat, roomIndex };
    if (isBuildingShellFeature(feat.roomName || '')) {
      shellOut.push(item);
    } else if (n.includes('door') || n.includes('window')) {
      legacyOut.push(item);
    } else {
      roomsOut.push(item);
    }
  });

  return { shell: shellOut, rooms: roomsOut, legacyOpenings: legacyOut };
}

function regionKind(
  roomIndex: number,
  shell: IndexedFloorFeature[],
  rooms: IndexedFloorFeature[],
  legacy: IndexedFloorFeature[],
): 'shell' | 'room' | 'legacy' {
  if (shell.some((s) => s.roomIndex === roomIndex)) return 'shell';
  if (legacy.some((s) => s.roomIndex === roomIndex)) return 'legacy';
  return 'room';
}

type Props = {
  model: FloorplanWorkspaceModel;
};

export function FloorplanRoomsTab({ model }: Props) {
  const queryClient = useQueryClient();
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
    commitGeoDoc,
    undoGeo,
    redoGeo,
    canUndoGeo,
    canRedoGeo,
    setPlacePoiKind,
    setSelectedPoiIndex,
    setActiveTab,
    hasUnsavedChanges,
    savingGeo,
    handleDiscard,
    shellTraceDraft,
    doorPlacement,
    startShellOutlineTrace,
    cancelShellOutlineTrace,
    undoShellOutlinePoint,
    finishShellOutlineTrace,
    roomTraceDraft,
    startRoomOutlineTrace,
    cancelRoomOutlineTrace,
    undoRoomOutlinePoint,
    finishRoomOutlineTrace,
    beginDoorPlacementForRoom,
    cancelDoorPlacement,
  } = model;

  const [segmentIndex, setSegmentIndex] = useState(0);

  const { shell: shellSection, rooms: roomsSection, legacyOpenings } = useMemo(
    () => (geoDoc ? categorizeFloorFeatures(geoDoc.rooms) : { shell: [], rooms: [], legacyOpenings: [] }),
    [geoDoc],
  );

  const segment: RoomTabSegment = ROOM_TAB_SEGMENTS[segmentIndex] ?? 'Customize';

  useEffect(() => {
    setSegmentIndex(0);
  }, [selectedRoomIndex, activeFloor?.floorplanId]);

  const selectedFeat =
    selectedRoomIndex != null && geoDoc?.rooms[selectedRoomIndex] ? geoDoc.rooms[selectedRoomIndex] : null;
  const selectedKind =
    selectedRoomIndex != null && geoDoc ? regionKind(selectedRoomIndex, shellSection, roomsSection, legacyOpenings) : null;

  const linkedRoomQuery = useQuery({
    queryKey: ['admin-floorplan-linked-room', activeFloor?.id, selectedFeat?.roomId],
    enabled:
      segment === 'Details' && selectedKind === 'room' && !!activeFloor?.id && !!selectedFeat?.roomId?.trim(),
    queryFn: async () => {
      const res = await unwrap(
        roomsApi.search(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          activeFloor!.id!,
          (selectedFeat!.roomId || '').trim(),
          undefined,
          undefined,
          1,
          50,
        ),
      );
      const items = res.items ?? [];
      return items[0] ?? null;
    },
  });

  const linkedRoom = linkedRoomQuery.data ?? null;

  const [capDraft, setCapDraft] = useState('');
  const [locDraft, setLocDraft] = useState('');
  const [resourcesDraft, setResourcesDraft] = useState('');
  const [amenityDraftKeys, setAmenityDraftKeys] = useState<string[]>([]);
  const [otherAmenityLine, setOtherAmenityLine] = useState('');

  const setCapacityDigitsOnly = useCallback((raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    setCapDraft(digits);
  }, []);

  const toggleAmenity = useCallback((key: string) => {
    setAmenityDraftKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  const appendOtherAmenityToResources = useCallback(() => {
    const t = otherAmenityLine.trim();
    if (!t) return;
    setResourcesDraft((prev) => {
      const p = prev.trim();
      return p ? `${p} · ${t}` : t;
    });
    setOtherAmenityLine('');
  }, [otherAmenityLine]);

  useEffect(() => {
    if (!linkedRoom) {
      setCapDraft('');
      setLocDraft('');
      setResourcesDraft('');
      setAmenityDraftKeys([]);
      setOtherAmenityLine('');
      return;
    }
    setCapDraft(String(linkedRoom.capacity ?? ''));
    setLocDraft(linkedRoom.location ?? '');
    setResourcesDraft(linkedRoom.resources ?? '');
    setAmenityDraftKeys([...(linkedRoom.amenities ?? [])]);
  }, [linkedRoom, linkedRoomQuery.dataUpdatedAt]);

  const detailsDirty = useMemo(() => {
    if (!linkedRoom) return false;
    const capDigits = capDraft.replace(/\D/g, '');
    const capacityTextDirty = capDigits !== String(linkedRoom.capacity);
    return (
      capacityTextDirty ||
      (locDraft.trim() || '') !== (linkedRoom.location ?? '').trim() ||
      (resourcesDraft.trim() || '') !== (linkedRoom.resources ?? '').trim() ||
      !amenitySetsEqual(amenityDraftKeys, linkedRoom.amenities ?? [])
    );
  }, [linkedRoom, capDraft, locDraft, resourcesDraft, amenityDraftKeys]);

  const saveDetailsMutation = useMutation({
    mutationFn: async (room: RoomDto) => {
      const capDigits = capDraft.replace(/\D/g, '');
      const capParsed = capDigits === '' ? NaN : Number.parseInt(capDigits, 10);
      const capacity =
        capDigits === ''
          ? room.capacity
          : Number.isFinite(capParsed) && capParsed >= 1
            ? capParsed
            : Math.max(1, room.capacity);
      const req = new CreateRoomRequest();
      req.name = room.name;
      req.location = locDraft.trim() || undefined;
      req.capacity = capacity;
      req.isBookable = room.isBookable;
      req.allowedEventTypeIds = (room.allowedEventTypes ?? []).map((e) => e.id!);
      req.buildingId = room.buildingId;
      req.floorId = room.floorId;
      req.coordinateX = room.coordinateX;
      req.coordinateY = room.coordinateY;
      /** Preserve server JSON/structured data — not edited in this screen. */
      req.customAttributes = room.customAttributes?.trim() ? room.customAttributes : undefined;
      req.requiredRoleId = room.requiredRoleId;
      req.mapIconKey = room.mapIconKey;
      req.resources = resourcesDraft.trim() || undefined;
      req.amenityKeys = [...amenityDraftKeys];
      await unwrap(roomsApi.update(room.id, req));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-floorplan-linked-room'] });
      await queryClient.invalidateQueries({ queryKey: ['map-floors'] });
      await queryClient.invalidateQueries({ queryKey: ['rooms-search'] });
      await queryClient.invalidateQueries({ queryKey: ['rooms-widget-available'] });
      Alert.alert('Saved', 'Room details were updated.');
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Save failed.';
      Alert.alert('Could not save room details', msg);
    },
  });

  const hasListableRegions =
    shellSection.length + roomsSection.length + legacyOpenings.length > 0;

  if (!activeFloor?.floorplanId || !geoDoc || floorplanLoading) {
    return (
      <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <AppText variant="body" style={{ color: colors.subtle }}>
          {!activeFloor?.floorplanId ? 'Select a floor with a floorplan record to edit rooms.' : 'Loading floorplan…'}
        </AppText>
      </ClayView>
    );
  }

  const renderRegionList = () => (
    <View style={{ flex: isWideLayout ? 0.42 : 1, minWidth: isWideLayout ? 160 : undefined }}>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
        Regions
      </AppText>
      <ScrollView nestedScrollEnabled style={{ maxHeight: isWideLayout ? 380 : 220 }} showsVerticalScrollIndicator>
        {geoDoc.rooms.length === 0 ? (
          <AppText variant="caption" style={{ color: colors.subtle }}>
            No polygons yet — use “Trace shell” or “Trace new room” in Shape, or run extraction (Setup).
          </AppText>
        ) : !hasListableRegions ? (
          <AppText variant="caption" style={{ color: colors.subtle }}>
            Only wall regions are present (walls are hidden here). Add or rename polygons in Setup / extraction.
          </AppText>
        ) : (
          <>
            {shellSection.length > 0 ? (
              <>
                <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
                  Building shell
                </AppText>
                {shellSection.map(({ feat, roomIndex }) => (
                  <TouchableOpacity
                    key={feat.key}
                    onPress={() => {
                      setSelectedRoomIndex(roomIndex);
                      setPlacePoiKind(null);
                      setSelectedPoiIndex(null);
                      setActiveTab('rooms');
                      if (!editMode && segment === 'Shape') setEditMode(true);
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
                        {feat.roomName?.trim() || 'Building shell'}
                      </AppText>
                    </ClayView>
                  </TouchableOpacity>
                ))}
              </>
            ) : null}

            {roomsSection.length > 0 ? (
              <>
                <AppText
                  variant="caption"
                  style={{ color: colors.subtle, marginBottom: 8, marginTop: shellSection.length > 0 ? 14 : 0 }}
                >
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
                      if (!editMode && segment === 'Shape') setEditMode(true);
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

            {legacyOpenings.length > 0 ? (
              <>
                <AppText
                  variant="caption"
                  style={{
                    color: colors.subtle,
                    marginBottom: 8,
                    marginTop: shellSection.length + roomsSection.length > 0 ? 14 : 0,
                  }}
                >
                  Legacy door / window polygons (optional)
                </AppText>
                <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
                  Hidden on the blueprint map. Remove when you switch to doorway lines on rooms instead.
                </AppText>
                {legacyOpenings.map(({ feat, roomIndex }) => (
                  <TouchableOpacity
                    key={feat.key}
                    onPress={() => {
                      setSelectedRoomIndex(roomIndex);
                      setPlacePoiKind(null);
                      setSelectedPoiIndex(null);
                      setActiveTab('rooms');
                      if (!editMode && segment === 'Shape') setEditMode(true);
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
                        {feat.roomName?.trim() || 'Opening'}
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
  );

  const renderCustomizePanel = () => {
    if (selectedRoomIndex == null || !selectedFeat) {
      return (
        <AppText variant="caption" style={{ color: colors.subtle, paddingVertical: 12 }}>
          Select a region, then set how it appears on the map and in the booking list (after publish).
        </AppText>
      );
    }

    const shell = isBuildingShellFeature(selectedFeat.roomName);

    return (
      <>
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
          {shell ? 'Building shell — label only' : 'Listing & map identity'}
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
          {shell
            ? 'The shell wraps the floor slab. Room names and booking flags apply to room polygons, not the shell outline.'
            : 'Name, bookable flag, and map icon live in floorplan GeoJSON. Publishing copies them into the Room row for this floor (matched by the stable feature id below).'}
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
          Stable feature id (for publish / API match)
        </AppText>
        <AppText variant="caption" style={{ color: colors.text, marginBottom: 12 }} selectable>
          {selectedFeat.roomId || '—'}
        </AppText>
        <TextInput
          value={selectedFeat.roomName}
          onChangeText={(t) =>
            setGeoDoc((prev) =>
              prev && selectedRoomIndex != null ? updateFeatureName(prev, selectedRoomIndex, t) : prev,
            )
          }
          placeholder={shell ? 'Building shell' : 'Room name'}
          placeholderTextColor={colors.subtle}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 8,
            color: colors.text,
            backgroundColor: colors.card,
            marginBottom: 12,
          }}
        />
        {!shell ? (
          <>
            <View
              style={{
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <AppText variant="body" style={{ color: colors.text, flex: 1 }}>
                Bookable space
              </AppText>
              <Switch
                value={selectedFeat.isBookable}
                onValueChange={(v) => {
                  if (selectedRoomIndex == null) return;
                  commitGeoDoc((d) => updateRoomIsBookable(d, selectedRoomIndex, v));
                }}
                trackColor={{ false: '#FFFFFF', true: colors.primary }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
                ios_backgroundColor="#E8E8EA"
              />
            </View>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
              Kitchens, restrooms, and corridors default off in extraction. Toggle on when the space should appear in
              booking search after publish.
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
              Map icon (optional)
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                {FLOORPLAN_ROOM_MAP_ICON_PRESETS.map((opt) => {
                  const sel = (selectedFeat.mapIconKey ?? '') === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key || 'none'}
                      onPress={() =>
                        selectedRoomIndex != null &&
                        commitGeoDoc((d) => updateRoomMapIconKey(d, selectedRoomIndex, opt.key || undefined))
                      }
                      activeOpacity={0.85}
                    >
                      <ClayView
                        depth={sel ? 2 : 5}
                        color={sel ? colors.primary : colors.background}
                        style={{
                          borderRadius: 12,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          minWidth: 52,
                          alignItems: 'center',
                        }}
                      >
                        {opt.key ? (
                          <FloorplanRoomMapGlyph iconKey={opt.key} size={22} color={sel ? '#fff' : colors.primary} />
                        ) : (
                          <AppText style={{ color: sel ? '#fff' : colors.text }} variant="caption">
                            None
                          </AppText>
                        )}
                        {opt.key ? (
                          <AppText
                            numberOfLines={1}
                            variant="caption"
                            style={{ color: sel ? '#fff' : colors.subtle, marginTop: 4, maxWidth: 72 }}
                          >
                            {opt.label}
                          </AppText>
                        ) : null}
                      </ClayView>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </>
        ) : null}
        <AppButton title="Deselect region" variant="outline" onPress={() => setSelectedRoomIndex(null)} />
      </>
    );
  };

  const renderShapePanel = () => (
    <>
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
          title="Trace shell (tap map)"
          variant="outline"
          onPress={() => {
            cancelDoorPlacement();
            startShellOutlineTrace();
          }}
          style={{ flexGrow: 1, minWidth: 130 }}
          disabled={shellTraceDraft != null || roomTraceDraft != null}
        />
        <AppButton
          title="Trace new room (tap map)"
          variant="outline"
          onPress={() => {
            cancelDoorPlacement();
            cancelShellOutlineTrace();
            startRoomOutlineTrace();
          }}
          style={{ flexGrow: 1, minWidth: 130 }}
          disabled={shellTraceDraft != null || roomTraceDraft != null}
        />
      </View>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
        Shell / room: tap or drag on the map, then Finish. Drag diamond = move whole region; edge tabs slide a wall.
        Undo / Redo at the bottom applies to all GeoJSON edits across Customize and Shape.
      </AppText>

      {selectedRoomIndex != null && geoDoc.rooms[selectedRoomIndex] ? (
        <>
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
            {isBuildingShellFeature(geoDoc.rooms[selectedRoomIndex].roomName) ? 'Building shell' : 'Selected polygon'}
          </AppText>
          <View style={{ gap: 8 }}>
            <AppButton
              title="Make rectangular"
              variant="outline"
              onPress={() =>
                selectedRoomIndex != null && commitGeoDoc((d) => makeRoomRectangular(d, selectedRoomIndex))
              }
            />
            <AppButton
              title="Smooth rounded outline"
              variant="outline"
              onPress={() =>
                selectedRoomIndex != null && commitGeoDoc((d) => smoothOutlineChaikin(d, selectedRoomIndex, 1))
              }
            />
            <AppButton
              title="Add corner"
              variant="outline"
              onPress={() =>
                selectedRoomIndex != null && commitGeoDoc((d) => insertVertexOnLongestEdge(d, selectedRoomIndex))
              }
            />
            {!isBuildingShellFeature(geoDoc.rooms[selectedRoomIndex].roomName) ? (
              <>
                {doorPlacement != null && doorPlacement.roomIndex === selectedRoomIndex ? (
                  <>
                    <AppText variant="caption" style={{ color: colors.primary, marginTop: 4 }}>
                      {doorPlacement.first == null
                        ? 'First tap: one side of the doorway on the wall. Second tap: the other side — both snap to this room.'
                        : 'Second tap completes the doorway line.'}
                    </AppText>
                    <AppButton title="Cancel doorway placement" variant="outline" onPress={cancelDoorPlacement} />
                  </>
                ) : (
                  <>
                    <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                      Doorway: tap twice on the map along the walls of this room — each tap snaps to the edges of this
                      polygon.
                    </AppText>
                    <AppButton
                      title="Place doorway (tap map ×2)"
                      variant="outline"
                      onPress={() => {
                        if (selectedRoomIndex == null) return;
                        beginDoorPlacementForRoom(selectedRoomIndex);
                      }}
                    />
                  </>
                )}
                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6 }}>
                  Door segments on this room: {(geoDoc.rooms[selectedRoomIndex].doorLines ?? []).length}
                </AppText>
                <AppButton
                  title="Clear doorway marks"
                  variant="outline"
                  onPress={() =>
                    selectedRoomIndex != null && commitGeoDoc((d) => clearDoorLines(d, selectedRoomIndex))
                  }
                  disabled={(geoDoc.rooms[selectedRoomIndex].doorLines ?? []).length === 0}
                />
              </>
            ) : (
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                Drag corners to wrap the slab; rooms sit inside this outline.
              </AppText>
            )}
            <AppButton title="Deselect region" variant="outline" onPress={() => setSelectedRoomIndex(null)} />
            <AppButton
              title="Remove region"
              variant="outline"
              onPress={() => {
                const rm = selectedRoomIndex;
                if (rm != null) commitGeoDoc((prev) => removeRoomAt(prev, rm));
                setSelectedRoomIndex(null);
              }}
            />
          </View>
        </>
      ) : (
        <AppText variant="caption" style={{ color: colors.subtle, paddingVertical: 12 }}>
          Select a region from the list or tap a polygon on the map, then use the tools above.
        </AppText>
      )}
    </>
  );

  const renderDetailsPanel = () => {
    if (selectedRoomIndex == null || !selectedFeat) {
      return (
        <AppText variant="caption" style={{ color: colors.subtle, paddingVertical: 12 }}>
          Select a room polygon to see booking metadata. Capacity, location, and structured attributes are stored on the
          Room record after you publish.
        </AppText>
      );
    }

    if (selectedKind === 'shell') {
      return (
        <AppText variant="caption" style={{ color: colors.subtle, paddingVertical: 12 }}>
          The building shell has no Room row. Use Details on a room polygon after publishing to edit capacity,
          location, and equipment notes on the booking record.
        </AppText>
      );
    }

    if (selectedKind === 'legacy') {
      return (
        <AppText variant="caption" style={{ color: colors.subtle, paddingVertical: 12 }}>
          Legacy door/window polygons are not published as bookable rooms. Trace proper room outlines in Shape, then use
          Customize and Save & publish in the header.
        </AppText>
      );
    }

    return (
      <>
        <View style={{ marginBottom: 10 }}>
          <AppText variant="caption" weight="bold" style={{ color: colors.text, marginBottom: 4 }}>
            Source of truth
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle }}>
            Display name, bookable flag, and map icon are edited in Customize (GeoJSON) and pushed to the Room row when
            you use Save & publish in the header. This panel loads the published Room matched by the same stable id as
            in Customize and lets you adjust booking metadata without renaming the polygon here.
          </AppText>
        </View>

        {linkedRoomQuery.isLoading ? (
          <AppText variant="caption" style={{ color: colors.subtle }}>
            Loading room record…
          </AppText>
        ) : linkedRoomQuery.isError ? (
          <ClayView depth={3} color={colors.background} style={{ borderRadius: 10, padding: 12, marginTop: 8 }}>
            <AppText variant="caption" style={{ color: colors.primary, marginBottom: 6 }}>
              Could not load this room from the API.
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle }}>
              {linkedRoomQuery.error instanceof Error
                ? linkedRoomQuery.error.message
                : 'If this persists after an app update, confirm Rooms search parameters match the generated API client.'}
            </AppText>
          </ClayView>
        ) : !linkedRoom ? (
          <ClayView depth={3} color={colors.background} style={{ borderRadius: 10, padding: 12, marginTop: 8 }}>
            <AppText variant="body" weight="bold" style={{ color: colors.text, marginBottom: 6 }}>
              No Room row yet
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
              Use Save & publish in the header so bookable rooms sync from this floorplan, then return here. Omada
              matches this polygon to a Room using the stable feature id and this floor.
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle }} selectable>
              Feature id: {selectedFeat.roomId}
            </AppText>
          </ClayView>
        ) : (
          <>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
              Linked booking record
            </AppText>
            <AppText variant="body" weight="bold" style={{ color: colors.text, marginBottom: 4 }}>
              {linkedRoom.name}
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 14 }}>
              Name changes with the polygon in Customize, then Save & publish in the header — not here.
            </AppText>

            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
              Capacity (seats — numbers only, minimum 1)
            </AppText>
            <TextInput
              value={capDraft}
              onChangeText={setCapacityDigitsOnly}
              keyboardType="number-pad"
              placeholder="8"
              placeholderTextColor={colors.subtle}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 8,
                color: colors.text,
                backgroundColor: colors.card,
                marginBottom: 16,
              }}
            />

            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6 }}>
              Amenities — tap to toggle (same keys as the Rooms widget). This room only.
            </AppText>
            {ROOM_AMENITY_CATEGORY_GROUPS.map((cat) => (
              <View key={cat.id} style={{ marginBottom: 14 }}>
                <AppText variant="caption" weight="bold" style={{ color: colors.text, marginBottom: 8 }}>
                  {cat.title}
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {cat.keys.map((key) => {
                    const label = ROOM_AMENITY_LABELS[key];
                    if (!label) return null;
                    const on = amenityDraftKeys.includes(key);
                    const iconName = (ROOM_AMENITY_ICONS[key] ?? 'star') as IconName;
                    return (
                      <PressClay key={key} onPress={() => toggleAmenity(key)}>
                        <ClayView
                          depth={on ? 2 : 5}
                          color={on ? colors.primary : colors.background}
                          style={{
                            borderRadius: 12,
                            paddingVertical: 8,
                            paddingHorizontal: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            maxWidth: '100%',
                          }}
                        >
                          <Icon name={iconName} size={18} color={on ? '#fff' : colors.primary} />
                          <AppText
                            variant="caption"
                            style={{ color: on ? '#fff' : colors.text, flexShrink: 1, maxWidth: 200 }}
                            numberOfLines={2}
                          >
                            {label}
                          </AppText>
                        </ClayView>
                      </PressClay>
                    );
                  })}
                </View>
              </View>
            ))}

            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
              Location / directions
            </AppText>
            <TextInput
              value={locDraft}
              onChangeText={setLocDraft}
              placeholder="e.g. North wing, 2nd floor, near elevators"
              placeholderTextColor={colors.subtle}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 8,
                color: colors.text,
                backgroundColor: colors.card,
                marginBottom: 16,
              }}
            />

            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
              Resources & extra amenities
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
              Plain text only — shown in Rooms alongside structured amenities. Use for cables, nicknames, or anything not
              in the checklist.
            </AppText>
            <TextInput
              value={resourcesDraft}
              onChangeText={setResourcesDraft}
              placeholder="e.g. HDMI in cabinet · Phone in room 204"
              placeholderTextColor={colors.subtle}
              multiline
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 8,
                color: colors.text,
                backgroundColor: colors.card,
                minHeight: 72,
                textAlignVertical: 'top',
                marginBottom: 10,
              }}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 16 }}>
              <TextInput
                value={otherAmenityLine}
                onChangeText={setOtherAmenityLine}
                placeholder="Add another amenity (free text)"
                placeholderTextColor={colors.subtle}
                style={{
                  flex: 1,
                  minWidth: 160,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  color: colors.text,
                  backgroundColor: colors.card,
                }}
              />
              <AppButton
                title="Add"
                variant="outline"
                onPress={appendOtherAmenityToResources}
                disabled={!otherAmenityLine.trim()}
              />
            </View>

            <AppButton
              title={saveDetailsMutation.isPending ? 'Saving…' : 'Save changes'}
              variant="secondary"
              disabled={!detailsDirty || saveDetailsMutation.isPending}
              onPress={() => linkedRoom && saveDetailsMutation.mutate(linkedRoom)}
            />
          </>
        )}
      </>
    );
  };

  return (
    <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
      <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
        Rooms on floorplan
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
        Use Customize for names and map listing flags, Shape for tracing and geometry, Details for capacity, amenities,
        and notes on the published Room row. Push GeoJSON and sync the booking list with Save & publish in the header.
      </AppText>
      <ClayView depth={3} color={colors.background} style={{ borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <AppText variant="caption" style={{ color: colors.subtle }}>
          Header action <AppText variant="caption" weight="bold" style={{ color: colors.text }}>Save & publish</AppText>{' '}
          saves any floorplan edits, then updates bookable rooms from polygons. After that, use the Details tab to align
          capacity and amenities with the Rooms widget.
        </AppText>
      </ClayView>
      {roomTraceDraft != null ? (
        <ClayView
          depth={3}
          color={colors.primary}
          style={{
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 12,
            marginBottom: 12,
          }}
        >
          <AppText variant="body" style={{ color: '#fff', marginBottom: 8 }}>
            Tracing new room: {roomTraceDraft.length} point{roomTraceDraft.length === 1 ? '' : 's'} — Tap or drag along
            walls; curves need more samples.
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <AppButton
              title="Finish room"
              variant="secondary"
              onPress={finishRoomOutlineTrace}
              style={{ flexGrow: 1, minWidth: 110 }}
              disabled={roomTraceDraft.length < 3}
            />
            <AppButton
              title="Undo point"
              variant="outline"
              onPress={undoRoomOutlinePoint}
              style={{ flexGrow: 1, minWidth: 100 }}
              disabled={roomTraceDraft.length === 0}
            />
            <AppButton title="Cancel trace" variant="outline" onPress={cancelRoomOutlineTrace} style={{ flexGrow: 1, minWidth: 100 }} />
          </View>
        </ClayView>
      ) : null}
      {shellTraceDraft != null ? (
        <ClayView
          depth={3}
          color={colors.primary}
          style={{
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 12,
            marginBottom: 12,
          }}
        >
          <AppText variant="body" style={{ color: '#fff', marginBottom: 8 }}>
            Tracing shell: {shellTraceDraft.length} point{shellTraceDraft.length === 1 ? '' : 's'} — Tap the map along
            the façade; curved walls need more taps.
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <AppButton
              title="Finish shell"
              variant="secondary"
              onPress={finishShellOutlineTrace}
              style={{ flexGrow: 1, minWidth: 110 }}
              disabled={shellTraceDraft.length < 3}
            />
            <AppButton
              title="Undo point"
              variant="outline"
              onPress={undoShellOutlinePoint}
              style={{ flexGrow: 1, minWidth: 100 }}
              disabled={shellTraceDraft.length === 0}
            />
            <AppButton title="Cancel trace" variant="outline" onPress={cancelShellOutlineTrace} style={{ flexGrow: 1, minWidth: 100 }} />
          </View>
        </ClayView>
      ) : null}

      <View style={{ marginBottom: 14 }}>
        <SegmentedControl
          options={[...ROOM_TAB_SEGMENTS]}
          selectedIndex={segmentIndex}
          onChange={setSegmentIndex}
        />
      </View>

      <View
        style={{
          flexDirection: isWideLayout ? 'row' : 'column',
          gap: 14,
          alignItems: 'stretch',
        }}
      >
        {renderRegionList()}

        <View style={{ flex: 1, minWidth: 0 }}>
          {segment === 'Customize' && renderCustomizePanel()}
          {segment === 'Shape' && renderShapePanel()}
          {segment === 'Details' && renderDetailsPanel()}
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
        <AppButton title="Undo" variant="outline" onPress={undoGeo} disabled={!canUndoGeo} style={{ flex: 1, minWidth: 100 }} />
        <AppButton title="Redo" variant="outline" onPress={redoGeo} disabled={!canRedoGeo} style={{ flex: 1, minWidth: 100 }} />
        <AppButton
          title="Discard"
          variant="outline"
          onPress={handleDiscard}
          disabled={!hasUnsavedChanges || savingGeo}
          style={{ flex: 1, minWidth: 120 }}
        />
      </View>
    </ClayView>
  );
}
