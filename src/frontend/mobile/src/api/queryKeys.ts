export const QUERY_KEYS = {
  // Global (Not scoped to an org)
  userProfile: (orgId: string) => ['userProfile', orgId] as const,
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
  announcements: {
    channels: (orgId: string) => ['announcements', orgId, 'channels'] as const,
    posts: (orgId: string, channelId: string) =>
      ['announcements', orgId, 'posts', channelId.trim().toLowerCase()] as const,
    feed: (orgId: string) => ['announcements', orgId, 'feed'] as const,
    comments: (orgId: string, postId: string) =>
      ['announcements', orgId, 'comments', postId] as const,
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
  documents: {
    all: (orgId: string) => ['documents', orgId] as const,
    categories: (orgId: string) => ['documents', orgId, 'categories'] as const,
    list: (orgId: string, q: string, category: string | null, page: number) =>
      ['documents', orgId, 'list', q || '', category ?? 'all', page] as const,
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
  users: {
    directory: (orgId: string, q: string, groupId: string | null, roleName: string | null) =>
      ['users', orgId, 'directory', q || '', groupId ?? 'all-groups', roleName ?? 'all-roles'] as const,
    directoryGroups: (orgId: string) => ['users', orgId, 'directory', 'groups'] as const,
    directoryRoles: (orgId: string) => ['users', orgId, 'directory', 'roles'] as const,
    profile: (orgId: string, userId: string) => ['users', orgId, 'profile', userId] as const,
    widgetTeam: (orgId: string, managerId: string | null, pageSize: number) =>
      ['users', orgId, 'widget-team', managerId ?? 'none', pageSize] as const,
    widgetManager: (orgId: string, managerId: string | null) =>
      ['users', orgId, 'widget-manager', managerId ?? 'none'] as const,
  },
  orgAdmin: {
    current: (orgId: string) => ['orgAdmin', orgId, 'current'] as const,
    members: (orgId: string, q: string, roleId: string | null) =>
      ['orgAdmin', orgId, 'members', q, roleId ?? 'all'] as const,
    scrapedHostAliases: (orgId: string) => ['orgAdmin', orgId, 'scraped-host-aliases'] as const,
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
    timetablesPreview: (
      orgId: string,
      periodId: string,
      weekIso: string,
      scopeStamp: string,
    ) => ['timetables-preview', orgId, periodId, weekIso, scopeStamp] as const,
    timetablesPublishStatus: (orgId: string, periodId: string, scopeStamp: string) =>
      ['timetables-publish-status', orgId, periodId, scopeStamp] as const,
  },
  superAdmin: {
    organizations: (page: number, pageSize: number) => ['superAdmin', 'organizations', page, pageSize] as const,
    auditLogs: (page: number, organizationId?: string | null) =>
      ['superAdmin', 'auditLogs', page, organizationId ?? 'all'] as const,
  },
};