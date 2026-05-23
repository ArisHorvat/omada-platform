import React, { useMemo } from 'react';
import { G, Text as SvgText, TSpan } from 'react-native-svg';
import type { AppThemeColors } from '@/src/hooks/useThemeColors';
import { polygonRingBBox } from '@/src/screens/widgets/map/utils/parseFloorplanGeoJson';

type Props = {
  x: number;
  y: number;
  roomName: string;
  colors: AppThemeColors;
  /** Ring in normalized coords — used to keep the pill inside the polygon footprint. */
  ring: [number, number][];
  /**
   * `indoor-map` — indoor floor slab: high-contrast label for busy/free tints & dark backdrop.
   * `enterprise` — interactive pastel floors; lighter label.
   */
  variant?: 'overlay' | 'vector' | 'enterprise' | 'indoor-map';
  /**
   * When set, `x` / `y` are pixel coordinates in an `<Svg width={w} height={h}>` with no viewBox;
   * layout math still uses the normalized `ring`, then scales to pixels for drawing.
   */
  svgPixelSize?: { w: number; h: number };
  /** Indoor map: split long names onto two lines when the footprint is wide/tall enough. */
  allowTwoLineRoomName?: boolean;
};

function truncate(name: string, maxLen: number): string {
  const t = name.replace(/\s+/g, ' ').trim() || 'Room';
  return t.length > maxLen ? `${t.slice(0, maxLen - 1)}…` : t;
}

/** Word-aware two-line split for SVG labels; returns null if a single line is enough or split is unsafe. */
function trySplitRoomNameTwoLines(raw: string, maxFirstLineChars: number): [string, string] | null {
  const t = raw.replace(/\s+/g, ' ').trim() || 'Room';
  if (t.length <= maxFirstLineChars + 2) return null;
  let breakAt = t.lastIndexOf(' ', maxFirstLineChars);
  if (breakAt < 5) breakAt = t.indexOf(' ', maxFirstLineChars);
  if (breakAt < 1) return null;
  const a = t.slice(0, breakAt).trimEnd();
  const b = t.slice(breakAt + 1).trim();
  if (!b || a.length < 3) return null;
  if (a.length > maxFirstLineChars + 10 || b.length > maxFirstLineChars + 14) return null;
  return [a, b];
}

/**
 * Room label at centroid — overlay uses a pill; vector mode floats clean typography on fills.
 */
export function FloorplanRoomLabelText({
  x,
  y,
  roomName,
  colors,
  ring,
  variant = 'overlay',
  svgPixelSize,
  allowTwoLineRoomName = false,
}: Props) {
  const pw = svgPixelSize?.w;
  const ph = svgPixelSize?.h;
  const nx = pw != null && ph != null && pw > 0 && ph > 0 ? x / pw : x;
  const ny = pw != null && ph != null && pw > 0 && ph > 0 ? y / ph : y;

  const bbox = useMemo(() => polygonRingBBox(ring), [ring]);

  // Aggressive declutter for small rooms (closets, tiny offices, hall slivers).
  if (bbox.w < 0.028 || bbox.h < 0.028) return null;

  const vectorLayout = useMemo(() => {
    if (variant !== 'vector' && variant !== 'enterprise' && variant !== 'indoor-map') return null;
    const indoorMap = variant === 'indoor-map';
    const enterpriseSizing = variant === 'enterprise' || indoorMap;
    let len = 28;
    let d = truncate(roomName, len);
    let fs = enterpriseSizing
      ? indoorMap
        ? Math.min(0.021, Math.max(0.0085, Math.min(0.0145, bbox.h * 0.32)))
        : Math.min(0.017, Math.max(0.007, Math.min(0.0125, bbox.h * 0.28)))
      : Math.min(0.02, Math.max(0.0115, Math.min(0.015, bbox.h * 0.34)));
    const estW = (s: string, f: number) => s.length * f * 0.52;
    while (estW(d, fs) > bbox.w * 0.9 && len > 4) {
      len -= 2;
      d = truncate(roomName, len);
    }
    fs = Math.min(fs, (bbox.w * 0.9) / Math.max(1, d.length * 0.52));
    if (variant === 'enterprise') fs = Math.min(fs, bbox.w * 0.8);
    if (indoorMap) {
      fs = Math.min(fs, bbox.w * 0.88 / Math.max(1, d.length * 0.5), bbox.h * 0.34, bbox.w * 0.1);
      if (bbox.w < 0.065 || bbox.h < 0.055) fs = Math.min(fs, bbox.h * 0.38, bbox.w * 0.12);
    }

    let twoLine: [string, string] | null = null;
    const pw0 = svgPixelSize?.w;
    const ph0 = svgPixelSize?.h;
    if (indoorMap && allowTwoLineRoomName && pw0 != null && ph0 != null && pw0 > 0 && ph0 > 0) {
      const fsPx = fs * ph0;
      const maxFirst = Math.max(
        10,
        Math.min(24, Math.floor((bbox.w * pw0 * 0.8) / Math.max(7, fsPx * 0.48))),
      );
      const split = trySplitRoomNameTwoLines(roomName, maxFirst);
      const twoLineHNorm = (fsPx * 2.35) / ph0;
      if (split && bbox.h >= Math.max(0.044, twoLineHNorm * 1.05) && bbox.w >= 0.05 && bbox.w * pw0 >= 52) {
        twoLine = split;
        fs = Math.min(fs, (bbox.h * 0.82) / 2.55, bbox.w * 0.11);
      }
    }

    const edgePad = Math.max(fs * 0.72, bbox.w * 0.024, bbox.h * 0.024, 0.008);
    const cx = Math.max(bbox.minX + edgePad, Math.min(bbox.maxX - edgePad, nx));
    const cy = Math.max(bbox.minY + edgePad, Math.min(bbox.maxY - edgePad, ny));

    return { display: d, fontSize: fs, cx, cy, twoLine };
  }, [variant, roomName, bbox, nx, ny, allowTwoLineRoomName, svgPixelSize?.w, svgPixelSize?.h]);

  const overlayLayout = useMemo(() => {
    if (variant === 'vector' || variant === 'enterprise' || variant === 'indoor-map') return null;
    let len = 22;
    let d = truncate(roomName, len);
    // Raster floorplans are usually light; keep labels readable (do not tie to UI dark/light theme).
    let fs = 0.02;
    // clamp to polygon bounds without drawing a pill background
    while (d.length > 6 && d.length * fs * 0.52 > bbox.w * 0.88) {
      len -= 2;
      d = truncate(roomName, Math.max(6, len));
    }
    fs = Math.min(0.024, Math.max(0.0145, Math.min(fs, bbox.h * 0.38)));
    fs = Math.min(fs, (bbox.w * 0.88) / Math.max(1, d.length * 0.52));
    const edgePad = Math.max(fs * 0.72, bbox.w * 0.024, bbox.h * 0.024, 0.008);
    const cx = Math.max(bbox.minX + edgePad, Math.min(bbox.maxX - edgePad, nx));
    const cy = Math.max(bbox.minY + edgePad, Math.min(bbox.maxY - edgePad, ny));
    return { display: d, fontSize: fs, cx, cy };
  }, [roomName, bbox, nx, ny, variant]);

  if (variant === 'indoor-map' && vectorLayout) {
    const cx = pw != null ? vectorLayout.cx * pw : vectorLayout.cx;
    const cy = ph != null ? vectorLayout.cy * ph : vectorLayout.cy;
    const fs = ph != null ? vectorLayout.fontSize * ph : vectorLayout.fontSize;
    const sw = fs * (ph != null ? 0.2 : 0.22);
    /** Busy/free tints + slab: keep contrast in both UI light/dark modes. */
    const halo = colors.isDark ? '#020617' : '#0f172a';
    const core = colors.isDark ? '#f8fafc' : '#f8fafc';
    const tl = vectorLayout.twoLine;
    const lineDy = fs * 1.16;
    const yTop = tl ? cy - lineDy * 0.48 : cy;
    return (
      <G pointerEvents="none">
        <SvgText
          x={cx}
          y={yTop}
          fontSize={fs}
          fill={halo}
          stroke={halo}
          strokeWidth={sw}
          fontWeight="800"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {tl ? (
            <>
              <TSpan>{tl[0]}</TSpan>
              <TSpan x={cx} dy={lineDy}>
                {tl[1]}
              </TSpan>
            </>
          ) : (
            vectorLayout.display
          )}
        </SvgText>
        <SvgText
          x={cx}
          y={yTop}
          fontSize={fs}
          fill={core}
          stroke="transparent"
          fontWeight="700"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {tl ? (
            <>
              <TSpan>{tl[0]}</TSpan>
              <TSpan x={cx} dy={lineDy}>
                {tl[1]}
              </TSpan>
            </>
          ) : (
            vectorLayout.display
          )}
        </SvgText>
      </G>
    );
  }

  if ((variant === 'vector' || variant === 'enterprise') && vectorLayout) {
    const cx = pw != null ? vectorLayout.cx * pw : vectorLayout.cx;
    const cy = ph != null ? vectorLayout.cy * ph : vectorLayout.cy;
    const fs = ph != null ? vectorLayout.fontSize * ph : vectorLayout.fontSize;
    return (
      <SvgText
        x={cx}
        y={cy}
        fontSize={fs}
        fill={variant === 'enterprise' ? '#E2E8F0' : '#475569'}
        fontWeight={variant === 'enterprise' ? 'bold' : '600'}
        textAnchor="middle"
        alignmentBaseline="middle"
        pointerEvents="none"
      >
        {vectorLayout.display}
      </SvgText>
    );
  }

  if (!overlayLayout) return null;

  const textX = pw != null ? overlayLayout.cx * pw : overlayLayout.cx;
  const textY = ph != null ? overlayLayout.cy * ph : overlayLayout.cy;
  const fsPx = ph != null ? overlayLayout.fontSize * ph : overlayLayout.fontSize;
  /** Light floorplan scans: always dark glyphs + halo; independent of UI `colors.isDark`. */
  const textFs = ph != null ? Math.max(11, Math.min(26, fsPx)) : fsPx;

  const overlayFill = '#020617';
  const haloStroke = '#FFFFFF';

  return (
    <G pointerEvents="none">
      <SvgText
        x={textX}
        y={textY}
        fontSize={textFs}
        fill={haloStroke}
        stroke={haloStroke}
        strokeWidth={ph != null ? Math.max(2.75, textFs * 0.22) : 0.008}
        fontWeight="800"
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        {overlayLayout.display}
      </SvgText>
      <SvgText
        x={textX}
        y={textY}
        fontSize={textFs}
        fill={overlayFill}
        stroke="transparent"
        fontWeight="800"
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        {overlayLayout.display}
      </SvgText>
    </G>
  );
}
