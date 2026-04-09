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
  // 1. CORE
  schedule:    { name: 'Schedule', icon: 'calendar-today', category: 'Academics', priority: 1, availability: 'all', defaultSize: 'wide' },
  chat:        { name: 'Chat', icon: 'chat', category: 'Social', priority: 1, availability: 'all', defaultSize: 'small' },
  tasks:       { name: 'Tasks', icon: 'check-circle', category: 'Productivity', priority: 1, availability: 'all', defaultSize: 'wide' },

  // 2. UNIVERSITY SPECIFIC
  grades:      { name: 'Grades', icon: 'analytics', category: 'Academics', priority: 2, availability: 'university', defaultSize: 'wide' },
  assignments: { name: 'Assignments', icon: 'assignment', category: 'Academics', priority: 2, availability: 'university', defaultSize: 'small' },
  attendance:  { name: 'Attendance', icon: 'how-to-reg', category: 'Academics', priority: 2, availability: 'university', defaultSize: 'small' },

  // 3. CORPORATE SPECIFIC
  finance:     { name: 'Finance', icon: 'attach-money', category: 'Productivity', priority: 2, availability: 'corporate', defaultSize: 'small' },
  documents:   { name: 'Documents', icon: 'folder-shared', category: 'Productivity', priority: 3, availability: 'corporate', defaultSize: 'wide' },

  // 4. SHARED / ALL
  news:        { name: 'News', icon: 'campaign', category: 'Social', priority: 3, availability: 'all', defaultSize: 'wide' },
  map:         { name: 'Map', icon: 'map', category: 'Facilities', priority: 3, availability: 'all', defaultSize: 'large' },
  transport:   { name: 'Transport', icon: 'directions-bus', category: 'Facilities', priority: 3, availability: 'all', defaultSize: 'small' },
  rooms:       { name: 'Room Booking', icon: 'meeting-room', category: 'Facilities', priority: 3, availability: 'all', defaultSize: 'large' },
  events:      { name: 'Events', icon: 'event', category: 'Social', priority: 4, availability: 'all', defaultSize: 'small' },
  users:       { name: 'Directory', icon: 'group', category: 'Social', priority: 4, availability: 'all', defaultSize: 'wide' },
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
      { name: 'Student', widgets: { grades: 'view', assignments: 'view', attendance: 'view', map: 'view', transport: 'view', events: 'view', documents: 'view', rooms: 'view' } },
      { name: 'Professor', widgets: { grades: 'edit', assignments: 'edit', attendance: 'edit', users: 'view', transport: 'view' } },
      { name: 'Teaching Assistant', widgets: { grades: 'edit', assignments: 'edit', attendance: 'edit' } },
      { name: 'Dean', widgets: { news: 'edit', users: 'edit', map: 'view' } },
      { name: 'Registrar', widgets: { grades: 'admin', attendance: 'admin', documents: 'edit', users: 'edit' } },
      { name: 'Operations', widgets: { map: 'edit', transport: 'edit', rooms: 'edit', events: 'edit' } }
    ]
  },
  corporate: {
    roles: [
      { name: 'Employee', widgets: { tasks: 'view', documents: 'view', finance: 'view', map: 'view', rooms: 'view' } },
      { name: 'Team Lead', widgets: { tasks: 'edit', users: 'view', rooms: 'view', chat: 'edit' } },
      { name: 'Project Manager', widgets: { tasks: 'admin', documents: 'edit', finance: 'view', users: 'view' } },
      { name: 'Director', widgets: { finance: 'view', news: 'edit', users: 'view' } },
      { name: 'HR Manager', widgets: { documents: 'admin', users: 'admin', finance: 'view', news: 'edit' } },
      { name: 'Operations', widgets: { map: 'edit', transport: 'edit', rooms: 'edit' } }
    ]
  }
};