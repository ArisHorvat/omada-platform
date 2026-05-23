import { useQuery } from '@tanstack/react-query';

import { groupsApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import type { GroupPickerItemDto } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

export type AssignableGroup = GroupPickerItemDto;

export type AssignableGroupContext = 'schedule' | 'assignment' | 'grade' | 'attendance';

/** Loads org groups for pickers (schedule, assignments, grades). */
export function useAssignableGroups(context: AssignableGroupContext) {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  return useQuery({
    queryKey: QUERY_KEYS.groups.assignable(orgId, context),
    queryFn: async () => unwrap(groupsApi.getAssignable(context)),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 3,
  });
}
