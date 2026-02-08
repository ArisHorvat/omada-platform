import { IconName } from '@/src/components/ui';

export type WidgetCategory = 'Academics' | 'Social' | 'Productivity' | 'Facilities';
// 1. Add this Type
export type WidgetAvailability = 'university' | 'corporate' | 'all'; 

export interface WidgetDef {
  name: string;
  icon: IconName;
  category: WidgetCategory;
  priority: number;
  availability: WidgetAvailability; // 2. Add to Interface
}

export const BASE_WIDGETS: Record<string, WidgetDef> = {
  // 1. CORE
  schedule:    { name: 'Schedule', icon: 'calendar-today', category: 'Academics', priority: 1, availability: 'all' },
  news:        { name: 'News', icon: 'campaign', category: 'Social', priority: 1, availability: 'all' },
  chat:        { name: 'Chat', icon: 'chat', category: 'Social', priority: 1, availability: 'all' },

  // 2. UNIVERSITY SPECIFIC
  grades:      { name: 'Grades', icon: 'analytics', category: 'Academics', priority: 2, availability: 'university' },
  assignments: { name: 'Assignments', icon: 'assignment', category: 'Academics', priority: 2, availability: 'university' },
  attendance:  { name: 'Attendance', icon: 'how-to-reg', category: 'Academics', priority: 2, availability: 'university' },

  // 3. CORPORATE SPECIFIC
  finance:     { name: 'Finance', icon: 'attach-money', category: 'Productivity', priority: 2, availability: 'corporate' },
  documents:   { name: 'Documents', icon: 'folder-shared', category: 'Productivity', priority: 3, availability: 'corporate' },

  // 4. SHARED / ALL
  tasks:       { name: 'Tasks', icon: 'check-circle', category: 'Productivity', priority: 3, availability: 'all' },
  map:         { name: 'Map', icon: 'map', category: 'Facilities', priority: 3, availability: 'all' },
  transport:   { name: 'Transport', icon: 'directions-bus', category: 'Facilities', priority: 3, availability: 'all' },
  rooms:       { name: 'Room Booking', icon: 'meeting-room', category: 'Facilities', priority: 3, availability: 'all' },
  events:      { name: 'Events', icon: 'event', category: 'Social', priority: 4, availability: 'all' },
  users:       { name: 'Directory', icon: 'group', category: 'Social', priority: 4, availability: 'all' },
};