import { usePermission } from '@/src/context/PermissionContext';
import { useGradesLogic } from './useGradesLogic';

/**
 * Dashboard grades widgets: `GET /api/grades/me` with widget permission gate.
 */
export function useGradesWidgetLogic() {
  const { can, isLoading: permissionsLoading } = usePermission();
  const canView = can('grades.view_own');

  const grades = useGradesLogic({
    enabled: canView && !permissionsLoading,
  });

  return {
    ...grades,
    canView,
    permissionsLoading,
  };
}
