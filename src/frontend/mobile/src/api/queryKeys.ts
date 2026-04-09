export const QUERY_KEYS = {
  // Global (Not scoped to an org)
  userProfile: ['userProfile'],
  myOrganizations: ['myOrganizations'],
  
  // Scoped to a specific Organization
  organization: (orgId: string) => ['organization', orgId],
  
  // Widgets (All strictly scoped by orgId to prevent data leaks!)
  tasks: {
    all: (orgId: string) => ['tasks', orgId],
    paginated: (orgId: string, page: number, pageSize: number) => ['tasks', orgId, page, pageSize],
    detail: (orgId: string, taskId: string) => ['tasks', orgId, 'detail', taskId],
  },
  news: {
    all: (orgId: string) => ['news', orgId],
    paginated: (orgId: string, page: number, pageSize: number) => ['news', orgId, page, pageSize],
  },
  schedule: {
    all: (orgId: string) => ['schedule', orgId],
    byDateAndMode: (orgId: string, date: string | null, viewMode: string) => ['schedule', orgId, date, viewMode],
  },
  chat: {
    recent: (orgId: string) => ['chat', orgId],
  },
  grades: {
    /** Current user’s grades + GPA for the active org (JWT). */
    me: (orgId: string) => ['grades', orgId, 'me'] as const,
  },
  digitalId: {
    /** Digital ID card payload for the active org (JWT). */
    me: (orgId: string) => ['digital-id', orgId, 'me'] as const,
  },
};