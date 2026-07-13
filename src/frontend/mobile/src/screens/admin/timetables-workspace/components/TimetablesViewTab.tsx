import React, { useMemo, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';

import { AppButton, AppText, ClayView, Icon, WidgetEmptyState } from '@/src/components/ui';
import {
  displaySlotStats,
  groupDisplaySlotsByView,
  WEEK_GRID_MAX_SLOTS_SOFT,
  type TimetableDisplaySlot,
} from '../utils/timetableDisplaySlots';
import { OmadaScheduleGroupSection } from './OmadaScheduleGroupSection';
import { TimetablesLayoutFiltersSheet } from './TimetablesLayoutFiltersSheet';
import { TimetableSlotDetailSheet } from './TimetableSlotDetailSheet';
import { TimetableWeekGrid } from './TimetableWeekGrid';
import { TimetableMemberScheduleCheck } from './TimetableMemberScheduleCheck';
import type { TimetablesWorkspaceModel } from '../hooks/useTimetablesWorkspace';
import { createTimetablesWorkspaceStyles } from '../styles/timetables-workspace.styles';

type Props = { model: TimetablesWorkspaceModel };

function weekRangeLabel(weekAnchor: Date): string {
  const fri = new Date(weekAnchor);
  fri.setDate(fri.getDate() + 4);
  const start = weekAnchor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const end = fri.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${start} – ${end} (Mon–Fri)`;
}

export function TimetablesViewTab({ model }: Props) {
  const {
    colors,
    periodId,
    weekAnchor,
    shiftWeek,
    displaySlots,
    displayConflicts,
    previewLoading,
    previewRefreshing,
    refreshPreview,
    viewDisplayMode,
    setViewDisplayMode,
    layoutFilter,
    setLayoutFilter,
    offeringProgramLabel,
    canShowWeekGrid,
    gridIsOverloaded,
    setScopeSheetOpen,
  } = model;

  const styles = createTimetablesWorkspaceStyles(colors);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimetableDisplaySlot | null>(null);

  const stats = useMemo(() => displaySlotStats(displaySlots), [displaySlots]);
  const groups = useMemo(
    () => groupDisplaySlotsByView(displaySlots, layoutFilter.viewMode, offeringProgramLabel),
    [displaySlots, layoutFilter.viewMode, offeringProgramLabel],
  );

  const displayed = layoutFilter.focusKey
    ? groups.filter((g) => g.key === layoutFilter.focusKey)
    : groups;

  const weekLabel = weekRangeLabel(weekAnchor);
  const conflictCount = displayConflicts.length;
  const isEmpty = !previewLoading && displaySlots.length === 0;
  const gridBlocked = viewDisplayMode === 'grid' && !canShowWeekGrid;

  if (!periodId) {
    return (
      <WidgetEmptyState
        icon="date-range"
        title="Select a period"
        description="Open Timetable scope and choose an academic period."
      />
    );
  }

  return (
    <View>
      <View style={styles.weekNav}>
        <AppButton title="Prev" size="sm" variant="outline" icon="chevron-left" onPress={() => shiftWeek(-1)} />
        <AppText variant="caption" weight="bold" style={{ color: colors.text, flex: 1, textAlign: 'center' }}>
          {weekLabel}
        </AppText>
        <AppButton title="Next" size="sm" variant="outline" icon="chevron-right" onPress={() => shiftWeek(1)} />
      </View>

      <AppButton
        title={previewRefreshing ? 'Refreshing…' : 'Refresh preview'}
        size="sm"
        variant="outline"
        icon="refresh"
        onPress={() => void refreshPreview()}
        loading={previewRefreshing}
        style={{ marginBottom: 12 }}
      />

      <TimetableMemberScheduleCheck model={model} />

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {(['list', 'grid'] as const).map((mode) => {
          const active = viewDisplayMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              onPress={() => setViewDisplayMode(mode)}
              style={{ flex: 1 }}
              activeOpacity={0.85}
            >
              <ClayView
                depth={active ? 2 : 1}
                color={active ? colors.primary : colors.card}
                style={{ borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}
              >
                <AppText variant="caption" weight="bold" style={{ color: active ? '#fff' : colors.text }}>
                  {mode === 'list' ? 'List' : 'Week grid'}
                </AppText>
              </ClayView>
            </TouchableOpacity>
          );
        })}
      </View>

      {viewDisplayMode === 'grid' && !canShowWeekGrid ? (
        <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 16, marginBottom: 12 }}>
          <AppText variant="label" weight="bold" style={{ color: colors.text }}>
            Narrow the scope for the week grid
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6, lineHeight: 18 }}>
            Pick at least one filter — teacher, program, group, course, or room — so the grid stays readable. You can
            combine them (e.g. one teacher within a program). List view still works for the full period overview.
          </AppText>
          <AppButton
            title="Set scope filters"
            variant="primary"
            icon="tune"
            onPress={() => setScopeSheetOpen(true)}
            style={{ marginTop: 14 }}
          />
        </ClayView>
      ) : null}

      {viewDisplayMode === 'grid' && canShowWeekGrid && gridIsOverloaded ? (
        <ClayView
          depth={2}
          color="#fffbeb"
          style={{ borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#fde68a' }}
        >
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Icon name="info" size={22} color="#d97706" />
            <View style={{ flex: 1 }}>
              <AppText variant="label" weight="bold" style={{ color: '#92400e' }}>
                Busy week ({displaySlots.length} sessions)
              </AppText>
              <AppText variant="caption" style={{ color: '#b45309', marginTop: 4, lineHeight: 18 }}>
                More than {WEEK_GRID_MAX_SLOTS_SOFT} blocks may overlap heavily. Filter by group, teacher, course, or room in
                scope, or switch to List view.
              </AppText>
              <AppButton
                title="Narrow scope"
                size="sm"
                variant="outline"
                onPress={() => setScopeSheetOpen(true)}
                style={{ marginTop: 10, alignSelf: 'flex-start' }}
              />
            </View>
          </View>
        </ClayView>
      ) : null}

      {conflictCount > 0 ? (
        <ClayView
          depth={2}
          color="#fef2f2"
          style={{ borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#fecaca' }}
        >
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Icon name="warning" size={22} color="#dc2626" />
            <View style={{ flex: 1 }}>
              <AppText variant="label" weight="bold" style={{ color: '#991b1b' }}>
                {conflictCount} scheduling conflict{conflictCount === 1 ? '' : 's'} this week
              </AppText>
              <AppText variant="caption" style={{ color: '#b91c1c', marginTop: 4, lineHeight: 18 }}>
                Same instructor double-booked, enrolled groups at the same time, or room overlap. Adjust patterns in Build & publish before publishing.
              </AppText>
              {displayConflicts.slice(0, 4).map((c) => (
                <AppText
                  key={`${c.slotKeyA}-${c.slotKeyB}-${c.message}`}
                  variant="caption"
                  style={{ color: '#7f1d1d', marginTop: 6, lineHeight: 17 }}
                >
                  · {c.message}
                </AppText>
              ))}
            </View>
          </View>
        </ClayView>
      ) : null}

      {previewLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
      ) : gridBlocked ? null : isEmpty ? (
        <WidgetEmptyState
          icon={viewDisplayMode === 'grid' ? 'calendar-view-week' : 'event-busy'}
          title="Nothing scheduled"
          description={
            viewDisplayMode === 'grid'
              ? 'No sessions this Mon–Fri week. Biweekly patterns appear on alternate weeks — try Next week, or refresh after saving patterns in Build & publish.'
              : 'Define weekly session patterns for offerings in Build & publish, then publish to schedule. Tap Refresh preview after saving.'
          }
        />
      ) : viewDisplayMode === 'grid' ? (
        <TimetableWeekGrid
          colors={colors}
          weekAnchor={weekAnchor}
          slots={displaySlots}
          onSlotPress={setSelectedSlot}
        />
      ) : (
        <>
          <ClayView depth={2} color={colors.card} style={{ borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <ClayView
                depth={2}
                color={colors.primary + '22'}
                style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="event-note" size={24} color={colors.primary} />
              </ClayView>
              <View style={{ flex: 1 }}>
                <AppText variant="label" weight="bold" style={{ color: colors.text }}>
                  {stats.total} sessions this week
                </AppText>
                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4, lineHeight: 18 }}>
                  {stats.courses} courses · {stats.teachers} teachers · {stats.groups} groups
                </AppText>
              </View>
            </View>
            <AppButton
              title="Layout & focus"
              variant="outline"
              onPress={() => setLayoutOpen(true)}
              style={{ marginTop: 14 }}
            />
          </ClayView>

          {displayed.length === 0 ? (
            <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14 }}>
              <AppText variant="body" style={{ color: colors.subtle }}>
                No sessions match this layout filter.
              </AppText>
            </ClayView>
          ) : (
            displayed.map((group, index) => (
              <OmadaScheduleGroupSection
                key={`${layoutFilter.viewMode}-${group.key}`}
                colors={colors}
                group={group}
                defaultExpanded={layoutFilter.focusKey !== null || index < 2 || displayed.length <= 3}
              />
            ))
          )}
        </>
      )}

      <TimetablesLayoutFiltersSheet
        visible={layoutOpen}
        onClose={() => setLayoutOpen(false)}
        displaySlots={displaySlots}
        value={layoutFilter}
        onApply={setLayoutFilter}
        offeringProgramLabel={offeringProgramLabel}
      />

      <TimetableSlotDetailSheet
        visible={selectedSlot != null}
        onClose={() => setSelectedSlot(null)}
        slot={selectedSlot}
        colors={colors}
      />
    </View>
  );
}
