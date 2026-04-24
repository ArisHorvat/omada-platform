import React, { useMemo } from 'react';
import { Rect, Text as SvgText } from 'react-native-svg';
import type { AppThemeColors } from '@/src/hooks/useThemeColors';
import { polygonRingBBox } from '@/src/screens/widgets/map/utils/parseFloorplanGeoJson';

type Props = {
  x: number;
  y: number;
  roomName: string;
  colors: AppThemeColors;
  /** Ring in normalized coords — used to keep the pill inside the polygon footprint. */
  ring: [number, number][];
  /** Overlay: theme-aware pill + light text. Vector: compact blueprint-style dark label. */
  variant?: 'overlay' | 'vector';
};

function truncate(name: string, maxLen: number): string {
  const t = name.trim() || 'Room';
  return t.length > maxLen ? `${t.slice(0, maxLen - 1)}…` : t;
}

/**
 * Room name near centroid — compact pill, clamped to stay inside the polygon bounding box.
 */
export function FloorplanRoomLabelText({ x, y, roomName, colors, ring, variant = 'overlay' }: Props) {
  const bbox = useMemo(() => polygonRingBBox(ring), [ring]);
  const maxByPoly = Math.min(0.36, bbox.w * 0.88, bbox.h * 2.2);

  const { display, w, h, fontSize, cx, cy } = useMemo(() => {
    let len = 20;
    let d = truncate(roomName, len);
    let fs = variant === 'vector' ? 0.0145 : 0.017;
    let pillW = Math.min(maxByPoly, 0.018 + d.length * 0.012);
    let pillH = fs * 2.1;
    while (pillW > maxByPoly && len > 6) {
      len -= 2;
      d = truncate(roomName, len);
      pillW = Math.min(maxByPoly, 0.018 + d.length * 0.012);
    }
    fs = Math.min(0.02, Math.max(0.012, Math.min(fs, bbox.h * 0.35)));
    pillH = fs * 2.2;
    pillW = Math.min(maxByPoly, Math.max(pillW, fs * 3));
    let tcx = x;
    let tcy = y;
    tcx = Math.max(bbox.minX + pillW / 2 + 0.004, Math.min(bbox.maxX - pillW / 2 - 0.004, tcx));
    tcy = Math.max(bbox.minY + pillH / 2 + 0.004, Math.min(bbox.maxY - pillH / 2 - 0.004, tcy));
    return { display: d, w: pillW, h: pillH, fontSize: fs, cx: tcx, cy: tcy };
  }, [roomName, maxByPoly, bbox, x, y, variant]);

  const rx = Math.min(0.01, h * 0.25);
  const isVector = variant === 'vector';

  /** Vector: blueprint text only — no pill, no border (per floorplan editor spec). */
  if (isVector) {
    return (
      <SvgText
        x={cx}
        y={cy}
        fontSize={fontSize}
        fill="#334155"
        fontWeight="700"
        textAnchor="middle"
        alignmentBaseline="central"
        pointerEvents="none"
      >
        {display}
      </SvgText>
    );
  }

  /** Solid dark pill so white text reads on both translucent room fills and noisy blueprint imagery. */
  const pillFill = colors.primary ?? '#1E293B';

  return (
    <>
      <Rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        rx={rx}
        ry={rx}
        fill={pillFill}
        stroke="transparent"
        strokeWidth={0}
        pointerEvents="none"
      />
      <SvgText
        x={cx}
        y={cy}
        fontSize={fontSize}
        fill="#ffffff"
        fontWeight="600"
        textAnchor="middle"
        alignmentBaseline="central"
        pointerEvents="none"
      >
        {display}
      </SvgText>
    </>
  );
}
