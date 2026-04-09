import { useMemo } from 'react';

import { useAuth } from '@/src/context/AuthContext';

export type AttendanceViewMode = 'teacher' | 'student';

export interface UseAttendanceLogicResult {
  viewMode: AttendanceViewMode;
  isTeacherView: boolean;
}

/**
 * Foundation role mapper for attendance widgets/screens.
 * Teacher/Admin roles get the teacher dashboard mode.
 */
export const useAttendanceLogic = (): UseAttendanceLogicResult => {
  const { activeSession } = useAuth();

  const viewMode = useMemo<AttendanceViewMode>(() => {
    const role = (activeSession?.role || '').toLowerCase();
    if (role === 'teacher' || role === 'admin' || role === 'superadmin') {
      return 'teacher';
    }
    return 'student';
  }, [activeSession?.role]);

  return {
    viewMode,
    isTeacherView: viewMode === 'teacher',
  };
};
