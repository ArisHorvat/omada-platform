import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import {
  AppText,
  AppButton,
  ClayView,
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

/**
 * Bento: weekly completion ring; large tiles also show “up next” (PDF).
 */
export const TasksBento: React.FC<TasksBentoProps> = ({ accentColor, size }) => {
  const { tasks, isLoading, isError, tasksQuery, toggleTaskCompletion } = useTasksWidgetLogic();

  const stats = useMemo(() => getWeeklyCompletionStats(tasks), [tasks]);
  const nextTask = useMemo(() => getNextPendingTask(tasks), [tasks]);
  const isLarge = size === 'large' || size === 'wide';

  const radius = 35;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.percent / 100) * circumference;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Skeleton width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth} borderRadius={999} />
        <Skeleton height={14} width="40%" style={{ marginTop: 12 }} />
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
      />
    );
  }

  if (isLarge && nextTask) {
    return (
      <ClayView depth={8} puffy={14} color={`${accentColor}14`} style={styles.largeClay}>
        <AppText variant="caption" weight="bold" style={[styles.kicker, { color: accentColor }]}>
          UP NEXT
        </AppText>
        <AppText variant="h3" weight="bold" numberOfLines={2} style={styles.nextTitle}>
          {nextTask.title}
        </AppText>
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
          <View style={{ flex: 1, marginLeft: 12 }}>
            <AppText variant="caption" weight="bold" style={{ opacity: 0.75 }}>
              This week
            </AppText>
            <AppText variant="body" weight="bold" style={{ marginTop: 4 }}>
              {stats.total === 0 ? '—' : `${stats.percent}% done`}
            </AppText>
          </View>
        </View>
        <AppButton
          title="Mark done"
          onPress={() => toggleTaskCompletion.mutate(nextTask)}
          loading={toggleTaskCompletion.isPending}
          icon="check"
          size="sm"
          style={styles.cta}
        />
      </ClayView>
    );
  }

  return (
    <View style={styles.bentoContainer}>
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
          <AppText variant="h3" weight="bold" style={{ color: accentColor }}>
            {stats.total === 0 ? '—' : `${stats.done}/${stats.total}`}
          </AppText>
        </View>
      </View>
      <AppText variant="caption" weight="bold" style={{ color: accentColor, opacity: 0.75, marginTop: 8 }}>
        THIS WEEK
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 140 },
  bentoContainer: { alignItems: 'center', justifyContent: 'center', minHeight: 140 },
  ringContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringTextContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeClay: { borderRadius: 20, minHeight: 140 },
  kicker: { marginBottom: 6, letterSpacing: 0.5 },
  nextTitle: { marginBottom: 12 },
  ringRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cta: { alignSelf: 'stretch' },
});
