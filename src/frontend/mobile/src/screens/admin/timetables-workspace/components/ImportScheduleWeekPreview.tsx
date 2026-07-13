import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { TimetableWeekGrid } from './TimetableWeekGrid';
import { TimetableSlotDetailSheet } from './TimetableSlotDetailSheet';
import type { TimetablesWorkspaceModel } from '../hooks/useTimetablesWorkspace';
import type { TimetableDisplaySlot } from '../utils/timetableDisplaySlots';
import {
  buildScrapedDisplaySlots,
  resolveScrapedEventTiming,
  scrapedParseStats,
  type NormalizedScrapedEvent,
} from '../utils/scrapedDisplaySlots';

type Props = {
  model: TimetablesWorkspaceModel;
  events: NormalizedScrapedEvent[];
};

function weekRangeLabel(weekAnchor: Date): string {
  const fri = new Date(weekAnchor);
  fri.setDate(fri.getDate() + 4);
  const start = weekAnchor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const end = fri.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${start} – ${end}`;
}

export function ImportScheduleWeekPreview({ model, events }: Props) {
  const { colors, periods, periodId, setPeriodId, weekAnchor, shiftWeek } = model;
  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimetableDisplaySlot | null>(null);

  const periodOptions = useMemo(
    () =>
      periods.map((p) => ({
        value: p.id ?? '',
        label: p.isCurrent ? `${p.name ?? 'Period'} (current)` : (p.name ?? 'Period'),
      })),
    [periods],
  );

  const selectedPeriodLabel =
    periodOptions.find((o) => o.value === periodId)?.label ?? 'Select reporting period';

  const stats = useMemo(() => scrapedParseStats(events, weekAnchor), [events, weekAnchor]);
  const gridSlots = useMemo(() => buildScrapedDisplaySlots(events, weekAnchor), [events, weekAnchor]);

  const unparsedSample = useMemo(() => {
    const resolved = events.map((e) => ({
      event: e,
      timing: resolveScrapedEventTiming(e),
    }));
    return resolved.filter((r) => !r.timing.timeParsed).slice(0, 8);
  }, [events]);

  return (
    <View style={{ marginTop: 12 }}>
      <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: 8 }}>
          IMPORT PREVIEW — WEEK GRID
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18, marginBottom: 12 }}>
          Choose the reporting period this scrape belongs to. Parsed rows (day + time range) appear on the same Mon–Fri
          grid as the View tab. Unparsed rows stay in the list below.
        </AppText>

        <PressClay onPress={() => setPeriodPickerOpen(true)}>
          <ClayView depth={1} color={colors.background} style={{ borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
              Reporting period
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText variant="body" weight="bold" style={{ color: colors.text, flex: 1 }}>
                {selectedPeriodLabel}
              </AppText>
              <Icon name="expand-more" size={22} color={colors.subtle} />
            </View>
          </ClayView>
        </PressClay>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <AppText variant="body" weight="bold" style={{ color: colors.text }}>
            {weekRangeLabel(weekAnchor)}
          </AppText>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <AppButton title="Prev" size="sm" variant="outline" icon="chevron-left" onPress={() => shiftWeek(-1)} />
            <AppButton title="Next" size="sm" variant="outline" icon="chevron-right" onPress={() => shiftWeek(1)} />
          </View>
        </View>

        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
          {stats.onGrid} on week grid (Mon–Fri)
          {stats.parsed !== stats.onGrid ? ` · ${stats.parsed} weekday rows parsed` : ''}
          {stats.unparsed > 0 ? ` · ${stats.unparsed} unparsed` : ''}
          {stats.weekend > 0 ? ` · ${stats.weekend} weekend (not on grid)` : ''}
        </AppText>

        {gridSlots.length > 0 ? (
          <TimetableWeekGrid
            colors={colors}
            weekAnchor={weekAnchor}
            slots={gridSlots}
            onSlotPress={setSelectedSlot}
          />
        ) : (
          <ClayView depth={1} color={colors.background} style={{ borderRadius: 12, padding: 14 }}>
            <AppText variant="body" style={{ color: colors.subtle }}>
              No Mon–Fri slots could be parsed from this scrape. Check raw rows in the list below or try a specific
              year page.
            </AppText>
          </ClayView>
        )}
      </ClayView>

      {stats.unparsed > 0 ? (
        <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
            Unparsed rows ({stats.unparsed})
          </AppText>
          {unparsedSample.map(({ event: row, timing }, i) => (
            <View
              key={`unparsed-${i}-${row.className}-${row.time}`}
              style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                {row.className}
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle }}>
                {row.time}
              </AppText>
              {timing.timeParseWarning ? (
                <AppText variant="caption" style={{ color: colors.primary, marginTop: 2 }}>
                  {timing.timeParseWarning}
                </AppText>
              ) : null}
            </View>
          ))}
          {stats.unparsed > unparsedSample.length ? (
            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 8 }}>
              + {stats.unparsed - unparsedSample.length} more in the session list
            </AppText>
          ) : null}
        </ClayView>
      ) : null}

      <SearchableOptionPickerSheet
        isVisible={periodPickerOpen}
        onClose={() => setPeriodPickerOpen(false)}
        title="Reporting period"
        options={periodOptions}
        selected={periodId || null}
        onSelect={(id) => {
          if (id) setPeriodId(id);
          setPeriodPickerOpen(false);
        }}
        includeAllOption={false}
      />

      <TimetableSlotDetailSheet
        visible={!!selectedSlot}
        onClose={() => setSelectedSlot(null)}
        slot={selectedSlot}
        colors={colors}
      />
    </View>
  );
}
