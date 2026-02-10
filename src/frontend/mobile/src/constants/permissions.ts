export type PermissionLevel = 'view' | 'view_own' | 'edit' | 'edit_own' | 'admin';

export interface WidgetPermission {
  key: string;
  label: string;
  description: string;
  possibleLevels: PermissionLevel[];
}

export const WIDGET_PERMISSIONS: Record<string, WidgetPermission> = {
  // --- CORE ---
  schedule: {
    key: 'schedule',
    label: 'Schedule',
    description: 'View and manage calendar events',
    possibleLevels: ['view', 'edit', 'admin'], 
  },
  news: {
    key: 'news',
    label: 'News Feed',
    description: 'Post and read organization announcements',
    possibleLevels: ['view', 'edit', 'admin'],
  },
  chat: {
    key: 'chat',
    label: 'Chat',
    description: 'Instant messaging and group channels',
    possibleLevels: ['view', 'edit', 'admin'],
  },

  // --- UNIVERSITY ---
  grades: {
    key: 'grades',
    label: 'Grades',
    description: 'Academic performance and transcripts',
    possibleLevels: ['view_own', 'edit', 'admin'],
  },
  assignments: {
    key: 'assignments',
    label: 'Assignments',
    description: 'Submit and grade coursework',
    possibleLevels: ['view_own', 'edit', 'admin'],
  },
  attendance: {
    key: 'attendance',
    label: 'Attendance',
    description: 'Track and verify presence',
    possibleLevels: ['view_own', 'edit', 'admin'],
  },

  // --- CORPORATE ---
  finance: {
    key: 'finance',
    label: 'Finance',
    description: 'Payroll, expenses, and budgeting',
    possibleLevels: ['view_own', 'edit', 'admin'],
  },
  documents: {
    key: 'documents',
    label: 'Documents',
    description: 'Shared folders and personal files',
    possibleLevels: ['view', 'edit', 'admin'],
  },

  // --- SHARED ---
  tasks: {
    key: 'tasks',
    label: 'Tasks',
    description: 'Personal and team to-do lists',
    possibleLevels: ['view_own', 'edit_own', 'edit', 'admin'],
  },
  rooms: {
    key: 'rooms',
    label: 'Room Booking',
    description: 'Manage physical space reservations',
    possibleLevels: ['view', 'edit', 'admin'],
  },
  users: {
    key: 'users',
    label: 'Directory',
    description: 'Manage member profiles and roles',
    possibleLevels: ['view', 'edit', 'admin'],
  },
};

/**
 * Helper to get default permission level for a widget 
 * if none is explicitly provided during registration.
 */
export const getDefaultLevel = (widgetKey: string): PermissionLevel => {
  const meta = WIDGET_PERMISSIONS[widgetKey];
  if (!meta) return 'view';
  
  // Prefer view_own for sensitive data, otherwise view
  return meta.possibleLevels.includes('view_own') ? 'view_own' : 'view';
};