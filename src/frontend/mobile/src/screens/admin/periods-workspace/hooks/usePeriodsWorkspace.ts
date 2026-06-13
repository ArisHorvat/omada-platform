import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { orgAdminApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import {
  CreateOrganizationPeriodRequest,
  type OrganizationPeriodDto,
  UpdateOrganizationPeriodRequest,
} from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { confirmAction, alertAction } from '@/src/utils/confirmAction';
import { markOnboardingStepComplete } from '../../utils/onboarding';
import { coercePeriodDate } from '../utils/periodDates';
import { getPeriodCopy } from '../utils/periodLabels';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function usePeriodsWorkspace() {
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const copy = useMemo(() => getPeriodCopy(organization?.organizationType), [organization?.organizationType]);

  const [newName, setNewName] = useState('');
  const [startDate, setStartDate] = useState(startOfToday);
  const [endDate, setEndDate] = useState(() => addMonths(startOfToday(), 4));
  const [markCurrent, setMarkCurrent] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editStartDate, setEditStartDate] = useState(startOfToday);
  const [editEndDate, setEditEndDate] = useState(() => addMonths(startOfToday(), 4));
  const [editMarkCurrent, setEditMarkCurrent] = useState(false);

  const periodsQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.periods(orgId),
    queryFn: () => unwrap(orgAdminApi.getPeriods()),
    enabled: !!orgId,
  });

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.periods(orgId) });
  }, [orgId, queryClient]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const req = CreateOrganizationPeriodRequest.fromJS({
        name: newName.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isCurrent: markCurrent,
      });
      return unwrap(orgAdminApi.createPeriod(req));
    },
    onSuccess: async () => {
      setNewName('');
      setStartDate(startOfToday());
      setEndDate(addMonths(startOfToday(), 4));
      await invalidate();

      const current = await unwrap(orgAdminApi.getCurrent());
      await unwrap(
        orgAdminApi.updateCurrent({
          name: current.name,
          primaryColor: current.primaryColor,
          secondaryColor: current.secondaryColor,
          tertiaryColor: current.tertiaryColor,
          completedOnboardingSteps: markOnboardingStepComplete(
            current.completedOnboardingSteps,
            'periods',
          ),
        } as never),
      );
    },
    onError: (e: Error) => {
      alertAction({ title: 'Could not add period', message: e.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(orgAdminApi.deletePeriod(id)),
    onSuccess: async (_data, id) => {
      setEditingId((prev) => (prev === id ? null : prev));
      await invalidate();
    },
    onError: (e: Error) => {
      alertAction({ title: 'Could not delete period', message: e.message });
    },
  });

  const buildUpdateRequest = useCallback(
    (fields: { name: string; startDate: Date; endDate: Date; isCurrent: boolean }) =>
      UpdateOrganizationPeriodRequest.fromJS({
        name: fields.name.trim(),
        startDate: fields.startDate.toISOString(),
        endDate: fields.endDate.toISOString(),
        isCurrent: fields.isCurrent,
      }),
    [],
  );

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      start,
      end,
      isCurrent,
    }: {
      id: string;
      name: string;
      start: Date;
      end: Date;
      isCurrent: boolean;
    }) => unwrap(orgAdminApi.updatePeriod(id, buildUpdateRequest({ name, startDate: start, endDate: end, isCurrent }))),
    onSuccess: async () => {
      setEditingId(null);
      await invalidate();
    },
    onError: (e: Error) => {
      alertAction({ title: 'Could not update period', message: e.message });
    },
  });

  const setCurrentMutation = useMutation({
    mutationFn: async (period: OrganizationPeriodDto) => {
      const start = coercePeriodDate(period.startDate);
      const end = coercePeriodDate(period.endDate);
      if (!start || !end) throw new Error('Invalid period dates.');

      return unwrap(
        orgAdminApi.updatePeriod(
          period.id,
          buildUpdateRequest({ name: period.name, startDate: start, endDate: end, isCurrent: true }),
        ),
      );
    },
    onSuccess: invalidate,
    onError: (e: Error) => {
      alertAction({ title: 'Could not update period', message: e.message });
    },
  });

  const startEdit = useCallback((period: OrganizationPeriodDto) => {
    const start = coercePeriodDate(period.startDate) ?? startOfToday();
    const end = coercePeriodDate(period.endDate) ?? addMonths(start, 4);
    setEditingId(period.id);
    setEditName(period.name ?? '');
    setEditStartDate(start);
    setEditEndDate(end);
    setEditMarkCurrent(!!period.isCurrent);
  }, []);

  const confirmDelete = useCallback(
    (id: string, name: string) => {
      confirmAction({
        title: copy.deleteTitle,
        message: `Delete "${name}"? Existing grade records keep their stored label; only the admin quick-pick list changes.`,
        confirmText: 'Delete period',
        destructive: true,
        onConfirm: () => deleteMutation.mutate(id),
      });
    },
    [copy.deleteTitle, deleteMutation],
  );

  const applyExampleName = useCallback((name: string) => {
    setNewName(name);
  }, []);

  const canCreate = newName.trim().length > 0 && endDate >= startDate;
  const canSaveEdit = editName.trim().length > 0 && editEndDate >= editStartDate;

  return {
    copy,
    periods: periodsQuery.data ?? [],
    loading: periodsQuery.isLoading,
    newName,
    setNewName,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    markCurrent,
    setMarkCurrent,
    editingId,
    editName,
    setEditName,
    editStartDate,
    setEditStartDate,
    editEndDate,
    setEditEndDate,
    editMarkCurrent,
    setEditMarkCurrent,
    startEdit,
    cancelEdit: () => setEditingId(null),
    saveEdit: () => {
      if (!editingId || !canSaveEdit) return;
      updateMutation.mutate({
        id: editingId,
        name: editName,
        start: editStartDate,
        end: editEndDate,
        isCurrent: editMarkCurrent,
      });
    },
    canSaveEdit,
    createPeriod: () => createMutation.mutate(),
    setAsCurrent: (period: OrganizationPeriodDto) => setCurrentMutation.mutate(period),
    settingCurrentId: setCurrentMutation.isPending ? setCurrentMutation.variables?.id ?? null : null,
    confirmDelete,
    applyExampleName,
    canCreate,
    isSaving:
      createMutation.isPending ||
      deleteMutation.isPending ||
      setCurrentMutation.isPending ||
      updateMutation.isPending,
    refetch: periodsQuery.refetch,
  };
}

export type PeriodsWorkspaceModel = ReturnType<typeof usePeriodsWorkspace>;
