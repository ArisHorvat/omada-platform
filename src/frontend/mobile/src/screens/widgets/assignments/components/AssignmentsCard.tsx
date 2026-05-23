import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  ClayView,
  Icon,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { useAssignmentsWidgetLogic } from '../hooks/useAssignmentsWidgetLogic';
import { formatDueKicker, getTaskUrgency, sortAssignmentsByUrgency } from '../utils/assignmentUrgency';

interface AssignmentsCardProps {
  accentColor: string;
}

export const AssignmentsCard: React.FC<AssignmentsCardProps> = ({ accentColor }) => {
  const colors = useThemeColors();
  const { assignments, isLoading, isError, tasksQuery } = useAssignmentsWidgetLogic();

  const { focus, next } = useMemo(() => {
    const sorted = sortAssignmentsByUrgency(assignments);
    return { focus: sorted[0], next: sorted[1] };
  }, [assignments]);

  if (isLoading) {
    return (
      <View style={styles.wrap}>
        <Skeleton height={88} borderRadius={16} />
        <Skeleton height={36} borderRadius={12} style={{ marginTop: 10 }} />
      </View>
    );
  }

  if (isError) {
    return (
      <WidgetErrorState message="Could not load assignments." onRetry={() => void tasksQuery.refetch()} />
    );
  }

  if (!focus) {
    return (
      <WidgetEmptyState
        title="All caught up"
        description="No pending assignments."
        icon="assignment-turned-in"
      />
    );
  }

  const urgency = getTaskUrgency(focus);
  const barColor =
    urgency === 'overdue' ? colors.error : urgency === 'dueSoon' ? colors.tertiary : accentColor;

  return (
    <View style={styles.wrap}>
      <ClayView depth={6} puffy={12} color={`${accentColor}15`} style={styles.urgentItem}>
        <View style={[styles.urgentBar, { backgroundColor: barColor }]} />
        <View style={styles.urgentText}>
          <AppText variant="caption" weight="bold" style={{ color: accentColor, opacity: 0.85, marginBottom: 4 }}>
            {formatDueKicker(focus)}
          </AppText>
          <AppText variant="h3" weight="bold" numberOfLines={2} style={{ color: accentColor }}>
            {focus.title}
          </AppText>
          <AppText variant="caption" numberOfLines={1} style={{ color: accentColor, opacity: 0.8, marginTop: 2 }}>
            {focus.groupName ?? 'Coursework'}
          </AppText>
        </View>
      </ClayView>

      {next ? (
        <View style={styles.secondary}>
          <Icon name="description" size={16} color={accentColor} style={{ marginRight: 8, opacity: 0.85 }} />
          <AppText variant="body" numberOfLines={1} style={{ color: accentColor, flex: 1 }}>
            {next.title}
            {next.dueDate
              ? ` · ${formatDueKicker(next).replace(/^DUE /, '').toLowerCase()}`
              : ''}
          </AppText>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { minHeight: 120 },
  urgentItem: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 10,
    minHeight: 88,
  },
  urgentBar: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
    alignSelf: 'stretch',
  },
  urgentText: { flex: 1, justifyContent: 'center', paddingVertical: 4 },
  secondary: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
});
