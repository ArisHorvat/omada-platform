import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, ClayView, Skeleton, WidgetEmptyState, WidgetErrorState } from '@/src/components/ui';
import type { BaseWidgetProps } from '@/src/constants/widgets.registry';
import { useAttendanceWidgetLogic } from '../hooks/useAttendanceWidgetLogic';
import { isCorporateKind, presentRateLabel, teacherModeLabel } from '../utils/attendanceLabels';
import { AttendanceWidgetAccess } from './AttendanceWidgetAccess';

interface AttendanceBentoProps {
  accentColor: string;
  size?: BaseWidgetProps['size'];
}

export const AttendanceBento: React.FC<AttendanceBentoProps> = ({ accentColor, size }) => {
  const {
    data,
    isLoading,
    isError,
    query,
    canView,
    permissionsLoading,
    isTeacherView,
  } = useAttendanceWidgetLogic();

  const isLarge = size === 'large' || size === 'wide';
  const summary = data?.summary;
  const kind = data?.organizationKind;
  const teacherSession = data?.teacherSessions[0];

  return (
    <AttendanceWidgetAccess canView={canView} permissionsLoading={permissionsLoading}>
      {isLoading ? (
        <View style={styles.center}>
          <Skeleton width={80} height={48} borderRadius={12} />
        </View>
      ) : isError ? (
        <WidgetErrorState message="Could not load attendance." onRetry={() => void query.refetch()} />
      ) : isTeacherView && teacherSession ? (
        <ClayView depth={8} puffy={12} color={`${accentColor}16`} style={styles.large}>
          <AppText variant="caption" weight="bold" style={{ color: accentColor }}>
            {teacherModeLabel(data?.mode).toUpperCase()}
          </AppText>
          <AppText variant="h3" weight="bold" numberOfLines={2}>
            {teacherSession.title}
          </AppText>
          <AppText variant="caption" style={{ opacity: 0.8 }}>
            {teacherSession.enrolledCount} enrolled
          </AppText>
        </ClayView>
      ) : !summary || summary.totalTracked === 0 ? (
        <WidgetEmptyState title="—" description="No data yet" icon="how-to-reg" />
      ) : isLarge ? (
        <ClayView depth={10} puffy={14} color={`${accentColor}18`} style={styles.large}>
          <AppText variant="display" weight="bold" style={{ color: accentColor, fontSize: 56, lineHeight: 60 }}>
            {summary.ratePercent.toFixed(0)}%
          </AppText>
          <AppText variant="caption" weight="bold" style={{ color: accentColor }}>
            {presentRateLabel(kind)}
          </AppText>
          {data?.nextSession ? (
            <AppText variant="caption" numberOfLines={2} style={{ marginTop: 8, opacity: 0.8 }}>
              Next: {data.nextSession.title}
            </AppText>
          ) : null}
        </ClayView>
      ) : (
        <View style={styles.bento}>
          <AppText variant="h2" weight="bold" style={{ color: accentColor, fontSize: 32, marginRight: 8 }}>
            {summary.ratePercent.toFixed(0)}%
          </AppText>
          <View>
            <AppText variant="caption" weight="bold" style={{ color: accentColor }}>
              {presentRateLabel(kind)}
            </AppText>
            {summary.presentStreakDays > 0 ? (
              <AppText variant="caption" style={{ color: accentColor, opacity: 0.75 }}>
                {summary.presentStreakDays}d streak
              </AppText>
            ) : null}
          </View>
        </View>
      )}
    </AttendanceWidgetAccess>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 140 },
  bento: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 140 },
  large: { borderRadius: 20, minHeight: 140, alignItems: 'center', justifyContent: 'center' },
});
