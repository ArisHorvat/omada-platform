import React from 'react';
import { Line } from 'react-native-svg';
import type { DoorLineSegment } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import { hairlineStrokeInViewBox } from '@/src/screens/widgets/map/utils/floorplanSemanticStyles';

type Props = {
  segments: DoorLineSegment[] | undefined;
  width: number;
  height: number;
  strokePx?: number;
  stroke?: string;
  keyPrefix: string;
  /**
   * When true, segment endpoints are normalized [0..1] and are mapped to SVG pixels (`× width/height`).
   * When false (default), endpoints are in the same coordinate space as the parent `<Svg>` (e.g. 0–1 viewBox).
   */
  mapNormalizedToPixels?: boolean;
};

/** Thin doorway / threshold strokes stored on room features (normalized coordinates in data). */
export function FloorplanDoorwayLineSegments({
  segments,
  width,
  height,
  strokePx = 1.35,
  stroke = '#262626',
  keyPrefix,
  mapNormalizedToPixels = false,
}: Props) {
  if (!segments?.length) return null;

  const strokeWidth = mapNormalizedToPixels
    ? strokePx
    : hairlineStrokeInViewBox(strokePx, width, height);

  return (
    <>
      {segments.map((s, i) => {
        const x1 = mapNormalizedToPixels ? s.a[0] * width : s.a[0];
        const y1 = mapNormalizedToPixels ? s.a[1] * height : s.a[1];
        const x2 = mapNormalizedToPixels ? s.b[0] * width : s.b[0];
        const y2 = mapNormalizedToPixels ? s.b[1] * height : s.b[1];
        return (
          <Line
            key={`${keyPrefix}-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={stroke}
            strokeOpacity={0.92}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            pointerEvents="none"
          />
        );
      })}
    </>
  );
}
