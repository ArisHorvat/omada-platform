import React, { createContext, useContext } from 'react';

/** Normalized GeoJSON (0–1) maps to this pixel rect — matches letterboxed `contain` image. */
export const FloorplanViewerMetricsContext = createContext<{
  contentWidth: number;
  contentHeight: number;
}>({ contentWidth: 0, contentHeight: 0 });

export function useFloorplanViewerMetrics() {
  return useContext(FloorplanViewerMetricsContext);
}
