import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  iconKey?: string | null;
  size: number;
  color: string;
};

/** Small room glyph for map overlays (matches `FLOORPLAN_ROOM_MAP_ICON_PRESETS`). */
export function FloorplanRoomMapGlyph({ iconKey, size, color }: Props) {
  if (!iconKey?.trim()) return null;
  switch (iconKey) {
    case 'meeting':
      return <MaterialIcons name="groups" size={size} color={color} />;
    case 'classroom':
      return <MaterialIcons name="school" size={size} color={color} />;
    case 'office':
      return <MaterialIcons name="business" size={size} color={color} />;
    case 'lab':
      return <MaterialIcons name="science" size={size} color={color} />;
    case 'computer':
      return <MaterialIcons name="computer" size={size} color={color} />;
    case 'event':
      return <MaterialIcons name="event" size={size} color={color} />;
    case 'library':
      return <MaterialIcons name="local-library" size={size} color={color} />;
    default:
      return <MaterialIcons name="meeting-room" size={size} color={color} />;
  }
}
