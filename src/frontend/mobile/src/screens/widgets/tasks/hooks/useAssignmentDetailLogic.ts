import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrap, usersApi } from '@/src/api';
import {
  buildTaskUpdateFromDto,
  getTaskExtended,
  submitTaskSubmission,
  updateTaskExtended,
  type ExtendedTaskItemDto,
  type TaskAttachment,
  type TaskUpdatePayload,
} from '@/src/api/tasksWorkApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useAuth } from '@/src/context/AuthContext';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { usePermission } from '@/src/context/PermissionContext';

import { useTasksApi } from './useTasksApi';
import {
  canGradeAssignment,
  canStudentMutateSubmission,
  getAssignmentStatus,
} from '../utils/assignmentStatus';
import { isAcademicTask } from '../utils/taskFilters';
import { isUniversityOrg } from '../utils/taskLabels';
import { alertAction } from '@/src/utils/confirmAction';

export function useAssignmentDetailLogic(taskId: string) {
  const queryClient = useQueryClient();
  const { activeSession } = useAuth();
  const { can } = usePermission();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const isUniversity = isUniversityOrg(organization?.organizationType);

  const remote = useTasksApi({ taskId, enabled: false });

  const taskQuery = useQuery({
    queryKey: orgId && taskId ? [...QUERY_KEYS.tasks.detail(orgId, taskId), 'extended'] : ['tasks', 'skip'],
    queryFn: () => getTaskExtended(taskId),
    enabled: !!orgId && !!taskId,
    staleTime: 1000 * 60 * 2,
  });

  const task = taskQuery.data;

  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.userProfile(orgId),
    queryFn: () => unwrap(usersApi.getMe()),
    staleTime: 1000 * 60 * 5,
  });

  const currentUserId = profileQuery.data?.id;
  const role = (activeSession?.role || '').toLowerCase();
  const isStaffRole = role === 'teacher' || role === 'admin' || role === 'superadmin';

  const canGrade = can('tasks.assign') || can('assignments.grade') || isStaffRole;
  const canSubmit =
    can('assignments.submit') || can('tasks.create') || can('tasks.assign') || isStaffRole;

  const status = useMemo(() => (task ? getAssignmentStatus(task) : 'pending'), [task]);

  const isAssignee = !!task && !!currentUserId && task.assigneeId === currentUserId;
  const isCreator = !!task && !!currentUserId && task.createdByUserId === currentUserId;
  const isClassWideOffering =
    !!task?.offeringId && !!currentUserId && task.createdByUserId !== currentUserId && !isAssignee;

  const showStudentActions =
    !!task &&
    isAcademicTask(task) &&
    canSubmit &&
    canStudentMutateSubmission(task, currentUserId) &&
    !canGradeAssignment(task, currentUserId, canGrade, isStaffRole);

  const showGradingPanel = !!task && canGradeAssignment(task, currentUserId, canGrade, isStaffRole);

  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionAttachments, setSubmissionAttachments] = useState<TaskAttachment[]>([]);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  useEffect(() => {
    if (!task) return;
    setSubmissionUrl(task.submissionUrl ?? '');
    setSubmissionAttachments(task.submissionAttachments ?? []);
    setGradeInput(task.grade != null ? String(task.grade) : '');
    setFeedbackInput(task.teacherFeedback ?? '');
  }, [task?.id, task?.submissionUrl, task?.submissionAttachments, task?.grade, task?.teacherFeedback]);

  const invalidateTask = async () => {
    if (orgId && taskId) {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.detail(orgId, taskId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all(orgId) });
    }
  };

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<TaskUpdatePayload>) => {
      if (!task) throw new Error('No task');
      return updateTaskExtended(task.id, buildTaskUpdateFromDto(task, patch));
    },
    onSuccess: invalidateTask,
  });

  const submitMutation = useMutation({
    mutationFn: (body: { isCompleted: boolean; submissionUrl?: string; submissionAttachments?: TaskAttachment[] }) => {
      if (!task) throw new Error('No task');
      return submitTaskSubmission(task.id, body);
    },
    onSuccess: invalidateTask,
    onError: (e: Error) => {
      void alertAction({
        title: 'Could not update submission',
        message: e.message || 'Try again.',
      });
    },
  });

  const saveSubmission = () => {
    if (!task) return;
    submitMutation.mutate({
      submissionUrl: submissionUrl.trim() || undefined,
      submissionAttachments,
      isCompleted: true,
    });
  };

  const markSubmitted = () => {
    if (!task) return;
    submitMutation.mutate({ isCompleted: true });
  };

  const saveGrade = () => {
    if (!task) return;
    const grade = gradeInput.trim() ? Number(gradeInput) : undefined;
    if (gradeInput.trim() && (grade == null || Number.isNaN(grade))) return;
    updateMutation.mutate({
      grade,
      teacherFeedback: feedbackInput.trim() || undefined,
    });
  };

  const reopenAssignment = () => {
    if (!task) return;
    updateMutation.mutate({ isCompleted: false, grade: undefined, teacherFeedback: undefined });
  };

  const undoTurnIn = () => {
    if (!task) return;
    submitMutation.mutate({
      isCompleted: false,
      submissionUrl: undefined,
      submissionAttachments: [],
    });
  };

  const canUndoTurnIn =
    !!task &&
    isAssignee &&
    task.isCompleted &&
    task.grade == null &&
    canStudentMutateSubmission(task, currentUserId);

  return {
    task,
    isLoading: taskQuery.isLoading || profileQuery.isLoading,
    isError: taskQuery.isError,
    refetch: () => void taskQuery.refetch(),
    isMutating: updateMutation.isPending || submitMutation.isPending || remote.isMutating,
    status,
    isUniversity,
    isAssignee,
    isCreator,
    isClassWideOffering,
    showStudentActions,
    showGradingPanel,
    submissionUrl,
    setSubmissionUrl,
    submissionAttachments,
    setSubmissionAttachments,
    gradeInput,
    setGradeInput,
    feedbackInput,
    setFeedbackInput,
    saveSubmission,
    markSubmitted,
    saveGrade,
    reopenAssignment,
    undoTurnIn,
    canUndoTurnIn,
    deleteTask: () => remote.deleteTask.mutate(taskId),
  };
}
