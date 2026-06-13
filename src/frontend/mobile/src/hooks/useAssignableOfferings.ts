import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/src/api/queryKeys';
import { offeringsApi, unwrapOfferingsAxios, type OfferingPickerItemDto } from '@/src/api/offeringsApi';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

export type AssignableOffering = OfferingPickerItemDto;

/** Course offerings the current user can assign schedule/coursework to (teachers/admins). */
export function useAssignableOfferings(periodId?: string | null) {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  return useQuery({
    queryKey: QUERY_KEYS.offerings.assignable(orgId, periodId),
    queryFn: () =>
      unwrapOfferingsAxios(
        offeringsApi.getAssignable(periodId ?? undefined),
      ),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 3,
  });
}

/** Offerings the current user is enrolled in for the active (or given) term. */
export function useMyOfferings(periodId?: string | null) {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  return useQuery({
    queryKey: QUERY_KEYS.offerings.my(orgId, periodId),
    queryFn: () =>
      unwrapOfferingsAxios(
        offeringsApi.getMyEnrollments(periodId ?? undefined),
      ),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 3,
  });
}
