import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  AppText,
  AppButton,
  ClayView,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useAssignmentsWidgetLogic } from '../hooks/useAssignmentsWidgetLogic';
import { openAssignmentDetail } from '../../tasks/utils/assignmentNavigation';
import {
  formatCountdown,
  formatDueKicker,
  getNextPendingAssignment,
  getTaskUrgency,
} from '../utils/assignmentUrgency';

interface AssignmentsHeroProps {
  accentColor: string;
}

export const AssignmentsHero: React.FC<AssignmentsHeroProps> = ({ accentColor }) => {
  const router = useRouter();
  const { assignments, isLoading, isError, tasksQuery } = useAssignmentsWidgetLogic();

  const focus = useMemo(() => getNextPendingAssignment(assignments), [assignments]);
  const urgency = focus ? getTaskUrgency(focus) : 'normal';

  const surfaceTint = useMemo(() => {
    if (!focus) return `${accentColor}18`;
    if (urgency === 'overdue') return 'rgba(239, 68, 68, 0.22)';
    if (urgency === 'dueSoon') return 'rgba(234, 179, 8, 0.2)';
    return `${accentColor}18`;
  }, [accentColor, focus, urgency]);

  if (isLoading) {
    return (
      <View style={styles.box}>
        <Skeleton height={160} borderRadius={20} />
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
        description="No pending assignments right now."
        icon="assignment-turned-in"
      />
    );
  }

  const due = focus.dueDate ? new Date(focus.dueDate) : null;

  return (
    <PressClay onPress={() => openAssignmentDetail(router, focus)}>
    <ClayView depth={12} puffy={16} color={surfaceTint} style={styles.hero}>
      <AppText variant="caption" weight="bold" style={[styles.kicker, { color: accentColor }]}>
        {formatDueKicker(focus)}
      </AppText>
      <AppText variant="h3" weight="bold" numberOfLines={2} style={styles.title}>
        {focus.title}
      </AppText>
      {focus.groupName ? (
        <AppText variant="caption" weight="bold" style={{ color: accentColor, opacity: 0.85, marginBottom: 6 }}>
          {focus.groupName}
        </AppText>
      ) : null}
      <AppText variant="caption" weight="bold" style={styles.countdown}>
        {due ? formatCountdown(due) : 'No due date set'}
      </AppText>
      {focus.grade != null ? (
        <View style={[styles.pill, { borderColor: accentColor }]}>
          <AppText variant="caption" weight="bold" style={{ color: accentColor }}>
            Graded: {focus.grade}
            {focus.maxScore != null ? ` / ${focus.maxScore}` : ''}
          </AppText>
        </View>
      ) : null}
      <AppButton
        title="Open assignment"
        onPress={() => openAssignmentDetail(router, focus)}
        icon="chevron-right"
        style={styles.cta}
      />
    </ClayView>
    </PressClay>
  );
};

const styles = StyleSheet.create({
  box: { minHeight: 160 },
  hero: {
    minHeight: 160,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'flex-end',
  },
  kicker: { marginBottom: 6, letterSpacing: 0.6 },
  title: { marginBottom: 6 },
  countdown: { marginBottom: 10, opacity: 0.85 },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 10,
  },
  cta: { alignSelf: 'stretch' },
});
