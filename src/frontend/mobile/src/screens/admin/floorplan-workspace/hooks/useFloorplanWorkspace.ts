import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Alert, BackHandler, Platform, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFloorForBuildingMultipart,
  fileParameterFromPickedImage,
  mapsApi,
  publishFloorplanRoomsToDb,
  unwrap,
  uploadFloorplanMultipart,
  updateFloorplanGeoJson,
} from '@/src/api';
import type { BuildingDto, CreateBuildingRequest, FloorDto } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useThemeColors } from '@/src/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFloorplan } from '@/src/screens/widgets/map/hooks/useFloorplan';
import {
  addDoorLineFromTwoTaps,
  addPoi,
  appendRoomFromOpenOutline,
  buildFloorplanFeatureCollectionString,
  movePoi,
  nudgeEdgeAlongNormalFromDrag,
  parseToFloorplanGeoDoc,
  translateFeatureVertices,
  updateVertex,
  upsertBuildingShellRing,
  type FloorplanGeoDoc,
  type FloorplanPoiKind,
} from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import {
  countFloorplanFeatures,
  parseFloorplanFeatureCollection,
} from '@/src/screens/widgets/map/utils/parseFloorplanGeoJson';
import { isBuildingShellFeature } from '@/src/screens/widgets/map/utils/floorplanSemanticStyles';

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

const MAX_UNDO = 40;

function stableGeoJsonSnapshot(d: FloorplanGeoDoc): string {
  return JSON.stringify(JSON.parse(buildFloorplanFeatureCollectionString(d)));
}

export type DoorPlacementSession =
  | null
  /** Tap map twice near room edges — firstSnap set after first tap. */
  | { roomIndex: number; first: [number, number] | null };

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
  const [publishingRooms, setPublishingRooms] = useState(false);
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
  const [newBuildingName, setNewBuildingName] = useState('');
  const [creatingBuilding, setCreatingBuilding] = useState(false);
  const prevSelectedFloorIdRef = useRef<string | null>(null);

  /** `null` = not tracing; `[]` … `[[x,y],…]` while tracing building shell perimeter. */
  const [shellTraceDraft, setShellTraceDraft] = useState<[number, number][] | null>(null);
  /** Same as shell trace but appends a new room polygon on finish. */
  const [roomTraceDraft, setRoomTraceDraft] = useState<[number, number][] | null>(null);
  const [doorPlacement, setDoorPlacement] = useState<DoorPlacementSession>(null);

  const undoPastRef = useRef<string[]>([]);
  const undoFutureRef = useRef<string[]>([]);
  const [histVersion, bumpHistory] = useReducer((n: number) => n + 1, 0);

  const clearUndoStacks = useCallback(() => {
    undoPastRef.current = [];
    undoFutureRef.current = [];
    bumpHistory();
  }, []);

  const commitGeoDoc = useCallback((mutator: (d: FloorplanGeoDoc) => FloorplanGeoDoc) => {
    setGeoDoc((prev) => {
      if (!prev) return prev;
      const before = stableGeoJsonSnapshot(prev);
      const next = mutator(prev);
      const after = stableGeoJsonSnapshot(next);
      if (before === after) return prev;
      undoPastRef.current.push(before);
      if (undoPastRef.current.length > MAX_UNDO) undoPastRef.current.shift();
      undoFutureRef.current = [];
      queueMicrotask(() => bumpHistory());
      return next;
    });
  }, []);

  const undoGeo = useCallback(() => {
    setGeoDoc((cur) => {
      if (!cur) return cur;
      const past = undoPastRef.current;
      if (!past.length) return cur;
      const snap = past.pop()!;
      undoFutureRef.current.unshift(stableGeoJsonSnapshot(cur));
      queueMicrotask(() => bumpHistory());
      return parseToFloorplanGeoDoc(snap);
    });
  }, []);

  const redoGeo = useCallback(() => {
    setGeoDoc((cur) => {
      if (!cur) return cur;
      const fut = undoFutureRef.current;
      if (!fut.length) return cur;
      const snap = fut.shift()!;
      undoPastRef.current.push(stableGeoJsonSnapshot(cur));
      queueMicrotask(() => bumpHistory());
      return parseToFloorplanGeoDoc(snap);
    });
  }, []);

  const canUndoGeo = useMemo(() => undoPastRef.current.length > 0, [histVersion]);
  const canRedoGeo = useMemo(() => undoFutureRef.current.length > 0, [histVersion]);

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
      clearUndoStacks();
      return;
    }
    if (geoJsonRaw === undefined) {
      setGeoDoc({ rooms: [], pois: [] });
      setSelectedRoomIndex(null);
      clearUndoStacks();
      return;
    }
    if (!geoJsonRaw?.trim()) {
      setGeoDoc({ rooms: [], pois: [] });
      setSelectedRoomIndex(null);
      clearUndoStacks();
      return;
    }
    setGeoDoc(parseToFloorplanGeoDoc(geoJsonRaw));
    setSelectedRoomIndex(null);
    clearUndoStacks();
  }, [activeFloor?.floorplanId, geoJsonRaw, clearUndoStacks]);

  useEffect(() => {
    if (!pendingFloorAsset?.uri || !activeFloor?.floorplanId) return;
    setGeoDoc({ rooms: [], pois: [] });
    setSelectedRoomIndex(null);
    setSelectedPoiIndex(null);
    clearUndoStacks();
  }, [pendingFloorAsset?.uri, activeFloor?.floorplanId, clearUndoStacks]);

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
  const isWideLayout = width >= 768; // aligns with BREAKPOINTS.medium (wide shell)
  const mapColumnWidth = isWideLayout
    ? Math.max(260, Math.floor((innerWidth - splitGap) * 0.44))
    : innerWidth;

  const previewHeightRatio = useMemo(() => {
    if (isWideLayout) return 0.52;
    const targetMapPixelHeight = windowHeight * 0.45 - 16;
    return Math.min(1.35, Math.max(0.38, targetMapPixelHeight / mapColumnWidth));
  }, [isWideLayout, windowHeight, mapColumnWidth]);

  const floorplanMapHeight = mapColumnWidth * previewHeightRatio;

  const outlineTraceActive = shellTraceDraft !== null || roomTraceDraft !== null;

  const mapGesturesEnabled =
    !outlineTraceActive &&
    !(editMode && selectedRoomIndex != null) &&
    (activeTab !== 'pins' ? placePoiKind == null : selectedPoiIndex == null);

  const hasRoomPolygons = (geoDoc?.rooms?.length ?? 0) > 0;
  const isTracingShellOutline = shellTraceDraft !== null;
  const isTracingRoomOutline = roomTraceDraft !== null;
  const showPolygonLayer =
    !!activeFloor?.floorplanId &&
    geoDoc != null &&
    !floorplanLoading &&
    (hasRoomPolygons || isTracingShellOutline || isTracingRoomOutline);
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

  const handlePublishRoomsToDb = async () => {
    if (!activeFloor?.floorplanId) return;
    if (hasUnsavedChanges) {
      Alert.alert(
        'Save first',
        'Save the floorplan so the server has the latest room polygons, then publish rooms for booking.',
      );
      return;
    }
    setSelectedRoomIndex(null);
    setEditMode(false);
    try {
      setPublishingRooms(true);
      const res = await unwrap(publishFloorplanRoomsToDb(activeFloor.floorplanId));
      await queryClient.invalidateQueries({ queryKey: ['map-floors'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-map-floors', selectedBuildingId] });
      Alert.alert(
        'Rooms published',
        `Created ${res.createdCount} room(s), updated ${res.updatedCount}. Non-bookable types (e.g. kitchens, restrooms) stay off the booking list unless you mark them bookable in GeoJSON.`,
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Publish failed.';
      Alert.alert('Could not publish rooms', msg);
    } finally {
      setPublishingRooms(false);
    }
  };

  /** Saves GeoJSON when there are local edits, then publishes bookable rooms — use from workspace header. */
  const handleSaveGeoJsonAndPublishRooms = async () => {
    if (!activeFloor?.floorplanId || !geoDoc) return;
    const hadUnsaved = hasUnsavedChanges;
    setSelectedRoomIndex(null);
    setEditMode(false);
    try {
      if (hadUnsaved) {
        setSavingGeo(true);
        const body = buildFloorplanFeatureCollectionString(geoDoc);
        await unwrap(updateFloorplanGeoJson(activeFloor.floorplanId, body));
        await queryClient.invalidateQueries({ queryKey: ['map', 'floorplan', activeFloor.floorplanId] });
        await queryClient.invalidateQueries({ queryKey: ['admin-map-floors', selectedBuildingId] });
        setSavingGeo(false);
      }
      setPublishingRooms(true);
      const res = await unwrap(publishFloorplanRoomsToDb(activeFloor.floorplanId));
      await queryClient.invalidateQueries({ queryKey: ['map-floors'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-map-floors', selectedBuildingId] });
      await queryClient.invalidateQueries({ queryKey: ['admin-floorplan-linked-room'] });
      Alert.alert(
        'Saved & published',
        hadUnsaved
          ? `Floorplan saved. Booking list: created ${res.createdCount} room(s), updated ${res.updatedCount}.`
          : `Booking list synced from the saved floorplan: created ${res.createdCount} room(s), updated ${res.updatedCount}.`,
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save or publish failed.';
      Alert.alert('Could not save / publish', msg);
    } finally {
      setSavingGeo(false);
      setPublishingRooms(false);
    }
  };

  const handleDiscard = () => {
    clearUndoStacks();
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
      commitGeoDoc((prev) => updateVertex(prev, featureIndex, vertexIndex, nx, ny));
    },
    [commitGeoDoc],
  );

  const onAddPoiAt = useCallback(
    (x: number, y: number) => {
      if (!placePoiKind) return;
      commitGeoDoc((d) => addPoi(d ?? { rooms: [], pois: [] }, placePoiKind, x, y, undefined, undefined));
      setPlacePoiKind(null);
    },
    [placePoiKind, commitGeoDoc],
  );

  const onMovePoi = useCallback(
    (index: number, x: number, y: number) => {
      commitGeoDoc((d) => (d ? movePoi(d, index, x, y) : d));
    },
    [commitGeoDoc],
  );

  const appendOutlineDraftTap = useCallback((nx: number, ny: number) => {
    const p = [clamp01(nx), clamp01(ny)] as [number, number];
    const minD = 0.0035;
    const push = (prev: [number, number][] | null) => {
      if (prev == null) return null;
      const last = prev[prev.length - 1];
      if (last && Math.hypot(last[0] - p[0], last[1] - p[1]) < minD) return prev;
      return [...prev, p];
    };
    setShellTraceDraft((sd) => push(sd));
    setRoomTraceDraft((rd) => push(rd));
  }, []);

  const onTranslateWholeFeature = useCallback(
    (featureIndex: number, deltaNx: number, deltaNy: number) => {
      commitGeoDoc((d) => translateFeatureVertices(d, featureIndex, deltaNx, deltaNy));
    },
    [commitGeoDoc],
  );

  const onNudgeEdgeRelease = useCallback(
    (featureIndex: number, edgeStartIndex: number, deltaNx: number, deltaNy: number) => {
      commitGeoDoc((d) => nudgeEdgeAlongNormalFromDrag(d, featureIndex, edgeStartIndex, deltaNx, deltaNy));
    },
    [commitGeoDoc],
  );

  const startShellOutlineTrace = useCallback(() => {
    setPlacePoiKind(null);
    setSelectedPoiIndex(null);
    setDoorPlacement(null);
    setRoomTraceDraft(null);
    setSelectedRoomIndex(null);
    setEditMode(false);
    setShellTraceDraft([]);
    setActiveTab('rooms');
  }, []);

  const cancelShellOutlineTrace = useCallback(() => {
    setShellTraceDraft(null);
  }, []);

  const undoShellOutlinePoint = useCallback(() => {
    setShellTraceDraft((prev) => {
      if (!prev?.length) return prev;
      const next = prev.slice(0, -1);
      return next.length ? next : [];
    });
  }, []);

  const finishShellOutlineTrace = useCallback(() => {
    setShellTraceDraft((prev) => {
      if (prev == null) return prev;
      if (prev.length < 3) {
        Alert.alert('Need more points', 'Place at least three taps along the façade, then finish.');
        return prev;
      }
      const outline = [...prev];
      queueMicrotask(() => {
        commitGeoDoc((doc) => {
          const merged = upsertBuildingShellRing(doc ?? { rooms: [], pois: [] }, outline);
          const si = merged.rooms.findIndex((r) => isBuildingShellFeature(r.roomName ?? ''));
          if (si >= 0) {
            setSelectedRoomIndex(si);
            setEditMode(true);
          }
          return merged;
        });
      });
      return null;
    });
  }, [commitGeoDoc]);

  const startRoomOutlineTrace = useCallback(() => {
    setPlacePoiKind(null);
    setSelectedPoiIndex(null);
    setDoorPlacement(null);
    setShellTraceDraft(null);
    setSelectedRoomIndex(null);
    setEditMode(false);
    setRoomTraceDraft([]);
    setActiveTab('rooms');
  }, []);

  const cancelRoomOutlineTrace = useCallback(() => {
    setRoomTraceDraft(null);
  }, []);

  const undoRoomOutlinePoint = useCallback(() => {
    setRoomTraceDraft((prev) => {
      if (!prev?.length) return prev;
      const next = prev.slice(0, -1);
      return next.length ? next : [];
    });
  }, []);

  const finishRoomOutlineTrace = useCallback(() => {
    setRoomTraceDraft((prev) => {
      if (prev == null) return prev;
      if (prev.length < 3) {
        Alert.alert('Need more points', 'Place at least three corners, then finish.');
        return prev;
      }
      const outline = [...prev];
      queueMicrotask(() => {
        commitGeoDoc((doc) => {
          const merged = appendRoomFromOpenOutline(doc ?? { rooms: [], pois: [] }, outline);
          setSelectedRoomIndex(merged.rooms.length - 1);
          setEditMode(true);
          return merged;
        });
      });
      return null;
    });
  }, [commitGeoDoc]);

  const cancelDoorPlacement = useCallback(() => {
    setDoorPlacement(null);
  }, []);

  const beginDoorPlacementForRoom = useCallback((roomIndex: number) => {
    setPlacePoiKind(null);
    setSelectedPoiIndex(null);
    setShellTraceDraft(null);
    setRoomTraceDraft(null);
    setEditMode(false);
    setDoorPlacement({ roomIndex, first: null });
    setActiveTab('rooms');
  }, []);

  const onDoorPlacementTap = useCallback((nx: number, ny: number) => {
    setDoorPlacement((sess) => {
      if (!sess) return sess;
      const pt: [number, number] = [clamp01(nx), clamp01(ny)];
      if (sess.first == null) return { ...sess, first: pt };
      const a = sess.first;
      queueMicrotask(() => {
        commitGeoDoc((doc) => (doc ? addDoorLineFromTwoTaps(doc, sess.roomIndex, a, pt) : doc));
      });
      return null;
    });
  }, [commitGeoDoc]);

  useEffect(() => {
    setShellTraceDraft(null);
    setRoomTraceDraft(null);
    setDoorPlacement(null);
  }, [activeFloor?.floorplanId]);

  useEffect(() => {
    setDoorPlacement((sess) => {
      if (!sess) return sess;
      if (selectedRoomIndex !== sess.roomIndex) return null;
      return sess;
    });
  }, [selectedRoomIndex]);

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

  const handleCreateBuilding = async () => {
    const name = newBuildingName.trim();
    if (!orgId) return;
    if (!name) {
      Alert.alert('Building name required', 'Enter a name for the new building.');
      return;
    }
    setCreatingBuilding(true);
    try {
      const request = CreateBuildingRequest.fromJS({ name });
      const created = await unwrap(mapsApi.createBuildingForOrganization(orgId, request));
      setNewBuildingName('');
      await queryClient.invalidateQueries({ queryKey: ['admin-map-buildings', orgId] });
      if (created.id) setSelectedBuildingId(created.id);
      Alert.alert('Building created', `"${created.name}" is ready. Add a floor level next.`);
    } catch (e: unknown) {
      Alert.alert('Could not create building', e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setCreatingBuilding(false);
    }
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
    commitGeoDoc,
    undoGeo,
    redoGeo,
    canUndoGeo,
    canRedoGeo,
    editMode,
    setEditMode,
    selectedRoomIndex,
    setSelectedRoomIndex,
    savingGeo,
    publishingRooms,
    handlePublishRoomsToDb,
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
    outlineTraceActive,
    hasRoomPolygons,
    showPolygonLayer,
    showPoiLayer,
    handleChooseFloorplanImage,
    handleRunExtraction,
    handleSaveGeoJson,
    handleSaveGeoJsonAndPublishRooms,
    handleDiscard,
    goToWorkflowChoice,
    onMoveVertex,
    onAddPoiAt,
    onMovePoi,
    confirmCreateBuildingAndLevel,
    handleCreateBuilding,
    newBuildingName,
    setNewBuildingName,
    creatingBuilding,
    handleCreateFloor,
    shellTraceDraft,
    roomTraceDraft,
    doorPlacement,
    startShellOutlineTrace,
    cancelShellOutlineTrace,
    undoShellOutlinePoint,
    finishShellOutlineTrace,
    appendOutlineDraftTap,
    startRoomOutlineTrace,
    cancelRoomOutlineTrace,
    undoRoomOutlinePoint,
    finishRoomOutlineTrace,
    beginDoorPlacementForRoom,
    cancelDoorPlacement,
    onDoorPlacementTap,
    onTranslateWholeFeature,
    onNudgeEdgeRelease,
  };
}

export type FloorplanWorkspaceModel = ReturnType<typeof useFloorplanWorkspace>;
