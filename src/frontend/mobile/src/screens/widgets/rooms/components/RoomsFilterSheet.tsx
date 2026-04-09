import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, Dimensions } from 'react-native';
import { FilterBottomSheet } from '@/src/components/filters/FilterBottomSheet';
import { OptionPickerSheet, type PickerOption } from '@/src/components/filters/OptionPickerSheet';
import { MultiOptionPickerSheet } from '@/src/components/filters/MultiOptionPickerSheet';
import { PressClay } from '@/src/components/animations';
import { ClayView, AppText, Icon } from '@/src/components/ui';
import { ClayDatePicker } from '@/src/components/ui/ClayDatePicker';
import { ClayTimeSpinner } from '@/src/components/ui/ClayTimeSpinner';
import { useThemeColors } from '@/src/hooks';
import type { BuildingDto } from '@/src/api/generatedClient';
import { ROOM_AMENITY_PICKER_OPTIONS, formatAmenityKeyLabel } from '../utils/roomAmenityTags';

export type RoomsFilterValues = {
  searchTerm: string;
  minCapacity: number | undefined;
  buildingIds: string[];
  amenityKeys: string[];
  eventTypeId: string | undefined;
  date: Date;
  startTime: Date;
  endTime: Date;
};

type PickerKey = null | 'buildings' | 'amenities' | 'capacity' | 'eventType';

interface Props {
  visible: boolean;
  onClose: () => void;
  applied: RoomsFilterValues;
  onApply: (next: RoomsFilterValues) => void;
  onReset: () => void;
  buildings: BuildingDto[];
  eventTypes: { id: string; name: string }[];
  contentInsetBottom?: number;
}

export function RoomsFilterSheet({
  visible,
  onClose,
  applied,
  onApply,
  onReset,
  buildings,
  eventTypes,
  contentInsetBottom = 0,
}: Props) {
  const colors = useThemeColors();
  const winH = Dimensions.get('window').height;
  const filterSheetHeight = Math.round(winH * 0.88);
  const pickerHeight = Math.round(winH * 0.58);

  const [draft, setDraft] = useState<RoomsFilterValues>(applied);
  const [picker, setPicker] = useState<PickerKey>(null);

  useEffect(() => {
    if (!visible) return;
    setDraft({ ...applied });
    setPicker(null);
  }, [visible, applied]);

  const buildingOptions: PickerOption<string>[] = useMemo(
    () =>
      buildings.map((b) => ({
        value: b.id,
        label: b.name,
        icon: 'apartment',
      })),
    [buildings],
  );

  const capacityOptions: PickerOption<number>[] = useMemo(
    () =>
      [4, 8, 12, 20, 40].map((n) => ({
        value: n,
        label: `${n}+ seats`,
        icon: 'group',
      })),
    [],
  );

  const eventTypeOptions: PickerOption<string>[] = useMemo(
    () =>
      eventTypes.map((t) => ({
        value: t.id,
        label: t.name,
        icon: 'event',
      })),
    [eventTypes],
  );

  const buildingsLabel = useMemo(() => {
    if (draft.buildingIds.length === 0) return 'Any building';
    if (draft.buildingIds.length === 1) {
      return buildings.find((b) => b.id === draft.buildingIds[0])?.name ?? '1 building';
    }
    return `${draft.buildingIds.length} buildings`;
  }, [draft.buildingIds, buildings]);

  const amenitiesLabel = useMemo(() => {
    if (draft.amenityKeys.length === 0) return 'Any amenities';
    if (draft.amenityKeys.length === 1) return formatAmenityKeyLabel(draft.amenityKeys[0]);
    return `${draft.amenityKeys.length} amenities (must have all)`;
  }, [draft.amenityKeys]);

  const capacityLabel =
    draft.minCapacity == null ? 'Any capacity' : `${draft.minCapacity}+ seats`;

  const eventTypeLabel =
    draft.eventTypeId == null
      ? 'Any event type'
      : eventTypes.find((t) => t.id === draft.eventTypeId)?.name ?? 'Event type';

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  return (
    <>
      <FilterBottomSheet
        isVisible={visible}
        onClose={onClose}
        title="Room filters"
        onApply={handleApply}
        onReset={handleReset}
        height={filterSheetHeight}
        contentInsetBottom={contentInsetBottom}
      >
        <View style={styles.gap}>
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6 }}>
            Name or location
          </AppText>
          <ClayView depth={3} color={colors.card} style={styles.searchWrap}>
            <Icon name="search" size={20} color={colors.subtle} style={{ marginRight: 8 }} />
            <TextInput
              value={draft.searchTerm}
              onChangeText={(searchTerm) => setDraft((d) => ({ ...d, searchTerm }))}
              placeholder="Search rooms…"
              placeholderTextColor={colors.subtle}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </ClayView>

          <PressClay onPress={() => setPicker('buildings')}>
            <ClayView depth={4} color={colors.card} style={styles.row}>
              <Icon name="apartment" size={22} color={colors.primary} />
              <View style={styles.rowText}>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  Buildings
                </AppText>
                <AppText weight="bold" style={{ color: colors.text }} numberOfLines={2}>
                  {buildingsLabel}
                </AppText>
              </View>
              <Icon name="chevron-right" size={22} color={colors.subtle} />
            </ClayView>
          </PressClay>

          <PressClay onPress={() => setPicker('capacity')}>
            <ClayView depth={4} color={colors.card} style={styles.row}>
              <Icon name="group" size={22} color={colors.primary} />
              <View style={styles.rowText}>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  Minimum capacity
                </AppText>
                <AppText weight="bold" style={{ color: colors.text }}>
                  {capacityLabel}
                </AppText>
              </View>
              <Icon name="chevron-right" size={22} color={colors.subtle} />
            </ClayView>
          </PressClay>

          <PressClay onPress={() => setPicker('amenities')}>
            <ClayView depth={4} color={colors.card} style={styles.row}>
              <Icon name="build" size={22} color={colors.primary} />
              <View style={styles.rowText}>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  Amenities (must have all selected)
                </AppText>
                <AppText weight="bold" style={{ color: colors.text }} numberOfLines={2}>
                  {amenitiesLabel}
                </AppText>
              </View>
              <Icon name="chevron-right" size={22} color={colors.subtle} />
            </ClayView>
          </PressClay>

          <PressClay onPress={() => setPicker('eventType')}>
            <ClayView depth={4} color={colors.card} style={styles.row}>
              <Icon name="event" size={22} color={colors.primary} />
              <View style={styles.rowText}>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  Event type (room must allow)
                </AppText>
                <AppText weight="bold" style={{ color: colors.text }} numberOfLines={2}>
                  {eventTypeLabel}
                </AppText>
              </View>
              <Icon name="chevron-right" size={22} color={colors.subtle} />
            </ClayView>
          </PressClay>

          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 8, marginBottom: 6 }}>
            Free between (15-minute steps)
          </AppText>
          <ClayView depth={3} color={colors.card} style={{ borderRadius: 16, padding: 12 }}>
            <View style={{ marginBottom: 12 }}>
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6 }}>
                Date
              </AppText>
              <ClayDatePicker value={draft.date} onChange={(date) => setDraft((d) => ({ ...d, date }))} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'center', marginBottom: 4 }}>
                  From
                </AppText>
                <ClayTimeSpinner
                  minuteIncrement={15}
                  value={draft.startTime}
                  onChange={(startTime) => setDraft((d) => ({ ...d, startTime }))}
                />
              </View>
              <View style={{ width: 1, backgroundColor: colors.border }} />
              <View style={{ flex: 1 }}>
                <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'center', marginBottom: 4 }}>
                  To
                </AppText>
                <ClayTimeSpinner
                  minuteIncrement={15}
                  value={draft.endTime}
                  onChange={(endTime) => setDraft((d) => ({ ...d, endTime }))}
                />
              </View>
            </View>
          </ClayView>
        </View>
      </FilterBottomSheet>

      <MultiOptionPickerSheet<string>
        isVisible={picker === 'buildings'}
        onClose={() => setPicker(null)}
        title="Buildings"
        options={buildingOptions}
        selected={draft.buildingIds}
        zIndexBase={220}
        contentInsetBottom={contentInsetBottom}
        height={pickerHeight}
        onChange={(buildingIds) => setDraft((d) => ({ ...d, buildingIds }))}
      />

      <MultiOptionPickerSheet<string>
        isVisible={picker === 'amenities'}
        onClose={() => setPicker(null)}
        title="Amenities"
        options={ROOM_AMENITY_PICKER_OPTIONS}
        selected={draft.amenityKeys}
        zIndexBase={220}
        contentInsetBottom={contentInsetBottom}
        height={pickerHeight}
        onChange={(amenityKeys) => setDraft((d) => ({ ...d, amenityKeys }))}
      />

      <OptionPickerSheet<number>
        isVisible={picker === 'capacity'}
        onClose={() => setPicker(null)}
        title="Minimum capacity"
        options={capacityOptions}
        selected={draft.minCapacity ?? null}
        zIndexBase={220}
        contentInsetBottom={contentInsetBottom}
        height={pickerHeight}
        onSelect={(v) => setDraft((d) => ({ ...d, minCapacity: v ?? undefined }))}
      />

      <OptionPickerSheet<string>
        isVisible={picker === 'eventType'}
        onClose={() => setPicker(null)}
        title="Event type"
        options={eventTypeOptions}
        selected={draft.eventTypeId ?? null}
        zIndexBase={220}
        contentInsetBottom={contentInsetBottom}
        height={pickerHeight}
        onSelect={(v) => setDraft((d) => ({ ...d, eventTypeId: v ?? undefined }))}
      />
    </>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 12,
  },
  rowText: { flex: 1 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
});
