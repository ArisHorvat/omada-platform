import type { PickerOption } from '@/src/components/filters/OptionPickerSheet';
import type { IconName } from '@/src/components/ui/Icon';

/** Material icon per backend `RoomAmenity` name (fallback-safe names). */
export const ROOM_AMENITY_ICONS: Record<string, IconName> = {
  VideoProjector: 'videocam',
  InteractiveSmartBoard: 'developer-board',
  WirelessPresentation: 'cast',
  VideoConference: 'video-call',
  MicrophoneArray: 'mic',
  DocumentCamera: 'document-scanner',
  HearingLoop: 'hearing',
  ComputerWorkstations: 'computer',
  WhiteboardWall: 'gesture',
  Kitchenette: 'kitchen',
  AcousticPanels: 'graphic-eq',
  DimmingLights: 'brightness-medium',
};

export type RoomAmenityChipModel = { id: string; label: string; icon: IconName };

/** Matches backend `RoomAmenity` enum names (order preserved for pickers). */
export const ROOM_AMENITY_LABELS: Record<string, string> = {
  VideoProjector: 'Video projector',
  InteractiveSmartBoard: 'Interactive smart board',
  WirelessPresentation: 'Wireless presentation',
  VideoConference: 'Video conference',
  MicrophoneArray: 'Microphone array',
  DocumentCamera: 'Document camera',
  HearingLoop: 'Hearing loop',
  ComputerWorkstations: 'Computer workstations',
  WhiteboardWall: 'Whiteboard wall',
  Kitchenette: 'Kitchenette',
  AcousticPanels: 'Acoustic panels',
  DimmingLights: 'Dimming lights',
};

export const ROOM_AMENITY_PICKER_OPTIONS: PickerOption<string>[] = Object.keys(ROOM_AMENITY_LABELS).map((key) => ({
  value: key,
  label: ROOM_AMENITY_LABELS[key],
  icon: 'build',
}));

export function formatAmenityKeyLabel(key: string): string {
  return ROOM_AMENITY_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^\s+/, '').trim();
}

/** Chips with icons for UI (enum keys → icon + label; legacy lines → generic icon). */
export function roomAmenityChips(room: {
  amenities?: string[] | null;
  resources?: string;
  customAttributes?: string;
}): RoomAmenityChipModel[] {
  const raw = room.amenities?.filter(Boolean) ?? [];
  if (raw.length > 0) {
    return raw.slice(0, 12).map((k, i) => ({
      id: `a-${k}-${i}`,
      label: formatAmenityKeyLabel(k),
      icon: ROOM_AMENITY_ICONS[k] ?? 'room',
    }));
  }

  const lines = roomAmenityTags(room);
  return lines.map((label, i) => ({
    id: `l-${i}-${label.slice(0, 12)}`,
    label,
    icon: 'label-important' as IconName,
  }));
}

/** Display chips: prefer API `amenities` (enum names); fall back to legacy text / JSON. */
export function roomAmenityTags(room: {
  amenities?: string[] | null;
  resources?: string;
  customAttributes?: string;
}): string[] {
  const raw = room.amenities?.filter(Boolean) ?? [];
  if (raw.length > 0) return raw.slice(0, 8).map((k) => formatAmenityKeyLabel(k));

  const fromResources = (room.resources ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromResources.length > 0) return fromResources.slice(0, 8);
  const ca = (room.customAttributes ?? '').trim();
  if (!ca) return [];
  try {
    const o = JSON.parse(ca) as Record<string, unknown>;
    const keys = Object.keys(o).filter((k) => typeof o[k] === 'string' || typeof o[k] === 'number');
    return keys.slice(0, 6).map((k) => `${k}: ${String(o[k])}`);
  } catch {
    return ca.length > 48 ? [`${ca.slice(0, 45)}…`] : [ca];
  }
}
