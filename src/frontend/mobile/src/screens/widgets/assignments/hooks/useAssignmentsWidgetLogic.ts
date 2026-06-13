import { useMemo } from 'react';

import { useTasksApi } from '../../tasks/hooks/useTasksApi';
import { filterCourseworkTasks } from '../../tasks/utils/taskFilters';

/**
 * Dashboard assignments widgets: Tasks API, filtered to coursework-style items.
 */
export function useAssignmentsWidgetLogic() {
  const remote = useTasksApi({ page: 1, pageSize: 100 });

  const assignments = useMemo(
    () => filterCourseworkTasks(remote.tasks),
    [remote.tasks],
  );

  return {
    ...remote,
    assignments,
    tasks: assignments,
  };
}
