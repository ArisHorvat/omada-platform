import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Icon, Skeleton } from '@/src/components/ui';
import { AnimatedItem } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';
import { useGradesWidgetLogic } from '../hooks/useGradesWidgetLogic';
import { countDistinctCourses } from '../utils/gradesTrend';
import { GradesWidgetAccess } from './GradesWidgetAccess';

interface GradesRailProps {
  accentColor: string;
}

/**
 * Rail: analytics icon with GPA badge or course count.
 */
export const GradesRail: React.FC<GradesRailProps> = ({ accentColor }) => {
  const { grades, currentGpa, isLoading, canView, permissionsLoading } = useGradesWidgetLogic();

  const courseCount = useMemo(() => countDistinctCourses(grades), [grades]);
  const badgeLabel =
    currentGpa > 0 ? currentGpa.toFixed(1) : courseCount > 0 ? String(courseCount) : null;

  return (
    <GradesWidgetAccess canView={canView} permissionsLoading={permissionsLoading}>
      {isLoading ? (
        <AnimatedItem animation={ClayAnimations.List(0)}>
          <Skeleton width={28} height={28} borderRadius={14} />
        </AnimatedItem>
      ) : (
        <AnimatedItem animation={ClayAnimations.List(0)}>
          <View style={styles.wrap}>
            <Icon name="analytics" size={26} color={accentColor} />
            {badgeLabel ? (
              <View style={[styles.badge, { backgroundColor: accentColor }]}>
                <AppText variant="caption" weight="bold" style={styles.badgeText}>
                  {badgeLabel}
                </AppText>
              </View>
            ) : null}
          </View>
        </AnimatedItem>
      )}
    </GradesWidgetAccess>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    minWidth: 22,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, lineHeight: 12 },
});
