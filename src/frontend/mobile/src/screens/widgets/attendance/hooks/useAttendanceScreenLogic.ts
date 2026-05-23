import { useState } from 'react';

import { useAssignableGroups } from '@/src/hooks';
import { usePermission } from '@/src/context/PermissionContext';
import { useAttendanceApi } from './useAttendanceApi';
import { resolveAttendanceViewMode } from '../utils/attendanceLabels';

export function useAttendanceScreenLogic() {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [viewAsTeacher, setViewAsTeacher] = useState<boolean | null>(null);

  const { can, isLoading: permissionsLoading } = usePermission();
  const canView = can('attendance.view_own');
  const canTakeRoll = can('attendance.take');
  const assignableQuery = useAssignableGroups('attendance');

  const remote = useAttendanceApi({
    groupId: activeGroupId,
    enabled: canView && !permissionsLoading,
  });

  const autoMode = resolveAttendanceViewMode(remote.data, canTakeRoll);
  const viewMode = viewAsTeacher === null ? autoMode : viewAsTeacher ? 'teacher' : 'student';

  return {
    ...remote,
    canView,
    canTakeRoll,
    permissionsLoading,
    activeGroupId,
    setActiveGroupId,
    assignableGroups: assignableQuery.data,
    viewMode,
    isTeacherView: viewMode === 'teacher',
    setViewAsTeacher,
    canSwitchView: canTakeRoll && (remote.data?.teacherSessions.length ?? 0) > 0,
  };
}

export type UseAttendanceScreenLogicResult = ReturnType<typeof useAttendanceScreenLogic>;
