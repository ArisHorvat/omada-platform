/**
 * Permission model (aligned with backend):
 * - `Omada.Api.Entities.AccessLevel`: View | Edit | Admin (stored per widget on `RolePermission`)
 * - `Omada.Api.Infrastructure.WidgetKeys` string keys (e.g. "news", "schedule")
 * - API returns `widgetAccess: Record<widgetKey, "view"|"edit"|"admin">` on profile; `[HasPermission(widget, AccessLevel)]` enforces on endpoints.
 *
 * View / Edit / Admin is a standard capability ladder: higher levels imply lower ones on the API
 * (`PermissionHandler.MeetsRequirement`). On mobile, `PERMISSION_MAP` lists concrete capabilities per level
 * so `can('news.view')` works when the user has edit or admin on `news` (those arrays are supersets).
 */

/** Mirror of backend `Omada.Api.Infrastructure.WidgetKeys` — use these strings everywhere. */
export const WIDGET_KEYS = {
  profile: 'profile',
  security: 'security',
  settings: 'settings',
  more: 'more',
  admin: 'admin',
  superAdmin: 'super-admin',
  chat: 'chat',
  news: 'news',
  events: 'events',
  schedule: 'schedule',
  tasks: 'tasks',
  documents: 'documents',
  grades: 'grades',
  assignments: 'assignments',
  attendance: 'attendance',
  users: 'users',
  groups: 'groups',
  finance: 'finance',
  rooms: 'rooms',
  transport: 'transport',
  map: 'map',
  digitalId: 'digital-id',
} as const;

export type WidgetKeyId = (typeof WIDGET_KEYS)[keyof typeof WIDGET_KEYS];

export type AccessLevel = 'view' | 'edit' | 'admin';

/** Alias used by presets and dashboard (`PermissionLevel` in UI code). */
export type PermissionLevel = AccessLevel;

/** Fine-grained UI capabilities (optional future API surface). First segment before `.` must match a widget key. */
export type Capability =
  // news
  | 'news.view'
  | 'news.create'
  | 'news.publish'
  | 'news.delete'
  // schedule
  | 'schedule.view_own'
  | 'schedule.view_all'
  | 'schedule.manage'
  // grades
  | 'grades.view_own'
  | 'grades.view_all'
  | 'grades.edit'
  | 'grades.finalize'
  // chat
  | 'chat.view'
  | 'chat.post'
  | 'chat.manage_rooms'
  // assignments
  | 'assignments.view'
  | 'assignments.submit'
  | 'assignments.grade'
  // attendance
  | 'attendance.view_own'
  | 'attendance.view_all'
  | 'attendance.take'
  // finance
  | 'finance.view_own'
  | 'finance.manage'
  // documents
  | 'documents.view'
  | 'documents.upload'
  | 'documents.manage'
  // tasks
  | 'tasks.view'
  | 'tasks.create'
  | 'tasks.assign'
  // rooms
  | 'rooms.view'
  | 'rooms.book'
  | 'rooms.manage'
  // users
  | 'users.view'
  | 'users.invite'
  | 'users.manage'
  // map / transport
  | 'map.view'
  | 'map.manage'
  // groups
  | 'groups.view'
  | 'groups.manage'
  // events (community / org events)
  | 'events.view'
  | 'events.create'
  | 'events.manage'
  // digital ID
  | 'digital-id.view'
  | 'digital-id.manage';

/** Maps each widget to the capabilities granted at each AccessLevel (must be supersets: admin ⊇ edit ⊇ view for UX checks). */
export const PERMISSION_MAP: Record<string, Record<AccessLevel, Capability[]>> = {
  news: {
    view: ['news.view'],
    edit: ['news.view', 'news.create', 'news.publish'],
    admin: ['news.view', 'news.create', 'news.publish', 'news.delete'],
  },
  schedule: {
    view: ['schedule.view_own', 'schedule.view_all'],
    edit: ['schedule.view_own', 'schedule.view_all', 'schedule.manage'],
    admin: ['schedule.view_own', 'schedule.view_all', 'schedule.manage'],
  },
  grades: {
    view: ['grades.view_own'],
    edit: ['grades.view_own', 'grades.view_all', 'grades.edit'],
    admin: ['grades.view_own', 'grades.view_all', 'grades.edit', 'grades.finalize'],
  },
  chat: {
    view: ['chat.view', 'chat.post'],
    edit: ['chat.view', 'chat.post'],
    admin: ['chat.view', 'chat.post', 'chat.manage_rooms'],
  },
  assignments: {
    view: ['assignments.view', 'assignments.submit'],
    edit: ['assignments.view', 'assignments.submit', 'assignments.grade'],
    admin: ['assignments.view', 'assignments.submit', 'assignments.grade'],
  },
  attendance: {
    view: ['attendance.view_own'],
    edit: ['attendance.view_own', 'attendance.view_all', 'attendance.take'],
    admin: ['attendance.view_own', 'attendance.view_all', 'attendance.take'],
  },
  finance: {
    view: ['finance.view_own'],
    edit: ['finance.view_own', 'finance.manage'],
    admin: ['finance.view_own', 'finance.manage'],
  },
  documents: {
    view: ['documents.view'],
    edit: ['documents.view', 'documents.upload'],
    admin: ['documents.view', 'documents.upload', 'documents.manage'],
  },
  tasks: {
    view: ['tasks.view'],
    edit: ['tasks.view', 'tasks.create'],
    admin: ['tasks.view', 'tasks.create', 'tasks.assign'],
  },
  rooms: {
    view: ['rooms.view', 'rooms.book'],
    edit: ['rooms.view', 'rooms.book', 'rooms.manage'],
    admin: ['rooms.view', 'rooms.book', 'rooms.manage'],
  },
  users: {
    view: ['users.view'],
    edit: ['users.view', 'users.invite'],
    admin: ['users.view', 'users.invite', 'users.manage'],
  },
  map: {
    view: ['map.view'],
    edit: ['map.view', 'map.manage'],
    admin: ['map.view', 'map.manage'],
  },
  transport: {
    view: ['map.view'],
    edit: ['map.view', 'map.manage'],
    admin: ['map.view', 'map.manage'],
  },
  groups: {
    view: ['groups.view'],
    edit: ['groups.view', 'groups.manage'],
    admin: ['groups.view', 'groups.manage'],
  },
  events: {
    view: ['events.view'],
    edit: ['events.view', 'events.create'],
    admin: ['events.view', 'events.create', 'events.manage'],
  },
  'digital-id': {
    view: ['digital-id.view'],
    edit: ['digital-id.view', 'digital-id.manage'],
    admin: ['digital-id.view', 'digital-id.manage'],
  },
};

export interface WidgetPermissionDef {
  key: string;
  label: string;
  description: string;
  levels: Record<AccessLevel, Capability[]>;
}

/** UI labels + same levels as `PERMISSION_MAP` (single source for levels). */
export const WIDGET_PERMISSIONS: Record<string, WidgetPermissionDef> = {
  schedule: {
    key: 'schedule',
    label: 'Schedule',
    description: 'Calendar and timetable',
    levels: PERMISSION_MAP.schedule!,
  },
  tasks: {
    key: 'tasks',
    label: 'Tasks',
    description: 'To-do and assignments',
    levels: PERMISSION_MAP.tasks!,
  },
  chat: {
    key: 'chat',
    label: 'Chat',
    description: 'Messaging',
    levels: PERMISSION_MAP.chat!,
  },
  grades: {
    key: 'grades',
    label: 'Grades',
    description: 'Academic records',
    levels: PERMISSION_MAP.grades!,
  },
  assignments: {
    key: 'assignments',
    label: 'Assignments',
    description: 'Coursework',
    levels: PERMISSION_MAP.assignments!,
  },
  attendance: {
    key: 'attendance',
    label: 'Attendance',
    description: 'Presence tracking',
    levels: PERMISSION_MAP.attendance!,
  },
  finance: {
    key: 'finance',
    label: 'Finance',
    description: 'Budget and payroll (corporate)',
    levels: PERMISSION_MAP.finance!,
  },
  documents: {
    key: 'documents',
    label: 'Documents',
    description: 'File repository',
    levels: PERMISSION_MAP.documents!,
  },
  news: {
    key: 'news',
    label: 'News',
    description: 'Announcements',
    levels: PERMISSION_MAP.news!,
  },
  rooms: {
    key: 'rooms',
    label: 'Room booking',
    description: 'Spaces and reservations',
    levels: PERMISSION_MAP.rooms!,
  },
  users: {
    key: 'users',
    label: 'Directory',
    description: 'People and profiles',
    levels: PERMISSION_MAP.users!,
  },
  map: {
    key: 'map',
    label: 'Map',
    description: 'Campus / floorplans',
    levels: PERMISSION_MAP.map!,
  },
  transport: {
    key: 'transport',
    label: 'Transport',
    description: 'Shuttle and routes',
    levels: PERMISSION_MAP.transport!,
  },
  events: {
    key: 'events',
    label: 'Events',
    description: 'Community and org events',
    levels: PERMISSION_MAP.events!,
  },
  groups: {
    key: 'groups',
    label: 'Groups',
    description: 'Classes and teams',
    levels: PERMISSION_MAP.groups!,
  },
  'digital-id': {
    key: 'digital-id',
    label: 'Digital ID',
    description: 'Campus card / ID',
    levels: PERMISSION_MAP['digital-id']!,
  },
};

export const ALL_CAPABILITIES: Capability[] = Array.from(
  new Set(
    Object.values(PERMISSION_MAP).flatMap((m) => [...m.view, ...m.edit, ...m.admin]),
  ),
);
