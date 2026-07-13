import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/src/api/queryKeys';
import { scrapedHostAliasesApi } from '@/src/api/scrapedHostAliasesApi';
import type { ScrapedScheduleEvent } from '@/src/screens/admin/web-spider-workspace/utils/schedulePreviewGrouping';
import { scrapedScheduleImportApi } from '@/src/api/scrapedScheduleImportApi';
import {
  buildMappingsDto,
  defaultImportAllScopedRows,
  defaultWizardContext,
  resolveTargetKind,
  usesCourseMappingStep,
  type GroupTimetableKind,
  type HostMappingValue,
  type ImportMappingTab,
  type ImportScopeKind,
  type ImportWizardContext,
  type ImportWizardStep,
} from './importWizardTypes';

function initLabelMap<T extends { scrapedLabel: string; suggestedTargetId?: string | null; confidence?: number }>(
  rows: T[],
  minConfidence = 0.72,
): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const row of rows) {
    const id = row.suggestedTargetId?.trim();
    const confidence = row.confidence ?? 0;
    out[row.scrapedLabel] = id && confidence >= minConfidence ? id : null;
  }
  return out;
}

function initProfessorMap(
  rows: { scrapedLabel: string; suggestedTargetId?: string | null; confidence?: number }[],
  savedAliases: {
    scrapedLabel: string;
    hostUserId?: string | null;
    pendingDisplayName?: string | null;
  }[],
): Record<string, HostMappingValue> {
  const aliasByLabel = new Map(
    savedAliases.map((a) => [a.scrapedLabel.toLowerCase(), a] as const),
  );

  const out: Record<string, HostMappingValue> = {};

  for (const row of rows) {
    const alias = aliasByLabel.get(row.scrapedLabel.toLowerCase());
    if (alias?.hostUserId) {
      out[row.scrapedLabel] = { mode: 'member', userId: alias.hostUserId };
      continue;
    }
    if (alias?.pendingDisplayName?.trim()) {
      out[row.scrapedLabel] = { mode: 'pendingName', displayName: alias.pendingDisplayName.trim() };
      continue;
    }

    const id = row.suggestedTargetId?.trim();
    const confidence = row.confidence ?? 0;
    out[row.scrapedLabel] =
      id && confidence >= 0.72 ? { mode: 'member', userId: id } : { mode: 'unmapped' };
  }

  return out;
}

function isIdMapped(map: Record<string, string | null>, key: string): boolean {
  const v = map[key];
  return typeof v === 'string' && v.length > 0;
}

function isProfessorMapped(val: HostMappingValue | undefined): boolean {
  if (!val || val.mode === 'unmapped') return false;
  if (val.mode === 'pendingName') return !!val.displayName?.trim();
  return val.mode === 'member' && !!val.userId?.trim();
}

function defaultMappingTab(scopeKind: ImportScopeKind | null): ImportMappingTab {
  if (scopeKind === 'multiCourse' || scopeKind === 'groupTimetable') return 'course';
  return 'eventTypes';
}

type Args = {
  orgId: string;
  periodId: string | null;
  events: ScrapedScheduleEvent[];
  studyGroupLabel: string | null;
};

export function useImportScheduleWizard({ orgId, periodId, events, studyGroupLabel }: Args) {
  const [step, setStep] = useState<ImportWizardStep>('context');
  const [mappingTab, setMappingTab] = useState<ImportMappingTab>('eventTypes');
  const [context, setContext] = useState<ImportWizardContext>(defaultWizardContext());
  const [activityMap, setActivityMap] = useState<Record<string, string | null>>({});
  const [professorMap, setProfessorMap] = useState<Record<string, HostMappingValue>>({});
  const [roomMap, setRoomMap] = useState<Record<string, string | null>>({});
  const [groupMap, setGroupMap] = useState<Record<string, string | null>>({});
  const [subjectMap, setSubjectMap] = useState<Record<string, string | null>>({});

  const mapsSeedKeyRef = useRef<string | null>(null);
  const targetKind = resolveTargetKind(context);

  const resolutionQuery = useQuery({
    queryKey: [
      'scraped-import-resolution',
      orgId,
      periodId,
      events.length,
      studyGroupLabel,
      context.offeringId,
    ],
    queryFn: () =>
      scrapedScheduleImportApi.resolve({
        periodId: periodId!,
        events,
        studyGroupLabel,
        selectedOfferingId: context.offeringId,
      }),
    enabled: !!periodId && events.length > 0,
    retry: false,
    staleTime: 30_000,
  });

  const savedAliasesQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.scrapedHostAliases(orgId),
    queryFn: () => scrapedHostAliasesApi.list(),
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const resolution = resolutionQuery.data;
  const mapsSeedKey = `${periodId ?? ''}|${events.length}|${studyGroupLabel ?? ''}|${context.offeringId ?? ''}`;

  useEffect(() => {
    if (!resolution) return;

    const isFreshScrape = mapsSeedKeyRef.current !== mapsSeedKey;
    if (isFreshScrape) {
      mapsSeedKeyRef.current = mapsSeedKey;
      setActivityMap(initLabelMap(resolution.activityTypes));
      setProfessorMap(initProfessorMap(resolution.professors, savedAliasesQuery.data ?? []));
      setRoomMap(initLabelMap(resolution.rooms));
      setGroupMap(initLabelMap(resolution.studyGroups));
      setSubjectMap(initLabelMap(resolution.subjects));
    }

    setContext((prev) => ({
      ...prev,
      offeringId: prev.offeringId ?? resolution.suggestedOfferingId ?? null,
      importAllScopedRows:
        prev.scopeKind != null
          ? prev.importAllScopedRows
          : (resolution.recommendSingleOfferingImport ?? prev.importAllScopedRows),
    }));
  }, [resolution, mapsSeedKey, savedAliasesQuery.data]);

  const setScopeKind = useCallback((scopeKind: ImportScopeKind) => {
    setContext((c) => {
      const groupKind = scopeKind === 'groupTimetable' ? (c.groupKind ?? 'group') : null;
      const importAllScopedRows = defaultImportAllScopedRows(scopeKind, groupKind);
      return {
        ...c,
        scopeKind,
        groupKind,
        importAllScopedRows,
        offeringId: importAllScopedRows ? c.offeringId : scopeKind === 'singleCourse' ? c.offeringId : null,
        anchorGroupId: scopeKind === 'groupTimetable' ? c.anchorGroupId : null,
      };
    });
    setMappingTab(defaultMappingTab(scopeKind));
  }, []);

  const setGroupKind = useCallback((groupKind: GroupTimetableKind) => {
    setContext((c) => ({
      ...c,
      groupKind,
      anchorGroupId: null,
      importAllScopedRows: defaultImportAllScopedRows(c.scopeKind, groupKind),
    }));
  }, []);

  useEffect(() => {
    if (!context.anchorGroupId || !studyGroupLabel) return;
    setGroupMap((m) => ({ ...m, [studyGroupLabel]: context.anchorGroupId }));
  }, [context.anchorGroupId, studyGroupLabel]);

  const mappingsDto = useMemo(
    () => buildMappingsDto({ activityMap, professorMap, roomMap, groupMap, subjectMap }),
    [activityMap, professorMap, roomMap, groupMap, subjectMap],
  );

  const courseMappingMode = usesCourseMappingStep(context, resolution);

  const mappedOfferingIds = useMemo(() => {
    const ids = new Set<string>();
    for (const id of Object.values(subjectMap)) {
      if (id?.trim()) ids.add(id.trim());
    }
    return [...ids];
  }, [subjectMap]);

  const mappingProgress = useMemo(() => {
    if (!resolution) {
      return {
        mapped: 0,
        total: 0,
        issues: [] as string[],
        tabStats: {} as Record<ImportMappingTab, { mapped: number; total: number; unmapped: number }>,
      };
    }
    const issues: string[] = [];
    let mapped = 0;
    let total = 0;
    const tabStats = {} as Record<ImportMappingTab, { mapped: number; total: number; unmapped: number }>;

    const bumpTab = (tab: ImportMappingTab, isMapped: boolean) => {
      if (!tabStats[tab]) tabStats[tab] = { mapped: 0, total: 0, unmapped: 0 };
      tabStats[tab].total++;
      if (isMapped) tabStats[tab].mapped++;
      else tabStats[tab].unmapped++;
    };

    const check = (
      labels: string[],
      map: Record<string, string | null>,
      label: string,
      tab: ImportMappingTab,
    ) => {
      for (const key of labels) {
        total++;
        const ok = isIdMapped(map, key);
        if (ok) mapped++;
        else issues.push(`${label}: "${key}"`);
        bumpTab(tab, ok);
      }
    };

    if (context.scopeKind === 'singleCourse') {
      total++;
      if (context.offeringId) mapped++;
      else issues.push('Target course offering');
    }

    if (targetKind === 'studyGroup' || targetKind === 'programOrSeries') {
      total++;
      if (context.anchorGroupId) mapped++;
      else issues.push('Anchor group');
    }

    if (courseMappingMode) {
      check(resolution.subjects.map((r) => r.scrapedLabel), subjectMap, 'Course', 'course');
    }

    check(resolution.activityTypes.map((r) => r.scrapedLabel), activityMap, 'Event type', 'eventTypes');

    for (const row of resolution.professors) {
      total++;
      const ok = isProfessorMapped(professorMap[row.scrapedLabel]);
      if (ok) mapped++;
      else issues.push(`Teacher: "${row.scrapedLabel}"`);
      bumpTab('teachers', ok);
    }

    check(resolution.rooms.map((r) => r.scrapedLabel), roomMap, 'Room', 'rooms');
    check(resolution.studyGroups.map((r) => r.scrapedLabel), groupMap, 'Group', 'groups');

    return { mapped, total, issues: issues.slice(0, 12), tabStats };
  }, [resolution, context, targetKind, courseMappingMode, activityMap, professorMap, roomMap, groupMap, subjectMap]);

  const canProceedFromContext = useMemo(() => {
    if (!context.scopeKind) return false;
    if (context.scopeKind === 'singleCourse') return !!context.offeringId;
    if (context.scopeKind === 'multiCourse') return true;
    if (context.scopeKind === 'groupTimetable') {
      if (!context.groupKind) return false;
      if (!context.anchorGroupId) return false;
      if (context.importAllScopedRows) return !!context.offeringId;
      return true;
    }
    return false;
  }, [context]);

  const needsSingleOfferingForApply =
    context.scopeKind === 'singleCourse' ||
    (context.scopeKind === 'groupTimetable' && context.importAllScopedRows);

  const canApply =
    events.length > 0 &&
    mappingProgress.issues.length === 0 &&
    (needsSingleOfferingForApply
      ? !!context.offeringId
      : courseMappingMode
        ? mappedOfferingIds.length > 0
        : !!context.offeringId);

  const activeTabStats = mappingProgress.tabStats[mappingTab];

  return {
    step,
    setStep,
    mappingTab,
    setMappingTab,
    context,
    setContext,
    setScopeKind,
    setGroupKind,
    targetKind,
    resolution,
    resolutionQuery,
    activityMap,
    setActivityMap,
    professorMap,
    setProfessorMap,
    roomMap,
    setRoomMap,
    groupMap,
    setGroupMap,
    subjectMap,
    setSubjectMap,
    mappingsDto,
    mappingProgress,
    activeTabStats,
    canProceedFromContext,
    canApply,
    courseMappingMode,
    mappedOfferingIds,
    needsSingleOfferingForApply,
    isIdMapped,
    isProfessorMapped,
  };
}

export type ImportScheduleWizardModel = ReturnType<typeof useImportScheduleWizard>;
