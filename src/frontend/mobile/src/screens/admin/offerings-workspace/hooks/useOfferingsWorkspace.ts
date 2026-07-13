import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  offeringPackagesApi,
  type CourseOfferingPackageDto,
} from '@/src/api/offeringPackagesApi';
import { offeringsApi } from '@/src/api/offeringsApi';
import { orgAdminApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { alertAction, confirmAction } from '@/src/utils/confirmAction';
import { normalizeWeeklySessions, normalizePackageActivitySessions, type OfferingWeeklySession } from '../utils/offeringSessionPlan';

function buildInstructors(item: PackageItemDraft) {
  const instructors: { userId: string; role: string }[] = [];
  if (item.hostUserId) {
    instructors.push({ userId: item.hostUserId, role: 'primary' });
  }
  for (const userId of item.teamUserIds) {
    if (userId && userId !== item.hostUserId) {
      instructors.push({ userId, role: 'co_instructor' });
    }
  }
  return instructors.length ? instructors : undefined;
}

export type PackageItemDraft = {
  key: string;
  name: string;
  code: string;
  hostUserId: string;
  teamUserIds: string[];
  credits: number;
  weeklySessions: OfferingWeeklySession[];
  /** When false, course stays in the package but is skipped on “Apply to period”. */
  applyToTerm: boolean;
};

function buildItemsPayload(itemDrafts: PackageItemDraft[]) {
  return itemDrafts
    .filter((i) => i.name.trim())
    .map((item, idx) => ({
      name: item.name.trim(),
      code: item.code.trim() || undefined,
      sortOrder: idx,
      defaultHostId: item.hostUserId || undefined,
      instructors: buildInstructors(item),
      weeklySessions: normalizePackageActivitySessions(item.weeklySessions),
      credits: item.credits,
    }));
}

function mapItemToDraft(item: CourseOfferingPackageDto['items'][number], idx: number): PackageItemDraft {
  const instructors = item.instructors ?? [];
  const hostFromList = instructors.find((i) => i.isPrimary)?.userId;
  const teamFromList = instructors.filter((i) => !i.isPrimary).map((i) => i.userId).filter(Boolean);

  return {
    key: item.id || `draft-${idx}`,
    name: item.name,
    code: item.code ?? '',
    hostUserId: item.defaultHostId ?? hostFromList ?? '',
    teamUserIds: teamFromList.length ? teamFromList : [],
    weeklySessions: (item.weeklySessions ?? []).map((s, i) => ({
      eventTypeId: s.eventTypeId,
      eventTypeName: s.eventTypeName,
      hoursPerSession: s.hoursPerSession,
      frequency: (s.frequency as OfferingWeeklySession['frequency']) ?? 'weekly',
      isOptional: s.isOptional ?? false,
      sortOrder: s.sortOrder ?? i,
      requiredAttendancePercent: s.requiredAttendancePercent,
      assignedInstructorIds: s.assignedInstructorIds ?? [],
    })),
    credits: item.credits ?? 0,
    applyToTerm: true,
  };
}

export function useOfferingsWorkspace() {
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [newPackageName, setNewPackageName] = useState('');
  const [newPackageDescription, setNewPackageDescription] = useState('');
  const [packageProgramId, setPackageProgramId] = useState('');
  const [itemDrafts, setItemDrafts] = useState<PackageItemDraft[]>([]);
  const [applyPeriodId, setApplyPeriodId] = useState('');

  const packagesQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.offeringPackages(orgId),
    queryFn: () => offeringPackagesApi.list(),
    enabled: !!orgId,
  });

  const periodsQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.periods(orgId),
    queryFn: () => unwrap(orgAdminApi.getPeriods()),
    enabled: !!orgId,
  });

  const periodOfferingsQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.offerings(orgId, applyPeriodId),
    queryFn: () => offeringsApi.listForPeriod(applyPeriodId).then((res) => unwrap(Promise.resolve(res.data))),
    enabled: !!orgId && !!applyPeriodId,
  });

  const packages = packagesQuery.data ?? [];
  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );

  const loadPackageIntoEditor = useCallback((pkg: CourseOfferingPackageDto) => {
    setSelectedPackageId(pkg.id);
    setNewPackageName(pkg.name);
    setNewPackageDescription(pkg.description ?? '');
    setPackageProgramId(pkg.programGroupIds[0] ?? '');
    setItemDrafts(pkg.items.map(mapItemToDraft));
  }, []);

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.offeringPackages(orgId) });
    if (applyPeriodId) {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.orgAdmin.offerings(orgId, applyPeriodId),
      });
    }
  }, [applyPeriodId, orgId, queryClient]);

  const packageProgramsPayload = packageProgramId ? [packageProgramId] : [];

  const createMutation = useMutation({
    mutationFn: () =>
      offeringPackagesApi.create({
        name: newPackageName.trim(),
        description: newPackageDescription.trim() || undefined,
        programGroupIds: packageProgramsPayload,
      }),
    onSuccess: async (created) => {
      await invalidate();
      loadPackageIntoEditor(created);
      alertAction({ title: 'Package created', message: 'Add courses below, then apply to a term.' });
    },
    onError: (e: Error) => alertAction({ title: 'Create failed', message: e.message }),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!selectedPackageId) throw new Error('Select a package first.');
      return offeringPackagesApi.update(selectedPackageId, {
        name: newPackageName.trim(),
        description: newPackageDescription.trim() || undefined,
        programGroupIds: packageProgramsPayload,
      });
    },
    onSuccess: invalidate,
    onError: (e: Error) => alertAction({ title: 'Save failed', message: e.message }),
  });

  const saveItemsMutation = useMutation({
    mutationFn: () => {
      if (!selectedPackageId) throw new Error('Select a package first.');
      return offeringPackagesApi.saveItems(selectedPackageId, buildItemsPayload(itemDrafts));
    },
    onSuccess: async (pkg) => {
      await invalidate();
      loadPackageIntoEditor(pkg);
      alertAction({ title: 'Courses saved', message: 'Package courses updated.' });
    },
    onError: (e: Error) => alertAction({ title: 'Save courses failed', message: e.message }),
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPackageId || !applyPeriodId) throw new Error('Select a package and period.');

      await offeringPackagesApi.update(selectedPackageId, {
        name: newPackageName.trim(),
        description: newPackageDescription.trim() || undefined,
        programGroupIds: packageProgramsPayload,
      });

      const saved = await offeringPackagesApi.saveItems(
        selectedPackageId,
        buildItemsPayload(itemDrafts),
      );
      loadPackageIntoEditor(saved);

      if (!packageProgramId) {
        throw new Error('Select a program for this package before applying.');
      }

      const applyNames = itemDrafts
        .filter((i) => i.applyToTerm && i.name.trim())
        .map((i) => i.name.trim());

      if (applyNames.length === 0) {
        throw new Error('Select at least one course to apply (toggle “Apply to term” on each row).');
      }

      return offeringPackagesApi.applyToPeriod(selectedPackageId, applyPeriodId, {
        enrollLinkedPrograms: true,
        skipExistingNames: true,
        enrollExistingOfferings: true,
        limitToItemNames: applyNames,
      });
    },
    onSuccess: async (result) => {
      await invalidate();
      const parts = [
        `Created ${result.offeringsCreated} offering(s).`,
        result.offeringsSkipped ? `Skipped ${result.offeringsSkipped} (already exist or could not create).` : null,
        `Enrolled ${result.enrollmentsCreated} student(s).`,
        result.offeringsExistingEnrolled
          ? `Enrolled students on ${result.offeringsExistingEnrolled} existing offering(s).`
          : null,
      ].filter(Boolean);
      alertAction({ title: 'Applied to term', message: parts.join(' ') });
    },
    onError: (e: Error) => alertAction({ title: 'Apply failed', message: e.message }),
  });

  const revertMutation = useMutation({
    mutationFn: () => {
      if (!selectedPackageId || !applyPeriodId) throw new Error('Select a package and period.');
      return offeringPackagesApi.revertFromPeriod(selectedPackageId, applyPeriodId);
    },
    onSuccess: async (result) => {
      await invalidate();
      alertAction({
        title: 'Package removed from term',
        message: `Removed ${result.offeringsRemoved} offering(s) and ${result.enrollmentsRemoved} enrollment(s).`,
      });
    },
    onError: (e: Error) => alertAction({ title: 'Undo failed', message: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => offeringPackagesApi.delete(id),
    onSuccess: async () => {
      setSelectedPackageId(null);
      setItemDrafts([]);
      await invalidate();
    },
    onError: (e: Error) => alertAction({ title: 'Delete failed', message: e.message }),
  });

  const periodOptions = useMemo(
    () =>
      (periodsQuery.data ?? []).map((p) => ({
        value: p.id!,
        label: p.name ?? 'Period',
        subtitle: p.isCurrent ? 'Current term' : undefined,
        icon: 'date-range' as const,
      })),
    [periodsQuery.data],
  );

  const periodOfferings = periodOfferingsQuery.data ?? [];

  const packageItemNames = useMemo(
    () => new Set(itemDrafts.map((i) => i.name.trim()).filter(Boolean)),
    [itemDrafts],
  );

  const matchedPeriodOfferings = useMemo(
    () => periodOfferings.filter((o) => packageItemNames.has(o.name)),
    [packageItemNames, periodOfferings],
  );

  const confirmDeletePackage = (pkg: CourseOfferingPackageDto) => {
    confirmAction({
      title: 'Delete package',
      message: `Delete "${pkg.name}"? This also removes matching term offerings (all periods) and their coursework tasks.`,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => deleteMutation.mutate(pkg.id),
    });
  };

  const confirmRevertFromPeriod = () => {
    if (!selectedPackage || !applyPeriodId) return;
    const periodName = periodOptions.find((p) => p.value === applyPeriodId)?.label ?? 'this term';
    confirmAction({
      title: 'Undo package on term',
      message: `Remove offerings from "${selectedPackage.name}" in ${periodName}? This deletes matching course offerings and all their enrollments for that term.`,
      confirmText: 'Remove offerings',
      destructive: true,
      onConfirm: () => revertMutation.mutate(),
    });
  };

  const addItemDraft = () => {
    setItemDrafts((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}`,
        name: '',
        code: '',
        hostUserId: '',
        teamUserIds: [],
        credits: 0,
        weeklySessions: [],
        applyToTerm: true,
      },
    ]);
  };

  const updateItemDraft = (key: string, patch: Partial<PackageItemDraft>) => {
    setItemDrafts((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const removeItemDraft = (key: string) => {
    setItemDrafts((prev) => prev.filter((row) => row.key !== key));
  };

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    saveItemsMutation.isPending ||
    applyMutation.isPending ||
    revertMutation.isPending ||
    deleteMutation.isPending;

  return {
    packages,
    loading: packagesQuery.isLoading,
    selectedPackage,
    loadPackageIntoEditor,
    clearEditor: () => {
      setSelectedPackageId(null);
      setNewPackageName('');
      setNewPackageDescription('');
      setPackageProgramId('');
      setItemDrafts([]);
    },
    newPackageName,
    setNewPackageName,
    newPackageDescription,
    setNewPackageDescription,
    packageProgramId,
    setPackageProgramId,
    itemDrafts,
    addItemDraft,
    updateItemDraft,
    removeItemDraft,
    createPackage: () => createMutation.mutate(),
    savePackage: () => updateMutation.mutate(),
    saveItems: () => saveItemsMutation.mutate(),
    applyPeriodId,
    setApplyPeriodId,
    periodOptions,
    periodOfferings: matchedPeriodOfferings,
    periodOfferingsLoading: periodOfferingsQuery.isLoading,
    applyToPeriod: () => applyMutation.mutate(),
    confirmRevertFromPeriod,
    confirmDeletePackage,
    isSaving,
    refetch: packagesQuery.refetch,
  };
}
