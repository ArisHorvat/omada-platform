import { useMemo } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { attendanceApi, scheduleApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import {
  AttendanceStatus,
  type AttendanceSessionDto,
  type MyAttendanceResponse,
  ScheduleItemDto,
  UpdateAttendanceRequest,
} from '@/src/api/generatedClient';
import { attendanceInstanceDate } from '../../schedule/utils/scheduleInstanceDate';
import { isCorporateKind } from '../utils/attendanceLabels';

export interface UseAttendanceApiOptions {
  groupId?: string | null;
  enabled?: boolean;
}

function sessionAsScheduleItem(session: AttendanceSessionDto): ScheduleItemDto {
  const item = new ScheduleItemDto();
  item.id = session.eventId;
  item.title = session.title;
  item.startTime = new Date(session.startTime);
  item.endTime = new Date(session.endTime);
  item.groupId = session.groupId;
  item.groupName = session.groupName;
  item.roomName = session.roomName;
  return item;
}

export function useAttendanceApi(options: UseAttendanceApiOptions = {}) {
  const { groupId = null, enabled = true } = options;
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const queryClient = useQueryClient();

  const invalidate = async () => {
    if (!orgId) return;
    await queryClient.invalidateQueries({ queryKey: ['attendance', orgId] });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedule.all(orgId) });
  };

  const query = useQuery({
    queryKey: QUERY_KEYS.attendance.me(orgId, groupId),
    queryFn: async () => unwrap(attendanceApi.getMyAttendance(groupId, 60)),
    enabled: enabled && !!orgId,
    staleTime: 1000 * 60 * 2,
  });

  const updateSessionStatus = useMutation({
    mutationFn: async ({
      session,
      status,
    }: {
      session: AttendanceSessionDto;
      status: AttendanceStatus;
      organizationKind?: string;
    }) => {
      const event = sessionAsScheduleItem(session);
      const req = new UpdateAttendanceRequest();
      req.instanceDate = attendanceInstanceDate(event);
      req.status = status;
      return unwrap(scheduleApi.updateAttendance(session.eventId, req));
    },
    onSuccess: invalidate,
    onError: (error: unknown, variables) => {
      const msg = error instanceof Error ? error.message : 'Could not update attendance.';
      const kind = variables.organizationKind ?? query.data?.organizationKind;
      Alert.alert(isCorporateKind(kind) ? 'Participation' : 'Attendance', msg);
    },
  });

  const checkIn = (session: AttendanceSessionDto, organizationKind: string) => {
    const status = isCorporateKind(organizationKind)
      ? AttendanceStatus.Accepted
      : AttendanceStatus.Added;
    return updateSessionStatus.mutateAsync({ session, status, organizationKind });
  };

  const decline = (session: AttendanceSessionDto, organizationKind: string) =>
    updateSessionStatus.mutateAsync({
      session,
      status: AttendanceStatus.Declined,
      organizationKind,
    });

  const rsvpTentative = (session: AttendanceSessionDto, organizationKind: string) =>
    updateSessionStatus.mutateAsync({
      session,
      status: AttendanceStatus.Tentative,
      organizationKind,
    });

  return {
    data: query.data,
    isLoading: query.isPending || query.isLoading,
    isError: query.isError,
    query,
    invalidate,
    checkIn,
    decline,
    rsvpTentative,
    isMutating: updateSessionStatus.isPending,
  };
}

export type UseAttendanceApiResult = ReturnType<typeof useAttendanceApi>;

export function useAttendanceSummary(data: MyAttendanceResponse | undefined) {
  return useMemo(() => data?.summary, [data?.summary]);
}
