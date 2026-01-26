// Granular capabilities used in code checks
export type Capability = 
  | 'news.create' | 'news.publish' | 'news.delete'
  | 'attendance.session.start' | 'attendance.view.all' | 'attendance.edit.all' | 'attendance.view.own' | 'attendance.log.self'
  | 'grades.view.all' | 'grades.edit' | 'grades.view.own'
  | 'tasks.assign' | 'tasks.view.all' | 'tasks.view.own' | 'tasks.complete'
  | 'assignments.create' | 'assignments.view.all' | 'assignments.submit';

// The mapping dictionary
export const PERMISSION_MAP: Record<string, Record<string, Capability[]>> = {
  attendance: {
    'admin': ['attendance.session.start', 'attendance.view.all', 'attendance.edit.all'],
    'view_own': ['attendance.view.own', 'attendance.log.self'],
    'read_only': ['attendance.view.own']
  },
  news: {
    'admin': ['news.create', 'news.publish', 'news.delete'],
    'editor': ['news.create', 'news.publish'],
    'viewer': []
  },
  grades: {
    'admin': ['grades.view.all', 'grades.edit'],
    'view_own': ['grades.view.own']
  },
  assignments: {
    'admin': ['assignments.create', 'assignments.view.all'],
    'view_own': ['assignments.submit']
  },
  tasks: {
    'admin': ['tasks.assign', 'tasks.view.all', 'tasks.complete'],
    'view_own': ['tasks.view.own', 'tasks.complete']
  }
};

// Fallback for SuperAdmins
export const ALL_CAPABILITIES: Capability[] = [
  'news.create', 'news.publish', 'news.delete',
  'attendance.session.start', 'attendance.view.all', 'attendance.edit.all', 'attendance.view.own', 'attendance.log.self',
  'grades.view.all', 'grades.edit', 'grades.view.own',
  'tasks.assign', 'tasks.view.all', 'tasks.view.own', 'tasks.complete',
  'assignments.create', 'assignments.view.all', 'assignments.submit'
];
