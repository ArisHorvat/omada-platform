import { OrganizationType } from '@/src/api/generatedClient';

export type GroupCopy = {
  screenTitle: string;
  screenSubtitle: string;
  heroHint: string;
  structureLabel: string;
  searchPlaceholder: string;
  typeFilterAll: string;
  typeFilterLabel: string;
  typeFilterPickerTitle: string;
  expandAll: string;
  collapseAll: string;
  groupCount: (count: number) => string;
  emptyTitle: string;
  emptyMessage: string;
  emptyCta: string;
  selectGroupTitle: string;
  selectGroupDescription: string;
  namePlaceholder: string;
  deleteTitle: string;
  deleteMessage: (name: string, childCount: number) => string;
  removeMemberTitle: string;
  removeMemberMessage: (firstName: string, placementGroupName?: string) => string;
  moveMembersTitle: string;
  moveMembersMessage: string;
  subGroupButton: string;
  newGroupButton: string;
  parentLabel: string;
  parentPickerTitle: string;
  parentNoneLabel: string;
  parentSearchPlaceholder: string;
  typeLabel: string;
  academicYearLabel: string;
  academicYearPlaceholder: string;
  subGroupsLabel: (count: number) => string;
  subGroupsSummary: (count: number) => string;
  subGroupsBrowseAll: string;
  subGroupsMore: (count: number) => string;
  subGroupsPickerTitle: string;
  subGroupsSearchPlaceholder: string;
  membersLabel: (count: number) => string;
  membersSummary: (count: number) => string;
  membersSelectedBadge: (count: number) => string;
  membersBrowseAll: string;
  membersMore: (count: number) => string;
  membersPickerTitle: (count: number) => string;
  membersSearchPlaceholder: string;
  membersEmpty: string;
  membersRollupHint: string;
  addMembersLeafHint: string;
  membersCountBreakdown: (total: number, direct: number) => string;
};

const UNIVERSITY_COPY: GroupCopy = {
  screenTitle: 'Academic structure',
  screenSubtitle: 'Faculty, department, program, series, groups, and subgroups',
  heroHint:
    'Faculty → department → program → series → group (stable for the full year) → subgroup for labs. Term courses are configured as offerings per period — not as groups in this tree.',
  structureLabel: 'Hierarchy',
  searchPlaceholder: 'Search faculties, programs, series, groups…',
  typeFilterAll: 'All types',
  typeFilterLabel: 'Filter by type',
  typeFilterPickerTitle: 'Group type',
  expandAll: 'Expand all',
  collapseAll: 'Collapse all',
  groupCount: (count) => `${count} group${count === 1 ? '' : 's'}`,
  emptyTitle: 'No groups yet',
  emptyMessage:
    'Create faculty, departments, programs, series, groups, and subgroups — then place students for schedule, attendance, and grades.',
  emptyCta: 'Create first group',
  selectGroupTitle: 'Select a group',
  selectGroupDescription:
    'Choose a group in the tree. Students placed in a subgroup (lab) appear on the parent group automatically — add them once at the lowest level.',
  namePlaceholder: 'e.g. Group 111 or Group 111 Lab 1',
  deleteTitle: 'Delete group',
  deleteMessage: (name, childCount) =>
    childCount > 0
      ? `Delete "${name}" and all ${childCount} nested group${childCount === 1 ? '' : 's'}? Members will be unlinked from this branch.`
      : `Delete "${name}"? Members will be unlinked from this group.`,
  removeMemberTitle: 'Remove member',
  removeMemberMessage: (firstName, placementGroupName) =>
    placementGroupName
      ? `Remove ${firstName} from "${placementGroupName}"? They will no longer appear on this group.`
      : `Remove ${firstName} from this group?`,
  moveMembersTitle: 'Select members',
  moveMembersMessage: 'Tap members below to select who to move.',
  subGroupButton: 'Subgroup',
  newGroupButton: 'New group',
  parentLabel: 'Parent group',
  parentPickerTitle: 'Choose parent',
  parentNoneLabel: 'No parent (top level)',
  parentSearchPlaceholder: 'Search groups…',
  typeLabel: 'Group type',
  academicYearLabel: 'Academic year',
  academicYearPlaceholder: 'e.g. 2025-26 (groups stay for the full year)',
  subGroupsLabel: (count) => `Child groups (${count})`,
  subGroupsSummary: (count) => (count === 1 ? '1 child group' : `${count} child groups`),
  subGroupsBrowseAll: 'Browse all',
  subGroupsMore: (count) => `+ ${count} more child group${count === 1 ? '' : 's'}`,
  subGroupsPickerTitle: 'Choose child group',
  subGroupsSearchPlaceholder: 'Search child groups…',
  membersLabel: (count) => `Members (${count})`,
  membersSummary: (count) => (count === 1 ? '1 member' : `${count} members`),
  membersSelectedBadge: (count) => `${count} selected`,
  membersBrowseAll: 'Browse all',
  membersMore: (count) => `+ ${count} more member${count === 1 ? '' : 's'}`,
  membersPickerTitle: (count) => `Members (${count})`,
  membersSearchPlaceholder: 'Search members…',
  membersEmpty: 'No members in this group yet.',
  membersRollupHint: 'Includes members placed in subgroups below.',
  addMembersLeafHint:
    'This group has subgroups. For lab splits, add students to the specific subgroup (e.g. Group 111 Lab 1) — they will still show here.',
  membersCountBreakdown: (total, direct) =>
    direct === total
      ? `${total} member${total === 1 ? '' : 's'}`
      : `${total} total (${direct} directly here)`,
};

const CORPORATE_COPY: GroupCopy = {
  screenTitle: 'Teams & structure',
  screenSubtitle: 'Divisions, departments, teams, squads, and project groups',
  heroHint:
    'Build your org chart — division → department → team → squad. Link employees, then move people between teams or project groups.',
  structureLabel: 'Org chart',
  searchPlaceholder: 'Search divisions, teams, departments…',
  typeFilterAll: 'All types',
  typeFilterLabel: 'Filter by type',
  typeFilterPickerTitle: 'Group type',
  expandAll: 'Expand all',
  collapseAll: 'Collapse all',
  groupCount: (count) => `${count} group${count === 1 ? '' : 's'}`,
  emptyTitle: 'No groups yet',
  emptyMessage:
    'Create divisions, departments, teams, squads, or project groups — then link members for directory, schedule, and assignments.',
  emptyCta: 'Create first group',
  selectGroupTitle: 'Select a group',
  selectGroupDescription:
    'Choose a division, team, or department in the tree to view members, edit structure, or move staff between groups.',
  namePlaceholder: 'e.g. Platform Engineering',
  deleteTitle: 'Delete group',
  deleteMessage: (name, childCount) =>
    childCount > 0
      ? `Delete "${name}" and all ${childCount} nested sub-group${childCount === 1 ? '' : 's'}? Members will be unlinked from this branch.`
      : `Delete "${name}"? Members will be unlinked from this group.`,
  removeMemberTitle: 'Remove member',
  removeMemberMessage: (firstName, placementGroupName) =>
    placementGroupName
      ? `Remove ${firstName} from "${placementGroupName}"? They will no longer appear on this group.`
      : `Remove ${firstName} from this group?`,
  moveMembersTitle: 'Select members',
  moveMembersMessage: 'Tap members below to select who to move.',
  subGroupButton: 'Sub-group',
  newGroupButton: 'New group',
  parentLabel: 'Parent group',
  parentPickerTitle: 'Choose parent',
  parentNoneLabel: 'No parent (top level)',
  parentSearchPlaceholder: 'Search groups…',
  typeLabel: 'Group type',
  academicYearLabel: 'Academic year',
  academicYearPlaceholder: '',
  subGroupsLabel: (count) => `Sub-groups (${count})`,
  subGroupsSummary: (count) => (count === 1 ? '1 sub-group' : `${count} sub-groups`),
  subGroupsBrowseAll: 'Browse all',
  subGroupsMore: (count) => `+ ${count} more sub-group${count === 1 ? '' : 's'}`,
  subGroupsPickerTitle: 'Choose sub-group',
  subGroupsSearchPlaceholder: 'Search sub-groups…',
  membersLabel: (count) => `Members (${count})`,
  membersSummary: (count) => (count === 1 ? '1 member' : `${count} members`),
  membersSelectedBadge: (count) => `${count} selected`,
  membersBrowseAll: 'Browse all',
  membersMore: (count) => `+ ${count} more member${count === 1 ? '' : 's'}`,
  membersPickerTitle: (count) => `Members (${count})`,
  membersSearchPlaceholder: 'Search members…',
  membersEmpty: 'No members in this group yet.',
  membersRollupHint: 'Includes members in nested teams below.',
  addMembersLeafHint:
    'This group has sub-teams. Add people to the specific team they belong to — they will still appear on this group.',
  membersCountBreakdown: (total, direct) =>
    direct === total
      ? `${total} member${total === 1 ? '' : 's'}`
      : `${total} total (${direct} directly here)`,
};

export function getGroupCopy(orgType?: OrganizationType): GroupCopy {
  return orgType === OrganizationType.University ? UNIVERSITY_COPY : CORPORATE_COPY;
}
