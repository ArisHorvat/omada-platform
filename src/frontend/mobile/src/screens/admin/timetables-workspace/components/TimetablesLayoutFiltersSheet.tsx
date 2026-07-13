import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import { FilterBottomSheet } from '@/src/components/filters/FilterBottomSheet';
import { OptionPickerSheet, type PickerOption } from '@/src/components/filters/OptionPickerSheet';
import { PressClay } from '@/src/components/animations';
import { AppText, ClayView, Icon } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import {
  groupDisplaySlotsByView,
  type TimetableDisplaySlot,
} from '../utils/timetableDisplaySlots';
import {
  OMADA_TIMETABLE_VIEW_MODES,
  type OmadaTimetableViewMode,
} from '../utils/omadaScheduleGrouping';
import type { TimetablesLayoutFilter } from '../hooks/useTimetablesWorkspace';

type Props = {
  visible: boolean;
  onClose: () => void;
  displaySlots: TimetableDisplaySlot[];
  value: TimetablesLayoutFilter;
  onApply: (next: TimetablesLayoutFilter) => void;
  offeringProgramLabel?: Map<string, string>;
};

export function TimetablesLayoutFiltersSheet({
  visible,
  onClose,
  displaySlots,
  value,
  onApply,
  offeringProgramLabel,
}: Props) {
  const colors = useThemeColors();
  const winH = Dimensions.get('window').height;
  const sheetH = Math.round(winH * 0.88);
  const pickerH = Math.round(winH * 0.72);

  const [draftMode, setDraftMode] = useState<OmadaTimetableViewMode>(value.viewMode);
  const [draftFocus, setDraftFocus] = useState<string | null>(value.focusKey);
  const [picker, setPicker] = useState<null | 'mode' | 'focus'>(null);

  useEffect(() => {
    if (!visible) return;
    setDraftMode(value.viewMode);
    setDraftFocus(value.focusKey);
  }, [visible, value]);

  const modeOptions: PickerOption<OmadaTimetableViewMode>[] = useMemo(
    () =>
      OMADA_TIMETABLE_VIEW_MODES.map((m) => ({
        value: m.key,
        label: m.label,
        subtitle: m.subtitle,
        icon: m.icon,
      })),
    [],
  );

  const focusGroups = useMemo(
    () => groupDisplaySlotsByView(displaySlots, draftMode, offeringProgramLabel),
    [displaySlots, draftMode, offeringProgramLabel],
  );

  const focusOptions: PickerOption<string>[] = useMemo(
    () =>
      focusGroups.map((g) => ({
        value: g.key,
        label: g.label,
        subtitle: `${g.slots.length} session${g.slots.length === 1 ? '' : 's'}`,
      })),
    [focusGroups],
  );

  const modeLabel = modeOptions.find((o) => o.value === draftMode)?.label ?? 'Day';
  const focusLabel =
    draftFocus === null
      ? 'All'
      : focusOptions.find((o) => o.value === draftFocus)?.label ?? draftFocus;

  return (
    <>
      <FilterBottomSheet
        isVisible={visible}
        onClose={onClose}
        title="Timetable layout"
        onApply={() => {
          onApply({ viewMode: draftMode, focusKey: draftFocus });
          onClose();
        }}
        onReset={() => {
          setDraftMode('day');
          setDraftFocus(null);
        }}
        height={sheetH}
      >
        <View style={styles.gap}>
          <PressClay onPress={() => setPicker('mode')}>
            <ClayView depth={4} color={colors.card} style={styles.row}>
              <Icon name="view-module" size={22} color={colors.primary} />
              <View style={styles.rowText}>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  Organize by
                </AppText>
                <AppText weight="bold" style={{ color: colors.text }}>
                  {modeLabel}
                </AppText>
              </View>
              <Icon name="chevron-right" size={22} color={colors.subtle} />
            </ClayView>
          </PressClay>

          <PressClay onPress={() => setPicker('focus')}>
            <ClayView depth={4} color={colors.card} style={styles.row}>
              <Icon name="filter-list" size={22} color={colors.primary} />
              <View style={styles.rowText}>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  Show only
                </AppText>
                <AppText weight="bold" style={{ color: colors.text }} numberOfLines={2}>
                  {focusLabel}
                </AppText>
              </View>
              <Icon name="chevron-right" size={22} color={colors.subtle} />
            </ClayView>
          </PressClay>
        </View>
      </FilterBottomSheet>

      <OptionPickerSheet<OmadaTimetableViewMode>
        isVisible={picker === 'mode'}
        onClose={() => setPicker(null)}
        title="Organize by"
        options={modeOptions}
        selected={draftMode}
        includeAllOption={false}
        onSelect={(v) => {
          if (v) {
            setDraftMode(v);
            setDraftFocus(null);
          }
          setPicker(null);
        }}
        height={pickerH}
        zIndexBase={220}
      />

      <SearchableOptionPickerSheet<string>
        isVisible={picker === 'focus'}
        onClose={() => setPicker(null)}
        title={`Show only — ${modeLabel}`}
        options={focusOptions}
        selected={draftFocus}
        includeAllOption
        allLabel="All (no filter)"
        searchPlaceholder={`Search ${modeLabel.toLowerCase()}…`}
        onSelect={(v) => setDraftFocus(v)}
        height={pickerH}
        zIndexBase={230}
      />
    </>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 12,
  },
  rowText: { flex: 1 },
});
