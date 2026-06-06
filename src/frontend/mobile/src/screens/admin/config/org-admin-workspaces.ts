import type { IconName } from '@/src/components/ui';
import { WIDGET_KEYS } from '@/src/config/permissions.config';

export type AdminWorkspaceItem = {
  id: string;
  icon: IconName;
  title: string;
  subtitle: string;
  route: string;
  widgetKey?: string;
  anyWidgetKeys?: string[];
};

export type AdminWorkspaceSection = {
  id: string;
  title: string;
  items: AdminWorkspaceItem[];
};

/** Quick-access tiles on the overview (admin workspaces only — no member widget routes). */
export const ADMIN_WORKSPACE_SECTIONS: AdminWorkspaceSection[] = [
  {
    id: 'people',
    title: 'People & governance',
    items: [
      {
        id: 'members',
        icon: 'people',
        title: 'Members',
        subtitle: 'Invites & directory',
        route: '/members-workspace',
      },
      {
        id: 'roles',
        icon: 'admin-panel-settings',
        title: 'Roles',
        subtitle: 'Widget permissions',
        route: '/roles-workspace',
      },
      {
        id: 'branding',
        icon: 'palette',
        title: 'Branding',
        subtitle: 'Logo & colors',
        route: '/branding-workspace',
      },
    ],
  },
  {
    id: 'structure',
    title: 'Structure & maps',
    items: [
      {
        id: 'groups',
        icon: 'group',
        title: 'Groups',
        subtitle: 'Teams & classes',
        route: '/groups-workspace',
        widgetKey: WIDGET_KEYS.groups,
      },
      {
        id: 'floorplan',
        icon: 'map',
        title: 'Floorplans',
        subtitle: 'Rooms & buildings',
        route: '/floorplan-workspace',
        widgetKey: WIDGET_KEYS.map,
      },
      {
        id: 'event-types',
        icon: 'event',
        title: 'Event types',
        subtitle: 'Schedule categories',
        route: '/event-types-workspace',
        widgetKey: WIDGET_KEYS.schedule,
      },
      {
        id: 'periods',
        icon: 'date-range',
        title: 'Periods',
        subtitle: 'Terms & semesters',
        route: '/periods-workspace',
        widgetKey: WIDGET_KEYS.grades,
      },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    items: [
      {
        id: 'spider',
        icon: 'language',
        title: 'Web spider',
        subtitle: 'Import & sync',
        route: '/web-spider-workspace',
        anyWidgetKeys: [WIDGET_KEYS.schedule, WIDGET_KEYS.news],
      },
    ],
  },
  {
    id: 'academic',
    title: 'Academic & attendance',
    items: [
      {
        id: 'grades',
        icon: 'school',
        title: 'Grades',
        subtitle: 'Student results',
        route: '/grades-workspace',
        widgetKey: WIDGET_KEYS.grades,
      },
      {
        id: 'attendance',
        icon: 'fact-check',
        title: 'Attendance',
        subtitle: 'Org-wide records',
        route: '/attendance-workspace',
        widgetKey: WIDGET_KEYS.attendance,
      },
    ],
  },
  {
    id: 'platform',
    title: 'Platform & compliance',
    items: [
      {
        id: 'widgets',
        icon: 'widgets',
        title: 'Widgets',
        subtitle: 'Feature catalog',
        route: '/widgets-workspace',
      },
      {
        id: 'rooms',
        icon: 'meeting-room',
        title: 'Rooms',
        subtitle: 'Bookable spaces',
        route: '/rooms-workspace',
        widgetKey: WIDGET_KEYS.rooms,
      },
      {
        id: 'audit',
        icon: 'history',
        title: 'Audit log',
        subtitle: 'Admin activity',
        route: '/audit-workspace',
      },
    ],
  },
];

export function filterAdminWorkspaceSections(
  sections: AdminWorkspaceSection[],
  enabledWidgets: string[] | undefined | null,
  isWidgetEnabled: (key: string | undefined, enabled: string[] | undefined | null) => boolean,
): AdminWorkspaceSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.anyWidgetKeys?.length) {
          return item.anyWidgetKeys.some((k) => isWidgetEnabled(k, enabledWidgets));
        }
        return isWidgetEnabled(item.widgetKey, enabledWidgets);
      }),
    }))
    .filter((section) => section.items.length > 0);
}
