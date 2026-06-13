import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { offeringsApi, unwrapOfferingsAxios, type CourseOfferingDto } from '@/src/api/offeringsApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { alertAction, confirmAction } from '@/src/utils/confirmAction';

function parseOfferingNames(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function usePeriodOfferings(periodId: string | null) {
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const [newName, setNewName] = useState('');
  const [programGroupId, setProgramGroupId] = useState('');
  const [bulkNames, setBulkNames] = useState('');

  const offeringsQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.offerings(orgId, periodId ?? ''),
    queryFn: async () => {
      if (!periodId) return [] as CourseOfferingDto[];
      return unwrapOfferingsAxios(offeringsApi.listForPeriod(periodId));
    },
    enabled: !!orgId && !!periodId,
  });

  const invalidate = useCallback(async () => {
    if (!periodId) return;
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.offerings(orgId, periodId) });
  }, [orgId, periodId, queryClient]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!periodId || !newName.trim()) throw new Error('Name required.');
      return unwrapOfferingsAxios(
        offeringsApi.create(periodId, {
          name: newName.trim(),
          programGroupId: programGroupId.trim() || undefined,
        }),
      );
    },
    onSuccess: async () => {
      setNewName('');
      await invalidate();
    },
    onError: (e: Error) => alertAction({ title: 'Could not add offering', message: e.message }),
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      if (!periodId || !programGroupId.trim()) throw new Error('Program group id required.');
      const names = parseOfferingNames(bulkNames);
      return unwrapOfferingsAxios(
        offeringsApi.setupProgram(periodId, {
          programGroupId: programGroupId.trim(),
          offeringNames: names.length ? names : undefined,
          enrollAllCohorts: true,
        }),
      );
    },
    onSuccess: async (result) => {
      setBulkNames('');
      await invalidate();
      alertAction({
        title: 'Term setup complete',
        message: `Created ${result.offeringsCreated} offering(s) and ${result.enrollmentsCreated} enrollment(s).`,
      });
    },
    onError: (e: Error) => alertAction({ title: 'Setup failed', message: e.message }),
  });

  const enrollMutation = useMutation({
    mutationFn: async ({ offeringId, programId }: { offeringId: string; programId: string }) => {
      if (!periodId) throw new Error('No period selected.');
      return unwrapOfferingsAxios(
        offeringsApi.enrollProgramCohorts(periodId, offeringId, programId),
      );
    },
    onSuccess: async (count) => {
      await invalidate();
      alertAction({ title: 'Enrolled', message: `${count} new enrollment(s) added.` });
    },
    onError: (e: Error) => alertAction({ title: 'Enroll failed', message: e.message }),
  });

  const enrollLinkedMutation = useMutation({
    mutationFn: async (offeringId: string) => {
      if (!periodId) throw new Error('No period selected.');
      return unwrapOfferingsAxios(offeringsApi.enrollLinkedPrograms(periodId, offeringId));
    },
    onSuccess: async (count) => {
      await invalidate();
      alertAction({ title: 'Enrolled', message: `${count} new enrollment(s) from linked programs.` });
    },
    onError: (e: Error) => alertAction({ title: 'Enroll failed', message: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (offeringId: string) => {
      if (!periodId) throw new Error('No period selected.');
      return unwrapOfferingsAxios(offeringsApi.delete(periodId, offeringId));
    },
    onSuccess: invalidate,
    onError: (e: Error) => alertAction({ title: 'Delete failed', message: e.message }),
  });

  const updateCreditsMutation = useMutation({
    mutationFn: async ({ offering, credits }: { offering: CourseOfferingDto; credits: number }) => {
      if (!periodId) throw new Error('No period selected.');
      return unwrapOfferingsAxios(
        offeringsApi.update(periodId, offering.id, {
          name: offering.name,
          code: offering.code,
          description: offering.description,
          programGroupId: offering.programGroupId,
          subjectCatalogGroupId: offering.subjectCatalogGroupId,
          hostId: offering.hostId,
          programGroupIds: offering.programGroupIds,
          credits,
          requiredAttendancePercent: offering.requiredAttendancePercent ?? undefined,
        }),
      );
    },
    onSuccess: invalidate,
    onError: (e: Error) => alertAction({ title: 'Could not save credits', message: e.message }),
  });

  const updateAttendanceRuleMutation = useMutation({
    mutationFn: async ({
      offering,
      requiredAttendancePercent,
    }: {
      offering: CourseOfferingDto;
      requiredAttendancePercent: number | null;
    }) => {
      if (!periodId) throw new Error('No period selected.');
      return unwrapOfferingsAxios(
        offeringsApi.update(periodId, offering.id, {
          name: offering.name,
          code: offering.code,
          description: offering.description,
          programGroupId: offering.programGroupId,
          subjectCatalogGroupId: offering.subjectCatalogGroupId,
          hostId: offering.hostId,
          programGroupIds: offering.programGroupIds,
          credits: offering.credits ?? 0,
          requiredAttendancePercent: requiredAttendancePercent ?? undefined,
        }),
      );
    },
    onSuccess: invalidate,
    onError: (e: Error) =>
      alertAction({ title: 'Could not save attendance rule', message: e.message }),
  });

  const confirmDeleteOffering = (offering: CourseOfferingDto) => {
    confirmAction({
      title: 'Delete offering',
      message: `Delete "${offering.name}"? Schedule and coursework linked to this offering will lose the link.`,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => deleteMutation.mutate(offering.id),
    });
  };

  return {
    offerings: offeringsQuery.data ?? [],
    loading: offeringsQuery.isLoading,
    newName,
    setNewName,
    programGroupId,
    setProgramGroupId,
    bulkNames,
    setBulkNames,
    createOffering: () => createMutation.mutate(),
    setupProgramTerm: () => setupMutation.mutate(),
    enrollProgramCohorts: (offeringId: string, programId: string) =>
      enrollMutation.mutate({ offeringId, programId: programId }),
    enrollLinkedPrograms: (offeringId: string) => enrollLinkedMutation.mutate(offeringId),
    confirmDeleteOffering,
    updateOfferingCredits: (offering: CourseOfferingDto, credits: number) =>
      updateCreditsMutation.mutate({ offering, credits }),
    updateOfferingAttendanceRule: (
      offering: CourseOfferingDto,
      requiredAttendancePercent: number | null,
    ) => updateAttendanceRuleMutation.mutate({ offering, requiredAttendancePercent }),
    isSaving: createMutation.isPending || setupMutation.isPending || enrollMutation.isPending || enrollLinkedMutation.isPending || deleteMutation.isPending || updateCreditsMutation.isPending || updateAttendanceRuleMutation.isPending,
    refetch: offeringsQuery.refetch,
  };
}
