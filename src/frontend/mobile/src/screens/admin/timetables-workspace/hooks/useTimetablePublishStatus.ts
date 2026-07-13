import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { offeringsApi, unwrapOfferingsAxios, type TimetableOfferingPublishStatusDto } from '@/src/api/offeringsApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

type Scope = {
  periodId: string;
  programGroupId?: string;
  placementGroupId?: string;
  hostId?: string;
  offeringId?: string;
  offeringsPatternStamp?: string;
  enabled?: boolean;
};

export function useTimetablePublishStatus(scope: Scope) {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const scopeStamp = `${scope.programGroupId ?? ''}|${scope.placementGroupId ?? ''}|${scope.hostId ?? ''}|${scope.offeringId ?? ''}|${scope.offeringsPatternStamp ?? ''}`;

  const query = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.timetablesPublishStatus(orgId, scope.periodId, scopeStamp),
    queryFn: () =>
      unwrapOfferingsAxios(
        offeringsApi.getTimetablePublishStatus(scope.periodId, {
          programGroupId: scope.programGroupId || undefined,
          hostId: scope.hostId || undefined,
          groupId: scope.placementGroupId || undefined,
          offeringId: scope.offeringId || undefined,
        }),
      ),
    enabled: !!orgId && !!scope.periodId && (scope.enabled ?? true),
    staleTime: 0,
  });

  const statusByOfferingId = useMemo(() => {
    const map = new Map<string, TimetableOfferingPublishStatusDto>();
    for (const row of query.data?.offerings ?? []) {
      map.set(row.offeringId, row);
    }
    return map;
  }, [query.data?.offerings]);

  return {
    summary: query.data,
    statusByOfferingId,
    loading: query.isLoading,
    refetch: query.refetch,
  };
}

export function offeringPublishStatusLabel(row: TimetableOfferingPublishStatusDto | undefined): string {
  if (!row?.hasPattern) return 'No pattern';
  if (row.conflictCount > 0) return `${row.conflictCount} conflict${row.conflictCount === 1 ? '' : 's'}`;
  if (row.needsRepublish) return 'Needs republish';
  if (row.isPublished) return 'Published';
  return 'Ready to publish';
}

export function offeringPublishStatusColor(
  row: TimetableOfferingPublishStatusDto | undefined,
  colors: { subtle: string; primary: string; error: string; secondary?: string; warning?: string },
): string {
  if (!row?.hasPattern) return colors.subtle;
  if (row.conflictCount > 0) return colors.error;
  if (row.needsRepublish) return colors.warning ?? colors.secondary ?? colors.primary;
  if (row.isPublished) return colors.primary;
  return colors.secondary ?? colors.primary;
}
