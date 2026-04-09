import { NewsCategory, NewsType } from '@/src/api/generatedClient';

/** Theme hook colors subset for category chips on article hero. */
export type NewsThemeColors = {
  primary: string;
  secondary?: string;
  tertiary: string;
  error: string;
  subtle: string;
};

/** Distinct accent per topic; reuses org theme tokens. */
export function newsCategoryAccent(category: NewsCategory, colors: NewsThemeColors): string {
  switch (category) {
    case NewsCategory.Urgent:
      return colors.error;
    case NewsCategory.Academic:
      return colors.secondary ?? colors.tertiary;
    case NewsCategory.Facilities:
      return colors.tertiary;
    case NewsCategory.PeopleAndCulture:
      return colors.secondary ?? colors.primary;
    case NewsCategory.EventsAndPrograms:
      return colors.tertiary;
    case NewsCategory.ResearchAndInnovation:
      return colors.primary;
    case NewsCategory.CommunityAndEngagement:
      return colors.secondary ?? colors.tertiary;
    case NewsCategory.OperationsAndBusiness:
      return colors.subtle;
    case NewsCategory.ComplianceAndSecurity:
      return colors.error;
    case NewsCategory.General:
    default:
      return colors.primary;
  }
}

export const NEWS_TYPE_LABELS: Record<NewsType, string> = {
  [NewsType.Announcement]: 'Announcement',
  [NewsType.Alert]: 'Alert',
  [NewsType.Event]: 'Event',
  [NewsType.Info]: 'Info',
};

/** Short labels for filter chips */
export const NEWS_CATEGORY_SHORT: Record<NewsCategory, string> = {
  [NewsCategory.General]: 'General',
  [NewsCategory.Academic]: 'Academic',
  [NewsCategory.Urgent]: 'Urgent',
  [NewsCategory.Facilities]: 'Facilities',
  [NewsCategory.PeopleAndCulture]: 'People',
  [NewsCategory.EventsAndPrograms]: 'Events',
  [NewsCategory.ResearchAndInnovation]: 'Research',
  [NewsCategory.CommunityAndEngagement]: 'Community',
  [NewsCategory.OperationsAndBusiness]: 'Operations',
  [NewsCategory.ComplianceAndSecurity]: 'Security',
};

/** Longer descriptions for full-width pickers */
export const NEWS_CATEGORY_DETAIL: Record<NewsCategory, string> = {
  [NewsCategory.General]: 'Broad organization news and announcements.',
  [NewsCategory.Academic]: 'Courses, curriculum, exams, and teaching.',
  [NewsCategory.Urgent]: 'Time-sensitive or critical updates.',
  [NewsCategory.Facilities]: 'Buildings, maintenance, and campus spaces.',
  [NewsCategory.PeopleAndCulture]: 'HR, culture, hiring, and employee life.',
  [NewsCategory.EventsAndPrograms]: 'Events, programs, and registrations.',
  [NewsCategory.ResearchAndInnovation]: 'Research, labs, grants, and innovation.',
  [NewsCategory.CommunityAndEngagement]: 'Community, outreach, and engagement.',
  [NewsCategory.OperationsAndBusiness]: 'Operations, finance, and business.',
  [NewsCategory.ComplianceAndSecurity]: 'Compliance, policy, and security.',
};

/** Stable order for pickers / filters */
export const NEWS_CATEGORY_ORDER: NewsCategory[] = [
  NewsCategory.General,
  NewsCategory.Academic,
  NewsCategory.Urgent,
  NewsCategory.Facilities,
  NewsCategory.PeopleAndCulture,
  NewsCategory.EventsAndPrograms,
  NewsCategory.ResearchAndInnovation,
  NewsCategory.CommunityAndEngagement,
  NewsCategory.OperationsAndBusiness,
  NewsCategory.ComplianceAndSecurity,
];

export const NEWS_TYPE_ORDER: NewsType[] = [
  NewsType.Announcement,
  NewsType.Alert,
  NewsType.Event,
  NewsType.Info,
];
