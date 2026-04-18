import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFloorForBuildingMultipart,
  fileParameterFromPickedImage,
  mapsApi,
  unwrap,
  uploadFloorplanMultipart,
  updateFloorplanGeoJson,
} from '@/src/api';
import type { BuildingDto, FloorDto } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useThemeColors } from '@/src/hooks';
import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFloorplan } from '@/src/screens/widgets/map/hooks/useFloorplan';
import { FloorplanViewer } from '@/src/screens/widgets/map/components/FloorplanViewer';
import { FloorplanPolygonEditorOverlay } from '@/src/screens/admin/components/FloorplanPolygonEditorOverlay';
import { FloorplanPoiEditorOverlay } from '@/src/screens/admin/components/FloorplanPoiEditorOverlay';
import {
  addPlaceholderRoom,
  addPoi,
  buildFloorplanFeatureCollectionString,
  FLOORPLAN_POI_KINDS,
  insertVertexOnLongestEdge,
  movePoi,
  parseToFloorplanGeoDoc,
  removePoiAt,
  removeRoomAt,
  simplifyRoomRing,
  updateFeatureName,
  updatePoiLabel,
  updateVertex,
  type FloorplanGeoDoc,
  type FloorplanPoiKind,
} from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import {
  countFloorplanFeatures,
  parseFloorplanFeatureCollection,
} from '@/src/screens/widgets/map/utils/parseFloorplanGeoJson';

export default function FloorplanWorkspaceScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;

  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [pickingImage, setPickingImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showRawGeoJson, setShowRawGeoJson] = useState(false);
  const [geoDoc, setGeoDoc] = useState<FloorplanGeoDoc | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number | null>(null);
  const [savingGeo, setSavingGeo] = useState(false);
  const [placePoiKind, setPlacePoiKind] = useState<FloorplanPoiKind | null>(null);
  const [selectedPoiIndex, setSelectedPoiIndex] = useState<number | null>(null);
  const [savingNewFloor, setSavingNewFloor] = useState(false);
  const [newFloorLevel, setNewFloorLevel] = useState('1');
  const [pendingFloorAsset, setPendingFloorAsset] = useState<{ uri: string; mimeType: string; fileName: string } | null>(
    null,
  );

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

  const floors = (floorsQuery.data ?? []) as FloorDto[];
  const buildings = (buildingsQuery.data ?? []) as BuildingDto[];

  const activeFloor = useMemo(
    () => floors.find((f) => f.id === selectedFloorId) ?? null,
    [floors, selectedFloorId],
  );

  const floorplanQuery = useFloorplan(activeFloor?.floorplanId);

  const geoJsonRaw = floorplanQuery.data?.geoJsonData;

  useEffect(() => {
    if (!activeFloor?.floorplanId || geoJsonRaw === undefined) {
      setGeoDoc(null);
      setSelectedRoomIndex(null);
      return;
    }
    if (!geoJsonRaw?.trim()) {
      setGeoDoc({ rooms: [], pois: [] });
      setSelectedRoomIndex(null);
      return;
    }
    setGeoDoc(parseToFloorplanGeoDoc(geoJsonRaw));
    setSelectedRoomIndex(null);
  }, [activeFloor?.floorplanId, geoJsonRaw]);

  const displayGeoJson = useMemo(() => {
    if (geoDoc) return buildFloorplanFeatureCollectionString(geoDoc);
    return geoJsonRaw ?? '';
  }, [geoDoc, geoJsonRaw]);

  const serverJsonNormalized = useMemo(() => {
    if (!geoJsonRaw?.trim()) return '';
    try {
      return JSON.stringify(JSON.parse(geoJsonRaw));
    } catch {
      return geoJsonRaw;
    }
  }, [geoJsonRaw]);

  const draftJsonNormalized = useMemo(() => {
    if (!geoDoc) return '';
    try {
      return JSON.stringify(JSON.parse(buildFloorplanFeatureCollectionString(geoDoc)));
    } catch {
      return '';
    }
  }, [geoDoc]);

  const hasUnsavedChanges =
    !!activeFloor?.floorplanId && !!geoDoc && draftJsonNormalized !== serverJsonNormalized;

  const extractedPolygons = useMemo(
    () => parseFloorplanFeatureCollection(displayGeoJson ?? undefined),
    [displayGeoJson],
  );
  const rawFeatureCount = useMemo(() => countFloorplanFeatures(displayGeoJson), [displayGeoJson]);
  const floorplanLoading = !!activeFloor?.floorplanId && floorplanQuery.isLoading;

  const displayImageUrl = useMemo(() => {
    const fromProcessed = floorplanQuery.data?.imageUrl;
    if (fromProcessed) return fromProcessed;
    return activeFloor?.floorplanImageUrl ?? '';
  }, [floorplanQuery.data?.imageUrl, activeFloor?.floorplanImageUrl]);

  /** Server image when available; otherwise local file from picker (preview before upload / extraction). */
  const previewImageUrl = useMemo(() => {
    if (displayImageUrl) return displayImageUrl;
    return pendingFloorAsset?.uri ?? '';
  }, [displayImageUrl, pendingFloorAsset?.uri]);

  const horizontalPad = 16;
  const splitGap = 12;
  const innerWidth = width - horizontalPad * 2;
  /** Side-by-side: controls on the left, floorplan preview on the right (stacks on phones). */
  const isWideLayout = width >= 720;
  const mapColumnWidth = isWideLayout
    ? Math.max(260, Math.floor((innerWidth - splitGap) * 0.44))
    : innerWidth;
  const previewHeightRatio = 0.52;
  const floorplanMapHeight = mapColumnWidth * previewHeightRatio;

  const hasRoomPolygons = (geoDoc?.rooms?.length ?? 0) > 0;
  const showPolygonLayer =
    !!activeFloor?.floorplanId && !!displayGeoJson && hasRoomPolygons && !floorplanLoading;
  const showPoiLayer =
    !!activeFloor?.floorplanId && (geoDoc != null || placePoiKind != null) && !floorplanLoading;

  const pickFloorplanAsset = useCallback(async (): Promise<{
    uri: string;
    mimeType: string;
    fileName: string;
  } | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow photo library access to upload a floorplan.');
      return null;
    }
    setPickingImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 1,
      });
      if (result.canceled || !result.assets?.length) return null;
      const asset = result.assets[0];
      const fileName = asset.fileName || `floorplan-${Date.now()}.png`;
      const mimeType = asset.mimeType || 'image/png';
      return { uri: asset.uri, mimeType, fileName };
    } finally {
      setPickingImage(false);
    }
  }, []);

  const handleChooseFloorplanImage = async () => {
    const a = await pickFloorplanAsset();
    if (a) setPendingFloorAsset(a);
  };

  const handleRunExtraction = async () => {
    if (!selectedFloorId) {
      Alert.alert('Select a floor', 'Choose a building and floor tab first.');
      return;
    }
    try {
      let file = pendingFloorAsset;
      if (!file) {
        file = await pickFloorplanAsset();
        if (file) setPendingFloorAsset(file);
      }
      if (!file) return;
      setUploading(true);
      const dto = await unwrap(
        uploadFloorplanMultipart(selectedFloorId, fileParameterFromPickedImage(file)),
      );
      const parsed = parseFloorplanFeatureCollection(dto.geoJsonData);
      const fc = countFloorplanFeatures(dto.geoJsonData);
      await queryClient.invalidateQueries({ queryKey: ['admin-map-floors', selectedBuildingId] });
      await queryClient.invalidateQueries({ queryKey: ['map', 'floorplan', dto.id] });
      await queryClient.invalidateQueries({ queryKey: ['map-floors'] });
      Alert.alert(
        'Extraction complete',
        `${parsed.length} room region${parsed.length === 1 ? '' : 's'} parsed from ${fc} GeoJSON feature${fc === 1 ? '' : 's'}. Use “Refine rooms” to adjust polygons.`,
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed.';
      Alert.alert('Processing failed', msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveGeoJson = async () => {
    if (!activeFloor?.floorplanId || !geoDoc) return;
    try {
      setSavingGeo(true);
      const body = buildFloorplanFeatureCollectionString(geoDoc);
      await unwrap(updateFloorplanGeoJson(activeFloor.floorplanId, body));
      await queryClient.invalidateQueries({ queryKey: ['map', 'floorplan', activeFloor.floorplanId] });
      await queryClient.invalidateQueries({ queryKey: ['admin-map-floors', selectedBuildingId] });
      Alert.alert('Saved', 'Floorplan GeoJSON (rooms and map pins) was updated for this floor.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed.';
      Alert.alert('Could not save', msg);
    } finally {
      setSavingGeo(false);
    }
  };

  const handleDiscard = () => {
    if (!geoJsonRaw?.trim()) {
      setGeoDoc({ rooms: [], pois: [] });
      return;
    }
    setGeoDoc(parseToFloorplanGeoDoc(geoJsonRaw));
    setSelectedRoomIndex(null);
    setSelectedPoiIndex(null);
  };

  const onMoveVertex = useCallback(
    (featureIndex: number, vertexIndex: number, nx: number, ny: number) => {
      setGeoDoc((prev) => {
        if (!prev) return prev;
        return updateVertex(prev, featureIndex, vertexIndex, nx, ny);
      });
    },
    [],
  );

  const onAddPoiAt = useCallback(
    (x: number, y: number) => {
      if (!placePoiKind) return;
      setGeoDoc((d) => addPoi(d ?? { rooms: [], pois: [] }, placePoiKind, x, y));
      setPlacePoiKind(null);
    },
    [placePoiKind],
  );

  const onMovePoi = useCallback((index: number, x: number, y: number) => {
    setGeoDoc((d) => (d ? movePoi(d, index, x, y) : d));
  }, []);

  const handleCreateFloor = async () => {
    if (!selectedBuildingId) {
      Alert.alert('Select building', 'Choose a building first.');
      return;
    }
    if (!pendingFloorAsset) {
      Alert.alert('Choose image', 'Pick a floorplan image before creating the floor.');
      return;
    }
    const level = Number(newFloorLevel);
    if (!Number.isFinite(level) || level <= 0) {
      Alert.alert('Invalid level', 'Floor level must be a positive number.');
      return;
    }
    try {
      setSavingNewFloor(true);
      const created = await unwrap(
        createFloorForBuildingMultipart(selectedBuildingId, level, fileParameterFromPickedImage(pendingFloorAsset)),
      );
      setSelectedFloorId(created.id!);
      setPendingFloorAsset(null);
      setNewFloorLevel(String(level + 1));
      await queryClient.invalidateQueries({ queryKey: ['admin-map-floors', selectedBuildingId] });
      await queryClient.invalidateQueries({ queryKey: ['map-floors'] });
      Alert.alert('Floor created', `Level ${created.levelNumber} is ready. Run extraction and add map pins below.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not create floor.';
      Alert.alert('Create floor failed', msg);
    } finally {
      setSavingNewFloor(false);
    }
  };

  const floorplanPreviewEl = (
    <ClayView
      depth={4}
      color={colors.card}
      style={{
        borderRadius: 14,
        padding: 12,
        marginBottom: isWideLayout ? 0 : 14,
        width: '100%',
        alignSelf: 'stretch',
      }}
    >
      <AppText variant="label" style={{ color: colors.subtle, marginBottom: 4 }}>
        Floorplan preview
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
        {hasRoomPolygons
          ? 'Tap the map to select a room or place pins. Editing tools are in the panel beside this preview.'
          : 'The image you pick appears here first. Run AI extraction on the selected floor — room outlines appear after processing completes.'}
      </AppText>
      {previewImageUrl ? (
        <View style={{ position: 'relative' }}>
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
            gesturesEnabled={!(editMode && selectedRoomIndex != null) && placePoiKind == null}
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
                onSelectRoom={(fi) => {
                  setPlacePoiKind(null);
                  setSelectedPoiIndex(null);
                  setSelectedRoomIndex(fi);
                  setEditMode(true);
                }}
              />
            ) : null}
            {showPoiLayer ? (
              <FloorplanPoiEditorOverlay
                pois={geoDoc?.pois ?? []}
                placeKind={placePoiKind}
                selectedPoiIndex={selectedPoiIndex}
                onAddAt={onAddPoiAt}
                onMovePoi={onMovePoi}
                onSelectPoi={setSelectedPoiIndex}
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
    </ClayView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}
          hitSlop={12}
        >
          <Icon name="arrow-back" size={22} color={colors.text} />
          <AppText variant="h2" weight="bold">
            Floorplan extraction
          </AppText>
        </Pressable>
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
          Run AI on a clear exported image, then refine room names and polygons before users see them on the map.
        </AppText>
      </View>

      <View
        style={{
          flex: 1,
          flexDirection: isWideLayout ? 'row' : 'column',
          paddingHorizontal: horizontalPad,
          gap: splitGap,
          alignItems: 'flex-start',
        }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ flex: isWideLayout ? 1 : undefined, minWidth: 0, width: isWideLayout ? undefined : '100%' }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View>
          <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <AppText variant="label" style={{ color: colors.subtle, marginBottom: 10 }}>
              Location
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
              Building
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {buildings.map((b) => (
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
            {!buildings.length && !buildingsQuery.isLoading ? (
              <AppText variant="caption" style={{ color: colors.subtle }}>
                No buildings in this organization yet.
              </AppText>
            ) : null}

            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
              Floor
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {floors.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setSelectedFloorId(f.id)}
                  style={{ marginRight: 8 }}
                >
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
            {selectedBuildingId && !floors.length && !floorsQuery.isLoading ? (
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 8 }}>
                No floors yet. Create one below with a floorplan image, then run extraction.
              </AppText>
            ) : null}
          </ClayView>

          <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
              Floorplan image & processing
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
              Choose an image once, then create a new level for this building or run AI extraction on the floor you
              selected above. Extraction needs Map Admin and the Python AiService (AiService:BaseUrl).
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
              Tips: export PNG/PDF→PNG from CAD (not a screen photo), high resolution, black walls on white, straight
              scan.
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <AppText variant="caption">New floor level</AppText>
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
            <AppButton
              title={pickingImage ? 'Opening…' : 'Choose image'}
              onPress={handleChooseFloorplanImage}
              variant="secondary"
              style={{ marginBottom: 10 }}
              disabled={pickingImage}
            />
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              <AppButton
                title={savingNewFloor ? 'Creating…' : 'Create floor'}
                onPress={handleCreateFloor}
                style={{ flex: 1, minWidth: 140 }}
                disabled={!selectedBuildingId || !pendingFloorAsset || savingNewFloor || pickingImage}
              />
              <AppButton
                title={uploading || pickingImage ? 'Working…' : 'Run AI extraction'}
                onPress={handleRunExtraction}
                variant="outline"
                style={{ flex: 1, minWidth: 140 }}
                disabled={!selectedFloorId || uploading || pickingImage}
              />
            </View>
            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 10 }}>
              {pendingFloorAsset
                ? `Selected: ${pendingFloorAsset.fileName}`
                : 'No file selected — “Run AI extraction” will prompt for an image if needed.'}
            </AppText>
          </ClayView>

          {!isWideLayout ? floorplanPreviewEl : null}

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
                <TouchableOpacity onPress={() => setShowRawGeoJson((v) => !v)} style={{ marginTop: 8 }}>
                  <AppText variant="caption" style={{ color: colors.primary }}>
                    {showRawGeoJson ? 'Hide raw GeoJSON' : 'Show raw GeoJSON'}
                  </AppText>
                </TouchableOpacity>
                {showRawGeoJson && !!displayGeoJson ? (
                  <ClayView depth={1} color={colors.background} style={{ borderRadius: 10, padding: 10, marginTop: 8, maxHeight: 220 }}>
                    <ScrollView nestedScrollEnabled>
                      <AppText variant="caption" style={{ fontFamily: 'monospace', color: colors.text }}>
                        {displayGeoJson.length > 6000 ? `${displayGeoJson.slice(0, 6000)}…` : displayGeoJson}
                      </AppText>
                    </ScrollView>
                  </ClayView>
                ) : null}
              </>
            )}
          </ClayView>

          {activeFloor?.floorplanId && geoDoc && !floorplanLoading ? (
            <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
                Refine rooms (Map Edit)
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
                {isWideLayout
                  ? 'Room list and tools on the left; floorplan preview stays on the right. Save sends the full GeoJSON.'
                  : 'Room list and tools are above; scroll up to see the floorplan preview. Save sends the full GeoJSON.'}
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
                    Rooms
                  </AppText>
                  <ScrollView
                    nestedScrollEnabled
                    style={{ maxHeight: isWideLayout ? 380 : 220 }}
                    showsVerticalScrollIndicator
                  >
                    {geoDoc.rooms.length === 0 ? (
                      <AppText variant="caption" style={{ color: colors.subtle }}>
                        No rooms yet. Run extraction or tap “Add room”.
                      </AppText>
                    ) : (
                      geoDoc.rooms.map((feat, idx) => (
                        <TouchableOpacity
                          key={feat.key}
                          onPress={() => {
                            setSelectedRoomIndex(idx);
                            setPlacePoiKind(null);
                            setSelectedPoiIndex(null);
                            if (!editMode) setEditMode(true);
                          }}
                          activeOpacity={0.85}
                          style={{ marginBottom: 8 }}
                        >
                          <ClayView
                            depth={selectedRoomIndex === idx ? 2 : 5}
                            color={selectedRoomIndex === idx ? colors.primary : colors.background}
                            style={{ borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 }}
                          >
                            <AppText
                              numberOfLines={2}
                              style={{ color: selectedRoomIndex === idx ? '#fff' : colors.text }}
                              weight="bold"
                            >
                              {feat.roomName?.trim() || `Room ${idx + 1}`}
                            </AppText>
                          </ClayView>
                        </TouchableOpacity>
                      ))
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
                              d && selectedRoomIndex != null
                                ? insertVertexOnLongestEdge(d, selectedRoomIndex)
                                : d,
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

              <AppText variant="label" style={{ color: colors.subtle, marginTop: 18, marginBottom: 8 }}>
                Map pins (POI)
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
                Choose a pin type, then tap the floorplan preview to place it. Drag a pin to move it. Saved in the same
                GeoJSON as room polygons.
              </AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {FLOORPLAN_POI_KINDS.map((kind) => (
                  <TouchableOpacity
                    key={kind}
                    onPress={() => {
                      setPlacePoiKind((k) => (k === kind ? null : kind));
                      setSelectedPoiIndex(null);
                    }}
                  >
                    <ClayView
                      depth={placePoiKind === kind ? 2 : 5}
                      color={placePoiKind === kind ? colors.primary : colors.background}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
                    >
                      <AppText style={{ color: placePoiKind === kind ? '#fff' : colors.text }}>{kind}</AppText>
                    </ClayView>
                  </TouchableOpacity>
                ))}
              </View>
              {placePoiKind ? (
                <AppText variant="caption" style={{ color: colors.primary, marginBottom: 8 }}>
                  Tap the floorplan to place: {placePoiKind}
                </AppText>
              ) : null}
              {geoDoc.pois.map((p, idx) => (
                <ClayView
                  key={p.pinId}
                  depth={selectedPoiIndex === idx ? 2 : 5}
                  color={selectedPoiIndex === idx ? colors.primary : colors.background}
                  style={{ borderRadius: 10, padding: 10, marginBottom: 8 }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPoiIndex(idx);
                      setPlacePoiKind(null);
                    }}
                  >
                    <AppText style={{ color: selectedPoiIndex === idx ? '#fff' : colors.text }} weight="bold">
                      {p.pinKind} {p.label ? `· ${p.label}` : ''}
                    </AppText>
                  </TouchableOpacity>
                  <TextInput
                    value={p.label}
                    onChangeText={(t) => setGeoDoc((prev) => (prev ? updatePoiLabel(prev, idx, t) : prev))}
                    placeholder="Label"
                    placeholderTextColor={colors.subtle}
                    style={{
                      marginTop: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      color: colors.text,
                      backgroundColor: colors.card,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setGeoDoc((prev) => (prev ? removePoiAt(prev, idx) : prev));
                      setSelectedPoiIndex(null);
                    }}
                    style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  >
                    <Icon name="delete-outline" size={18} color="#ef4444" />
                    <AppText variant="caption" style={{ color: '#ef4444' }}>
                      Remove pin
                    </AppText>
                  </TouchableOpacity>
                </ClayView>
              ))}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <AppButton
                  title={savingGeo ? 'Saving…' : 'Save changes'}
                  onPress={handleSaveGeoJson}
                  disabled={!hasUnsavedChanges || savingGeo}
                  style={{ flex: 1 }}
                />
                <AppButton
                  title="Discard"
                  variant="outline"
                  onPress={handleDiscard}
                  disabled={!hasUnsavedChanges || savingGeo}
                  style={{ flex: 1 }}
                />
              </View>
            </ClayView>
          ) : null}
          </View>
        </ScrollView>

        {isWideLayout ? (
          <View style={{ width: mapColumnWidth, alignSelf: 'stretch' }}>{floorplanPreviewEl}</View>
        ) : null}
      </View>
    </View>
  );
}
