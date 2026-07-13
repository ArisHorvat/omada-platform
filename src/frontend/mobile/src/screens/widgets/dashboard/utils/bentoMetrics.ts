import { Platform } from 'react-native';

import type { BentoColumnCount } from './bentoLayout';

export interface BentoMetrics {
  columns: BentoColumnCount;
  smallWidth: number;
  largeWidth: number;
  smallHeight: number;
  largeHeight: number;
  gridWidth: number;
  gap: number;
}

export function getBentoMetrics(
  availableWidth: number,
  options: { breakpointWide: boolean; isWideShell: boolean },
): BentoMetrics {
  const gap = 12;
  const gridWidth = Math.max(0, availableWidth);
  const isWebWide = Platform.OS === 'web' && options.isWideShell;

  const columns: BentoColumnCount =
    options.breakpointWide || isWebWide ? 3 : 2;

  const smallWidth =
    columns === 3
      ? (gridWidth - gap * 2) / 3
      : (gridWidth - gap) / 2;

  const largeWidth = gridWidth;
  const smallHeight = Math.min(Math.round(smallWidth * 0.92), 168);
  const largeHeight = Math.min(smallHeight * 2 + gap, 340);

  return {
    columns,
    smallWidth,
    largeWidth,
    smallHeight,
    largeHeight,
    gridWidth,
    gap,
  };
}
