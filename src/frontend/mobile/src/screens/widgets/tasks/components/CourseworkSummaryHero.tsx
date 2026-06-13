import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { AppText, ClayView, Icon, Skeleton } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import type { TaskItemDto } from '@/src/api/generatedClient';

import { computeCourseworkStats } from '../utils/courseworkStats';
import { formatCountdown, formatDueKicker } from '../utils/taskUrgency';

interface CourseworkSummaryHeroProps {
  tasks: TaskItemDto[];
  loading?: boolean;
  onNextPress?: (task: TaskItemDto) => void;
}

export function CourseworkSummaryHero({ tasks, loading, onNextPress }: CourseworkSummaryHeroProps) {
  const colors = useThemeColors();
  const stats = useMemo(() => computeCourseworkStats(tasks), [tasks]);

  if (loading) {
    return <Skeleton height={168} borderRadius={24} style={{ marginHorizontal: 20, marginBottom: 8 }} />;
  }

  return (
    <ClayView depth={12} puffy={0} color={colors.secondary} style={styles.panel}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" weight="bold" style={{ color: colors.onSecondary, opacity: 0.85 }}>
            TASKS
          </AppText>
          <View style={styles.statRow}>
            <View>
              <AppText
                variant="display"
                weight="bold"
                style={{ color: colors.onSecondary, fontSize: 42, lineHeight: 46 }}
              >
                {stats.pending}
              </AppText>
              <AppText variant="caption" style={{ color: colors.onSecondary, opacity: 0.8 }}>
                Open
              </AppText>
            </View>
            <View style={styles.miniStat}>
              <AppText variant="h3" weight="bold" style={{ color: colors.onSecondary }}>
                {stats.overdue}
              </AppText>
              <AppText variant="caption" style={{ color: colors.onSecondary, opacity: 0.75 }}>
                Overdue
              </AppText>
            </View>
            <View style={styles.miniStat}>
              <AppText variant="h3" weight="bold" style={{ color: colors.onSecondary }}>
                {stats.dueSoon}
              </AppText>
              <AppText variant="caption" style={{ color: colors.onSecondary, opacity: 0.75 }}>
                Due soon
              </AppText>
            </View>
          </View>
        </View>
        <Icon name="assignment" size={52} color={colors.onSecondary} style={{ opacity: 0.28 }} />
      </View>

      {stats.next ? (
        <PressClay onPress={() => onNextPress?.(stats.next!)}>
          <ClayView depth={6} color={`${colors.onSecondary}18`} style={styles.nextCard}>
            <AppText
              variant="caption"
              weight="bold"
              style={{ color: colors.onSecondary, opacity: 0.85, marginBottom: 4 }}
            >
              UP NEXT · {formatDueKicker(stats.next)}
            </AppText>
            <AppText
              variant="h3"
              weight="bold"
              numberOfLines={2}
              style={{ color: colors.onSecondary, marginBottom: 4 }}
            >
              {stats.next.title}
            </AppText>
            <AppText variant="caption" style={{ color: colors.onSecondary, opacity: 0.75 }}>
              {stats.next.offeringName ?? stats.next.groupName ?? 'Coursework'}
              {stats.next.dueDate ? ` · ${formatCountdown(new Date(stats.next.dueDate))}` : ''}
            </AppText>
          </ClayView>
        </PressClay>
      ) : (
        <ClayView depth={4} color={`${colors.onSecondary}14`} style={styles.nextCard}>
          <AppText variant="body" weight="bold" style={{ color: colors.onSecondary }}>
            All caught up — no open coursework.
          </AppText>
        </ClayView>
      )}
    </ClayView>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 24,
    padding: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 20,
    marginTop: 8,
  },
  miniStat: {
    alignItems: 'flex-start',
  },
  nextCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
