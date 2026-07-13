import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { orgAdminApi, unwrap } from '@/src/api';
import { offeringsApi, unwrapOfferingsAxios, type PreviewTimetableResultDto } from '@/src/api/offeringsApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useThemeColors } from '@/src/hooks';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useProgramGroupOptions } from '@/src/screens/admin/periods-workspace/hooks/useProgramGroupOptions';
import { useTimetablePlacementOptions } from './useTimetablePlacementOptions';
import { useTimetableRoomPicker } from './useTimetableRoomPicker';
import {
  startOfWeekMonday,
  type OmadaTimetableViewMode,
} from '../utils/omadaScheduleGrouping';
import {
  applyBackendConflictsToDisplaySlots,
  mergeTimetableDisplaySlots,
} from '../utils/timetableDisplaySlots';
import { formatOfferingInstructorRole } from '@/src/screens/admin/offerings-workspace/utils/offeringSessionPlan';

export type TimetablesTab = 'view' | 'build' | 'import';

export type TimetablesViewDisplayMode = 'list' | 'grid';

export type TimetablesLayoutFilter = {
  viewMode: OmadaTimetableViewMode;
  focusKey: string | null;
};

export function hasTimetableNarrowScopeFilter(model: {
  programGroupId: string;
  placementGroupId: string;
  hostId: string;
  offeringId: string;
  roomId?: string;
}): boolean {
  return !!(model.programGroupId || model.placementGroupId || model.hostId || model.offeringId || model.roomId);
}

function toDateOnlyIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function weekEndDate(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function buildOfferingsPatternStamp(
  offerings: { id: string; timetablePublishedAt?: string | null; weeklySessions?: unknown }[],
) {
  return offerings
    .map((o) => `${o.id}:${o.timetablePublishedAt ?? ''}:${JSON.stringify(o.weeklySessions ?? [])}`)
    .join('|');
}

export function useTimetablesWorkspace() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const [activeTab, setActiveTab] = useState<TimetablesTab>('view');
  const [viewDisplayMode, setViewDisplayMode] = useState<TimetablesViewDisplayMode>('list');
  const [periodId, setPeriodId] = useState('');
  const [programGroupId, setProgramGroupId] = useState('');
  const [placementGroupId, setPlacementGroupId] = useState('');
  const [hostId, setHostId] = useState('');
  const [offeringId, setOfferingId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeekMonday(new Date()));
  const [layoutFilter, setLayoutFilter] = useState<TimetablesLayoutFilter>({
    viewMode: 'day',
    focusKey: null,
  });
  const [scopeSheetOpen, setScopeSheetOpen] = useState(false);

  const periodsQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.periods(orgId),
    queryFn: () => unwrap(orgAdminApi.getPeriods()),
    enabled: !!orgId,
  });

  const periods = periodsQuery.data ?? [];
  const selectedPeriod = periods.find((p) => p.id === periodId);

  const selectPeriod = useCallback(
    (newPeriodId: string) => {
      const period = periods.find((p) => p.id === newPeriodId);
      setPeriodId(newPeriodId);
      if (!period?.startDate || !period.endDate) return;

      const periodStart = startOfWeekMonday(new Date(period.startDate));
      const periodEnd = new Date(period.endDate);
      periodEnd.setHours(23, 59, 59, 999);
      const today = new Date();

      if (today >= new Date(period.startDate) && today <= periodEnd) {
        const currentWeekEnd = weekEndDate(weekAnchor);
        if (weekAnchor >= periodStart && currentWeekEnd <= periodEnd) {
          return;
        }
        setWeekAnchor(startOfWeekMonday(today));
        return;
      }

      setWeekAnchor(periodStart);
    },
    [periods, weekAnchor],
  );

  useEffect(() => {
    if (periodId || !periods.length) return;
    const current = periods.find((p) => p.isCurrent) ?? periods[0];
    if (current?.id) selectPeriod(current.id);
  }, [periods, periodId, selectPeriod]);

  const { options: programOptions } = useProgramGroupOptions();
  const { options: placementOptions, typeById } = useTimetablePlacementOptions(
    programGroupId || undefined,
  );

  const offeringsQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.offerings(orgId, periodId),
    queryFn: () => unwrapOfferingsAxios(offeringsApi.listForPeriod(periodId)),
    enabled: !!orgId && !!periodId,
  });

  const allOfferings = offeringsQuery.data ?? [];
  const offeringsPatternStamp = useMemo(
    () => buildOfferingsPatternStamp(allOfferings),
    [allOfferings],
  );

  const offerings = useMemo(() => {
    let list = allOfferings;
    if (programGroupId) {
      list = list.filter(
        (o) =>
          o.programGroupId === programGroupId ||
          o.programGroupIds?.includes(programGroupId),
      );
    }
    return list;
  }, [allOfferings, programGroupId]);

  const hostOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: { value: string; label: string; subtitle?: string }[] = [];
    for (const o of offerings) {
      for (const i of o.instructors ?? []) {
        const userId = i.userId?.trim();
        if (!userId || seen.has(userId)) continue;
        seen.add(userId);
        out.push({
          value: userId,
          label: i.displayName?.trim() || 'Staff',
          subtitle: formatOfferingInstructorRole(i.role, i.isPrimary),
        });
      }
      if (o.hostId && o.hostName && !seen.has(o.hostId)) {
        seen.add(o.hostId);
        out.push({ value: o.hostId, label: o.hostName, subtitle: 'Primary instructor' });
      }
    }
    return out.sort((a, b) => a.label.localeCompare(b.label));
  }, [offerings]);

  const offeringOptions = useMemo(
    () => offerings.map((o) => ({ value: o.id, label: o.name, subtitle: o.code })),
    [offerings],
  );

  const { rooms: timetableRooms } = useTimetableRoomPicker();
  const roomOptions = useMemo(
    () =>
      timetableRooms.map((r) => ({
        value: r.value,
        label: r.label,
        subtitle: r.subtitle,
      })),
    [timetableRooms],
  );

  const offeringProgramLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of allOfferings) {
      const label =
        o.programGroupNames?.join(', ') || o.programGroupName || o.name;
      map.set(o.id, label);
    }
    return map;
  }, [allOfferings]);

  const scopeStamp = `${programGroupId}|${placementGroupId}|${hostId}|${offeringId}|${offeringsPatternStamp}`;

  const previewQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.timetablesPreview(
      orgId,
      periodId,
      weekAnchor.toISOString(),
      scopeStamp,
    ),
    queryFn: () =>
      unwrapOfferingsAxios(
        offeringsApi.previewTimetable(periodId, {
          weekStartDate: toDateOnlyIso(weekAnchor),
          programGroupId: programGroupId || undefined,
          offeringId: offeringId || undefined,
          hostId: hostId || undefined,
          groupId: placementGroupId || undefined,
        }),
      ),
    enabled: !!orgId && !!periodId && activeTab === 'view',
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const preview = previewQuery.data as PreviewTimetableResultDto | undefined;

  const { slots: mergedDisplaySlots, conflicts: mergedDisplayConflicts } = useMemo(() => {
    const merged = mergeTimetableDisplaySlots(preview?.slots ?? []);
    const enriched = merged.map((slot) => ({
      ...slot,
      programGroupName:
        slot.programGroupName?.trim() ||
        (slot.offeringId ? offeringProgramLabel.get(slot.offeringId) : undefined) ||
        undefined,
    }));
    return applyBackendConflictsToDisplaySlots(enriched, preview?.conflicts ?? []);
  }, [preview?.slots, preview?.conflicts, offeringProgramLabel]);

  const displaySlots = useMemo(() => {
    if (!roomId) return mergedDisplaySlots;
    return mergedDisplaySlots.filter((s) => s.roomId === roomId);
  }, [mergedDisplaySlots, roomId]);

  const displayConflicts = useMemo(() => {
    if (!roomId) return mergedDisplayConflicts;
    const visibleKeys = new Set(displaySlots.map((s) => s.displayKey));
    return mergedDisplayConflicts.filter(
      (c) => visibleKeys.has(c.slotKeyA) || visibleKeys.has(c.slotKeyB),
    );
  }, [mergedDisplayConflicts, displaySlots, roomId]);

  useEffect(() => {
    if (activeTab !== 'view' || !periodId || !orgId) return;
    void offeringsQuery.refetch();
    void previewQuery.refetch();
  }, [activeTab, periodId, orgId]);

  const hasNarrowScopeFilter = hasTimetableNarrowScopeFilter({
    programGroupId,
    placementGroupId,
    hostId,
    offeringId,
    roomId,
  });
  const canShowWeekGrid = hasNarrowScopeFilter;
  const gridIsOverloaded = displaySlots.length > 48;

  const periodOptions = useMemo(
    () => periods.map((p) => ({ value: p.id, label: p.name, subtitle: p.isCurrent ? 'Current' : undefined })),
    [periods],
  );

  const shiftWeek = (delta: number) => {
    setWeekAnchor((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta * 7);
      if (selectedPeriod?.startDate) {
        const min = startOfWeekMonday(new Date(selectedPeriod.startDate));
        if (next < min) return min;
      }
      if (selectedPeriod?.endDate) {
        const max = startOfWeekMonday(new Date(selectedPeriod.endDate));
        if (next > max) return max;
      }
      return next;
    });
  };

  const resetScopeFilters = () => {
    setProgramGroupId('');
    setPlacementGroupId('');
    setHostId('');
    setOfferingId('');
    setRoomId('');
    setLayoutFilter({ viewMode: 'day', focusKey: null });
  };

  const refreshPreview = useCallback(async () => {
    await offeringsQuery.refetch();
    await previewQuery.refetch();
  }, [offeringsQuery, previewQuery]);

  const invalidatePreview = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ['timetables-preview', orgId],
    });
  }, [queryClient, orgId]);

  return {
    colors,
    insets,
    horizontalPad: 16,
    activeTab,
    setActiveTab,
    viewDisplayMode,
    setViewDisplayMode,
    periodId,
    setPeriodId,
    selectPeriod,
    periods,
    periodOptions,
    selectedPeriod,
    programGroupId,
    setProgramGroupId,
    programOptions,
    placementGroupId,
    setPlacementGroupId,
    placementOptions,
    hostId,
    setHostId,
    hostOptions,
    offeringId,
    setOfferingId,
    offeringOptions,
    roomId,
    setRoomId,
    roomOptions,
    weekAnchor,
    shiftWeek,
    layoutFilter,
    setLayoutFilter,
    displaySlots,
    displayConflicts,
    previewLoading: previewQuery.isLoading,
    previewRefreshing: previewQuery.isFetching,
    hasNarrowScopeFilter,
    canShowWeekGrid,
    gridIsOverloaded,
    offerings,
    offeringsLoading: offeringsQuery.isLoading,
    offeringsPatternStamp,
    periodsLoading: periodsQuery.isLoading,
    groupTypeById: typeById,
    offeringProgramLabel,
    resetScopeFilters,
    refreshPreview,
    invalidatePreview,
    refetch: refreshPreview,
    scopeSheetOpen,
    setScopeSheetOpen,
  };
}

export type TimetablesWorkspaceModel = ReturnType<typeof useTimetablesWorkspace>;
