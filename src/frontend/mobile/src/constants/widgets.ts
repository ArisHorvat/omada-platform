import { IconName } from '@/src/components/ui';
import { PermissionLevel } from './permissions';

export type WidgetCategory = 'Academics' | 'Social' | 'Productivity' | 'Facilities';
export type WidgetAvailability = 'university' | 'corporate' | 'all';

export interface WidgetDef {
  name: string;
  icon: IconName;
  category: WidgetCategory;
  priority: number;
  availability: WidgetAvailability;
  defaultSize: 'small' | 'wide' | 'large';
}

export const BASE_WIDGETS: Record<string, WidgetDef> = {
  // Always on (tab bar / profile)
  schedule: { name: 'Schedule', icon: 'calendar-today', category: 'Academics', priority: 1, availability: 'all', defaultSize: 'wide' },
  tasks: {
    name: 'Tasks',
    icon: 'check-circle',
    category: 'Productivity',
    priority: 1,
    availability: 'all',
    defaultSize: 'wide',
  },

  // Shared configurable
  announcements: {
    name: 'Announcements',
    icon: 'campaign',
    category: 'Social',
    priority: 1,
    availability: 'all',
    defaultSize: 'wide',
  },
  attendance: { name: 'Attendance', icon: 'how-to-reg', category: 'Academics', priority: 2, availability: 'all', defaultSize: 'small' },
  users: { name: 'Directory', icon: 'group', category: 'Social', priority: 4, availability: 'all', defaultSize: 'wide' },
  map: { name: 'Map', icon: 'map', category: 'Facilities', priority: 3, availability: 'all', defaultSize: 'large' },
  rooms: { name: 'Room Booking', icon: 'meeting-room', category: 'Facilities', priority: 3, availability: 'all', defaultSize: 'large' },

  // University only
  grades: { name: 'Grades', icon: 'analytics', category: 'Academics', priority: 2, availability: 'university', defaultSize: 'wide' },
  assignments: { name: 'Assignments', icon: 'assignment', category: 'Academics', priority: 2, availability: 'university', defaultSize: 'small' },

  // Corporate only
  documents: { name: 'Documents', icon: 'folder-shared', category: 'Productivity', priority: 3, availability: 'corporate', defaultSize: 'wide' },
};

// --- PRESETS CONFIGURATION ---

export interface RolePreset {
  name: string;
  widgets: Record<string, PermissionLevel>;
}

export interface OrgPreset {
  roles: RolePreset[];
}

export const ORG_PRESETS: Record<string, OrgPreset> = {
  university: {
    roles: [
      {
        name: 'Student',
        widgets: { tasks: 'view', grades: 'view', attendance: 'view', map: 'view', rooms: 'view', announcements: 'view' },
      },
      {
        name: 'Professor',
        widgets: { tasks: 'edit', grades: 'edit', attendance: 'edit', users: 'view', announcements: 'edit' },
      },
      { name: 'Teaching Assistant', widgets: { tasks: 'edit', grades: 'edit', attendance: 'edit' } },
      { name: 'Dean', widgets: { announcements: 'edit', users: 'edit', map: 'view', rooms: 'edit' } },
      { name: 'Registrar', widgets: { grades: 'admin', attendance: 'admin', users: 'edit' } },
      { name: 'Operations', widgets: { map: 'edit', rooms: 'edit', announcements: 'edit' } },
    ],
  },
  corporate: {
    roles: [
      { name: 'Employee', widgets: { tasks: 'view', documents: 'view', map: 'view', rooms: 'view', attendance: 'view', announcements: 'view' } },
      { name: 'Team Lead', widgets: { tasks: 'edit', users: 'view', rooms: 'view', announcements: 'edit', attendance: 'edit' } },
      { name: 'Project Manager', widgets: { tasks: 'admin', documents: 'edit', users: 'view' } },
      { name: 'Director', widgets: { announcements: 'edit', users: 'view', documents: 'view' } },
      { name: 'HR Manager', widgets: { documents: 'admin', users: 'admin', announcements: 'edit' } },
      { name: 'Operations', widgets: { map: 'edit', rooms: 'edit' } },
    ],
  },
};
