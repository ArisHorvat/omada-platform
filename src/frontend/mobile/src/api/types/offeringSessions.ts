/** Shared offering weekly-session shape (API + admin UI). */
export type OfferingSessionFrequency = 'weekly' | 'biweekly' | 'monthly' | 'as_needed';

export interface OfferingWeeklySession {
  eventTypeId?: string;
  eventTypeName?: string;
  hoursPerSession: number;
  frequency: OfferingSessionFrequency;
  isOptional: boolean;
  sortOrder: number;
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek?: number;
  /** HH:mm (24h) for timetable publish */
  startTimeLocal?: string;
}
