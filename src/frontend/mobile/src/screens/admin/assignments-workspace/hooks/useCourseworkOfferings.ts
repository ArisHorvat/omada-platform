import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { orgAdminApi, unwrap, usersApi } from '@/src/api';
import { offeringsApi, unwrapOfferingsAxios } from '@/src/api/offeringsApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useAuth } from '@/src/context/AuthContext';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { canAccessOrgStructure } from '@/src/utils/orgAdminAccess';

export type CourseworkOfferingOption = {
  value: string;
  label: string;
  subtitle?: string;
  periodId: string;
};

/** Loads term + course list for coursework posting (admin catalog vs teacher teaching team). */
export function useCourseworkOfferings() {
  const { organization } = useCurrentOrganization();
  const { activeSession } = useAuth();
  const orgId = organization?.id ?? '';

  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.userProfile(orgId),
    queryFn: () => unwrap(usersApi.getMe()),
    staleTime: 1000 * 60 * 5,
  });

  const canUseFullCatalog = canAccessOrgStructure(
    activeSession?.role,
    profileQuery.data?.widgetAccess,
  );

  const [periodId, setPeriodId] = useState('');

  const currentPeriodQuery = useQuery({
    queryKey: QUERY_KEYS.offerings.assignable(orgId, 'current-period'),
    queryFn: () => unwrapOfferingsAxios(offeringsApi.getCurrentPeriod()),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
  });

  const adminPeriodsQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.periods(orgId),
    queryFn: () => unwrap(orgAdminApi.getPeriods()),
    enabled: !!orgId && canUseFullCatalog,
    staleTime: 1000 * 60 * 3,
  });

  useEffect(() => {
    if (periodId) return;
    const current = currentPeriodQuery.data?.periodId;
    if (current) {
      setPeriodId(current);
      return;
    }
    const periods = adminPeriodsQuery.data;
    const currentFromList = periods?.find((p) => p.isCurrent)?.id;
    if (currentFromList) {
      setPeriodId(currentFromList);
      return;
    }
    if (periods?.[0]?.id) setPeriodId(periods[0].id);
  }, [periodId, currentPeriodQuery.data?.periodId, adminPeriodsQuery.data]);

  const offeringsQuery = useQuery({
    queryKey: ['coursework-offerings', orgId, periodId, canUseFullCatalog],
    queryFn: async () => {
      if (canUseFullCatalog && periodId) {
        const list = await unwrap(offeringsApi.listForPeriod(periodId).then((res) => Promise.resolve(res.data)));
        const periodName =
          adminPeriodsQuery.data?.find((p) => p.id === periodId)?.name ??
          currentPeriodQuery.data?.periodName;
        return list.map((o) => ({
          id: o.id,
          name: o.name,
          code: o.code,
          periodId: o.periodId,
          periodName,
        }));
      }
      return unwrapOfferingsAxios(offeringsApi.getAssignable(periodId || undefined));
    },
    enabled: !!orgId && (canUseFullCatalog ? !!periodId : true),
    staleTime: 1000 * 60 * 2,
  });

  const periodOptions = useMemo(() => {
    if (canUseFullCatalog && adminPeriodsQuery.data?.length) {
      return adminPeriodsQuery.data
        .filter((p) => p.id && p.name)
        .map((p) => ({
          value: p.id!,
          label: p.name!,
          subtitle: p.isCurrent ? 'Current term' : undefined,
        }));
    }
    const current = currentPeriodQuery.data;
    if (current?.periodId && current.periodName) {
      return [{ value: current.periodId, label: current.periodName, subtitle: 'Current term' }];
    }
    const fromOfferings = new Map<string, string>();
    for (const o of offeringsQuery.data ?? []) {
      if (o.periodId && o.periodName) fromOfferings.set(o.periodId, o.periodName);
    }
    return [...fromOfferings.entries()].map(([value, label]) => ({ value, label }));
  }, [canUseFullCatalog, adminPeriodsQuery.data, currentPeriodQuery.data, offeringsQuery.data]);

  const offeringOptions: CourseworkOfferingOption[] = useMemo(
    () =>
      (offeringsQuery.data ?? []).map((o) => ({
        value: o.id ?? '',
        label: o.name ?? 'Course',
        subtitle: [o.periodName, o.code].filter(Boolean).join(' · ') || 'Course offering',
        periodId: o.periodId ?? periodId,
      })),
    [offeringsQuery.data, periodId],
  );

  return {
    canUseFullCatalog,
    periodId,
    setPeriodId,
    periodOptions,
    offeringOptions,
    offeringsLoading:
      offeringsQuery.isLoading ||
      currentPeriodQuery.isLoading ||
      (canUseFullCatalog && adminPeriodsQuery.isLoading),
    offeringsEmpty: !offeringsQuery.isLoading && offeringOptions.length === 0,
    offeringsError: offeringsQuery.error,
    noPeriodConfigured:
      !periodId &&
      !currentPeriodQuery.isLoading &&
      !currentPeriodQuery.data?.periodId &&
      (!canUseFullCatalog || !adminPeriodsQuery.data?.length),
  };
}
