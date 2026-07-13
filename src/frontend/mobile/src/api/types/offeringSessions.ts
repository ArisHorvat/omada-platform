/** Shared offering weekly-session shape (API + admin UI). */
export type OfferingSessionFrequency = 'weekly' | 'biweekly' | 'monthly' | 'as_needed';

export type OfferingSessionCohortAssignment = {
  hostId?: string;
  hostName?: string;
  cohortGroupIds: string[];
  dayOfWeek?: number;
  startTimeLocal?: string;
  roomId?: string;
  roomName?: string;
  /** Override frequency for this block (defaults to session frequency). */
  frequency?: OfferingSessionFrequency;
  /** 1 = odd term weeks, 2 = even term weeks (biweekly only). */
  biweeklyPhase?: 1 | 2;
};

export type CohortPickerLevel = 'all' | 'series' | 'group' | 'subgroup';

export interface OfferingWeeklySession {
  eventTypeId?: string;
  eventTypeName?: string;
  hoursPerSession: number;
  frequency: OfferingSessionFrequency;
  /** 1 = odd term weeks, 2 = even term weeks (biweekly only). */
  biweeklyPhase?: 1 | 2;
  isOptional: boolean;
  sortOrder: number;
  dayOfWeek?: number;
  startTimeLocal?: string;
  hostId?: string;
  hostName?: string;
  audienceScope?: 'all' | 'selected';
  cohortGroupIds?: string[];
  cohortDelivery?: 'split' | 'combined';
  cohortAssignments?: OfferingSessionCohortAssignment[];
  roomId?: string;
  roomName?: string;
  requiredAttendancePercent?: number;
  assignedInstructorIds?: string[];
}
