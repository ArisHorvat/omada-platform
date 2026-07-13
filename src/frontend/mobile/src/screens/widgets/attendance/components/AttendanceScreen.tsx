import React from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
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
import { useThemeColors } from '@/src/hooks';
import { usePermission } from '@/src/context/PermissionContext';
import { AttendanceStatus } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { isUniversityOrg } from '@/src/screens/widgets/tasks/utils/taskLabels';
import { useAttendanceScreenLogic } from '../hooks/useAttendanceScreenLogic';
import { AttendanceOfferingsPanel } from './AttendanceOfferingsPanel';
import { AttendanceFiltersBar } from './AttendanceFiltersBar';
import { WorkTimeClockPanel } from './WorkTimeClockPanel';
import {
  absentNoun,
  formatSessionTime,
  isAttendanceAbsent,
  isAttendancePresent,
  isCorporateKind,
  presentNoun,
  streakLabel,
} from '../utils/attendanceLabels';
import { createStyles } from '../styles/attendance.styles';

export default function AttendanceScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { can } = usePermission();
  const { organization } = useCurrentOrganization();
  const isUniversity = isUniversityOrg(organization?.organizationType);
  const canScanIds = can('attendance.take') || can('digital-id.manage');

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

  const groupChips = (assignableGroups ?? []).map((g) => ({
    value: g.id,
    label: g.name,
  }));

  const listAnimation = Platform.OS === 'web' ? null : ClayAnimations.SlideInFlow;

  if (!permissionsLoading && !canView) {
    return (
      <WidgetPageShell>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
          <ScreenHeader title={isCorporateKind(kind) ? 'Participation' : 'Attendance'} />
          <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
            <WidgetEmptyState
              title="Attendance unavailable"
              description="You do not have permission to view attendance in this organization."
              icon="lock"
            />
          </View>
        </SafeAreaView>
      </WidgetPageShell>
    );
  }

  const isAbsentStatus = (status: AttendanceStatus, statusLabel?: string) =>
    isAttendanceAbsent(status, statusLabel);

  const isPresentStatus = (status: AttendanceStatus, statusLabel?: string) =>
    isAttendancePresent(status, statusLabel);

  return (
    <WidgetPageShell>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenTransition style={{ flex: 1 }}>
          <SafeAreaView style={styles.container} edges={['top']}>
            <ScreenHeader
              title={isCorporateKind(kind) ? 'Participation' : 'Attendance'}
              right={
                canSwitchView ? (
                  <PressClay onPress={() => setViewAsTeacher(isTeacherView ? false : true)}>
                    <View
                      style={[
                        styles.toggle,
                        { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary + '30' },
                      ]}
                    >
                      <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
                        {isTeacherView ? 'Student view' : 'Teacher view'}
                      </AppText>
                    </View>
                  </PressClay>
                ) : null
              }
            />

            {isLoading && !data ? (
              <View style={{ gap: 12 }}>
                <Skeleton height={120} borderRadius={20} />
                <Skeleton height={72} borderRadius={16} />
              </View>
            ) : isError ? (
              <WidgetErrorState message="Could not load attendance." onRetry={() => void query.refetch()} />
            ) : (
              <>
                {!isTeacherView && summary && summary.totalTracked > 0 ? (
                  <ClayView
                    depth={2}
                    contentOverflow="visible"
                    color={colors.card}
                    style={styles.inlineStats}
                  >
                    <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18 }}>
                      {summary.presentCount} {presentNoun(kind).toLowerCase()} · {summary.absentCount}{' '}
                      {absentNoun(kind).toLowerCase()}
                      {summary.ratePercent > 0 ? ` · ${summary.ratePercent.toFixed(0)}% marked present` : ''}
                      {summary.presentStreakDays > 0 ? ` · ${streakLabel(summary.presentStreakDays, kind)}` : ''}
                    </AppText>
                  </ClayView>
                ) : null}

                <AttendanceFiltersBar
                  groupOptions={groupChips}
                  activeGroupId={activeGroupId}
                  onGroupChange={setActiveGroupId}
                />

                {isTeacherView ? (
                  <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                    {canScanIds ? (
                      <AppButton
                        title="Scan Digital ID"
                        icon="qr-code"
                        variant="secondary"
                        onPress={() => router.push('/digital-id-scanner' as never)}
                        style={{ marginBottom: 16 }}
                      />
                    ) : null}
                    <AppText variant="h3" weight="bold" style={[styles.sectionTitle, { color: colors.text }]}>
                      This week&apos;s sessions
                    </AppText>
                    <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12, lineHeight: 18 }}>
                      Sessions you host this calendar week. Tap a row to take roll.
                    </AppText>
                    {teacherSessions.length === 0 ? (
                      <WidgetEmptyState
                        title="No upcoming sessions"
                        description="Offering-linked classes or meetings you manage will appear here."
                        icon="event"
                      />
                    ) : (
                      teacherSessions.map((session, index) => {
                        const instanceParam = encodeURIComponent(
                          new Date(session.startTime).toISOString(),
                        );

                        return (
                        <AnimatedItem
                          key={`${session.eventId}-${instanceParam}`}
                          animation={listAnimation?.(index) ?? null}
                        >
                          <PressClay
                            onPress={() =>
                              router.push(
                                `/attendance-session/${session.eventId}?instanceDate=${instanceParam}` as never,
                              )
                            }
                          >
                            <ClayView
                              depth={4}
                              contentOverflow="visible"
                              color={colors.card}
                              style={[styles.listCard, { padding: 14, borderRadius: 16 }]}
                            >
                              <View style={{ flex: 1 }}>
                                <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                                  {session.title}
                                </AppText>
                                <AppText variant="caption" style={{ color: colors.subtle }}>
                                  {formatSessionTime(session)}
                                  {session.offeringName ? ` · ${session.offeringName}` : ''}
                                  {session.eventTypeName ? ` · ${session.eventTypeName}` : ''}
                                  {session.cohortGroupName
                                    ? ` · ${session.cohortGroupName}`
                                    : session.groupName
                                      ? ` · ${session.groupName}`
                                      : ''}
                                </AppText>
                                <AppText variant="caption" weight="bold" style={{ color: colors.secondary, marginTop: 4 }}>
                                  {session.enrolledCount}
                                  {session.maxCapacity != null ? ` / ${session.maxCapacity}` : ''} enrolled
                                </AppText>
                                <AppText variant="caption" style={{ color: colors.primary, marginTop: 6 }}>
                                  Open roster
                                </AppText>
                              </View>
                            </ClayView>
                          </PressClay>
                        </AnimatedItem>
                        );
                      })
                    )}
                  </ScrollView>
                ) : (
                  <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                    {isCorporateKind(kind) ? <WorkTimeClockPanel /> : null}

                    {next ? (
                      <ClayView
                        depth={6}
                        contentOverflow="visible"
                        color={colors.card}
                        style={{ padding: 14, borderRadius: 16, marginBottom: 16 }}
                      >
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
                            title={isCorporateKind(kind) ? 'Decline' : 'Absent'}
                            size="sm"
                            variant="secondary"
                            onPress={() => void decline(next, kind ?? 'University')}
                            style={isCorporateKind(kind) ? styles.actionBtnFull : styles.actionBtnHalf}
                          />
                        </View>
                      </ClayView>
                    ) : null}

                    {isUniversity ? <AttendanceOfferingsPanel enabled={canView} /> : null}

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
                      records.map((item, index) => {
                        const absent = isAbsentStatus(item.status, item.statusLabel);
                        const present = isPresentStatus(item.status, item.statusLabel);
                        return (
                          <AnimatedItem
                            key={item.id}
                            animation={listAnimation?.(index) ?? null}
                            layout={Platform.OS === 'web' ? null : undefined}
                            style={{ overflow: 'visible' }}
                          >
                            <ClayView
                              depth={4}
                              contentOverflow="visible"
                              color={colors.card}
                              style={styles.historyCard}
                            >
                              <View style={styles.historyHeader}>
                                <View style={styles.historyBody}>
                                  <AppText
                                    variant="body"
                                    weight="bold"
                                    style={{ color: colors.text, flexShrink: 1 }}
                                  >
                                    {item.eventTitle}
                                  </AppText>
                                  <AppText
                                    variant="caption"
                                    style={[styles.historyMeta, { color: colors.subtle }]}
                                  >
                                    {new Date(item.instanceDate).toLocaleDateString(undefined, {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                    {(item as { eventTypeName?: string }).eventTypeName
                                      ? ` · ${(item as { eventTypeName?: string }).eventTypeName}`
                                      : ''}
                                    {item.groupName ? ` · ${item.groupName}` : ''}
                                  </AppText>
                                </View>
                                <View
                                  style={[
                                    styles.statusBadge,
                                    {
                                      backgroundColor: absent
                                        ? colors.error + '25'
                                        : present
                                          ? colors.success + '25'
                                          : colors.subtle + '22',
                                    },
                                  ]}
                                >
                                  <AppText
                                    variant="caption"
                                    weight="bold"
                                    numberOfLines={2}
                                    style={{
                                      color: absent ? colors.error : present ? colors.success : colors.subtle,
                                      textAlign: 'center',
                                    }}
                                  >
                                    {item.statusLabel}
                                  </AppText>
                                </View>
                              </View>
                            </ClayView>
                          </AnimatedItem>
                        );
                      })
                    )}
                  </ScrollView>
                )}
              </>
            )}
          </SafeAreaView>
        </ScreenTransition>
      </View>
    </WidgetPageShell>
  );
}
