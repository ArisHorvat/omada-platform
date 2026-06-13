import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { offeringsApi, unwrapOfferingsAxios } from '@/src/api/offeringsApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

export function useOrganizationPeriods() {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const periodsQuery = useQuery({
    queryKey: QUERY_KEYS.offerings.periods(orgId),
    queryFn: () => unwrapOfferingsAxios(offeringsApi.getPeriods()),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });

  const currentPeriodQuery = useQuery({
    queryKey: QUERY_KEYS.offerings.assignable(orgId, 'current-period'),
    queryFn: () => unwrapOfferingsAxios(offeringsApi.getCurrentPeriod()),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
  });

  const [activePeriodId, setActivePeriodId] = useState<string | null>(null);

  const periods = periodsQuery.data ?? [];

  useEffect(() => {
    if (activePeriodId) return;
    const currentId = currentPeriodQuery.data?.periodId;
    if (currentId) {
      setActivePeriodId(currentId);
      return;
    }
    const fromList = periods.find((p) => p.isCurrent)?.id;
    if (fromList) {
      setActivePeriodId(fromList);
      return;
    }
    if (periods[0]?.id) setActivePeriodId(periods[0].id);
  }, [activePeriodId, currentPeriodQuery.data?.periodId, periods]);

  const activePeriod = useMemo(
    () => periods.find((p) => p.id === activePeriodId) ?? null,
    [periods, activePeriodId],
  );

  const periodOptions = useMemo(
    () =>
      periods.map((p) => ({
        value: p.id,
        label: p.name,
        subtitle: p.isCurrent ? 'Current term' : undefined,
      })),
    [periods],
  );

  return {
    periods,
    activePeriodId,
    setActivePeriodId,
    activePeriod,
    periodOptions,
    isLoading: periodsQuery.isLoading || currentPeriodQuery.isLoading,
    isError: periodsQuery.isError,
    refetch: () => void periodsQuery.refetch(),
  };
}
