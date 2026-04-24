import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, Pressable, StyleSheet, View } from 'react-native';
import type { EditablePoiFeature, FloorplanPoiKind } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import { AppText } from '@/src/components/ui';
import { useFloorplanViewerMetrics } from '@/src/screens/widgets/map/components/floorplanViewerMetrics';
import { FloorplanPoiKindIcon } from '@/src/screens/widgets/map/components/floorplanPoiIcons';

const PIN_BOX = 32;
const TOUCH = 54;

function colorForKind(k: FloorplanPoiKind): string {
  switch (k) {
    case 'entrance':
      return '#2563eb';
    case 'exit':
      return '#16a34a';
    case 'elevator':
      return '#7c3aed';
    case 'stairs':
      return '#ea580c';
    case 'restroom':
      return '#0d9488';
    default:
      return '#64748b';
  }
}

type Props = {
  pois: EditablePoiFeature[];
  placeKind: FloorplanPoiKind | null;
  selectedPoiIndex: number | null;
  onMovePoi: (index: number, x: number, y: number) => void;
  onSelectPoi: (index: number | null) => void;
  width?: number;
  height?: number;
};

export function FloorplanPoiEditorOverlay({
  pois,
  placeKind,
  selectedPoiIndex,
  onMovePoi,
  onSelectPoi,
  width: wProp,
  height: hProp,
}: Props) {
  const metrics = useFloorplanViewerMetrics();
  const [layout, setLayout] = useState({ w: 0, h: 0 });

  const w =
    layout.w > 0
      ? layout.w
      : metrics.contentWidth > 0
        ? metrics.contentWidth
        : (wProp ?? 0);
  const h =
    layout.h > 0
      ? layout.h
      : metrics.contentHeight > 0
        ? metrics.contentHeight
        : (hProp ?? 0);

  const safeW = Math.max(1, w);
  const safeH = Math.max(1, h);

  const webNoSelect =
    Platform.OS === 'web'
      ? ({ userSelect: 'none', WebkitUserSelect: 'none' } as Record<string, string>)
      : {};

  return (
    <View
      style={[StyleSheet.absoluteFillObject, { zIndex: 25 }, webNoSelect]}
      pointerEvents="box-none"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) setLayout({ w: width, h: height });
      }}
      collapsable={false}
    >
      {selectedPoiIndex != null ? (
        <Pressable
          accessibilityLabel="Deselect pin"
          onPress={() => onSelectPoi(null)}
          style={[StyleSheet.absoluteFillObject, { zIndex: 1 }]}
        />
      ) : null}
      {pois.map((p, index) => (
        <DraggablePoiPin
          key={p.pinId}
          poi={p}
          index={index}
          width={safeW}
          height={safeH}
          selected={selectedPoiIndex === index}
          onMovePoi={onMovePoi}
          onSelectPoi={onSelectPoi}
          placeMode={!!placeKind}
          zIndex={selectedPoiIndex === index ? 42 : 22}
        />
      ))}
    </View>
  );
}

function DraggablePoiPin({
  poi,
  index,
  width,
  height,
  selected,
  onMovePoi,
  onSelectPoi,
  placeMode,
  zIndex,
}: {
  poi: EditablePoiFeature;
  index: number;
  width: number;
  height: number;
  selected: boolean;
  onMovePoi: (index: number, x: number, y: number) => void;
  onSelectPoi: (index: number | null) => void;
  placeMode: boolean;
  zIndex: number;
}) {
  const start = useRef({ x: poi.x, y: poi.y });
  const [drag, setDrag] = useState({ dx: 0, dy: 0 });

  const px = poi.x * width + drag.dx;
  const py = poi.y * height + drag.dy;
  const bg = colorForKind(poi.pinKind);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !placeMode,
        onStartShouldSetPanResponderCapture: () => !placeMode,
        onMoveShouldSetPanResponderCapture: () => !placeMode,
        onPanResponderGrant: () => {
          start.current = { x: poi.x, y: poi.y };
          setDrag({ dx: 0, dy: 0 });
          onSelectPoi(index);
        },
        onPanResponderMove: (_, g) => {
          setDrag({ dx: g.dx, dy: g.dy });
        },
        onPanResponderRelease: (_, g) => {
          const nx = Math.max(0, Math.min(1, start.current.x + g.dx / width));
          const ny = Math.max(0, Math.min(1, start.current.y + g.dy / height));
          onMovePoi(index, nx, ny);
          setDrag({ dx: 0, dy: 0 });
        },
        onPanResponderTerminate: (_, g) => {
          const nx = Math.max(0, Math.min(1, start.current.x + g.dx / width));
          const ny = Math.max(0, Math.min(1, start.current.y + g.dy / height));
          onMovePoi(index, nx, ny);
          setDrag({ dx: 0, dy: 0 });
        },
      }),
    [poi.x, poi.y, width, height, index, onMovePoi, onSelectPoi, placeMode],
  );

  return (
    <View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        left: px - TOUCH / 2,
        top: py - TOUCH / 2,
        width: TOUCH,
        height: TOUCH,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex,
      }}
    >
      <View
        style={{
          width: PIN_BOX,
          height: PIN_BOX,
          borderRadius: PIN_BOX / 2,
          backgroundColor: bg,
          borderWidth: selected ? 3 : 2,
          borderColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.35,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <FloorplanPoiKindIcon kind={poi.pinKind} size={18} color="#fff" />
      </View>
      <View style={{ position: 'absolute', top: -44, maxWidth: 140, alignItems: 'center' }} pointerEvents="none">
        <AppText
          variant="caption"
          numberOfLines={1}
          style={{
            fontSize: 11,
            color: '#0f172a',
            backgroundColor: 'rgba(255,255,255,0.95)',
            overflow: 'hidden',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
          }}
        >
          {poi.label || poi.pinKind}
        </AppText>
      </View>
    </View>
  );
}
