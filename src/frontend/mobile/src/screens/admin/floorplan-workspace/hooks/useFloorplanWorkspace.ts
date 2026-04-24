import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Platform, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFloorplan } from '@/src/screens/widgets/map/hooks/useFloorplan';
import {
  addPoi,
  buildFloorplanFeatureCollectionString,
  movePoi,
  parseToFloorplanGeoDoc,
  updateVertex,
  type FloorplanGeoDoc,
  type FloorplanPoiKind,
} from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import {
  countFloorplanFeatures,
  parseFloorplanFeatureCollection,
} from '@/src/screens/widgets/map/utils/parseFloorplanGeoJson';

export function useFloorplanWorkspace() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width, height: windowHeight } = useWindowDimensions();
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
  const [activeTab, setActiveTab] = useState<'setup' | 'rooms' | 'pins'>('setup');
  /** Digital twin / “map view”: hide raster, solid semantic fills, dark wall background. */
  const [isVectorMode, setIsVectorMode] = useState(false);
  const [workspaceIntent, setWorkspaceIntent] = useState<'unset' | 'create' | 'edit'>('unset');
  const [createLevelChoiceLocked, setCreateLevelChoiceLocked] = useState(false);
  const prevSelectedFloorIdRef = useRef<string | null>(null);

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
    if (!activeFloor?.floorplanId) {
      setGeoDoc(null);
      setSelectedRoomIndex(null);
      return;
    }
    if (geoJsonRaw === undefined) {
      setGeoDoc({ rooms: [], pois: [] });
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

  useEffect(() => {
    if (!pendingFloorAsset?.uri || !activeFloor?.floorplanId) return;
    setGeoDoc({ rooms: [], pois: [] });
    setSelectedRoomIndex(null);
    setSelectedPoiIndex(null);
  }, [pendingFloorAsset?.uri, activeFloor?.floorplanId]);

  useEffect(() => {
    const prev = prevSelectedFloorIdRef.current;
    if (prev && selectedFloorId && prev !== selectedFloorId) {
      setPendingFloorAsset(null);
    }
    prevSelectedFloorIdRef.current = selectedFloorId || null;
  }, [selectedFloorId]);

  useEffect(() => {
    if (workspaceIntent !== 'create') setCreateLevelChoiceLocked(false);
  }, [workspaceIntent]);

  useEffect(() => {
    setCreateLevelChoiceLocked(false);
  }, [selectedBuildingId]);

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

  const displayImageUrl = useMemo(() => {
    const fromProcessed = floorplanQuery.data?.imageUrl;
    if (fromProcessed) return fromProcessed;
    return activeFloor?.floorplanImageUrl ?? '';
  }, [floorplanQuery.data?.imageUrl, activeFloor?.floorplanImageUrl]);

  const previewImageUrl = useMemo(() => {
    if (pendingFloorAsset?.uri) return pendingFloorAsset.uri;
    if (displayImageUrl) return displayImageUrl;
    return '';
  }, [pendingFloorAsset?.uri, displayImageUrl]);

  const showingPickedImageWithoutServerPreview =
    !!pendingFloorAsset?.uri && previewImageUrl === pendingFloorAsset.uri;
  const floorplanLoading =
    !!activeFloor?.floorplanId &&
    floorplanQuery.isLoading &&
    !showingPickedImageWithoutServerPreview;

  const horizontalPad = 16;
  const splitGap = 12;
  const innerWidth = width - horizontalPad * 2;
  const isWideLayout = width >= 720;
  const mapColumnWidth = isWideLayout
    ? Math.max(260, Math.floor((innerWidth - splitGap) * 0.44))
    : innerWidth;

  const previewHeightRatio = useMemo(() => {
    if (isWideLayout) return 0.52;
    const targetMapPixelHeight = windowHeight * 0.45 - 16;
    return Math.min(1.35, Math.max(0.38, targetMapPixelHeight / mapColumnWidth));
  }, [isWideLayout, windowHeight, mapColumnWidth]);

  const floorplanMapHeight = mapColumnWidth * previewHeightRatio;

  const mapGesturesEnabled =
    !(editMode && selectedRoomIndex != null) &&
    (activeTab !== 'pins' ? placePoiKind == null : selectedPoiIndex == null);

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
      Alert.alert('Select a floor', 'Choose a building and floor first.');
      return;
    }
    if (!pendingFloorAsset) {
      Alert.alert(
        'Choose an image',
        'Pick a floorplan image first. You will see it in the preview, then run AI extraction.',
      );
      return;
    }
    try {
      setUploading(true);
      const dto = await unwrap(
        uploadFloorplanMultipart(selectedFloorId, fileParameterFromPickedImage(pendingFloorAsset)),
      );
      const parsed = parseFloorplanFeatureCollection(dto.geoJsonData);
      const fc = countFloorplanFeatures(dto.geoJsonData);
      setPendingFloorAsset(null);
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

  const goToWorkflowChoice = () => {
    if (hasUnsavedChanges) {
      Alert.alert('Unsaved changes', 'Discard edits and return to the workflow choice?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            handleDiscard();
            setWorkspaceIntent('unset');
            setActiveTab('setup');
          },
        },
      ]);
      return;
    }
    setWorkspaceIntent('unset');
    setActiveTab('setup');
  };

  const goToWorkflowChoiceRef = useRef(goToWorkflowChoice);
  goToWorkflowChoiceRef.current = goToWorkflowChoice;

  useEffect(() => {
    if (workspaceIntent === 'unset' || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goToWorkflowChoiceRef.current();
      return true;
    });
    return () => sub.remove();
  }, [workspaceIntent]);

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

  const confirmCreateBuildingAndLevel = () => {
    if (!selectedBuildingId) {
      Alert.alert('Select building', 'Choose a building first.');
      return;
    }
    const level = Number(newFloorLevel);
    if (!Number.isFinite(level) || level <= 0) {
      Alert.alert('Invalid level', 'Floor level must be a positive number.');
      return;
    }
    if (floors.some((f) => f.levelNumber === level)) {
      Alert.alert(
        'Level already exists',
        `This building already has a floor for level ${level}. Enter a different level number.`,
      );
      return;
    }
    setCreateLevelChoiceLocked(true);
  };

  const handleCreateFloor = async () => {
    if (!selectedBuildingId) {
      Alert.alert('Select building', 'Choose a building first.');
      return;
    }
    if (workspaceIntent === 'create' && !createLevelChoiceLocked) {
      Alert.alert(
        'Confirm level',
        'Confirm building and level number before choosing an image or creating the floor.',
      );
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
    if (floors.some((f) => f.levelNumber === level)) {
      Alert.alert(
        'Level already exists',
        `This building already has a floor for level ${level}. Change the level number or pick another building.`,
      );
      return;
    }
    try {
      setSavingNewFloor(true);
      const created = await unwrap(
        createFloorForBuildingMultipart(selectedBuildingId, level, fileParameterFromPickedImage(pendingFloorAsset)),
      );
      setSelectedFloorId(created.id!);
      setNewFloorLevel(String(level + 1));
      setCreateLevelChoiceLocked(false);
      await queryClient.invalidateQueries({ queryKey: ['admin-map-floors', selectedBuildingId] });
      await queryClient.invalidateQueries({ queryKey: ['map-floors'] });
      Alert.alert(
        'Level added',
        `Level ${created.levelNumber} is on the building. You can run “Run AI (optional)” next with the same image, or open Rooms and add polygons manually.`,
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not create floor.';
      Alert.alert('Create floor failed', msg);
    } finally {
      setSavingNewFloor(false);
    }
  };

  return {
    colors,
    insets,
    horizontalPad,
    splitGap,
    isWideLayout,
    mapColumnWidth,
    floorplanMapHeight,
    previewHeightRatio,
    buildingsQuery,
    floorsQuery,
    buildings,
    floors,
    activeFloor,
    floorplanQuery,
    geoJsonRaw,
    selectedBuildingId,
    setSelectedBuildingId,
    selectedFloorId,
    setSelectedFloorId,
    pickingImage,
    uploading,
    showRawGeoJson,
    setShowRawGeoJson,
    geoDoc,
    setGeoDoc,
    editMode,
    setEditMode,
    selectedRoomIndex,
    setSelectedRoomIndex,
    savingGeo,
    placePoiKind,
    setPlacePoiKind,
    selectedPoiIndex,
    setSelectedPoiIndex,
    savingNewFloor,
    newFloorLevel,
    setNewFloorLevel,
    pendingFloorAsset,
    setPendingFloorAsset,
    activeTab,
    setActiveTab,
    isVectorMode,
    setIsVectorMode,
    workspaceIntent,
    setWorkspaceIntent,
    createLevelChoiceLocked,
    setCreateLevelChoiceLocked,
    displayGeoJson,
    hasUnsavedChanges,
    extractedPolygons,
    rawFeatureCount,
    previewImageUrl,
    floorplanLoading,
    mapGesturesEnabled,
    hasRoomPolygons,
    showPolygonLayer,
    showPoiLayer,
    handleChooseFloorplanImage,
    handleRunExtraction,
    handleSaveGeoJson,
    handleDiscard,
    goToWorkflowChoice,
    onMoveVertex,
    onAddPoiAt,
    onMovePoi,
    confirmCreateBuildingAndLevel,
    handleCreateFloor,
  };
}

export type FloorplanWorkspaceModel = ReturnType<typeof useFloorplanWorkspace>;
