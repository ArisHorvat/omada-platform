import { OrganizationType } from '@/src/api/generatedClient';

export type DirectoryGroupTypeOption = {
  key: string;
  label: string;
};

const UNIVERSITY_TYPES: DirectoryGroupTypeOption[] = [
  { key: 'faculty', label: 'Faculty' },
  { key: 'department', label: 'Department' },
  { key: 'program', label: 'Program' },
  { key: 'series', label: 'Series' },
  { key: 'group', label: 'Group' },
  { key: 'subgroup', label: 'Subgroup' },
];

const CORPORATE_TYPES: DirectoryGroupTypeOption[] = [
  { key: 'division', label: 'Division' },
  { key: 'department', label: 'Department' },
  { key: 'team', label: 'Team' },
  { key: 'squad', label: 'Squad' },
  { key: 'project', label: 'Project' },
];

export function getDirectoryGroupTypeCatalog(
  orgType?: OrganizationType | string | null,
): DirectoryGroupTypeOption[] {
  const normalized = String(orgType ?? '').toLowerCase();
  return normalized === 'university' ? UNIVERSITY_TYPES : CORPORATE_TYPES;
}
