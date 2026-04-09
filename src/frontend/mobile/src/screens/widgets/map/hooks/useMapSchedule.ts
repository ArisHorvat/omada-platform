import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scheduleApi, unwrap } from '@/src/api';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

/** Org-wide schedule for the current local day (for map room busy/free). */
export function useMapScheduleForToday() {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;

  const { localOffsetDate, dateString } = useMemo(() => {
    const date = new Date();
    const offset = date.getTimezoneOffset() * 60000;
    const localOffsetDate = new Date(date.getTime() - offset);
    const dateString = localOffsetDate.toISOString().split('T')[0];
    return { localOffsetDate, dateString };
  }, []);

  /** Align with useScheduleApi queryKey so day/org-wide feed shares cache with schedule when filters match. */
  const filters = useMemo(() => ({ myScheduleOnly: false as boolean, publicOnly: false as boolean }), []);

  return useQuery({
    queryKey: ['schedule', orgId, dateString, 'day', filters],
    queryFn: async () =>
      unwrap(
        scheduleApi.getSchedule(localOffsetDate, 'day', null, null, null, null, false, false),
      ),
    enabled: !!orgId,
    refetchInterval: 60_000,
  });
}
