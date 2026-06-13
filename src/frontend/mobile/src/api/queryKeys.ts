export const QUERY_KEYS = {
  // Global (Not scoped to an org)
  userProfile: ['userProfile'],
  myOrganizations: ['myOrganizations'],
  
  // Scoped to a specific Organization
  organization: (orgId: string) => ['organization', orgId],
  
  // Widgets (All strictly scoped by orgId to prevent data leaks!)
  tasks: {
    all: (orgId: string) => ['tasks', orgId],
    paginated: (
      orgId: string,
      page: number,
      pageSize: number,
      groupId?: string | null,
      offeringId?: string | null,
    ) => ['tasks', orgId, page, pageSize, groupId ?? 'all', offeringId ?? 'all'],
    detail: (orgId: string, taskId: string) => ['tasks', orgId, 'detail', taskId],
    batches: (orgId: string, page: number, pageSize: number) =>
      ['tasks', orgId, 'batches', page, pageSize] as const,
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
    me: (orgId: string, groupId?: string | null) =>
      ['grades', orgId, 'me', groupId ?? 'all'] as const,
  },
  attendance: {
    me: (orgId: string, groupId?: string | null) =>
      ['attendance', orgId, 'me', groupId ?? 'all'] as const,
    myOfferings: (orgId: string, periodId?: string | null) =>
      ['attendance', orgId, 'my-offerings', periodId ?? 'current'] as const,
    roster: (orgId: string, eventId: string, instanceDate: string) =>
      ['attendance', orgId, 'roster', eventId, instanceDate] as const,
    workTime: (orgId: string) => ['attendance', orgId, 'work-time'] as const,
  },
  digitalId: {
    /** Digital ID card payload for the active org (JWT). */
    me: (orgId: string) => ['digital-id', orgId, 'me'] as const,
  },
  offerings: {
    assignable: (orgId: string, periodId?: string | null) =>
      ['offerings', orgId, 'assignable', periodId ?? 'current'] as const,
    my: (orgId: string, periodId?: string | null) =>
      ['offerings', orgId, 'my', periodId ?? 'current'] as const,
    periods: (orgId: string) => ['offerings', orgId, 'periods'] as const,
    gradebook: (orgId: string, periodId: string, offeringId: string, cohortGroupId?: string | null) =>
      ['offerings', orgId, 'gradebook', periodId, offeringId, cohortGroupId ?? 'all'] as const,
    studentBreakdown: (orgId: string, periodId: string, offeringId: string, userId: string) =>
      ['offerings', orgId, 'gradebook', periodId, offeringId, 'student', userId] as const,
  },
  groups: {
    assignable: (orgId: string, context: string) => ['groups', orgId, 'assignable', context] as const,
    tree: (orgId: string) => ['groups', orgId, 'tree'] as const,
    types: (orgId: string) => ['groups', orgId, 'types'] as const,
    detail: (orgId: string, groupId: string) => ['groups', orgId, 'detail', groupId] as const,
    members: (orgId: string, groupId: string, q: string) =>
      ['groups', orgId, groupId, 'members', q] as const,
  },
  search: {
    universal: (orgId: string, query: string) => ['search', orgId, query] as const,
  },
  orgAdmin: {
    current: (orgId: string) => ['orgAdmin', orgId, 'current'] as const,
    members: (orgId: string, q: string, roleId: string | null) =>
      ['orgAdmin', orgId, 'members', q, roleId ?? 'all'] as const,
    memberCount: (orgId: string) => ['orgAdmin', orgId, 'memberCount'] as const,
    roles: (orgId: string) => ['orgAdmin', orgId, 'roles'] as const,
    roleDetail: (orgId: string, roleId: string) => ['orgAdmin', orgId, 'role', roleId] as const,
    widgets: (orgId: string) => ['orgAdmin', orgId, 'widgets'] as const,
    eventTypes: (orgId: string) => ['orgAdmin', orgId, 'eventTypes'] as const,
    spiderSyncHistory: (orgId: string) => ['orgAdmin', orgId, 'spiderSyncHistory'] as const,
    spiderUnresolved: (orgId: string) => ['orgAdmin', orgId, 'spiderUnresolved'] as const,
    periods: (orgId: string) => ['orgAdmin', orgId, 'periods'] as const,
    offerings: (orgId: string, periodId: string) =>
      ['orgAdmin', orgId, 'periods', periodId, 'offerings'] as const,
    offeringPackages: (orgId: string) => ['orgAdmin', orgId, 'offering-packages'] as const,
    gradePlan: (orgId: string, periodId: string, offeringId: string) =>
      ['orgAdmin', orgId, 'grade-plan', periodId, offeringId] as const,
    gradesAdmin: (orgId: string, page: number, semester: string) =>
      ['orgAdmin', orgId, 'grades', page, semester || 'all'] as const,
    attendanceAdmin: (orgId: string, page: number, groupId?: string | null) =>
      ['orgAdmin', orgId, 'attendanceAdmin', page, groupId ?? 'all'] as const,
    rooms: (orgId: string, q: string) => ['orgAdmin', orgId, 'rooms', q || 'all'] as const,
    auditLogs: (orgId: string) => ['orgAdmin', orgId, 'auditLogs'] as const,
  },
  superAdmin: {
    organizations: (page: number, pageSize: number) => ['superAdmin', 'organizations', page, pageSize] as const,
    auditLogs: (page: number, organizationId?: string | null) =>
      ['superAdmin', 'auditLogs', page, organizationId ?? 'all'] as const,
  },
};