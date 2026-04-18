import React from 'react';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import type { FloorplanPoiKind } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';

type Props = { kind: FloorplanPoiKind; size: number; color: string };

/** Icons for floorplan POI kinds (editor + indoor map). */
export function FloorplanPoiKindIcon({ kind, size, color }: Props) {
  switch (kind) {
    case 'entrance':
      return <MaterialIcons name="sensor-door" size={size} color={color} />;
    case 'exit':
      return <MaterialIcons name="logout" size={size} color={color} />;
    case 'elevator':
      return <MaterialIcons name="elevator" size={size} color={color} />;
    case 'stairs':
      return <MaterialIcons name="stairs" size={size} color={color} />;
    case 'restroom':
      return <MaterialIcons name="wc" size={size} color={color} />;
    default:
      return <Ionicons name="location" size={size} color={color} />;
  }
}
