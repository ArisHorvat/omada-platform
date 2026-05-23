import { AttendanceStatus, type AttendanceSessionDto, type MyAttendanceResponse } from '@/src/api/generatedClient';

export function isCorporateKind(kind: string | undefined): boolean {
  return (kind ?? '').toLowerCase() === 'corporate';
}

export function presentRateLabel(kind: string | undefined): string {
  return isCorporateKind(kind) ? 'Participation' : 'Attendance';
}

export function presentNoun(kind: string | undefined): string {
  return isCorporateKind(kind) ? 'Accepted' : 'Present';
}

export function absentNoun(kind: string | undefined): string {
  return isCorporateKind(kind) ? 'Declined' : 'Absent';
}

export function streakLabel(days: number, kind: string | undefined): string {
  if (days <= 0) return isCorporateKind(kind) ? 'No active streak' : 'No streak yet';
  return `${days}-day ${isCorporateKind(kind) ? 'participation' : 'attendance'} streak`;
}

export function formatSessionTime(session: AttendanceSessionDto): string {
  const start = new Date(session.startTime);
  return start.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function teacherModeLabel(mode: string | undefined): string {
  switch (mode) {
    case 'SessionManager':
      return 'Class sessions';
    case 'UniversalSessionManager':
      return 'Org sessions';
    case 'Approval':
      return 'Department approvals';
    default:
      return 'Your sessions';
  }
}

export type AttendanceViewMode = 'student' | 'teacher';

export function resolveAttendanceViewMode(
  data: MyAttendanceResponse | undefined,
  canTakeRoll: boolean,
): AttendanceViewMode {
  if (!data) return 'student';
  if (canTakeRoll && data.teacherSessions.length > 0 && data.mode !== 'Student') {
    return 'teacher';
  }
  return 'student';
}

export function attendanceStatusLabel(status: AttendanceStatus, kind: string | undefined): string {
  if (isCorporateKind(kind)) {
    switch (status) {
      case AttendanceStatus.Accepted:
        return 'Accepted';
      case AttendanceStatus.Tentative:
        return 'Maybe';
      case AttendanceStatus.Declined:
        return 'Declined';
      case AttendanceStatus.Added:
        return 'Joined';
      case AttendanceStatus.Expected:
        return 'Expected';
      default:
        return AttendanceStatus[status] ?? String(status);
    }
  }

  switch (status) {
    case AttendanceStatus.Declined:
      return 'Absent';
    case AttendanceStatus.Expected:
    case AttendanceStatus.Added:
    case AttendanceStatus.Accepted:
      return 'Present';
    case AttendanceStatus.Tentative:
      return 'Tentative';
    default:
      return AttendanceStatus[status] ?? String(status);
  }
}
