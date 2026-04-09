import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import {
  createFloorForBuildingMultipart,
  fileParameterFromPickedImage,
  mapsApi,
  roomsApi,
  unwrap,
  uploadFloorplanMultipart,
} from '@/src/api';
import {
  BuildingDto,
  CreateMapPinRequest,
  CreateRoomRequest,
  FloorDto,
  PinType,
  RoomDto,
} from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useThemeColors } from '@/src/hooks';
import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';

type DraftPin = {
  id: string;
  x: number;
  y: number;
  roomId?: string;
  label?: string;
  pinType: PinType;
};

type PickedImageAsset = { uri: string; mimeType: string; fileName: string };

export default function AdminMappingToolScreen() {
  const colors = useThemeColors();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [selectedFloorImageUrl, setSelectedFloorImageUrl] = useState<string>('');
  /** Local image picked for *new* floor creation (multipart to API — not a public URL upload). */
  const [pendingFloorplanAsset, setPendingFloorplanAsset] = useState<PickedImageAsset | null>(null);
  const [newFloorLevel, setNewFloorLevel] = useState<string>('1');
  const [pickingImage, setPickingImage] = useState(false);
  const [savingFloor, setSavingFloor] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [creatingPin, setCreatingPin] = useState(false);

  const [pendingTap, setPendingTap] = useState<{ x: number; y: number } | null>(null);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [pinLabel, setPinLabel] = useState<string>('');
  const [isEntrance, setIsEntrance] = useState(false);
  const [createNewRoom, setCreateNewRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [draftPins, setDraftPins] = useState<DraftPin[]>([]);
  const [mapSize, setMapSize] = useState({ width: 1, height: 1 });

  const buildingsQuery = useQuery({
    queryKey: ['admin-map-buildings', orgId],
    queryFn: async () => unwrap(mapsApi.getBuildingsForOrganization(orgId!)),
    enabled: !!orgId,
  });

  const floorsQuery = useQuery({
    queryKey: ['admin-map-floors', selectedBuildingId],
    queryFn: async () => unwrap(mapsApi.getFloorsForBuilding(selectedBuildingId)),
    enabled: !!selectedBuildingId,
  });

  const roomsQuery = useQuery({
    queryKey: ['admin-map-rooms', orgId],
    queryFn: async () => unwrap(roomsApi.getAll()),
    enabled: !!orgId,
  });

  const floors = (floorsQuery.data ?? []) as FloorDto[];
  const rooms = (roomsQuery.data ?? []) as RoomDto[];
  const activeFloor = useMemo(() => floors.find((f) => f.id === selectedFloorId) ?? null, [floors, selectedFloorId]);
  const activeImageUrl = useMemo(() => {
    if (pendingFloorplanAsset?.uri) return pendingFloorplanAsset.uri;
    return selectedFloorImageUrl || activeFloor?.floorplanImageUrl || '';
  }, [pendingFloorplanAsset, selectedFloorImageUrl, activeFloor?.floorplanImageUrl]);

  const roomsForActiveFloor = useMemo(() => {
    if (!activeFloor) return [];
    return rooms.filter((r) => r.floorId === activeFloor.id);
  }, [rooms, activeFloor]);

  const handlePickFloorplanImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow gallery access to choose floorplans.');
        return;
      }
      setPickingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 1,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const fileName = asset.fileName || `floorplan-${Date.now()}.png`;
      const mimeType = asset.mimeType || 'image/png';
      setPendingFloorplanAsset({ uri: asset.uri, mimeType, fileName });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not open the image library.';
      Alert.alert('Image pick failed', msg);
    } finally {
      setPickingImage(false);
    }
  };

  const handleAiFloorplanProcess = async () => {
    if (!selectedFloorId) {
      Alert.alert('Select a floor', 'Choose a floor tab below before running AI processing.');
      return;
    }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow gallery access.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 1,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const fileName = asset.fileName || `floorplan-ai-${Date.now()}.png`;
      const mimeType = asset.mimeType || 'image/png';
      setAiProcessing(true);
      await unwrap(
        uploadFloorplanMultipart(selectedFloorId, fileParameterFromPickedImage({ uri: asset.uri, mimeType, fileName })),
      );
      await floorsQuery.refetch();
      Alert.alert(
        'AI floorplan saved',
        'GeoJSON was stored for this floor. Open the building indoor map to see polygons (Map → View Floorplans).',
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed.';
      Alert.alert('AI processing failed', msg);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleCreateFloor = async () => {
    if (!selectedBuildingId) {
      Alert.alert('Select building', 'Choose a building first.');
      return;
    }
    if (!pendingFloorplanAsset) {
      Alert.alert('Choose floorplan', 'Tap “Choose floorplan image” and pick a file before creating the floor.');
      return;
    }
    const level = Number(newFloorLevel);
    if (!Number.isFinite(level) || level <= 0) {
      Alert.alert('Invalid level', 'Floor level must be a positive number.');
      return;
    }
    try {
      setSavingFloor(true);
      const created = await unwrap(
        createFloorForBuildingMultipart(selectedBuildingId, level, fileParameterFromPickedImage(pendingFloorplanAsset)),
      );
      setSelectedFloorId(created.id!);
      setPendingFloorplanAsset(null);
      setSelectedFloorImageUrl(created.floorplanImageUrl ?? '');
      setNewFloorLevel(String(level + 1));
      await floorsQuery.refetch();
      Alert.alert('Floor created', `Level ${created.levelNumber} is ready for pin dropping.`);
    } catch (e: any) {
      Alert.alert('Could not create floor', e?.message ?? 'Check backend floor-create endpoint.');
    } finally {
      setSavingFloor(false);
    }
  };

  const handleMapTap = (event: any) => {
    if (!selectedFloorId) {
      Alert.alert('Select floor', 'Create or select a floor before dropping pins.');
      return;
    }
    const xRaw = event.nativeEvent.locationX / mapSize.width;
    const yRaw = event.nativeEvent.locationY / mapSize.height;
    const x = Math.max(0, Math.min(1, xRaw));
    const y = Math.max(0, Math.min(1, yRaw));
    setPendingTap({ x, y });
    setSelectedRoomId('');
    setPinLabel('');
    setIsEntrance(false);
    setCreateNewRoom(false);
    setNewRoomName('');
    setPinModalVisible(true);
  };

  const handleSavePin = async () => {
    if (!selectedFloorId || !pendingTap) return;
    if (!isEntrance && !createNewRoom && !selectedRoomId) {
      Alert.alert('Select room', 'Pick an existing room, create a new one, or mark as Entrance.');
      return;
    }
    if (!isEntrance && createNewRoom && !newRoomName.trim()) {
      Alert.alert('Room name', 'Enter a name for the new room.');
      return;
    }
    if (!isEntrance && createNewRoom && !selectedBuildingId) {
      Alert.alert('Building', 'Select a building before creating a room.');
      return;
    }
    try {
      setCreatingPin(true);
      let roomIdForPin = isEntrance ? undefined : selectedRoomId;
      if (!isEntrance && createNewRoom) {
        const newRoom = await unwrap(
          roomsApi.create(
            new CreateRoomRequest({
              name: newRoomName.trim(),
              floorId: selectedFloorId,
              buildingId: selectedBuildingId,
              coordinateX: pendingTap.x,
              coordinateY: pendingTap.y,
              isBookable: true,
            }),
          ),
        );
        roomIdForPin = newRoom.id;
        await roomsQuery.refetch();
      }
      const created = await unwrap(
        mapsApi.createPinForFloor(
          selectedFloorId,
          new CreateMapPinRequest({
            roomId: isEntrance ? undefined : roomIdForPin,
            coordinateX: pendingTap.x,
            coordinateY: pendingTap.y,
            pinType: isEntrance ? PinType.Exit : PinType.Room,
            isEntrance,
            label: isEntrance ? pinLabel || 'Entrance' : pinLabel || undefined,
          }),
        ),
      );
      setDraftPins((prev) => {
        const next = [...prev];
        if (isEntrance) {
          const filtered = next.filter((p) => !(p.pinType === PinType.Exit && (p.label || '').toLowerCase() === 'entrance'));
          return [
            ...filtered,
            {
              id: created.id,
              x: created.coordinateX,
              y: created.coordinateY,
              roomId: created.roomId,
              label: created.label,
              pinType: created.pinType as PinType,
            },
          ];
        }
        return [
          ...next,
          {
            id: created.id,
            x: created.coordinateX,
            y: created.coordinateY,
            roomId: created.roomId,
            label: created.label,
            pinType: created.pinType as PinType,
          },
        ];
      });
      setPinModalVisible(false);
      setPendingTap(null);
      await floorsQuery.refetch();
    } catch (e: any) {
      Alert.alert('Could not save pin', e?.message ?? 'Check backend pin-create endpoint.');
    } finally {
      setCreatingPin(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <AppText variant="h2" weight="bold">Admin Mapping Tool</AppText>
        <AppText style={{ color: colors.subtle, marginTop: 4, marginBottom: 14 }}>
          Upload floorplans, create floors, and place room/entrance pins.
        </AppText>

        <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <AppText weight="bold" style={{ marginBottom: 8 }}>1) Choose image & create floor</AppText>
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
            Multipart floor upload requires widget permission Map Edit or higher (Map Admin satisfies Edit). AI step
            1b requires Map Admin. Creating rooms from the pin modal requires Rooms Edit.
          </AppText>

          <AppText variant="caption" style={{ marginBottom: 6 }}>Building</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {(buildingsQuery.data ?? []).map((b: BuildingDto) => (
              <TouchableOpacity key={b.id} onPress={() => setSelectedBuildingId(b.id)} style={{ marginRight: 8 }}>
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

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AppText variant="caption">Level</AppText>
            <TextInput
              value={newFloorLevel}
              onChangeText={setNewFloorLevel}
              keyboardType="numeric"
              style={{
                minWidth: 72,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 6,
                color: colors.text,
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <AppButton
              title={pickingImage ? 'Opening…' : 'Choose floorplan image'}
              onPress={handlePickFloorplanImage}
              style={{ flex: 1 }}
            />
            <AppButton
              title={savingFloor ? 'Creating…' : 'Create floor'}
              onPress={handleCreateFloor}
              style={{ flex: 1 }}
              variant="outline"
            />
          </View>
          {pendingFloorplanAsset ? (
            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 8 }}>
              Ready: {pendingFloorplanAsset.fileName}
            </AppText>
          ) : null}

          <AppText weight="bold" style={{ marginTop: 16, marginBottom: 6 }}>
            1b) AI room polygons (optional)
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
            Requires the Python AI service running, Omada API configured with its URL, and Map Admin permission.
            Sends the image to the AI service and stores GeoJSON for the selected floor.
          </AppText>
          <AppButton
            title={aiProcessing ? 'Processing…' : 'Run AI floorplan processing'}
            onPress={handleAiFloorplanProcess}
            variant="outline"
            disabled={!selectedFloorId || aiProcessing}
          />
        </ClayView>

        <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14 }}>
          <AppText weight="bold" style={{ marginBottom: 8 }}>2) Pin Drop & Link</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {floors.map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => {
                  setSelectedFloorId(f.id);
                  setSelectedFloorImageUrl(f.floorplanImageUrl ?? '');
                  setPendingFloorplanAsset(null);
                }}
                style={{ marginRight: 8 }}
              >
                <ClayView
                  depth={selectedFloorId === f.id ? 2 : 5}
                  color={selectedFloorId === f.id ? colors.primary : colors.background}
                  style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
                >
                  <AppText style={{ color: selectedFloorId === f.id ? '#fff' : colors.text }}>{`Level ${f.levelNumber}`}</AppText>
                </ClayView>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {!activeImageUrl ? (
            <AppText style={{ color: colors.subtle }}>Upload/create a floor to start dropping pins.</AppText>
          ) : (
            <View style={{ width: '100%', aspectRatio: 1.35, borderRadius: 12, overflow: 'hidden' }}>
              <Pressable
                style={{ flex: 1 }}
                onPress={handleMapTap}
                onLayout={(e) => {
                  const { width, height } = e.nativeEvent.layout;
                  setMapSize({ width: Math.max(1, width), height: Math.max(1, height) });
                }}
              >
                <Image source={{ uri: activeImageUrl }} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
                {[...(activeFloor?.pins ?? []), ...draftPins].map((p: any) => (
                  <View
                    key={String(p.id)}
                    style={{
                      position: 'absolute',
                      left: `${(p.coordinateX ?? p.x) * 100}%`,
                      top: `${(p.coordinateY ?? p.y) * 100}%`,
                      marginLeft: -6,
                      marginTop: -6,
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: (p.pinType as number) === PinType.Exit ? '#2563eb' : '#ef4444',
                      borderWidth: 2,
                      borderColor: '#fff',
                    }}
                  />
                ))}
              </Pressable>
            </View>
          )}

          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 10 }}>
            Tap anywhere on the floorplan to drop a pin. Entrance pins are saved with label "Entrance".
          </AppText>
        </ClayView>
      </ScrollView>

      <Modal visible={pinModalVisible} transparent animationType="fade" onRequestClose={() => setPinModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 }}>
          <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 16 }}>
            <AppText variant="h3" weight="bold">Link Pin</AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
              Connect this pin to a room, or mark it as entrance.
            </AppText>

            <TouchableOpacity
              onPress={() => {
                setIsEntrance((prev) => {
                  const next = !prev;
                  if (next) {
                    setCreateNewRoom(false);
                    setNewRoomName('');
                    setSelectedRoomId('');
                  }
                  return next;
                });
              }}
              style={{ marginBottom: 10 }}
            >
              <ClayView depth={2} color={isEntrance ? colors.primary : colors.background} style={{ borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <AppText style={{ color: isEntrance ? '#fff' : colors.text }}>Set as Entrance pin</AppText>
                <Icon name={isEntrance ? 'check-circle' : 'radio-button-unchecked'} color={isEntrance ? '#fff' : colors.subtle} size={18} />
              </ClayView>
            </TouchableOpacity>

            {!isEntrance && (
              <>
                <TouchableOpacity
                  onPress={() => {
                    setCreateNewRoom((v) => !v);
                    if (!createNewRoom) setSelectedRoomId('');
                  }}
                  style={{ marginBottom: 10 }}
                >
                  <ClayView
                    depth={2}
                    color={createNewRoom ? colors.primary : colors.background}
                    style={{ borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <AppText style={{ color: createNewRoom ? '#fff' : colors.text }}>
                      Create new room at this tap (map coordinates)
                    </AppText>
                    <Icon name={createNewRoom ? 'check-circle' : 'radio-button-unchecked'} color={createNewRoom ? '#fff' : colors.subtle} size={18} />
                  </ClayView>
                </TouchableOpacity>

                {createNewRoom ? (
                  <>
                    <AppText variant="caption" style={{ marginBottom: 6 }}>New room name</AppText>
                    <TextInput
                      value={newRoomName}
                      onChangeText={setNewRoomName}
                      placeholder="e.g. Conference 201"
                      placeholderTextColor={colors.subtle}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 10,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        color: colors.text,
                        marginBottom: 10,
                      }}
                    />
                  </>
                ) : (
                  <>
                    <AppText variant="caption" style={{ marginBottom: 6 }}>Existing room</AppText>
                    <ScrollView style={{ maxHeight: 140, marginBottom: 10 }}>
                      {roomsForActiveFloor.map((room) => (
                        <TouchableOpacity
                          key={room.id}
                          onPress={() => setSelectedRoomId(room.id)}
                          style={{ marginBottom: 6 }}
                        >
                          <ClayView depth={selectedRoomId === room.id ? 2 : 5} color={selectedRoomId === room.id ? colors.primary : colors.background} style={{ borderRadius: 10, padding: 10 }}>
                            <AppText style={{ color: selectedRoomId === room.id ? '#fff' : colors.text }}>{room.name}</AppText>
                          </ClayView>
                        </TouchableOpacity>
                      ))}
                      {roomsForActiveFloor.length === 0 && (
                        <AppText variant="caption" style={{ color: colors.subtle }}>
                          No rooms yet — enable “Create new room” above or set entrance.
                        </AppText>
                      )}
                    </ScrollView>
                  </>
                )}
              </>
            )}

            <TextInput
              value={pinLabel}
              onChangeText={setPinLabel}
              placeholder={isEntrance ? 'Entrance label (optional)' : 'Pin label (optional)'}
              placeholderTextColor={colors.subtle}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 8,
                color: colors.text,
                marginBottom: 12,
              }}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <AppButton title="Cancel" variant="outline" onPress={() => setPinModalVisible(false)} style={{ flex: 1 }} />
              <AppButton
                title={creatingPin ? 'Saving...' : 'Save Pin'}
                onPress={handleSavePin}
                style={{ flex: 1 }}
              />
            </View>
            {creatingPin && <ActivityIndicator style={{ marginTop: 10 }} color={colors.primary} />}
          </ClayView>
        </View>
      </Modal>
    </View>
  );
}

