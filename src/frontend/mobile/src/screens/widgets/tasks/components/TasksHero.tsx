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
import { useTasksWidgetLogic } from '../hooks/useTasksWidgetLogic';
import { getNextPendingTask, getTaskUrgency, formatCountdown } from '../utils/taskUrgency';

interface TasksHeroProps {
  /** Theme accent from dashboard */
  accentColor: string;
}

/**
 * Hero (Focus): most urgent assignment, countdown, primary action (PDF / widget registry).
 */
export const TasksHero: React.FC<TasksHeroProps> = ({ accentColor }) => {
  const { tasks, isLoading, isError, tasksQuery, toggleTaskCompletion } = useTasksWidgetLogic();

  const focusTask = useMemo(() => getNextPendingTask(tasks), [tasks]);
  const urgency = focusTask ? getTaskUrgency(focusTask) : 'normal';

  const surfaceTint = useMemo(() => {
    if (!focusTask) return accentColor;
    if (urgency === 'overdue') return 'rgba(239, 68, 68, 0.22)';
    if (urgency === 'dueSoon') return 'rgba(234, 179, 8, 0.2)';
    return `${accentColor}18`;
  }, [accentColor, focusTask, urgency]);

  if (isLoading) {
    return (
      <View style={styles.box}>
        <Skeleton height={160} borderRadius={20} />
      </View>
    );
  }

  if (isError) {
    return (
      <WidgetErrorState message="Could not load tasks." onRetry={() => void tasksQuery.refetch()} />
    );
  }

  if (!focusTask) {
    return (
      <WidgetEmptyState
        title="All caught up"
        description="No pending tasks right now."
        icon="check-circle"
      />
    );
  }

  const due = focusTask.dueDate ? new Date(focusTask.dueDate) : null;
  const countdown = due ? formatCountdown(due) : 'No due date';

  return (
    <ClayView depth={12} puffy={16} color={surfaceTint} style={styles.heroClay}>
      <AppText variant="caption" weight="bold" style={[styles.kicker, { color: accentColor }]}>
        MOST URGENT
      </AppText>
      <AppText variant="h3" weight="bold" numberOfLines={2} style={styles.title}>
        {focusTask.title}
      </AppText>
      <AppText variant="caption" weight="bold" style={styles.countdown}>
        {countdown}
      </AppText>
      {focusTask.subjectId ? (
        <View style={[styles.pill, { borderColor: accentColor }]}>
          <AppText variant="caption" weight="bold" style={{ color: accentColor }}>
            Course
          </AppText>
        </View>
      ) : null}
      <AppButton
        title={focusTask.isCompleted ? 'Done' : 'Mark done'}
        onPress={() => toggleTaskCompletion.mutate(focusTask)}
        loading={toggleTaskCompletion.isPending}
        icon="check"
        style={styles.cta}
      />
    </ClayView>
  );
};

const styles = StyleSheet.create({
  box: { minHeight: 160 },
  heroClay: {
    minHeight: 160,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'flex-end',
  },
  kicker: { marginBottom: 6, letterSpacing: 0.6 },
  title: { marginBottom: 8 },
  countdown: { marginBottom: 12, opacity: 0.85 },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 12,
  },
  cta: { alignSelf: 'stretch' },
});
