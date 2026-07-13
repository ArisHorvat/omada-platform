import { OrganizationType } from '@/src/api/generatedClient';

export type DirectoryCopy = {
  subtitle: string;
  searchPlaceholder: string;
  groupFilterLabel: string;
  groupFilterTitle: string;
  groupFilterAll: string;
  roleFilterLabel: string;
  roleFilterTitle: string;
  roleFilterAll: string;
  departmentFilterLabel: string;
  departmentFilterTitle: string;
  departmentFilterAll: string;
  groupSearchPlaceholder: string;
  groupTypeFilterAll: string;
  groupTypeFilterLabel: string;
  groupTypeFilterPickerTitle: string;
  roleSearchPlaceholder: string;
  departmentSearchPlaceholder: string;
  primaryDepartmentLabel: string;
  groupsSectionTitle: string;
  emptyDescription: string;
  managerKicker: string;
  teamKicker: string;
};

const UNIVERSITY: DirectoryCopy = {
  subtitle: 'Find students, faculty, and staff across your organization.',
  searchPlaceholder: 'Search by name, email, or title',
  groupFilterLabel: 'Group or cohort',
  groupFilterTitle: 'Filter by group',
  groupFilterAll: 'Everyone',
  roleFilterLabel: 'Role',
  roleFilterTitle: 'Filter by role',
  roleFilterAll: 'All roles',
  departmentFilterLabel: 'Primary department',
  departmentFilterTitle: 'Filter by department',
  departmentFilterAll: 'Any department',
  groupSearchPlaceholder: 'Search groups…',
  groupTypeFilterAll: 'All types',
  groupTypeFilterLabel: 'Group type',
  groupTypeFilterPickerTitle: 'Group type',
  roleSearchPlaceholder: 'Search roles…',
  departmentSearchPlaceholder: 'Search departments…',
  primaryDepartmentLabel: 'Primary department',
  groupsSectionTitle: 'Groups & cohorts',
  emptyDescription: 'Try another search or clear your filters.',
  managerKicker: 'MY ADVISOR',
  teamKicker: 'MY COHORT',
};

const CORPORATE: DirectoryCopy = {
  subtitle: 'Find colleagues by name, team, or role.',
  searchPlaceholder: 'Search by name, email, or title',
  groupFilterLabel: 'Team or group',
  groupFilterTitle: 'Filter by team',
  groupFilterAll: 'Everyone',
  roleFilterLabel: 'Role',
  roleFilterTitle: 'Filter by role',
  roleFilterAll: 'All roles',
  departmentFilterLabel: 'Department',
  departmentFilterTitle: 'Filter by department',
  departmentFilterAll: 'Any department',
  groupSearchPlaceholder: 'Search teams…',
  groupTypeFilterAll: 'All types',
  groupTypeFilterLabel: 'Team type',
  groupTypeFilterPickerTitle: 'Team type',
  roleSearchPlaceholder: 'Search roles…',
  departmentSearchPlaceholder: 'Search departments…',
  primaryDepartmentLabel: 'Department',
  groupsSectionTitle: 'Teams & groups',
  emptyDescription: 'Try another search or clear your filters.',
  managerKicker: 'MY MANAGER',
  teamKicker: 'MY TEAM',
};

export function getDirectoryCopy(orgType?: OrganizationType | string | null): DirectoryCopy {
  const normalized = String(orgType ?? '').toLowerCase();
  return normalized === 'university' ? UNIVERSITY : CORPORATE;
}
