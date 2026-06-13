import { OrganizationType } from '@/src/api/generatedClient';

import type { TasksListMode, TasksTimeFilter } from './taskFilters';

export type TasksInboxMode = 'coursework' | 'work';

export function isUniversityOrg(orgType?: OrganizationType | string | number | null): boolean {
  if (orgType == null) return false;
  if (orgType === OrganizationType.University || orgType === 0) return true;
  if (typeof orgType === 'string' && orgType.toLowerCase() === 'university') return true;
  return false;
}

/** Coursework inbox when org is university OR the user has offering enrollments / coursework tasks. */
export function resolveTasksInboxMode(
  orgType: OrganizationType | string | number | null | undefined,
  enrolledOfferingCount: number,
  courseworkTaskCount: number,
): TasksInboxMode {
  if (isUniversityOrg(orgType)) return 'coursework';
  if (enrolledOfferingCount > 0 || courseworkTaskCount > 0) return 'coursework';
  return 'work';
}

export function isCourseworkInboxMode(mode: TasksInboxMode): boolean {
  return mode === 'coursework';
}

export function getTasksScreenTitle(_mode: TasksInboxMode): string {
  return 'Tasks';
}

export function getGroupFilterLabels(mode: TasksInboxMode): { all: string; chipPrefix: string } {
  if (isCourseworkInboxMode(mode)) {
    return { all: 'All courses', chipPrefix: 'Course offering' };
  }
  return { all: 'All groups', chipPrefix: 'Group' };
}

export interface ListModeOption {
  id: TasksListMode;
  label: string;
}

export function getListModeOptions(): ListModeOption[] {
  return [
    { id: 'open', label: 'Open' },
    { id: 'completed', label: 'Completed' },
  ];
}

export interface TimeFilterOption {
  id: TasksTimeFilter;
  label: string;
}

export function getTimeFilterOptions(mode: TasksInboxMode): TimeFilterOption[] {
  if (isCourseworkInboxMode(mode)) {
    return [
      { id: 'all', label: 'All' },
      { id: 'overdue', label: 'Overdue' },
      { id: 'week', label: 'This week' },
    ];
  }
  return [
    { id: 'all', label: 'All' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'today', label: 'Today' },
    { id: 'tomorrow', label: 'Tomorrow' },
    { id: 'upcoming', label: 'Upcoming' },
  ];
}

export function getEmptyStateCopy(
  listMode: TasksListMode,
  mode: TasksInboxMode,
): { title: string; description: string } {
  if (listMode === 'completed') {
    return {
      title: 'Nothing completed yet',
      description: isCourseworkInboxMode(mode)
        ? 'Submitted and graded coursework will show here.'
        : 'Finished tasks will show here.',
    };
  }
  if (isCourseworkInboxMode(mode)) {
    return {
      title: 'All caught up',
      description: 'No open coursework right now.',
    };
  }
  return {
    title: 'All clear',
    description: 'You have no open tasks right now.',
  };
}
