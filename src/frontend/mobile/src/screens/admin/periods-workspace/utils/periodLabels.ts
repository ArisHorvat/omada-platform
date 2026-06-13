import { OrganizationType } from '@/src/api/generatedClient';

export type PeriodCopy = {
  screenTitle: string;
  screenSubtitle: string;
  heroTitle: string;
  heroHint: string;
  nameLabel: string;
  namePlaceholder: string;
  nameExamples: string[];
  dateRangeLabel: string;
  currentToggle: string;
  currentBadge: string;
  addButton: string;
  listLabel: (count: number) => string;
  emptyTitle: string;
  emptyMessage: string;
  usageTitle: string;
  usageHint: string;
  previewChipLabel: string;
  previewGradeCourse: string;
  gradesFieldLabel: string;
  gradesFilterPlaceholder: string;
  deleteTitle: string;
  setCurrentButton: string;
  infoNote: string;
};

const UNIVERSITY_COPY: PeriodCopy = {
  screenTitle: 'Academic periods',
  screenSubtitle: 'Semesters and date ranges for the academic year',
  heroTitle: 'Terms for your academic calendar',
  heroHint:
    'Each period is a labeled date range. Apply curriculum packages from the Course offerings workspace when a term starts.',
  nameLabel: 'Period name',
  namePlaceholder: 'e.g. Fall 2026, Spring 2027',
  nameExamples: ['Fall 2026', 'Spring 2027', 'Summer 2026'],
  dateRangeLabel: 'Date range',
  currentToggle: 'Mark as current term',
  currentBadge: 'Current term',
  addButton: 'Add period',
  listLabel: (count) => `YOUR PERIODS (${count})`,
  emptyTitle: 'No periods yet',
  emptyMessage: 'Add your first semester or term above. They appear as quick picks in Grades management.',
  usageTitle: 'PREVIEW',
  usageHint: 'Period names become the semester label on grade records and in the member Grades widget.',
  previewChipLabel: 'Quick pick in Grades admin',
  previewGradeCourse: 'Introduction to Design',
  gradesFieldLabel: 'Semester / term',
  gradesFilterPlaceholder: 'Filter by semester',
  deleteTitle: 'Delete period',
  setCurrentButton: 'Set as current term',
  infoNote:
    'Only one period can be current at a time. Manage course offerings and enrollments in the Course offerings workspace. Deleting a period does not remove existing grade rows that already use its name.',
};

const CORPORATE_COPY: PeriodCopy = {
  screenTitle: 'Reporting periods',
  screenSubtitle: 'Quarters, cycles, or sprints for grades and filters',
  heroTitle: 'Cycles for outcomes and reporting',
  heroHint:
    'Each period is a labeled date range. Admins pick period names when logging results; members see those labels grouped in the Grades widget.',
  nameLabel: 'Period name',
  namePlaceholder: 'e.g. Q1 2026, H1 Review, Sprint 12',
  nameExamples: ['Q1 2026', 'Q2 2026', 'H1 2026'],
  dateRangeLabel: 'Date range',
  currentToggle: 'Mark as current period',
  currentBadge: 'Current period',
  addButton: 'Add period',
  listLabel: (count) => `YOUR PERIODS (${count})`,
  emptyTitle: 'No periods yet',
  emptyMessage: 'Add your first quarter or cycle above. They appear as quick picks in Grades management.',
  usageTitle: 'PREVIEW',
  usageHint: 'Period names become the period label on grade records and in the member Grades widget.',
  previewChipLabel: 'Quick pick in Grades admin',
  previewGradeCourse: 'Leadership Workshop',
  gradesFieldLabel: 'Reporting period',
  gradesFilterPlaceholder: 'Filter by period',
  deleteTitle: 'Delete period',
  setCurrentButton: 'Set as current period',
  infoNote:
    'Only one period can be current at a time. Use the button on a period below to switch the active period. Deleting a period does not remove existing grade rows that already use its name.',
};

export function isUniversityOrg(orgType?: OrganizationType): boolean {
  return orgType === OrganizationType.University;
}

export function getPeriodCopy(orgType?: OrganizationType): PeriodCopy {
  return isUniversityOrg(orgType) ? UNIVERSITY_COPY : CORPORATE_COPY;
}
