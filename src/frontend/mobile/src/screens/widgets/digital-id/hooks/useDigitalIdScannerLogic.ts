import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { attendanceApi, digitalIdApi, unwrap } from '@/src/api';
import {
  AttendanceStatus,
  OrganizationType,
  RecordMemberAttendanceRequest,
  ValidateDigitalIdRequest,
  type AttendanceSessionDto,
  type DigitalIdScanResultDto,
} from '@/src/api/generatedClient';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { isCorporateKind } from '@/src/screens/widgets/attendance/utils/attendanceLabels';

export function useDigitalIdScannerLogic() {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const queryClient = useQueryClient();
  const [lastScan, setLastScan] = useState<DigitalIdScanResultDto | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const sessionsQuery = useQuery({
    queryKey: QUERY_KEYS.attendance.me(orgId, null),
    queryFn: async () => unwrap(attendanceApi.getMyAttendance(null, 7)),
    enabled: !!orgId,
    staleTime: 60_000,
    select: (data) => data.teacherSessions ?? [],
  });

  const scanMutation = useMutation({
    mutationFn: async (token: string) => {
      const req = new ValidateDigitalIdRequest();
      req.token = token.trim();
      return unwrap(digitalIdApi.scan(req));
    },
    onSuccess: (result) => {
      setLastScan(result);
      setScanError(result.valid ? null : result.message ?? 'Invalid code.');
    },
    onError: (err: Error) => {
      setLastScan(null);
      setScanError(err.message);
    },
  });

  const recordMutation = useMutation({
    mutationFn: async ({
      session,
      userId,
      organizationKind,
    }: {
      session: AttendanceSessionDto;
      userId: string;
      organizationKind: string;
    }) => {
      const req = new RecordMemberAttendanceRequest();
      req.eventId = session.eventId;
      req.instanceDate = session.startTime;
      req.userId = userId;
      req.status = isCorporateKind(organizationKind) ? AttendanceStatus.Accepted : AttendanceStatus.Added;
      return unwrap(attendanceApi.recordMemberAttendance(req));
    },
    onSuccess: async () => {
      if (!orgId) return;
      await queryClient.invalidateQueries({ queryKey: ['attendance', orgId] });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedule.all(orgId) });
    },
  });

  const handleScanToken = useCallback(
    (token: string) => {
      if (!token.trim() || scanMutation.isPending) return;
      void scanMutation.mutateAsync(token);
    },
    [scanMutation],
  );

  const resetScan = useCallback(() => {
    setLastScan(null);
    setScanError(null);
    scanMutation.reset();
  }, [scanMutation]);

  return {
    teacherSessions: sessionsQuery.data ?? [],
    sessionsLoading: sessionsQuery.isLoading,
    lastScan,
    scanError,
    isScanning: scanMutation.isPending,
    isRecording: recordMutation.isPending,
    handleScanToken,
    resetScan,
    recordAttendance: recordMutation.mutateAsync,
    organizationKind:
      organization?.organizationType === OrganizationType.Corporate ? 'Corporate' : 'University',
  };
}
