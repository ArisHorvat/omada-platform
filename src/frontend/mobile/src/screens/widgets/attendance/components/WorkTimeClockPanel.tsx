import React, { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppButton, AppText, ClayView, Skeleton } from '@/src/components/ui';
import { AnimatedItem, ClayAnimations } from '@/src/components/animations';
import { attendanceExtendedApi, unwrapAttendanceExtendedAxios } from '@/src/api/attendanceExtendedApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useThemeColors } from '@/src/hooks';
import { alertAction } from '@/src/utils/confirmAction';
import { inputTextStyle } from '@/src/styles/typography';

function formatTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function WorkTimeClockPanel() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const query = useQuery({
    queryKey: QUERY_KEYS.attendance.workTime(orgId),
    queryFn: () => unwrapAttendanceExtendedAxios(attendanceExtendedApi.getWorkTime(14)),
    enabled: !!orgId,
    staleTime: 1000 * 30,
  });

  const today = query.data?.today;
  const recent = query.data?.recent ?? [];
  const [breakValue, setBreakValue] = useState(String(today?.breakMinutes ?? 0));

  useEffect(() => {
    setBreakValue(String(today?.breakMinutes ?? 0));
  }, [today?.id, today?.breakMinutes]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.workTime(orgId) });
  };

  const clockInMutation = useMutation({
    mutationFn: () => unwrapAttendanceExtendedAxios(attendanceExtendedApi.clockIn()),
    onSuccess: invalidate,
    onError: (e: Error) => alertAction({ title: 'Clock in failed', message: e.message }),
  });

  const clockOutMutation = useMutation({
    mutationFn: () => unwrapAttendanceExtendedAxios(attendanceExtendedApi.clockOut()),
    onSuccess: invalidate,
    onError: (e: Error) => alertAction({ title: 'Clock out failed', message: e.message }),
  });

  const breakMutation = useMutation({
    mutationFn: (minutes: number) => unwrapAttendanceExtendedAxios(attendanceExtendedApi.setBreak(minutes)),
    onSuccess: invalidate,
    onError: (e: Error) => alertAction({ title: 'Break update failed', message: e.message }),
  });

  const busy =
    clockInMutation.isPending || clockOutMutation.isPending || breakMutation.isPending || query.isFetching;

  const canClockIn = !today?.clockInUtc;
  const canClockOut = !!today?.clockInUtc && !today?.clockOutUtc;

  if (query.isLoading && !query.data) {
    return <Skeleton height={160} borderRadius={20} />;
  }

  return (
    <View style={{ gap: 12, marginBottom: 16 }}>
      <ClayView depth={6} puffy={14} color={colors.card} style={{ gap: 10 }}>
        <AppText variant="caption" weight="bold" style={{ color: colors.secondary }}>
          TODAY&apos;S WORKDAY
        </AppText>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <AppText variant="caption" style={{ color: colors.subtle }}>
              Started
            </AppText>
            <AppText variant="body" weight="bold" style={{ color: colors.text }}>
              {formatTime(today?.clockInUtc)}
            </AppText>
          </View>
          <View>
            <AppText variant="caption" style={{ color: colors.subtle }}>
              Finished
            </AppText>
            <AppText variant="body" weight="bold" style={{ color: colors.text }}>
              {formatTime(today?.clockOutUtc)}
            </AppText>
          </View>
          <View>
            <AppText variant="caption" style={{ color: colors.subtle }}>
              Worked
            </AppText>
            <AppText variant="body" weight="bold" style={{ color: colors.primary }}>
              {today?.clockOutUtc ? formatMinutes(today.workedMinutes) : '—'}
            </AppText>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <AppButton
            title="Clock in"
            size="sm"
            icon="login"
            disabled={!canClockIn || busy}
            loading={clockInMutation.isPending}
            onPress={() => clockInMutation.mutate()}
            style={{ flex: 1 }}
          />
          <AppButton
            title="Clock out"
            size="sm"
            variant="secondary"
            icon="logout"
            disabled={!canClockOut || busy}
            loading={clockOutMutation.isPending}
            onPress={() => clockOutMutation.mutate()}
            style={{ flex: 1 }}
          />
        </View>

        {today?.clockInUtc ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AppText variant="caption" style={{ color: colors.subtle }}>
              Break (min)
            </AppText>
            <TextInput
              value={breakValue}
              onChangeText={setBreakValue}
              keyboardType="number-pad"
              style={[
                inputTextStyle(),
                {
                  flex: 1,
                  minHeight: 40,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  color: colors.text,
                },
              ]}
            />
            <AppButton
              title="Save"
              size="sm"
              variant="secondary"
              disabled={busy || !Number.isFinite(Number(breakValue))}
              onPress={() => breakMutation.mutate(Number(breakValue))}
            />
          </View>
        ) : null}
      </ClayView>

      {recent.length > 0 ? (
        <>
          <AppText variant="h3" weight="bold" style={{ color: colors.text }}>
            Recent days
          </AppText>
          {recent.slice(0, 10).map((row, index) => (
            <AnimatedItem key={row.id} animation={ClayAnimations.SlideInFlow(index)}>
              <ClayView depth={4} puffy={10} color={colors.card} style={{ marginBottom: 8 }}>
                <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                  {new Date(row.workDate).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </AppText>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  {formatTime(row.clockInUtc)} – {formatTime(row.clockOutUtc)} · Break{' '}
                  {row.breakMinutes}m · {formatMinutes(row.workedMinutes)} worked
                </AppText>
              </ClayView>
            </AnimatedItem>
          ))}
        </>
      ) : null}
    </View>
  );
}
