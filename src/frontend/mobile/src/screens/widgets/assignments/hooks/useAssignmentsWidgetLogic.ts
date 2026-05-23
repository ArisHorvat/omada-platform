import { useMemo } from 'react';

import { useTasksApi } from '../../tasks/hooks/useTasksApi';
import { filterAssignmentTasks } from '../utils/assignmentFilters';

/**
 * Dashboard assignments widgets: Tasks API, filtered to coursework-style items.
 */
export function useAssignmentsWidgetLogic() {
  const remote = useTasksApi({ page: 1, pageSize: 100 });

  const assignments = useMemo(
    () => filterAssignmentTasks(remote.tasks),
    [remote.tasks],
  );

  return {
    ...remote,
    assignments,
    tasks: assignments,
  };
}
