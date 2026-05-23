import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { FilterBottomSheet } from '@/src/components/filters/FilterBottomSheet';
import { OptionPickerSheet, type PickerOption } from '@/src/components/filters/OptionPickerSheet';
import { PressClay } from '@/src/components/animations';
import { AppText, ClayView, Icon } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import {
  groupEventsByView,
  SCHEDULE_VIEW_MODES,
  type SchedulePreviewGroup,
  type SchedulePreviewViewMode,
  type ScrapedScheduleEvent,
} from '../utils/schedulePreviewGrouping';
import { SearchableOptionPickerSheet } from './SearchableOptionPickerSheet';

export type SchedulePreviewFilterState = {
  viewMode: SchedulePreviewViewMode;
  focusKey: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  events: ScrapedScheduleEvent[];
  value: SchedulePreviewFilterState;
  onApply: (next: SchedulePreviewFilterState) => void;
};

export function SchedulePreviewFiltersSheet({ visible, onClose, events, value, onApply }: Props) {
  const colors = useThemeColors();
  const winH = Dimensions.get('window').height;
  const sheetH = Math.round(winH * 0.88);
  const pickerH = Math.round(winH * 0.72);

  const [draftMode, setDraftMode] = useState<SchedulePreviewViewMode>(value.viewMode);
  const [draftFocus, setDraftFocus] = useState<string | null>(value.focusKey);
  const [picker, setPicker] = useState<null | 'mode' | 'focus'>(null);

  useEffect(() => {
    if (!visible) return;
    setDraftMode(value.viewMode);
    setDraftFocus(value.focusKey);
  }, [visible, value]);

  const modeOptions: PickerOption<SchedulePreviewViewMode>[] = useMemo(
    () =>
      SCHEDULE_VIEW_MODES.map((m) => ({
        value: m.key,
        label: m.label,
        subtitle: m.subtitle,
        icon: m.icon,
      })),
    [],
  );

  const focusGroups = useMemo(
    () => groupEventsByView(events, draftMode),
    [events, draftMode],
  );

  const focusOptions: PickerOption<string>[] = useMemo(
    () =>
      focusGroups.map((g) => ({
        value: g.key,
        label: g.label,
        subtitle: `${g.events.length} session${g.events.length === 1 ? '' : 's'}`,
        icon: focusIconForMode(draftMode),
      })),
    [focusGroups, draftMode],
  );

  const modeLabel = modeOptions.find((o) => o.value === draftMode)?.label ?? 'Group';
  const focusLabel =
    draftFocus === null
      ? 'All'
      : focusOptions.find((o) => o.value === draftFocus)?.label ?? draftFocus;

  const handleApply = () => {
    onApply({ viewMode: draftMode, focusKey: draftFocus });
    onClose();
  };

  const handleReset = () => {
    setDraftMode('group');
    setDraftFocus(null);
  };

  return (
    <>
      <FilterBottomSheet
        isVisible={visible}
        onClose={onClose}
        title="Preview layout"
        onApply={handleApply}
        onReset={handleReset}
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

          <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18 }}>
            Use “Show only” to pick one group, subject, program page, teacher, or day. Search inside the picker when
            the list is long.
          </AppText>
        </View>
      </FilterBottomSheet>

      <OptionPickerSheet<SchedulePreviewViewMode>
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

function focusIconForMode(mode: SchedulePreviewViewMode): string {
  switch (mode) {
    case 'subject':
      return 'subject';
    case 'type':
      return 'category';
    case 'teacher':
      return 'person';
    case 'day':
      return 'today';
    case 'page':
      return 'school';
    default:
      return 'groups';
  }
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
