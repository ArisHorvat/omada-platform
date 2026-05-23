import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  AppButton,
  ClayView,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { useAssignmentsWidgetLogic } from '../hooks/useAssignmentsWidgetLogic';
import {
  countDueSoonAssignments,
  formatDueKicker,
  getNextPendingAssignment,
} from '../utils/assignmentUrgency';
import type { BaseWidgetProps } from '@/src/constants/widgets.registry';
import { getPendingAssignments } from '../utils/assignmentFilters';

interface AssignmentsBentoProps {
  accentColor: string;
  size?: BaseWidgetProps['size'];
}

export const AssignmentsBento: React.FC<AssignmentsBentoProps> = ({ accentColor, size }) => {
  const { assignments, isLoading, isError, tasksQuery, toggleTaskCompletion } =
    useAssignmentsWidgetLogic();

  const dueSoonCount = useMemo(() => countDueSoonAssignments(assignments), [assignments]);
  const pendingCount = useMemo(() => getPendingAssignments(assignments).length, [assignments]);
  const next = useMemo(() => getNextPendingAssignment(assignments), [assignments]);
  const isLarge = size === 'large' || size === 'wide';

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Skeleton height={48} width={72} borderRadius={12} />
        <Skeleton height={14} width="50%" style={{ marginTop: 10 }} />
      </View>
    );
  }

  if (isError) {
    return (
      <WidgetErrorState message="Could not load assignments." onRetry={() => void tasksQuery.refetch()} />
    );
  }

  if (pendingCount === 0) {
    return (
      <WidgetEmptyState title="All done" description="No open assignments." icon="assignment-turned-in" />
    );
  }

  if (isLarge && next) {
    return (
      <ClayView depth={8} puffy={14} color={`${accentColor}14`} style={styles.large}>
        <AppText variant="caption" weight="bold" style={[styles.kicker, { color: accentColor }]}>
          UP NEXT
        </AppText>
        <AppText variant="h3" weight="bold" numberOfLines={2} style={{ marginBottom: 8 }}>
          {next.title}
        </AppText>
        <AppText variant="caption" style={{ opacity: 0.8, marginBottom: 10 }}>
          {formatDueKicker(next)}
          {next.groupName ? ` · ${next.groupName}` : ''}
        </AppText>
        <View style={styles.statRow}>
          <View>
            <AppText variant="display" weight="bold" style={{ color: accentColor, fontSize: 36 }}>
              {dueSoonCount}
            </AppText>
            <AppText variant="caption" weight="bold" style={{ color: accentColor }}>
              Due soon
            </AppText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <AppText variant="h3" weight="bold" style={{ color: accentColor }}>
              {pendingCount}
            </AppText>
            <AppText variant="caption" style={{ color: accentColor, opacity: 0.75 }}>
              Open total
            </AppText>
          </View>
        </View>
        <AppButton
          title="Mark submitted"
          size="sm"
          icon="check"
          onPress={() => toggleTaskCompletion.mutate(next)}
          loading={toggleTaskCompletion.isPending}
          style={{ marginTop: 10 }}
        />
      </ClayView>
    );
  }

  return (
    <View style={styles.bento}>
      <AppText variant="display" weight="bold" style={[styles.number, { color: accentColor }]}>
        {dueSoonCount}
      </AppText>
      <View>
        <AppText variant="caption" weight="bold" style={{ color: accentColor }}>
          Due
        </AppText>
        <AppText variant="caption" style={{ color: accentColor, opacity: 0.8 }}>
          Soon
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 140 },
  bento: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  number: { fontSize: 32, marginRight: 8 },
  large: { borderRadius: 20, minHeight: 140 },
  kicker: { marginBottom: 6, letterSpacing: 0.5 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
});
