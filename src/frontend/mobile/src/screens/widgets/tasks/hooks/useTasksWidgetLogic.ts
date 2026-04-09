import { useTasksApi } from './useTasksApi';

/**
 * Dashboard task widgets: full list from the API without screen filters.
 * Screens use {@link useTasksLogic} (filters + local UI). Both share the same query keys via {@link useTasksApi}.
 */
export function useTasksWidgetLogic() {
  return useTasksApi({ page: 1, pageSize: 100 });
}
