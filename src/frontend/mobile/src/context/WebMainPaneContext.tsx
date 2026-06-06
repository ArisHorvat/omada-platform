import React, { createContext, useContext } from 'react';

import type { WebOverlayAnchor } from '@/src/hooks/usePaneOverlayAnchor';

const WebMainPaneContext = createContext<WebOverlayAnchor | null>(null);

export function useWebMainPaneAnchor(): WebOverlayAnchor | null {
  return useContext(WebMainPaneContext);
}

export function WebMainPaneProvider({
  anchor,
  children,
}: {
  anchor: WebOverlayAnchor | null;
  children: React.ReactNode;
}) {
  return <WebMainPaneContext.Provider value={anchor}>{children}</WebMainPaneContext.Provider>;
}
