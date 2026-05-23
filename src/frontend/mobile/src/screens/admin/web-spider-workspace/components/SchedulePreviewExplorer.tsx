import React, { useMemo } from 'react';
import { View } from 'react-native';
import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import type { WebSpiderWorkspaceModel } from '../hooks/useWebSpiderWorkspace';
import {
  groupEventsByView,
  previewStats,
  type ScrapedScheduleEvent,
} from '../utils/schedulePreviewGrouping';
import type { SchedulePreviewFilterState } from './SchedulePreviewFiltersSheet';
import { SchedulePreviewGroupSection } from './SchedulePreviewGroupSection';

type Props = {
  model: WebSpiderWorkspaceModel;
  events: ScrapedScheduleEvent[];
  filter: SchedulePreviewFilterState;
  onOpenFilters: () => void;
  sourceUrl?: string;
  pages?: { sourceUrl?: string; eventCount?: number }[];
  hubLinksDiscovered?: number;
  schedulePagesScraped?: number;
  wasTruncated?: boolean;
};

export function SchedulePreviewExplorer({
  model,
  events,
  filter,
  onOpenFilters,
  sourceUrl,
  pages,
  hubLinksDiscovered = 0,
  schedulePagesScraped = 0,
  wasTruncated = false,
}: Props) {
  const { colors } = model;

  const stats = useMemo(() => previewStats(events), [events]);
  const groups = useMemo(() => groupEventsByView(events, filter.viewMode), [events, filter.viewMode]);

  const displayedGroups = filter.focusKey
    ? groups.filter((g) => g.key === filter.focusKey)
    : groups;

  const activeFilterCount = (filter.focusKey ? 1 : 0) + 1;

  return (
    <View style={{ marginTop: 12 }}>
      <ClayView depth={2} color={colors.card} style={{ borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <ClayView
            depth={2}
            color={colors.primary + '22'}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="event-note" size={24} color={colors.primary} />
          </ClayView>
          <View style={{ flex: 1 }}>
            <AppText variant="label" weight="bold" style={{ color: colors.text }}>
              {stats.total} sessions scraped
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4, lineHeight: 18 }}>
              {stats.groupCount} groups · {stats.pageCount} programs · {stats.typeCount} types · {stats.subjectCount}{' '}
              subjects
            </AppText>
            {schedulePagesScraped > 0 ? (
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                From {schedulePagesScraped} timetable page{schedulePagesScraped === 1 ? '' : 's'}
                {hubLinksDiscovered > 0 ? ` (${hubLinksDiscovered} links on index)` : ''}
              </AppText>
            ) : null}
            {wasTruncated ? (
              <AppText variant="caption" style={{ color: colors.primary, marginTop: 6 }}>
                Some program pages were not fetched (limit). Open a specific year page for full coverage.
              </AppText>
            ) : null}
          </View>
        </View>

        <AppButton
          title={activeFilterCount > 1 ? `Filters (${activeFilterCount})` : 'Filters & layout'}
          variant="outline"
          onPress={onOpenFilters}
          style={{ marginTop: 14 }}
        />
      </ClayView>

      {displayedGroups.length === 0 ? (
        <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14 }}>
          <AppText variant="body" style={{ color: colors.subtle }}>
            No sessions match this filter.
          </AppText>
        </ClayView>
      ) : (
        displayedGroups.map((group, index) => (
          <SchedulePreviewGroupSection
            key={`${filter.viewMode}-${group.key}`}
            model={model}
            group={group}
            viewMode={filter.viewMode}
            defaultExpanded={filter.focusKey !== null || index < 2 || displayedGroups.length <= 3}
          />
        ))
      )}

    </View>
  );
}
