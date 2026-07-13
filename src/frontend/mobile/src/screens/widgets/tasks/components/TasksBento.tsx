import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import {
  AppText,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { useTasksWidgetLogic } from '../hooks/useTasksWidgetLogic';
import { getNextPendingTask, getWeeklyCompletionStats } from '../utils/taskUrgency';
import type { BaseWidgetProps } from '@/src/constants/widgets.registry';

interface TasksBentoProps {
  accentColor: string;
  size?: BaseWidgetProps['size'];
}

/** Bento: weekly completion ring + optional up-next title (compact for small tiles). */
export const TasksBento: React.FC<TasksBentoProps> = ({ accentColor, size }) => {
  const { tasks, isLoading, isError, tasksQuery } = useTasksWidgetLogic();

  const stats = useMemo(() => getWeeklyCompletionStats(tasks), [tasks]);
  const nextTask = useMemo(() => getNextPendingTask(tasks), [tasks]);
  const isLarge = size === 'large' || size === 'wide';

  const radius = isLarge ? 28 : 24;
  const strokeWidth = isLarge ? 6 : 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.percent / 100) * circumference;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Skeleton width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth} borderRadius={999} />
        <Skeleton height={14} width="40%" style={{ marginTop: 10 }} />
      </View>
    );
  }

  if (isError) {
    return (
      <WidgetErrorState message="Could not load tasks." onRetry={() => void tasksQuery.refetch()} />
    );
  }

  if (tasks.length === 0) {
    return (
      <WidgetEmptyState
        title="No tasks yet"
        description="Add tasks from the Tasks tab."
        icon="assignment"
        style={styles.empty}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.ringRow}>
        <View style={styles.ringContainer}>
          <Svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
            <Circle
              cx={radius + strokeWidth / 2}
              cy={radius + strokeWidth / 2}
              r={radius}
              stroke={accentColor}
              strokeWidth={strokeWidth}
              opacity={0.2}
              fill="none"
            />
            <Circle
              cx={radius + strokeWidth / 2}
              cy={radius + strokeWidth / 2}
              r={radius}
              stroke={accentColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
            />
          </Svg>
          <View
            style={[
              styles.ringTextContainer,
              { width: radius * 2 + strokeWidth, height: radius * 2 + strokeWidth },
            ]}
          >
            <AppText variant="caption" weight="bold" style={{ color: accentColor }}>
              {stats.total === 0 ? '—' : `${stats.done}/${stats.total}`}
            </AppText>
          </View>
        </View>

        <View style={styles.copy}>
          <AppText variant="caption" weight="bold" style={{ color: accentColor, opacity: 0.8 }}>
            THIS WEEK
          </AppText>
          <AppText variant="body" weight="bold" numberOfLines={1} style={{ marginTop: 2 }}>
            {stats.total === 0 ? '—' : `${stats.percent}% done`}
          </AppText>
          {nextTask ? (
            <>
              <AppText
                variant="caption"
                weight="bold"
                numberOfLines={1}
                style={{ color: accentColor, marginTop: 8 }}
              >
                Up next
              </AppText>
              <AppText variant="caption" numberOfLines={isLarge ? 2 : 1} style={{ color: accentColor, opacity: 0.9 }}>
                {nextTask.title}
              </AppText>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', minHeight: 0 },
  center: { alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 0 },
  empty: { minHeight: 72, paddingVertical: 6 },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ringContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringTextContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
});
