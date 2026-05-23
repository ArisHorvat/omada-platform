import React from 'react';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import type { FloorplanPoiKind } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import { FLOORPLAN_POI_OTHER_ICON_CHOICES } from '@/src/screens/widgets/map/utils/floorplanPoiCustomIcons';

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

type MarkerProps = Props & { customIconKey?: string | null };

/** POI marker: preset kinds + optional Material icon name for `other` (whitelist in `floorplanPoiCustomIcons`). */
export function FloorplanPoiMarkerIcon({ kind, customIconKey, size, color }: MarkerProps) {
  if (kind === 'other' && customIconKey) {
    const allowed = FLOORPLAN_POI_OTHER_ICON_CHOICES.some((c) => c.material === customIconKey);
    if (allowed) {
      return (
        <MaterialIcons
          name={customIconKey as React.ComponentProps<typeof MaterialIcons>['name']}
          size={size}
          color={color}
        />
      );
    }
  }
  return <FloorplanPoiKindIcon kind={kind} size={size} color={color} />;
}
