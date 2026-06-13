import React from 'react';

import { WebMainPaneProvider } from '@/src/context/WebMainPaneContext';
import { useWebMainPaneLayout } from '@/src/hooks/useWebMainPaneLayout';

/** Publishes wide-web main-column bounds for anchored overlays (modals, sheets). */
export function WebMainPaneBridge({ children }: { children: React.ReactNode }) {
  const anchor = useWebMainPaneLayout();
  return <WebMainPaneProvider anchor={anchor}>{children}</WebMainPaneProvider>;
}
