import { useMemo } from 'react';

import { useMyOfferings } from '@/src/hooks';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

import { filterCourseworkTasks, filterTasksForInbox } from '../utils/taskFilters';
import { isUniversityOrg, resolveTasksInboxMode } from '../utils/taskLabels';
import { useTasksApi } from './useTasksApi';

/**
 * Dashboard task widgets: coursework when university or enrolled in offerings; otherwise work tasks.
 */
export function useTasksWidgetLogic() {
  const api = useTasksApi({ page: 1, pageSize: 100 });
  const { organization } = useCurrentOrganization();
  const myOfferingsQuery = useMyOfferings();
  const orgType = organization?.organizationType;

  const inboxMode = useMemo(() => {
    if (isUniversityOrg(orgType)) return 'coursework' as const;
    const enrollments = myOfferingsQuery.data ?? [];
    return resolveTasksInboxMode(
      orgType,
      enrollments.length,
      filterCourseworkTasks(api.tasks).length,
    );
  }, [orgType, myOfferingsQuery.data, api.tasks]);

  const tasks = useMemo(
    () => filterTasksForInbox(api.tasks, inboxMode),
    [api.tasks, inboxMode],
  );

  return { ...api, tasks, inboxMode };
}
