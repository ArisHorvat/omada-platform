import React, { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { WidgetPageShell } from '@/src/components/layout';
import { AppButton, AppText, ClayView, Skeleton, WidgetErrorState } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { AttendanceStatus } from '@/src/api/generatedClient';
import {
  attendanceExtendedApi,
  unwrapAttendanceExtendedAxios,
  type AttendanceRosterMemberDto,
} from '@/src/api/attendanceExtendedApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useThemeColors } from '@/src/hooks';
import { alertAction } from '@/src/utils/confirmAction';
import { formatSessionTime } from '../utils/attendanceLabels';

function rosterStatusForPresent(isPresent: boolean) {
  return isPresent ? AttendanceStatus.Added : AttendanceStatus.Declined;
}

function isMarkedPresent(status: AttendanceStatus) {
  return status === AttendanceStatus.Added || status === AttendanceStatus.Accepted;
}

function isMarkedAbsent(status: AttendanceStatus) {
  return status === AttendanceStatus.Declined;
}

function normalizeRosterStatus(status: AttendanceStatus | string | number | undefined | null): AttendanceStatus {
  if (status == null) return AttendanceStatus.None;
  if (status === AttendanceStatus.None || status === 'None' || status === 0) return AttendanceStatus.None;
  if (status === AttendanceStatus.Expected || status === 'Expected') return AttendanceStatus.None;
  if (status === AttendanceStatus.Added || status === 'Added' || status === 1) return AttendanceStatus.Added;
  if (status === AttendanceStatus.Declined || status === 'Declined' || status === 2) return AttendanceStatus.Declined;
  if (status === AttendanceStatus.Accepted || status === 'Accepted') return AttendanceStatus.Accepted;
  return status as AttendanceStatus;
}

function rosterQueryKey(instanceDate: string) {
  const parsed = new Date(instanceDate);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return instanceDate.slice(0, 10);
}

export default function AttendanceSessionRosterScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const params = useLocalSearchParams<{ eventId: string; instanceDate?: string }>();
  const eventId = params.eventId ?? '';
  const instanceDate =
    params.instanceDate ?? new Date().toISOString();
  const instanceKey = rosterQueryKey(instanceDate);

  const query = useQuery({
    queryKey: QUERY_KEYS.attendance.roster(orgId, eventId, instanceKey),
    queryFn: () => unwrapAttendanceExtendedAxios(attendanceExtendedApi.getSessionRoster(eventId, instanceDate)),
    enabled: !!orgId && !!eventId,
  });

  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});

  const members = query.data?.members ?? [];

  const effectiveStatus = (m: AttendanceRosterMemberDto): AttendanceStatus => {
    if (draft[m.userId] != null) return draft[m.userId];
    return normalizeRosterStatus(m.status as AttendanceStatus);
  };

  const roster = query.data;
  const canonicalInstanceDate = roster?.instanceDate ?? instanceDate;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const rows = members
        .map((m) => ({
          userId: m.userId,
          status: effectiveStatus(m),
          original: normalizeRosterStatus(m.status as AttendanceStatus),
        }))
        .filter(
          (m) =>
            m.status !== AttendanceStatus.None ||
            m.original !== AttendanceStatus.None,
        )
        .map(({ userId, status }) => ({ userId, status }));

      return unwrapAttendanceExtendedAxios(
        attendanceExtendedApi.bulkMarkRoster(eventId, {
          instanceDate: canonicalInstanceDate,
          rows,
        }),
      );
    },
    onSuccess: async () => {
      setDraft({});
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendance.roster(orgId, eventId, instanceKey),
      });
      await queryClient.invalidateQueries({ queryKey: ['attendance', orgId] });
      await query.refetch();
      alertAction({ title: 'Saved', message: 'Attendance updated for this session.' });
    },
    onError: (e: Error) => alertAction({ title: 'Save failed', message: e.message }),
  });

  const markedCount = useMemo(
    () => members.filter((m) => effectiveStatus(m) !== AttendanceStatus.None).length,
    [members, draft],
  );

  return (
    <WidgetPageShell>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <ScreenHeader title="Take roll" onBack={() => router.back()} />

        {query.isLoading ? (
          <Skeleton height={120} borderRadius={20} />
        ) : query.isError ? (
          <WidgetErrorState message="Could not load roster." onRetry={() => void query.refetch()} />
        ) : roster ? (
          <>
            <ClayView
              depth={4}
              contentOverflow="visible"
              color={colors.card}
              style={{ marginBottom: 12, padding: 14, borderRadius: 16, gap: 4 }}
            >
              <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                {roster.title}
              </AppText>
              {roster.offeringName ? (
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  {roster.offeringName}
                  {roster.eventTypeName ? ` · ${roster.eventTypeName}` : ''}
                </AppText>
              ) : null}
              <AppText variant="caption" style={{ color: colors.subtle }}>
                {formatSessionTime({
                  startTime: new Date(roster.startTime),
                  endTime: new Date(roster.endTime),
                } as never)}
              </AppText>
              <AppText variant="caption" style={{ color: colors.primary, marginTop: 4 }}>
                {markedCount}/{members.length} marked · others start neutral until you choose Present or Absent
              </AppText>
            </ClayView>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
              {members.map((m) => {
                const status = effectiveStatus(m);
                const present = isMarkedPresent(status);
                const absent = isMarkedAbsent(status);
                const neutral = !present && !absent;

                return (
                  <ClayView
                    key={m.userId}
                    depth={4}
                    contentOverflow="visible"
                    color={colors.card}
                    style={{ marginBottom: 10, padding: 14, borderRadius: 16, gap: 8 }}
                  >
                    <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                      {m.displayName}
                    </AppText>
                    {m.cohortGroupName ? (
                      <AppText variant="caption" style={{ color: colors.subtle }}>
                        {m.cohortGroupName}
                      </AppText>
                    ) : null}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      <PressClay
                        onPress={() =>
                          setDraft((d) => ({
                            ...d,
                            [m.userId]: rosterStatusForPresent(true),
                          }))
                        }
                      >
                        <ClayView
                          depth={present ? 6 : 2}
                          contentOverflow="visible"
                          color={present ? colors.success + '30' : colors.background}
                          style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 }}
                        >
                          <AppText
                            variant="caption"
                            weight="bold"
                            style={{ color: present ? colors.success : colors.subtle }}
                          >
                            Present
                          </AppText>
                        </ClayView>
                      </PressClay>
                      <PressClay
                        onPress={() =>
                          setDraft((d) => ({
                            ...d,
                            [m.userId]: rosterStatusForPresent(false),
                          }))
                        }
                      >
                        <ClayView
                          depth={absent ? 6 : 2}
                          contentOverflow="visible"
                          color={absent ? colors.error + '30' : colors.background}
                          style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 }}
                        >
                          <AppText
                            variant="caption"
                            weight="bold"
                            style={{ color: absent ? colors.error : colors.subtle }}
                          >
                            Absent
                          </AppText>
                        </ClayView>
                      </PressClay>
                      {!neutral ? (
                        <PressClay
                          onPress={() =>
                            setDraft((d) => ({
                              ...d,
                              [m.userId]: AttendanceStatus.None,
                            }))
                          }
                        >
                          <ClayView
                            depth={2}
                            contentOverflow="visible"
                            color={colors.background}
                            style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 }}
                          >
                            <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
                              Clear
                            </AppText>
                          </ClayView>
                        </PressClay>
                      ) : null}
                    </View>
                  </ClayView>
                );
              })}
            </ScrollView>

            <View style={{ paddingVertical: 12 }}>
              <AppButton
                title={saveMutation.isPending ? 'Saving…' : 'Save attendance'}
                icon="save"
                loading={saveMutation.isPending}
                disabled={saveMutation.isPending}
                onPress={() => saveMutation.mutate()}
              />
            </View>
          </>
        ) : null}
      </SafeAreaView>
    </WidgetPageShell>
  );
}
