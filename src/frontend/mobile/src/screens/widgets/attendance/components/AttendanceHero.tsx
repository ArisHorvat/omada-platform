import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  AppButton,
  ClayView,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { useAttendanceWidgetLogic } from '../hooks/useAttendanceWidgetLogic';
import {
  absentNoun,
  formatSessionTime,
  isCorporateKind,
  presentNoun,
  presentRateLabel,
  streakLabel,
} from '../utils/attendanceLabels';
import { AttendanceWidgetAccess } from './AttendanceWidgetAccess';

interface AttendanceHeroProps {
  accentColor: string;
}

export const AttendanceHero: React.FC<AttendanceHeroProps> = ({ accentColor }) => {
  const colors = useThemeColors();
  const {
    data,
    isLoading,
    isError,
    query,
    canView,
    permissionsLoading,
    isTeacherView,
    checkIn,
    decline,
    rsvpTentative,
    isMutating,
  } = useAttendanceWidgetLogic();

  const kind = data?.organizationKind;
  const summary = data?.summary;
  const next = data?.nextSession;
  const teacherSession = data?.teacherSessions[0];

  return (
    <AttendanceWidgetAccess canView={canView} permissionsLoading={permissionsLoading}>
      {isLoading ? (
        <View style={styles.box}>
          <Skeleton height={160} borderRadius={20} />
        </View>
      ) : isError ? (
        <WidgetErrorState message="Could not load attendance." onRetry={() => void query.refetch()} />
      ) : isTeacherView && teacherSession ? (
        <ClayView depth={10} puffy={14} color={`${accentColor}14`} style={styles.clay}>
          <AppText variant="caption" weight="bold" style={[styles.kicker, { color: accentColor }]}>
            NEXT SESSION TO MONITOR
          </AppText>
          <AppText variant="h3" weight="bold" numberOfLines={2}>
            {teacherSession.title}
          </AppText>
          <AppText variant="caption" style={{ opacity: 0.8, marginTop: 4 }}>
            {formatSessionTime(teacherSession)}
            {teacherSession.groupName ? ` · ${teacherSession.groupName}` : ''}
          </AppText>
          <AppText variant="body" weight="bold" style={{ color: accentColor, marginTop: 10 }}>
            {teacherSession.enrolledCount}
            {teacherSession.maxCapacity != null ? ` / ${teacherSession.maxCapacity}` : ''} enrolled
          </AppText>
        </ClayView>
      ) : !summary || summary.totalTracked === 0 ? (
        <WidgetEmptyState
          title={isCorporateKind(kind) ? 'No RSVP history' : 'No attendance yet'}
          description={
            next
              ? 'Your next session is coming up — check in when ready.'
              : 'Sessions from your schedule will appear here.'
          }
          icon="how-to-reg"
        />
      ) : (
        <ClayView depth={10} puffy={14} color={`${accentColor}14`} style={styles.clay}>
          <AppText variant="caption" weight="bold" style={[styles.kicker, { color: accentColor }]}>
            {presentRateLabel(kind).toUpperCase()}
          </AppText>
          <AppText variant="display" weight="bold" style={{ color: accentColor, fontSize: 48, lineHeight: 52 }}>
            {summary.ratePercent.toFixed(0)}%
          </AppText>
          <AppText variant="caption" style={{ opacity: 0.85 }}>
            {summary.presentCount} {presentNoun(kind).toLowerCase()} · {summary.absentCount}{' '}
            {absentNoun(kind).toLowerCase()}
            {summary.presentStreakDays > 0 ? ` · ${streakLabel(summary.presentStreakDays, kind)}` : ''}
          </AppText>
          {next ? (
            <ClayView
              depth={4}
              contentOverflow="visible"
              color={`${accentColor}10`}
              style={styles.nextBox}
            >
              <AppText variant="caption" weight="bold" style={{ color: accentColor }}>
                UP NEXT
              </AppText>
              <AppText variant="body" weight="bold" numberOfLines={2}>
                {next.title}
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }}>
                {formatSessionTime(next)}
              </AppText>
              <View
                style={isCorporateKind(kind) ? styles.actionsStack : styles.actions}
              >
                <AppButton
                  title={isCorporateKind(kind) ? 'Accept' : 'Check in'}
                  size="sm"
                  icon="check"
                  loading={isMutating}
                  onPress={() => void checkIn(next, kind ?? 'University')}
                  style={isCorporateKind(kind) ? styles.actionBtnFull : styles.actionBtnHalf}
                />
                {isCorporateKind(kind) ? (
                  <AppButton
                    title="Maybe"
                    size="sm"
                    variant="secondary"
                    onPress={() => void rsvpTentative(next, kind ?? 'Corporate')}
                    style={styles.actionBtnFull}
                  />
                ) : null}
                <AppButton
                  title={isCorporateKind(kind) ? 'Decline' : 'Mark absent'}
                  size="sm"
                  variant="secondary"
                  onPress={() => void decline(next, kind ?? 'University')}
                  style={isCorporateKind(kind) ? styles.actionBtnFull : styles.actionBtnHalf}
                />
              </View>
            </ClayView>
          ) : null}
        </ClayView>
      )}
    </AttendanceWidgetAccess>
  );
};

const styles = StyleSheet.create({
  box: { minHeight: 160 },
  clay: { borderRadius: 20, minHeight: 160, padding: 14 },
  kicker: { marginBottom: 6, letterSpacing: 0.5 },
  nextBox: { marginTop: 12, borderRadius: 14, padding: 12 },
  actions: { flexDirection: 'row', marginTop: 10, gap: 8 },
  actionsStack: { marginTop: 10, gap: 8 },
  actionBtnFull: { alignSelf: 'stretch' },
  actionBtnHalf: { flex: 1, minWidth: 0 },
});
