import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Icon, Skeleton } from '@/src/components/ui';
import { AnimatedItem } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';
import { useAttendanceWidgetLogic } from '../hooks/useAttendanceWidgetLogic';
import { AttendanceWidgetAccess } from './AttendanceWidgetAccess';

interface AttendanceRailProps {
  accentColor: string;
}

export const AttendanceRail: React.FC<AttendanceRailProps> = ({ accentColor }) => {
  const { data, isLoading, canView, permissionsLoading, isTeacherView } = useAttendanceWidgetLogic();

  const badge =
    isTeacherView && (data?.teacherSessions.length ?? 0) > 0
      ? String(data!.teacherSessions.length)
      : data?.summary && data.summary.totalTracked > 0
        ? `${Math.round(data.summary.ratePercent)}%`
        : null;

  return (
    <AttendanceWidgetAccess canView={canView} permissionsLoading={permissionsLoading}>
      {isLoading ? (
        <AnimatedItem animation={ClayAnimations.List(0)}>
          <Skeleton width={28} height={28} borderRadius={14} />
        </AnimatedItem>
      ) : (
        <AnimatedItem animation={ClayAnimations.List(0)}>
          <View style={styles.wrap}>
            <Icon name="how-to-reg" size={26} color={accentColor} />
            {badge ? (
              <View style={[styles.badge, { backgroundColor: accentColor }]}>
                <AppText variant="caption" weight="bold" style={styles.badgeText}>
                  {badge}
                </AppText>
              </View>
            ) : null}
          </View>
        </AnimatedItem>
      )}
    </AttendanceWidgetAccess>
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
