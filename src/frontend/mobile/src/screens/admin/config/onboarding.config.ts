import { WIDGET_KEYS } from '@/src/config/permissions.config';

export type OnboardingItem = {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  stepIndex: number;
  /** When set, step is omitted if this widget is disabled for the org. */
  widgetKey?: string;
  anyWidgetKeys?: string[];
};

export const ONBOARDING_ITEMS: OnboardingItem[] = [
  {
    id: 'invite',
    title: 'Invite your team',
    subtitle: 'Add members or share your join link',
    route: '/members-workspace',
    stepIndex: 1,
  },
  {
    id: 'roles',
    title: 'Configure roles & permissions',
    subtitle: 'Control who can access each widget',
    route: '/roles-workspace',
    stepIndex: 2,
  },
  {
    id: 'branding',
    title: 'Customize branding',
    subtitle: 'Logo, colors, and organization identity',
    route: '/branding-workspace',
    stepIndex: 3,
  },
  {
    id: 'groups',
    title: 'Set up groups',
    subtitle: 'Departments, teams, classes, and cohorts',
    route: '/groups-workspace',
    stepIndex: 4,
    widgetKey: WIDGET_KEYS.groups,
  },
  {
    id: 'floorplan',
    title: 'Upload floorplans',
    subtitle: 'Map rooms and publish bookable spaces',
    route: '/floorplan-workspace',
    stepIndex: 5,
    widgetKey: WIDGET_KEYS.map,
  },
  {
    id: 'spider',
    title: 'Connect web spider',
    subtitle: 'Import timetable and news from your site',
    route: '/web-spider-workspace',
    stepIndex: 6,
    anyWidgetKeys: [WIDGET_KEYS.schedule, WIDGET_KEYS.news],
  },
  {
    id: 'periods',
    title: 'Define academic periods',
    subtitle: 'Semesters, terms, or sprints',
    route: '/periods-workspace',
    stepIndex: 7,
    widgetKey: WIDGET_KEYS.grades,
  },
  {
    id: 'grades',
    title: 'Set up grades',
    subtitle: 'Record and manage student results',
    route: '/grades-workspace',
    stepIndex: 8,
    widgetKey: WIDGET_KEYS.grades,
  },
  {
    id: 'widgets',
    title: 'Enable widgets',
    subtitle: 'Choose which features your org uses',
    route: '/widgets-workspace',
    stepIndex: 9,
  },
  {
    id: 'rooms',
    title: 'Manage rooms',
    subtitle: 'Publish bookable spaces for your org',
    route: '/rooms-workspace',
    stepIndex: 10,
    widgetKey: WIDGET_KEYS.rooms,
  },
];

export function filterOnboardingItems(
  items: OnboardingItem[],
  enabledWidgets: string[] | undefined | null,
  isWidgetEnabled: (key: string | undefined, enabled: string[] | undefined | null) => boolean,
): OnboardingItem[] {
  return items.filter((item) => {
    if (item.anyWidgetKeys?.length) {
      return item.anyWidgetKeys.some((k) => isWidgetEnabled(k, enabledWidgets));
    }
    return isWidgetEnabled(item.widgetKey, enabledWidgets);
  });
}

export function isOnboardingItemDone(
  item: OnboardingItem,
  onboardingStep: number,
  memberCount: number,
): boolean {
  if (item.id === 'invite') return memberCount > 1;
  return onboardingStep >= item.stepIndex;
}
