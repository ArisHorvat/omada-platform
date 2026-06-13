import type { OfferingSessionFrequency, OfferingWeeklySession } from '@/src/api/types/offeringSessions';

export type { OfferingSessionFrequency, OfferingWeeklySession };

export const SESSION_FREQUENCY_OPTIONS: { value: OfferingSessionFrequency; label: string }[] = [
  { value: 'weekly', label: 'Every week' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'as_needed', label: 'As needed / optional block' },
];

export function createEmptySession(sortOrder: number): OfferingWeeklySession {
  return {
    hoursPerSession: 1.5,
    frequency: 'weekly',
    isOptional: false,
    sortOrder,
    dayOfWeek: 1,
    startTimeLocal: '09:00',
  };
}

export function summarizeWeeklyPlan(sessions: OfferingWeeklySession[]): string {
  if (!sessions.length) return 'No weekly pattern';
  const hours = sessions.reduce((sum, s) => sum + (s.hoursPerSession || 0), 0);
  const labels = sessions
    .slice(0, 3)
    .map((s) => s.eventTypeName?.trim() || 'Session')
    .join(', ');
  const suffix = sessions.length > 3 ? ` +${sessions.length - 3}` : '';
  return `${hours.toFixed(1)}h/wk · ${labels}${suffix}`;
}

export function normalizeWeeklySessions(sessions: OfferingWeeklySession[]): OfferingWeeklySession[] {
  return sessions
    .filter((s) => s.hoursPerSession > 0)
    .map((s, idx) => ({
      ...s,
      sortOrder: idx,
      frequency: s.frequency || 'weekly',
    }));
}
