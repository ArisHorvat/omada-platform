import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  assignmentsBatchApi,
  type AssignmentBatchSummaryDto,
  type CreateAssignmentBatchRequest,
  type TaskDistributionScope,
} from '@/src/api/assignmentsBatchApi';
import type { TaskAttachment } from '@/src/api/tasksWorkApi';
import { gradePlanApi } from '@/src/api/gradePlanApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { groupsApi, unwrap } from '@/src/api';
import { parseWeightInput } from '@/src/screens/widgets/tasks/utils/assignmentStatus';
import { confirmAction, alertAction } from '@/src/utils/confirmAction';
import { useCourseworkOfferings } from './useCourseworkOfferings';

export type AudienceScope = 'offering' | 'group';

export function useAssignmentsWorkspace() {
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [maxScore, setMaxScore] = useState('');
  const [weight, setWeight] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [materials, setMaterials] = useState<TaskAttachment[]>([]);
  const [gradeCategoryId, setGradeCategoryId] = useState('');
  const [audienceScope, setAudienceScope] = useState<AudienceScope>('offering');
  const [offeringId, setOfferingId] = useState('');
  const [groupId, setGroupId] = useState('');

  const batchesQuery = useQuery({
    queryKey: QUERY_KEYS.tasks.batches(orgId, 1, 50),
    queryFn: () => assignmentsBatchApi.list(1, 50),
    enabled: !!orgId,
  });

  const courseworkOfferings = useCourseworkOfferings();
  const groupsQuery = useQuery({
    queryKey: QUERY_KEYS.groups.assignable(orgId, 'assignment'),
    queryFn: () => unwrap(groupsApi.getAssignable('assignment')),
    enabled: !!orgId,
  });

  const offeringOptions = courseworkOfferings.offeringOptions;
  const selectedOffering = offeringOptions.find((o) => o.value === offeringId);

  useEffect(() => {
    if (offeringId && !offeringOptions.some((o) => o.value === offeringId)) {
      setOfferingId('');
    }
  }, [offeringId, offeringOptions]);

  useEffect(() => {
    setOfferingId('');
  }, [courseworkOfferings.periodId]);

  const gradePlanQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.gradePlan(orgId, selectedOffering?.periodId ?? '', offeringId),
    queryFn: () => gradePlanApi.get(selectedOffering!.periodId, offeringId),
    enabled: !!orgId && !!offeringId && !!selectedOffering?.periodId && audienceScope === 'offering',
  });

  const gradeCategoryOptions = useMemo(
    () =>
      (gradePlanQuery.data?.categories ?? []).map((c) => ({
        value: c.id,
        label: c.name,
        subtitle: `${Math.round(c.weight * 100)}% of final${c.isBonus ? ' · bonus' : ''}`,
      })),
    [gradePlanQuery.data],
  );

  const groupOptions = useMemo(
    () =>
      (groupsQuery.data ?? []).map((g) => ({
        id: g.id ?? '',
        label: g.name ?? 'Group',
        subtitle: g.typeLabel ?? g.type,
      })),
    [groupsQuery.data],
  );

  const invalidate = useCallback(async () => {
    if (!orgId) return;
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all(orgId) });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.batches(orgId, 1, 50) });
  }, [orgId, queryClient]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(null);
    setMaxScore('');
    setWeight('');
    setReferenceUrl('');
    setMaterials([]);
    setGradeCategoryId('');
    setOfferingId('');
    setGroupId('');
  };

  const createMutation = useMutation({
    mutationFn: (body: CreateAssignmentBatchRequest) => assignmentsBatchApi.create(body),
    onSuccess: async (result) => {
      resetForm();
      await invalidate();
      void alertAction({
        title: 'Assignment posted',
        message: `Created ${result.createdCount} individual tasks for students.${
          result.skippedCount > 0 ? ` Skipped ${result.skippedCount} inactive members.` : ''
        }`,
      });
    },
    onError: (e: Error) => {
      void alertAction({ title: 'Could not post coursework', message: e.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (batchId: string) => assignmentsBatchApi.delete(batchId),
    onSuccess: invalidate,
  });

  const publishAssignment = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const parsedMax = maxScore.trim() ? Number(maxScore) : undefined;
    const parsedWeight = parseWeightInput(weight);

    const distributionScope: TaskDistributionScope =
      audienceScope === 'offering' ? 'OfferingEnrolled' : 'GroupMembers';

    if (audienceScope === 'offering' && !offeringId) {
      void alertAction({ title: 'Select a course', message: 'Choose which course offering to assign to.' });
      return;
    }

    if (audienceScope === 'group' && !groupId) {
      void alertAction({ title: 'Select a group', message: 'Choose a class, lab, or cohort group.' });
      return;
    }

    const body: CreateAssignmentBatchRequest = {
      title: trimmedTitle,
      description: description.trim() || undefined,
      dueDate: dueDate?.toISOString(),
      distributionScope,
      offeringId: audienceScope === 'offering' ? offeringId : undefined,
      subjectId: audienceScope === 'group' ? groupId : undefined,
      maxScore: parsedMax != null && !Number.isNaN(parsedMax) ? parsedMax : undefined,
      weight: parsedWeight,
      referenceUrl: referenceUrl.trim() || undefined,
      materials: materials.length ? materials.map((m) => ({ ...m, kind: 'material' })) : undefined,
      gradeCategoryId: gradeCategoryId || undefined,
    };

    createMutation.mutate(body);
  };

  const confirmDeleteBatch = (batch: AssignmentBatchSummaryDto) => {
    void confirmAction({
      title: 'Delete assignment?',
      message: `Remove "${batch.title}" for all ${batch.totalAssigned} students? This cannot be undone.`,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => deleteMutation.mutate(batch.batchId),
    });
  };

  return {
    orgId,
    batches: batchesQuery.data?.items ?? [],
    loading: batchesQuery.isLoading,
    isError: batchesQuery.isError,
    batchesError: batchesQuery.error,
    offeringsLoading: courseworkOfferings.offeringsLoading,
    offeringsEmpty: courseworkOfferings.offeringsEmpty,
    noPeriodConfigured: courseworkOfferings.noPeriodConfigured,
    canUseFullCatalog: courseworkOfferings.canUseFullCatalog,
    periodId: courseworkOfferings.periodId,
    setPeriodId: courseworkOfferings.setPeriodId,
    periodOptions: courseworkOfferings.periodOptions,
    refetch: () => void batchesQuery.refetch(),
    title,
    setTitle,
    description,
    setDescription,
    dueDate,
    setDueDate,
    maxScore,
    setMaxScore,
    weight,
    setWeight,
    referenceUrl,
    setReferenceUrl,
    materials,
    setMaterials,
    gradeCategoryId,
    setGradeCategoryId,
    gradeCategoryOptions,
    selectedOffering,
    gradePlanQuery,
    audienceScope,
    setAudienceScope,
    offeringId,
    setOfferingId,
    groupId,
    setGroupId,
    offeringOptions,
    groupOptions,
    publishAssignment,
    confirmDeleteBatch,
    isSaving: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export type AssignmentsWorkspaceModel = ReturnType<typeof useAssignmentsWorkspace>;
