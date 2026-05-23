import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { WidgetPageShell } from '@/src/components/layout';
import { AnimatedItem, ScreenTransition, PressClay } from '@/src/components/animations';
import {
  AppButton,
  AppText,
  ClayView,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { ClayAnimations } from '@/src/constants/animations';
import { useThemeColors, useBreakpoint } from '@/src/hooks';
import { AttendanceStatus, type GroupPickerItemDto } from '@/src/api/generatedClient';
import { GradesFilterChips } from '../../grades/components/GradesFilterChips';
import { useAttendanceScreenLogic } from '../hooks/useAttendanceScreenLogic';
import {
  absentNoun,
  formatSessionTime,
  isCorporateKind,
  presentNoun,
  presentRateLabel,
  streakLabel,
  teacherModeLabel,
} from '../utils/attendanceLabels';
import { createStyles } from '../styles/attendance.styles';

export default function AttendanceScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { isWideShell } = useBreakpoint();
  const styles = createStyles(colors);

  const {
    data,
    isLoading,
    isError,
    query,
    canView,
    permissionsLoading,
    activeGroupId,
    setActiveGroupId,
    assignableGroups,
    viewMode,
    isTeacherView,
    canSwitchView,
    setViewAsTeacher,
    checkIn,
    decline,
    rsvpTentative,
    isMutating,
  } = useAttendanceScreenLogic();

  const kind = data?.organizationKind;
  const summary = data?.summary;
  const records = data?.records ?? [];
  const next = data?.nextSession;
  const teacherSessions = data?.teacherSessions ?? [];

  const groupChips = (assignableGroups ?? []).map((g: GroupPickerItemDto) => ({
    id: g.id,
    label: g.name,
  }));

  if (!permissionsLoading && !canView) {
    return (
      <WidgetPageShell>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <ClayBackButton absolute />
          <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
            <WidgetEmptyState
              title="Attendance unavailable"
              description="You do not have permission to view attendance in this organization."
              icon="lock"
            />
          </View>
        </View>
      </WidgetPageShell>
    );
  }

  const isAbsentStatus = (status: AttendanceStatus) => status === AttendanceStatus.Declined;

  return (
    <WidgetPageShell>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ClayBackButton absolute={!isWideShell} />

        <ScreenTransition style={{ flex: 1 }}>
          <SafeAreaView style={styles.container}>
            <View style={styles.headerRow}>
              <AppText variant="h2" weight="bold" style={{ color: colors.text, flex: 1 }}>
                {isCorporateKind(kind) ? 'Participation' : 'Attendance'}
              </AppText>
              {canSwitchView ? (
                <PressClay
                  onPress={() => setViewAsTeacher(isTeacherView ? false : true)}
                >
                  <ClayView depth={4} puffy={8} color={colors.card} style={styles.toggle}>
                    <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
                      {isTeacherView ? 'Student view' : 'Teacher view'}
                    </AppText>
                  </ClayView>
                </PressClay>
              ) : null}
            </View>

            {isLoading && !data ? (
              <View style={{ gap: 12 }}>
                <Skeleton height={120} borderRadius={20} />
                <Skeleton height={72} borderRadius={16} />
              </View>
            ) : isError ? (
              <WidgetErrorState message="Could not load attendance." onRetry={() => void query.refetch()} />
            ) : (
              <>
                <ClayView depth={8} puffy={16} color={colors.primary} style={styles.summaryCard}>
                  {summary && summary.totalTracked > 0 ? (
                    <>
                      <AppText style={styles.summaryLabel}>{presentRateLabel(kind)} rate</AppText>
                      <AppText variant="h1" weight="bold" style={styles.summaryValue}>
                        {summary.ratePercent.toFixed(0)}%
                      </AppText>
                      <AppText variant="caption" style={styles.summaryMeta}>
                        {summary.presentCount} {presentNoun(kind).toLowerCase()} · {summary.absentCount}{' '}
                        {absentNoun(kind).toLowerCase()}
                        {summary.tentativeCount > 0 ? ` · ${summary.tentativeCount} maybe` : ''}
                      </AppText>
                      {summary.presentStreakDays > 0 ? (
                        <AppText variant="caption" style={styles.summaryMeta}>
                          {streakLabel(summary.presentStreakDays, kind)}
                        </AppText>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <AppText style={styles.summaryLabel}>
                        {isTeacherView ? teacherModeLabel(data?.mode) : 'Getting started'}
                      </AppText>
                      <AppText variant="h3" weight="bold" style={styles.summaryValue}>
                        {isCorporateKind(kind)
                          ? 'RSVP to meetings from your schedule'
                          : 'Check in to classes from your schedule'}
                      </AppText>
                    </>
                  )}
                </ClayView>

                <GradesFilterChips
                  chips={groupChips}
                  activeId={activeGroupId}
                  onSelect={setActiveGroupId}
                  allLabel="All groups"
                />

                {isTeacherView ? (
                  <>
                    <AppText variant="h3" weight="bold" style={[styles.sectionTitle, { color: colors.text }]}>
                      Sessions to monitor
                    </AppText>
                    {teacherSessions.length === 0 ? (
                      <WidgetEmptyState
                        title="No upcoming sessions"
                        description="Classes or meetings you manage will appear here."
                        icon="event"
                      />
                    ) : (
                      teacherSessions.map((session, index) => (
                        <AnimatedItem key={session.eventId} animation={ClayAnimations.SlideInFlow(index)}>
                          <PressClay onPress={() => router.push('/schedule' as never)}>
                            <ClayView depth={4} puffy={10} color={colors.card} style={styles.row}>
                              <View style={{ flex: 1 }}>
                                <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                                  {session.title}
                                </AppText>
                                <AppText variant="caption" style={{ color: colors.subtle }}>
                                  {formatSessionTime(session)}
                                  {session.groupName ? ` · ${session.groupName}` : ''}
                                </AppText>
                                <AppText variant="caption" weight="bold" style={{ color: colors.secondary, marginTop: 4 }}>
                                  {session.enrolledCount}
                                  {session.maxCapacity != null ? ` / ${session.maxCapacity}` : ''} enrolled
                                </AppText>
                                <AppText variant="caption" style={{ color: colors.primary, marginTop: 6 }}>
                                  Open in schedule
                                </AppText>
                              </View>
                            </ClayView>
                          </PressClay>
                        </AnimatedItem>
                      ))
                    )}
                  </>
                ) : (
                  <>
                    {next ? (
                      <ClayView depth={6} puffy={14} color={colors.card} style={[styles.row, { marginBottom: 16 }]}>
                        <AppText variant="caption" weight="bold" style={{ color: colors.secondary }}>
                          UP NEXT
                        </AppText>
                        <AppText variant="h3" weight="bold" style={{ color: colors.text, marginVertical: 6 }}>
                          {next.title}
                        </AppText>
                        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
                          {formatSessionTime(next)}
                          {next.roomName ? ` · ${next.roomName}` : ''}
                        </AppText>
                        <View style={styles.actions}>
                          <AppButton
                            title={isCorporateKind(kind) ? 'Accept' : 'Check in'}
                            size="sm"
                            icon="check"
                            loading={isMutating}
                            onPress={() => void checkIn(next, kind ?? 'University')}
                            style={{ flex: 1, marginRight: 8 }}
                          />
                          {isCorporateKind(kind) ? (
                            <AppButton
                              title="Maybe"
                              size="sm"
                              variant="secondary"
                              onPress={() => void rsvpTentative(next, kind ?? 'Corporate')}
                              style={{ flex: 1, marginRight: 8 }}
                            />
                          ) : null}
                          <AppButton
                            title={isCorporateKind(kind) ? 'Decline' : 'Absent'}
                            size="sm"
                            variant="secondary"
                            onPress={() => void decline(next, kind ?? 'University')}
                            style={{ flex: 1 }}
                          />
                        </View>
                      </ClayView>
                    ) : null}

                    <AppText variant="h3" weight="bold" style={[styles.sectionTitle, { color: colors.text }]}>
                      Recent history
                    </AppText>
                    {records.length === 0 ? (
                      <WidgetEmptyState
                        title="No records yet"
                        description="Your check-ins and absences will appear here."
                        icon="history"
                      />
                    ) : (
                      <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
                        {records.map((item, index) => {
                          const absent = isAbsentStatus(item.status);
                          return (
                            <AnimatedItem key={item.id} animation={ClayAnimations.SlideInFlow(index)}>
                              <ClayView depth={4} puffy={8} color={colors.card} style={styles.row}>
                                <View style={{ flex: 1 }}>
                                  <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                                    {item.eventTitle}
                                  </AppText>
                                  <AppText variant="caption" style={{ color: colors.subtle }}>
                                    {new Date(item.instanceDate).toLocaleDateString(undefined, {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                    {item.groupName ? ` · ${item.groupName}` : ''}
                                  </AppText>
                                </View>
                                <View
                                  style={[
                                    styles.statusBadge,
                                    {
                                      backgroundColor: absent
                                        ? colors.error + '25'
                                        : colors.success + '25',
                                    },
                                  ]}
                                >
                                  <AppText
                                    variant="caption"
                                    weight="bold"
                                    style={{ color: absent ? colors.error : colors.success }}
                                  >
                                    {item.statusLabel}
                                  </AppText>
                                </View>
                              </ClayView>
                            </AnimatedItem>
                          );
                        })}
                      </ScrollView>
                    )}
                  </>
                )}
              </>
            )}
          </SafeAreaView>
        </ScreenTransition>
      </View>
    </WidgetPageShell>
  );
}
