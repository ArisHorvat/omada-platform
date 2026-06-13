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

export default function AttendanceSessionRosterScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const params = useLocalSearchParams<{ eventId: string; instanceDate?: string }>();
  const eventId = params.eventId ?? '';
  const instanceDate =
    params.instanceDate ?? new Date().toISOString().slice(0, 10);

  const query = useQuery({
    queryKey: QUERY_KEYS.attendance.roster(orgId, eventId, instanceDate),
    queryFn: () => unwrapAttendanceExtendedAxios(attendanceExtendedApi.getSessionRoster(eventId, instanceDate)),
    enabled: !!orgId && !!eventId,
  });

  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});

  const members = query.data?.members ?? [];

  const effectiveStatus = (m: AttendanceRosterMemberDto): AttendanceStatus => {
    if (draft[m.userId] != null) return draft[m.userId];
    if (m.status === AttendanceStatus.None || m.status === 'None') return AttendanceStatus.None;
    return m.status as AttendanceStatus;
  };

  const dirtyRows = useMemo(() => {
    return members.filter((m) => {
      const next = draft[m.userId];
      if (next == null) return false;
      const current =
        m.status === AttendanceStatus.None || m.status === 'None'
          ? AttendanceStatus.None
          : (m.status as AttendanceStatus);
      return next !== current;
    });
  }, [members, draft]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const rows = members
        .map((m) => {
          const status = effectiveStatus(m);
          if (status === AttendanceStatus.None) return null;
          return { userId: m.userId, status };
        })
        .filter(Boolean) as { userId: string; status: AttendanceStatus }[];

      return unwrapAttendanceExtendedAxios(
        attendanceExtendedApi.bulkMarkRoster(eventId, {
          instanceDate,
          rows,
        }),
      );
    },
    onSuccess: async () => {
      setDraft({});
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendance.roster(orgId, eventId, instanceDate),
      });
      await queryClient.invalidateQueries({ queryKey: ['attendance', orgId] });
      alertAction({ title: 'Saved', message: 'Attendance updated for this session.' });
    },
    onError: (e: Error) => alertAction({ title: 'Save failed', message: e.message }),
  });

  const roster = query.data;

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
            <ClayView depth={6} puffy={12} color={colors.card} style={{ marginBottom: 12, gap: 4 }}>
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
            </ClayView>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
              {members.map((m) => {
                const status = effectiveStatus(m);
                const present =
                  status === AttendanceStatus.Added ||
                  status === AttendanceStatus.Expected ||
                  status === AttendanceStatus.Accepted;
                const absent = status === AttendanceStatus.Declined;

                return (
                  <ClayView
                    key={m.userId}
                    depth={4}
                    puffy={10}
                    color={colors.card}
                    style={{ marginBottom: 8, gap: 8 }}
                  >
                    <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                      {m.displayName}
                    </AppText>
                    {m.cohortGroupName ? (
                      <AppText variant="caption" style={{ color: colors.subtle }}>
                        {m.cohortGroupName}
                      </AppText>
                    ) : null}
                    <View style={{ flexDirection: 'row', gap: 8 }}>
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
                          puffy={8}
                          color={present ? colors.success + '30' : colors.background}
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
                          puffy={8}
                          color={absent ? colors.error + '30' : colors.background}
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
