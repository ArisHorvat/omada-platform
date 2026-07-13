import type { IconName } from '@/src/components/ui';
import { WIDGET_KEYS } from '@/src/config/permissions.config';

export type AdminNavItem = {
  id: string;
  icon: IconName;
  label: string;
  route: string;
  widgetKey?: string;
  anyWidgetKeys?: string[];
  /** Periods, offerings — organization Admin role only (not the settings widget). */
  requiresOrgAdmin?: boolean;
};

export type AdminNavSection = {
  id: string;
  title: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    id: 'overview',
    title: 'Console',
    items: [
      { id: 'hub', icon: 'dashboard', label: 'Overview', route: '/org-dashboard' },
      { id: 'profile', icon: 'person', label: 'Profile', route: '/admin-profile' },
    ],
  },
  {
    id: 'people',
    title: 'People',
    items: [
      { id: 'members', icon: 'people', label: 'Members', route: '/members-workspace' },
      { id: 'roles', icon: 'admin-panel-settings', label: 'Roles', route: '/roles-workspace' },
      { id: 'branding', icon: 'palette', label: 'Branding', route: '/branding-workspace' },
    ],
  },
  {
    id: 'structure',
    title: 'Structure',
    items: [
      { id: 'groups', icon: 'group', label: 'Groups', route: '/groups-workspace' },
      { id: 'floorplan', icon: 'map', label: 'Floorplans', route: '/floorplan-workspace', widgetKey: WIDGET_KEYS.map },
      {
        id: 'event-types',
        icon: 'event',
        label: 'Event types',
        route: '/event-types-workspace',
        widgetKey: WIDGET_KEYS.schedule,
      },
      {
        id: 'periods',
        icon: 'date-range',
        label: 'Periods',
        route: '/periods-workspace',
        requiresOrgAdmin: true,
      },
      {
        id: 'timetables',
        icon: 'event-note',
        label: 'Timetables',
        route: '/timetables-workspace',
        widgetKey: WIDGET_KEYS.schedule,
        requiresOrgAdmin: true,
      },
      {
        id: 'offerings',
        icon: 'school',
        label: 'Offerings',
        route: '/offerings-workspace',
        requiresOrgAdmin: true,
      },
      {
        id: 'coursework',
        icon: 'assignment',
        label: 'Coursework',
        route: '/assignments-workspace',
      },
    ],
  },
  {
    id: 'platform',
    title: 'Platform',
    items: [
      { id: 'widgets', icon: 'widgets', label: 'Widget catalog', route: '/widgets-workspace' },
      { id: 'audit', icon: 'history', label: 'Audit log', route: '/audit-workspace' },
    ],
  },
];

export function filterAdminNavSections(
  sections: AdminNavSection[],
  enabledWidgets: string[] | undefined | null,
  isWidgetEnabled: (key: string | undefined, enabled: string[] | undefined | null) => boolean,
  canAccessOrgStructure: boolean,
): AdminNavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.requiresOrgAdmin && !canAccessOrgStructure) return false;
        if (item.anyWidgetKeys?.length) {
          return item.anyWidgetKeys.some((k) => isWidgetEnabled(k, enabledWidgets));
        }
        return isWidgetEnabled(item.widgetKey, enabledWidgets);
      }),
    }))
    .filter((section) => section.items.length > 0);
}
