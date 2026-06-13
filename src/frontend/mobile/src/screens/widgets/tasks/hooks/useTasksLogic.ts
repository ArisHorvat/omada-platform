import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';

import { TaskItemDto } from '@/src/api/generatedClient';
import { useAssignableGroups, useAssignableOfferings, useMyOfferings } from '@/src/hooks';
import { useAuth } from '@/src/context/AuthContext';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { usePermission } from '@/src/context/PermissionContext';

import { useTasksApi } from './useTasksApi';
import {
  filterCourseworkTasks,
  filterTasksForScreen,
  type TasksListMode,
  type TasksTimeFilter,
} from '../utils/taskFilters';
import { computeCourseworkStats } from '../utils/courseworkStats';
import { isUniversityOrg, resolveTasksInboxMode, type TasksInboxMode } from '../utils/taskLabels';
import {
  buildCorporateScopeOptions,
  buildUniversityScopeOptions,
  parseScopeSelection,
  scopeSelectionKey,
  type TasksScopeOption,
  type TasksScopeSelection,
} from '../utils/taskScopeOptions';

export interface UseTasksLogicResult {
  tasks: TaskItemDto[];
  allTasks: TaskItemDto[];
  courseworkStats: ReturnType<typeof computeCourseworkStats>;
  loading: boolean;
  isError: boolean;
  refetchTasks: () => void;
  inboxMode: TasksInboxMode;
  listMode: TasksListMode;
  setListMode: Dispatch<SetStateAction<TasksListMode>>;
  timeFilter: TasksTimeFilter;
  setTimeFilter: Dispatch<SetStateAction<TasksTimeFilter>>;
  isCourseworkInbox: boolean;
  canSubmitCoursework: boolean;
  activeScopeKey: string | null;
  setActiveScopeKey: (key: string | null) => void;
  scopeOptions: TasksScopeOption[];
  toggleTask: (task: TaskItemDto) => void;
}

export const useTasksScreenLogic = (): UseTasksLogicResult => {
  const { organization } = useCurrentOrganization();
  const { can } = usePermission();
  const orgType = organization?.organizationType;

  const [listMode, setListMode] = useState<TasksListMode>('open');
  const [timeFilter, setTimeFilter] = useState<TasksTimeFilter>('all');
  const [activeScopeKey, setActiveScopeKey] = useState<string | null>(null);

  const assignableQuery = useAssignableGroups('assignment');
  const offeringsQuery = useAssignableOfferings();
  const myOfferingsQuery = useMyOfferings();
  const { activeSession } = useAuth();

  const role = (activeSession?.role || '').toLowerCase();
  const isStaffRole =
    can('assignments.grade') ||
    role === 'teacher' ||
    role === 'professor' ||
    role === 'admin' ||
    role === 'superadmin';

  const enrolledOrTeachingOfferings = useMemo(() => {
    const mine = myOfferingsQuery.data ?? [];
    if (!isStaffRole) return mine;
    const byId = new Map<string, (typeof mine)[number]>();
    for (const o of [...(offeringsQuery.data ?? []), ...mine]) {
      byId.set(o.id, o);
    }
    return [...byId.values()];
  }, [isStaffRole, myOfferingsQuery.data, offeringsQuery.data]);

  const activeScope: TasksScopeSelection = useMemo(() => {
    return parseScopeSelection(activeScopeKey, []);
  }, [activeScopeKey]);

  const tasksRemote = useTasksApi({
    page: 1,
    pageSize: 100,
    groupId: activeScope?.filterKind === 'group' ? activeScope.id : null,
    offeringId: activeScope?.filterKind === 'offering' ? activeScope.id : null,
  });

  const inboxMode = useMemo(() => {
    if (isUniversityOrg(orgType)) return 'coursework' as const;
    if (myOfferingsQuery.isLoading && !myOfferingsQuery.isFetched) {
      return 'coursework' as const;
    }
    return resolveTasksInboxMode(
      orgType,
      enrolledOrTeachingOfferings.length,
      filterCourseworkTasks(tasksRemote.tasks).length,
    );
  }, [
    orgType,
    enrolledOrTeachingOfferings.length,
    tasksRemote.tasks,
    myOfferingsQuery.isLoading,
    myOfferingsQuery.isFetched,
  ]);

  const isCourseworkInbox = inboxMode === 'coursework';

  const scopeOptionsWithTasks = useMemo(() => {
    if (isCourseworkInbox) {
      return buildUniversityScopeOptions(enrolledOrTeachingOfferings, tasksRemote.tasks);
    }
    return buildCorporateScopeOptions(assignableQuery.data);
  }, [isCourseworkInbox, enrolledOrTeachingOfferings, tasksRemote.tasks, assignableQuery.data]);

  const activeScopeResolved: TasksScopeSelection = useMemo(
    () => parseScopeSelection(activeScopeKey, scopeOptionsWithTasks),
    [activeScopeKey, scopeOptionsWithTasks],
  );

  const canSubmitCoursework =
    can('assignments.submit') || can('tasks.create') || can('tasks.assign') || isStaffRole;

  const filteredTasks = useMemo(
    () => filterTasksForScreen(tasksRemote.tasks, inboxMode, listMode, timeFilter),
    [tasksRemote.tasks, inboxMode, listMode, timeFilter],
  );

  const courseworkStats = useMemo(
    () => computeCourseworkStats(tasksRemote.tasks),
    [tasksRemote.tasks],
  );

  const toggleTask = (task: TaskItemDto) => {
    tasksRemote.toggleTaskCompletion.mutate(task);
  };

  useEffect(() => {
    setListMode('open');
    setTimeFilter('all');
    setActiveScopeKey(null);
  }, [orgType, inboxMode]);

  useEffect(() => {
    if (!activeScopeKey) return;
    const stillValid = scopeOptionsWithTasks.some(
      (o) => scopeSelectionKey({ filterKind: o.filterKind, id: o.id }) === activeScopeKey,
    );
    if (!stillValid) {
      setActiveScopeKey(null);
    }
  }, [activeScopeKey, scopeOptionsWithTasks]);

  return {
    tasks: filteredTasks,
    allTasks: tasksRemote.tasks,
    courseworkStats,
    loading:
      tasksRemote.isLoading ||
      tasksRemote.isMutating ||
      myOfferingsQuery.isLoading ||
      (isStaffRole && offeringsQuery.isLoading),
    isError: tasksRemote.isError || myOfferingsQuery.isError,
    refetchTasks: () => {
      void tasksRemote.tasksQuery.refetch();
      void myOfferingsQuery.refetch();
      if (isStaffRole) void offeringsQuery.refetch();
    },
    inboxMode,
    listMode,
    setListMode,
    timeFilter,
    setTimeFilter,
    isCourseworkInbox,
    canSubmitCoursework,
    activeScopeKey,
    setActiveScopeKey,
    scopeOptions: scopeOptionsWithTasks,
    toggleTask,
  };
};
