import { usePermission } from '@/src/context/PermissionContext';
import { useAttendanceApi } from './useAttendanceApi';
import { resolveAttendanceViewMode } from '../utils/attendanceLabels';

export function useAttendanceWidgetLogic() {
  const { can, isLoading: permissionsLoading } = usePermission();
  const canView = can('attendance.view_own');
  const canTakeRoll = can('attendance.take');

  const remote = useAttendanceApi({
    enabled: canView && !permissionsLoading,
  });

  const viewMode = resolveAttendanceViewMode(remote.data, canTakeRoll);

  return {
    ...remote,
    canView,
    canTakeRoll,
    permissionsLoading,
    viewMode,
    isTeacherView: viewMode === 'teacher',
  };
}
