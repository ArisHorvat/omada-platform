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



/** Ordered for a sensible first-time org setup flow. */

export const ONBOARDING_ITEMS: OnboardingItem[] = [

  {

    id: 'widgets',

    title: 'Enable widgets',

    subtitle: 'Choose which features your org uses',

    route: '/widgets-workspace',

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

    id: 'periods',

    title: 'Define reporting periods',

    subtitle: 'Semesters, quarters, or reporting cycles',

    route: '/periods-workspace',

    stepIndex: 4,

  },

  {

    id: 'groups',

    title: 'Set up groups',

    subtitle: 'Departments, teams, classes, and cohorts',

    route: '/groups-workspace',

    stepIndex: 5,

  },

  {

    id: 'floorplan',

    title: 'Set up locations & rooms',

    subtitle: 'Add sites and levels, then rooms — floorplans optional',

    route: '/floorplan-workspace',

    stepIndex: 6,

    widgetKey: WIDGET_KEYS.map,

  },

  {

    id: 'invite',

    title: 'Invite your team',

    subtitle: 'Add members or share your join link',

    route: '/members-workspace',

    stepIndex: 7,

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
  completedSteps: string[] | undefined | null,
  memberCount: number,
): boolean {
  if (item.id === 'invite') return memberCount > 1;
  const normalized = new Set((completedSteps ?? []).map((s) => s.toLowerCase()));
  return normalized.has(item.id.toLowerCase());
}


