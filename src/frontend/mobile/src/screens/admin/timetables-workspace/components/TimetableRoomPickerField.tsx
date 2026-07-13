import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import type { AppThemeColors } from '@/src/hooks/useThemeColors';
import { useTimetableRoomPicker } from '../hooks/useTimetableRoomPicker';

type Props = {
  colors: AppThemeColors;
  roomId?: string;
  roomName?: string;
  readOnly?: boolean;
  label?: string;
  onSelect: (roomId: string | undefined, roomName: string | undefined) => void;
  zIndexBase?: number;
};

export function TimetableRoomPickerField({
  colors,
  roomId,
  roomName,
  readOnly,
  label = 'Room (optional)',
  onSelect,
  zIndexBase = 450,
}: Props) {
  const { buildings, rooms, roomsForBuilding, loading } = useTimetableRoomPicker();
  const [buildingPickerOpen, setBuildingPickerOpen] = useState(false);
  const [roomPickerOpen, setRoomPickerOpen] = useState(false);
  const [draftBuildingId, setDraftBuildingId] = useState<string | null>(null);

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.value === roomId),
    [rooms, roomId],
  );

  const effectiveBuildingId = draftBuildingId ?? selectedRoom?.buildingId ?? null;
  const buildingLabel =
    buildings.find((b) => b.value === effectiveBuildingId)?.label ?? 'All buildings';

  const filteredRooms = useMemo(
    () => roomsForBuilding(effectiveBuildingId),
    [effectiveBuildingId, roomsForBuilding],
  );

  if (!loading && rooms.length === 0) return null;

  const openFlow = () => {
    if (readOnly) return;
    if (buildings.length > 0) {
      setDraftBuildingId(selectedRoom?.buildingId ?? null);
      setBuildingPickerOpen(true);
    } else {
      setRoomPickerOpen(true);
    }
  };

  return (
    <>
      <PressClay onPress={openFlow} disabled={readOnly}>
        <ClayView
          depth={1}
          color={colors.card}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 12,
            borderRadius: 12,
            marginBottom: 0,
          }}
        >
          <View style={{ width: 22, alignItems: 'center' }}>
            <Icon name="meeting-room" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="caption" style={{ color: colors.subtle }}>
              {label}
            </AppText>
            <AppText variant="body" numberOfLines={1} style={{ color: roomName ? colors.text : colors.subtle }}>
              {roomName ?? 'Choose building & room'}
            </AppText>
            {selectedRoom?.buildingId && buildings.length > 0 ? (
              <AppText variant="caption" numberOfLines={1} style={{ color: colors.subtle, marginTop: 2 }}>
                {buildingLabel}
              </AppText>
            ) : null}
          </View>
          {!readOnly ? <Icon name="expand-more" size={20} color={colors.subtle} /> : null}
        </ClayView>
      </PressClay>

      <SearchableOptionPickerSheet
        isVisible={buildingPickerOpen}
        onClose={() => setBuildingPickerOpen(false)}
        title="Building"
        options={buildings}
        selected={effectiveBuildingId}
        includeAllOption
        allLabel="All buildings"
        searchPlaceholder="Search buildings…"
        onSelect={(id) => {
          setDraftBuildingId(id);
          setBuildingPickerOpen(false);
          setRoomPickerOpen(true);
        }}
        height={400}
        zIndexBase={zIndexBase}
      />

      <SearchableOptionPickerSheet
        isVisible={roomPickerOpen}
        onClose={() => setRoomPickerOpen(false)}
        title={buildings.length > 0 ? `Room · ${buildingLabel}` : 'Room'}
        options={filteredRooms}
        selected={roomId ?? null}
        includeAllOption
        allLabel="No room"
        searchPlaceholder="Search rooms…"
        onSelect={(id) => {
          const picked = filteredRooms.find((r) => r.value === id) ?? rooms.find((r) => r.value === id);
          onSelect(id ?? undefined, id ? picked?.label : undefined);
          setRoomPickerOpen(false);
        }}
        height={440}
        zIndexBase={zIndexBase + 10}
      />
    </>
  );
}
