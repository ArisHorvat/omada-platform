import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import apiClient from '@/src/api/apiClient';
import { API_BASE_URL } from '@/src/config/config';
import { unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import {
  CreateTaskRequest,
  TasksClient,
  TaskItemDto,
  UpdateTaskRequest,
} from '@/src/api/generatedClient';

export interface UseTasksApiParams {
  page?: number;
  pageSize?: number;
  taskId?: string | null;
  enabled?: boolean;
  client?: TasksClient;
}

type TasksListData = {
  items: TaskItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export interface UseTasksApiResult {
  tasks: TaskItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  task: TaskItemDto | undefined;
  tasksQuery: UseQueryResult<TasksListData, Error>;
  taskQuery: UseQueryResult<TaskItemDto, Error>;
  createTask: ReturnType<typeof useMutation<TaskItemDto, Error, CreateTaskRequest>>;
  updateTask: ReturnType<
    typeof useMutation<TaskItemDto, Error, { id: string; request: UpdateTaskRequest }>
  >;
  deleteTask: ReturnType<typeof useMutation<boolean, Error, string>>;
  toggleTaskCompletion: ReturnType<typeof useMutation<TaskItemDto, Error, TaskItemDto>>;
  invalidateTasks: () => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  listError: Error | null;
  detailError: Error | null;
  isMutating: boolean;
}

/**
 * Tasks domain: React Query + NSwag `TasksClient` (list, detail, create, update, toggle, delete).
 */
export function useTasksApi(params: UseTasksApiParams = {}): UseTasksApiResult {
  const {
    page = 1,
    pageSize = 50,
    taskId = null,
    enabled = true,
    client,
  } = params;

  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;
  const queryClient = useQueryClient();

  const tasksClient = useMemo(
    () => client ?? new TasksClient(API_BASE_URL, apiClient),
    [client]
  );

  const invalidateTasks = async () => {
    if (!orgId) return;
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all(orgId) });
  };

  const tasksQuery = useQuery({
    queryKey: QUERY_KEYS.tasks.paginated(orgId ?? '', page, pageSize),
    queryFn: async () => {
      const data = await unwrap(tasksClient.getAll(page, pageSize));
      return {
        items: data.items ?? [],
        totalCount: data.totalCount,
        page: data.page,
        pageSize: data.pageSize,
      };
    },
    enabled: enabled && !!orgId,
    staleTime: 1000 * 60 * 2,
  });

  const taskQuery = useQuery({
    queryKey: taskId && orgId ? QUERY_KEYS.tasks.detail(orgId, taskId) : ['tasks', 'detail', 'skip'],
    queryFn: async () => unwrap(tasksClient.getById(taskId!)),
    enabled: enabled && !!orgId && !!taskId,
    staleTime: 1000 * 60 * 2,
  });

  const createTask = useMutation({
    mutationFn: (request: CreateTaskRequest) => unwrap(tasksClient.create(request)),
    onSuccess: invalidateTasks,
  });

  const updateTask = useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateTaskRequest }) =>
      unwrap(tasksClient.update(id, request)),
    onSuccess: async (_, variables) => {
      await invalidateTasks();
      if (orgId && variables.id) {
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.tasks.detail(orgId, variables.id),
        });
      }
    },
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => unwrap(tasksClient.delete(id)),
    onSuccess: invalidateTasks,
  });

  const toggleTaskCompletion = useMutation({
    mutationFn: async (task: TaskItemDto) => {
      const request = new UpdateTaskRequest({
        title: task.title,
        description: task.description,
        isCompleted: !task.isCompleted,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        priority: task.priority,
        projectId: task.projectId,
        subjectId: task.subjectId,
        maxScore: task.maxScore,
        weight: task.weight,
        referenceUrl: task.referenceUrl,
        submissionUrl: task.submissionUrl,
        teacherFeedback: task.teacherFeedback,
        grade: task.grade,
      });
      return unwrap(tasksClient.update(task.id, request));
    },
    onSuccess: async (_, task) => {
      await invalidateTasks();
      if (orgId) {
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.tasks.detail(orgId, task.id),
        });
      }
    },
  });

  const isMutating =
    createTask.isPending ||
    updateTask.isPending ||
    deleteTask.isPending ||
    toggleTaskCompletion.isPending;

  const list = tasksQuery.data;

  return {
    tasks: list?.items ?? [],
    totalCount: list?.totalCount ?? 0,
    page: list?.page ?? page,
    pageSize: list?.pageSize ?? pageSize,
    task: taskQuery.data,
    tasksQuery,
    taskQuery,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    invalidateTasks,
    isLoading:
      (tasksQuery.isPending || tasksQuery.isLoading) ||
      (!!taskId && (taskQuery.isPending || taskQuery.isLoading)),
    isError: tasksQuery.isError || (!!taskId && taskQuery.isError),
    listError: tasksQuery.error,
    detailError: taskQuery.error,
    isMutating,
  };
}
