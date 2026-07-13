import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, ClayView, Skeleton, WidgetEmptyState, WidgetErrorState } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { useAttendanceWidgetLogic } from '../hooks/useAttendanceWidgetLogic';
import {
  isAttendancePresent,
  isCorporateKind,
  presentRateLabel,
  streakLabel,
} from '../utils/attendanceLabels';
import { AttendanceWidgetAccess } from './AttendanceWidgetAccess';

interface AttendanceCardProps {
  accentColor: string;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({ accentColor }) => {
  const colors = useThemeColors();
  const { data, isLoading, isError, query, canView, permissionsLoading } = useAttendanceWidgetLogic();

  const kind = data?.organizationKind;
  const summary = data?.summary;
  const latest = data?.records[0];

  return (
    <AttendanceWidgetAccess canView={canView} permissionsLoading={permissionsLoading}>
      {isLoading ? (
        <View style={styles.wrap}>
          <Skeleton height={100} borderRadius={16} />
        </View>
      ) : isError ? (
        <WidgetErrorState message="Could not load attendance." onRetry={() => void query.refetch()} />
      ) : !summary || summary.totalTracked === 0 ? (
        <WidgetEmptyState
          title={isCorporateKind(kind) ? 'No participation data' : 'No attendance data'}
          description="Your recent sessions will show here."
          icon="how-to-reg"
        />
      ) : (
        <View style={styles.wrap}>
          <View style={[styles.bigCircle, { borderColor: accentColor + '33' }]}>
            <AppText
              variant="h3"
              weight="bold"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
              style={{
                color: accentColor,
                fontSize: 22,
                lineHeight: 26,
                textAlign: 'center',
                width: '100%',
                paddingHorizontal: 4,
              }}
            >
              {summary.ratePercent.toFixed(0)}%
            </AppText>
          </View>
          <View style={styles.textContainer}>
            <AppText variant="h2" weight="bold" style={{ color: accentColor }}>
              {presentRateLabel(kind)}
            </AppText>
            {summary.presentStreakDays > 0 ? (
              <AppText variant="body" style={{ color: accentColor, opacity: 0.85 }}>
                {streakLabel(summary.presentStreakDays, kind)}
              </AppText>
            ) : null}
            {latest ? (
              <ClayView depth={3} puffy={8} color={`${accentColor}10`} style={styles.latest}>
                <AppText
                  variant="caption"
                  weight="bold"
                  style={{
                    color: isAttendancePresent(latest.status, latest.statusLabel)
                      ? colors.success
                      : accentColor,
                  }}
                >
                  Latest · {latest.statusLabel}
                </AppText>
                <AppText variant="caption" numberOfLines={1} style={{ color: colors.subtle }}>
                  {latest.eventTitle}
                </AppText>
              </ClayView>
            ) : null}
          </View>
        </View>
      )}
    </AttendanceWidgetAccess>
  );
};

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', flex: 1, minHeight: 0 },
  bigCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: { flex: 1 },
  latest: { marginTop: 8, borderRadius: 12 },
});
