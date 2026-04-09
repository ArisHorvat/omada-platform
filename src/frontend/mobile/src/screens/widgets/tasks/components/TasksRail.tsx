import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Icon, Skeleton } from '@/src/components/ui';
import { AnimatedItem } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';
import { useTasksWidgetLogic } from '../hooks/useTasksWidgetLogic';

interface TasksRailProps {
  accentColor: string;
}

/**
 * Rail: checklist icon + badge for pending count (dashboard apps strip).
 */
export const TasksRail: React.FC<TasksRailProps> = ({ accentColor }) => {
  const { tasks, isLoading } = useTasksWidgetLogic();

  const pendingCount = useMemo(() => tasks.filter((t) => !t.isCompleted).length, [tasks]);

  if (isLoading) {
    return (
      <AnimatedItem animation={ClayAnimations.List(0)}>
        <Skeleton width={28} height={28} borderRadius={14} />
      </AnimatedItem>
    );
  }

  return (
    <AnimatedItem animation={ClayAnimations.List(0)}>
      <View style={styles.wrap}>
        <Icon name="assignment" size={24} color={accentColor} />
        {pendingCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: accentColor }]}>
            <AppText variant="caption" weight="bold" style={styles.badgeText}>
              {pendingCount > 99 ? '99+' : pendingCount}
            </AppText>
          </View>
        ) : null}
      </View>
    </AnimatedItem>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, lineHeight: 12 },
});
