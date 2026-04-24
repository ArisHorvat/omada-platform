import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FloorplanTheme = {
  /** Negative space — reads as solid walls around rooms. */
  backgroundColor: string;
  roomFill: string;
  roomStroke: string;
  doorFill: string;
  windowFill: string;
};

export type FloorplanThemedViewerProps = {
  geoJson: GeoJsonFeatureCollectionLike | null | undefined;
  width: number;
  height: number;
  theme: FloorplanTheme;
};

/** Minimal GeoJSON shape for AI output (rooms, doors, windows). */
export type GeoJsonFeatureCollectionLike = {
  type?: string;
  features?: unknown;
};

type PolygonGeometry = {
  type: 'Polygon';
  coordinates: number[][][];
};

type GeoJsonFeatureLike = {
  type?: string;
  id?: string | number;
  geometry?: PolygonGeometry | null;
  properties?: Record<string, unknown> | null;
};

// ---------------------------------------------------------------------------
// GeoJSON helpers
// ---------------------------------------------------------------------------

function getOuterRing(geometry: unknown): number[][] | null {
  if (!geometry || typeof geometry !== 'object') return null;
  const g = geometry as { type?: string; coordinates?: unknown };
  if (g.type !== 'Polygon' || !Array.isArray(g.coordinates)) return null;
  const outer = g.coordinates[0];
  if (!Array.isArray(outer) || outer.length < 3) return null;
  const ring: number[][] = [];
  for (const p of outer) {
    if (!Array.isArray(p) || p.length < 2) return null;
    ring.push([Number(p[0]), Number(p[1])]);
  }
  return ring;
}

function classifyFeatureKind(props: Record<string, unknown> | null | undefined): 'room' | 'door' | 'window' {
  const label = String(props?.roomName ?? props?.class_name ?? '')
    .trim()
    .toLowerCase();
  if (label === 'door') return 'door';
  if (label === 'window') return 'window';
  return 'room';
}

function isFeatureCollection(value: unknown): value is { type: string; features: unknown[] } {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: string }).type === 'FeatureCollection' &&
    Array.isArray((value as { features?: unknown }).features)
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * “Digital twin” view: renders normalized GeoJSON polygons on a solid wall-colored canvas
 * (no raster floorplan image).
 */
export function FloorplanThemedViewer({ geoJson, width, height, theme }: FloorplanThemedViewerProps) {
  /**
   * Maps normalized GeoJSON coordinates [0..1] to the SVG canvas in pixels.
   */
  const scaleNormalizedRingToSvgPoints = useCallback(
    (ring: number[][], canvasWidth: number, canvasHeight: number): string | null => {
      if (!ring.length || canvasWidth <= 0 || canvasHeight <= 0) return null;
      const parts: string[] = [];
      for (const pt of ring) {
        if (!Array.isArray(pt) || pt.length < 2) return null;
        const x = Number(pt[0]);
        const y = Number(pt[1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        parts.push(`${x * canvasWidth},${y * canvasHeight}`);
      }
      return parts.join(' ');
    },
    [],
  );

  const polygons = useMemo(() => {
    if (!isFeatureCollection(geoJson)) return [];

    const items: {
      key: string;
      points: string;
      kind: 'room' | 'door' | 'window';
    }[] = [];

    geoJson.features.forEach((raw, index) => {
      if (!raw || typeof raw !== 'object') return;
      const f = raw as GeoJsonFeatureLike;
      if (f.type !== 'Feature') return;
      const ring = getOuterRing(f.geometry);
      if (!ring) return;
      const points = scaleNormalizedRingToSvgPoints(ring, width, height);
      if (!points) return;
      const props = f.properties ?? undefined;
      const kind = classifyFeatureKind(props);
      const key = String(f.id ?? `feature-${index}`);
      items.push({ key, points, kind });
    });

    return items;
  }, [geoJson, width, height, scaleNormalizedRingToSvgPoints]);

  const emptyOrInvalid = width <= 0 || height <= 0 || !isFeatureCollection(geoJson);

  if (emptyOrInvalid) {
    return (
      <View style={{ width, height, backgroundColor: theme.backgroundColor }} accessibilityRole="image" />
    );
  }

  return (
    <View
      style={{ width, height, backgroundColor: theme.backgroundColor }}
      accessibilityRole="image"
      accessibilityLabel="Floorplan vector map"
    >
      <Svg width={width} height={height}>
        {polygons.map(({ key, points, kind }) => {
          if (kind === 'door') {
            return (
              <Polygon
                key={key}
                points={points}
                fill={theme.doorFill}
                stroke="none"
              />
            );
          }
          if (kind === 'window') {
            return (
              <Polygon
                key={key}
                points={points}
                fill={theme.windowFill}
                stroke="none"
              />
            );
          }
          return (
            <Polygon
              key={key}
              points={points}
              fill={theme.roomFill}
              stroke={theme.roomStroke}
              strokeWidth={2}
            />
          );
        })}
      </Svg>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Preset themes
// ---------------------------------------------------------------------------

export const ModernCorporateTheme: FloorplanTheme = {
  backgroundColor: '#2d2d32',
  roomFill: '#ffffff',
  roomStroke: '#c5c8ce',
  doorFill: '#2563eb',
  windowFill: '#93c5fd',
};

export const BlueprintTheme: FloorplanTheme = {
  backgroundColor: '#0c1e3d',
  roomFill: '#1e3a5f',
  roomStroke: '#e8f0ff',
  doorFill: '#3b82f6',
  windowFill: '#bfdbfe',
};
