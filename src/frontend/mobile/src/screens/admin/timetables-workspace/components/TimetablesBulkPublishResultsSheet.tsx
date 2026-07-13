import React from 'react';
import { ScrollView, View } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import type { BulkPublishOfferingResultDto, BulkPublishTimetableResultDto } from '@/src/api/offeringsApi';

type ThemeColors = {
  card: string;
  text: string;
  subtle: string;
  primary: string;
  error: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  result: BulkPublishTimetableResultDto | null;
  colors: ThemeColors;
};

function outcomeMeta(outcome: BulkPublishOfferingResultDto['outcome']) {
  switch (outcome) {
    case 'published':
      return { label: 'Published', color: '#16a34a', icon: 'check-circle' as const };
    case 'republished':
      return { label: 'Republished', color: '#16a34a', icon: 'sync' as const };
    case 'skipped_conflict':
      return { label: 'Skipped — conflict', color: '#dc2626', icon: 'warning' as const };
    case 'skipped_no_pattern':
      return { label: 'Skipped — no pattern', color: '#d97706', icon: 'info' as const };
    case 'failed':
    default:
      return { label: 'Failed', color: '#dc2626', icon: 'error' as const };
  }
}

function ResultRow({ row, colors }: { row: BulkPublishOfferingResultDto; colors: ThemeColors }) {
  const meta = outcomeMeta(row.outcome);
  return (
    <ClayView depth={1} color={colors.card} style={{ borderRadius: 12, padding: 12, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <Icon name={meta.icon} size={20} color={meta.color} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="body" weight="bold" style={{ color: colors.text }} numberOfLines={2}>
            {row.offeringName}
          </AppText>
          <AppText variant="caption" weight="bold" style={{ color: meta.color, marginTop: 4 }}>
            {meta.label}
            {row.eventsCreated != null ? ` · ${row.eventsCreated} events` : ''}
          </AppText>
          {row.message ? (
            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6, lineHeight: 17 }}>
              {row.message}
            </AppText>
          ) : null}
        </View>
      </View>
    </ClayView>
  );
}

export function TimetablesBulkPublishResultsSheet({ visible, onClose, result, colors }: Props) {
  if (!result) return null;

  const problemRows = result.results.filter((r) => r.outcome !== 'published' && r.outcome !== 'republished');
  const successRows = result.results.filter((r) => r.outcome === 'published' || r.outcome === 'republished');

  return (
    <BottomSheet isVisible={visible} onClose={onClose} height={520} zIndexBase={330}>
      <AppText variant="h2" weight="bold" style={{ color: colors.text, marginBottom: 8 }}>
        Bulk publish results
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18, marginBottom: 14 }}>
        {result.publishedCount} published · {result.skippedConflictCount} skipped (conflicts) · {result.failedCount}{' '}
        failed. Conflicts are checked against the whole term — overlaps may involve courses outside your current scope
        filter.
      </AppText>

      <ScrollView showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
        {problemRows.length > 0 ? (
          <>
            <AppText variant="label" weight="bold" style={{ color: colors.error, marginBottom: 8 }}>
              Needs attention ({problemRows.length})
            </AppText>
            {problemRows.map((row) => (
              <ResultRow key={`${row.offeringId}-${row.outcome}`} row={row} colors={colors} />
            ))}
          </>
        ) : null}

        {successRows.length > 0 ? (
          <>
            <AppText
              variant="label"
              weight="bold"
              style={{
                color: colors.primary,
                marginTop: problemRows.length ? 12 : 0,
                marginBottom: 8,
              }}
            >
              Published ({successRows.length})
            </AppText>
            {successRows.map((row) => (
              <ResultRow key={`${row.offeringId}-ok`} row={row} colors={colors} />
            ))}
          </>
        ) : null}
      </ScrollView>
    </BottomSheet>
  );
}
