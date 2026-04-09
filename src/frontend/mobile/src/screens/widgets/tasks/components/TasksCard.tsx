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
import { PressClay } from '@/src/components/animations';
import { useTasksWidgetLogic } from '../hooks/useTasksWidgetLogic';
import type { TaskItemDto } from '@/src/api/generatedClient';

interface TasksCardProps {
  accentColor: string;
}

/**
 * Card: top 3 pending tasks + pending count badge (PDF / registry).
 */
export const TasksCard: React.FC<TasksCardProps> = ({ accentColor }) => {
  const { tasks, isLoading, isError, tasksQuery, toggleTaskCompletion } = useTasksWidgetLogic();

  const { top3, pendingCount } = useMemo(() => {
    const pending = tasks.filter((t) => !t.isCompleted);
    const sorted = pending.slice().sort((a, b) => {
      const ta = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      return ta - tb;
    });
    return { top3: sorted.slice(0, 3), pendingCount: pending.length };
  }, [tasks]);

  if (isLoading) {
    return (
      <View style={styles.wrap}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.row, i === 2 && { marginBottom: 0 }]}>
            <Skeleton width={20} height={20} borderRadius={10} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Skeleton height={14} width="72%" />
            </View>
          </View>
        ))}
        <Skeleton height={28} width={120} borderRadius={14} style={{ marginTop: 12 }} />
      </View>
    );
  }

  if (isError) {
    return (
      <WidgetErrorState message="Could not load tasks." onRetry={() => void tasksQuery.refetch()} />
    );
  }

  if (pendingCount === 0) {
    return (
      <WidgetEmptyState
        title="All done"
        description="No pending tasks."
        icon="task-alt"
      />
    );
  }

  const onToggle = (task: TaskItemDto) => toggleTaskCompletion.mutate(task);

  return (
    <View style={styles.wrap}>
      {top3.map((task, idx) => (
        <PressClay key={task.id} onPress={() => onToggle(task)}>
          <ClayView
            depth={4}
            puffy={10}
            color={`${accentColor}12`}
            style={[styles.row, idx === top3.length - 1 && { marginBottom: 0 }]}
          >
            <Icon name="radio-button-unchecked" size={20} color={accentColor} style={styles.taskIcon} />
            <AppText variant="body" weight="bold" style={{ color: accentColor, flex: 1 }} numberOfLines={1}>
              {task.title}
            </AppText>
          </ClayView>
        </PressClay>
      ))}

      <View style={[styles.badge, { backgroundColor: `${accentColor}28` }]}>
        <AppText variant="caption" weight="bold" style={{ color: accentColor }}>
          {pendingCount} {pendingCount === 1 ? 'task' : 'tasks'} left
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { minHeight: 120 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  taskIcon: { marginRight: 10 },
  badge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
