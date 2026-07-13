import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  CreateEventTypeRequest,
  CreateGroupRequest,
  CreateRoomRequest,
  ScrapedImportMappingsDto,
} from '@/src/api/generatedClient';
import { eventTypesApi, groupsApi, roomsApi, unwrap } from '@/src/api';
import { scrapedScheduleApplyApi } from '@/src/api/scrapedScheduleApplyApi';
import { scrapedScheduleImportApi } from '@/src/api/scrapedScheduleImportApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import type { ScrapedScheduleEvent } from '@/src/screens/admin/web-spider-workspace/utils/schedulePreviewGrouping';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { alertAction, confirmAction } from '@/src/utils/confirmAction';
import { formatGroupLabel } from '../utils/importScheduleScope';
import type { TimetablesWorkspaceModel } from '../hooks/useTimetablesWorkspace';
import {
  CREATE_MAPPING_OPTION,
  mergeMappingPickerOptions,
  useImportScheduleMappingCatalogs,
} from '../hooks/useImportScheduleMappingCatalogs';
import {
  ImportScheduleCreateEntitySheet,
  type CreateEntityKind,
} from './ImportScheduleCreateEntitySheet';

type Props = {
  model: TimetablesWorkspaceModel;
  events: ScrapedScheduleEvent[];
  studyGroupLabel: string | null;
};

type PickerKind = 'offering' | 'activity' | 'professor' | 'room' | 'group' | 'subject';

type PickerState = {
  kind: PickerKind;
  label: string;
} | null;

type CreateState = {
  kind: CreateEntityKind;
  scrapedLabel: string;
  mapKind: PickerKind;
} | null;

function initLabelMap<T extends { scrapedLabel: string; suggestedTargetId?: string | null }>(
  rows: T[],
): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const row of rows) out[row.scrapedLabel] = row.suggestedTargetId ?? null;
  return out;
}

function initGroupMap(
  rows: { scrapedLabel: string; suggestedGroupId?: string | null }[],
): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const row of rows) out[row.scrapedLabel] = row.suggestedGroupId ?? null;
  return out;
}

function groupTypeLabel(type?: string | null) {
  if (!type) return null;
  const map: Record<string, string> = {
    program: 'Program',
    series: 'Series / year',
    group: 'Group',
    subgroup: 'Subgroup',
  };
  return map[type.toLowerCase()] ?? type;
}

function MappingSection({
  colors,
  title,
  subtitle,
  expanded,
  onToggle,
  children,
}: {
  colors: { primary: string; text: string; subtle: string; background: string };
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <ClayView depth={1} color={colors.background} style={{ borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
      <PressClay onPress={onToggle}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
              {title.toUpperCase()}
            </AppText>
            {subtitle ? (
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4, lineHeight: 16 }}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          <Icon name={expanded ? 'expand-less' : 'expand-more'} size={22} color={colors.subtle} />
        </View>
      </PressClay>
      {expanded ? <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>{children}</View> : null}
    </ClayView>
  );
}

function MappingRow({
  colors,
  scrapedLabel,
  eventCount,
  selectedLabel,
  hint,
  onPress,
}: {
  colors: { background: string; text: string; subtle: string; primary: string };
  scrapedLabel: string;
  eventCount: number;
  selectedLabel: string;
  hint?: string | null;
  onPress: () => void;
}) {
  return (
    <PressClay onPress={onPress}>
      <ClayView depth={1} color={colors.background} style={{ borderRadius: 10, padding: 10, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <AppText variant="body" weight="bold" style={{ color: colors.text, flex: 1 }}>
            {scrapedLabel}
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle }}>
            {eventCount}×
          </AppText>
        </View>
        <AppText variant="caption" style={{ color: colors.primary, marginTop: 4 }}>
          → {selectedLabel}
        </AppText>
        {hint ? (
          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }}>
            {hint}
          </AppText>
        ) : null}
      </ClayView>
    </PressClay>
  );
}

export function ImportScheduleApplyPanel({ model, events, studyGroupLabel }: Props) {
  const { colors, periodId } = model;
  const catalogs = useImportScheduleMappingCatalogs(model);
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null);
  const [importAllScopedRows, setImportAllScopedRows] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [previewSummary, setPreviewSummary] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerState>(null);
  const [createState, setCreateState] = useState<CreateState>(null);
  const [createBusy, setCreateBusy] = useState(false);

  const [expanded, setExpanded] = useState({
    activities: false,
    professors: false,
    rooms: false,
    groups: false,
    subjects: false,
  });

  const [activityMap, setActivityMap] = useState<Record<string, string | null>>({});
  const [professorMap, setProfessorMap] = useState<Record<string, string | null>>({});
  const [roomMap, setRoomMap] = useState<Record<string, string | null>>({});
  const [groupMap, setGroupMap] = useState<Record<string, string | null>>({});
  const [subjectMap, setSubjectMap] = useState<Record<string, string | null>>({});

  const resolutionQuery = useQuery({
    queryKey: ['scraped-import-resolution', orgId, periodId, selectedOfferingId, events.length, studyGroupLabel],
    queryFn: () =>
      scrapedScheduleImportApi.resolve({
        periodId: periodId!,
        events,
        studyGroupLabel,
        selectedOfferingId,
      }),
    enabled: !!periodId && events.length > 0,
    retry: false,
    staleTime: 30_000,
  });

  const resolution = resolutionQuery.data;

  useEffect(() => {
    if (!resolution) return;
    setActivityMap(initLabelMap(resolution.activityTypes));
    setProfessorMap(initLabelMap(resolution.professors));
    setRoomMap(initLabelMap(resolution.rooms));
    setGroupMap(initGroupMap(resolution.studyGroups));
    setSubjectMap(initLabelMap(resolution.subjects));
    if (resolution.recommendSingleOfferingImport) setImportAllScopedRows(true);
  }, [resolutionQuery.dataUpdatedAt, resolution]);

  useEffect(() => {
    if (resolution?.suggestedOfferingId && !selectedOfferingId) {
      setSelectedOfferingId(resolution.suggestedOfferingId);
    }
  }, [resolution?.suggestedOfferingId, selectedOfferingId]);

  const selectedOffering = catalogs.offeringOptions.find((o) => o.value === selectedOfferingId);

  const labelFromCatalog = useCallback(
    (options: { value: string; label: string }[], id: string | null | undefined, fallback?: string | null) => {
      if (!id) return fallback ?? 'Not mapped — tap to choose';
      return options.find((o) => o.value === id)?.label ?? fallback ?? 'Mapped';
    },
    [],
  );

  const buildMappings = useCallback((): ScrapedImportMappingsDto => {
    return new ScrapedImportMappingsDto({
      activityTypeToEventTypeId: activityMap,
      professorToHostId: professorMap,
      roomToRoomId: roomMap,
      studyGroupToGroupId: groupMap,
      subjectToOfferingId: subjectMap,
    });
  }, [activityMap, professorMap, roomMap, groupMap, subjectMap]);

  const applyPayload = useCallback(() => {
    if (!periodId || !selectedOfferingId) throw new Error('Pick a course offering.');
    return {
      periodId,
      offeringId: selectedOfferingId,
      events,
      studyGroupLabel,
      replaceExistingSessions: replaceExisting,
      importAllScopedRows,
      implicitCourseName: resolution?.implicitCourseName ?? selectedOffering?.label ?? null,
      mappings: buildMappings(),
    };
  }, [
    periodId,
    selectedOfferingId,
    events,
    studyGroupLabel,
    replaceExisting,
    importAllScopedRows,
    resolution?.implicitCourseName,
    selectedOffering?.label,
    buildMappings,
  ]);

  const previewMutation = useMutation({
    mutationFn: () => scrapedScheduleApplyApi.previewApply(applyPayload()),
    onSuccess: (result) => {
      setPreviewSummary(
        `${result.matchedEventCount} row(s) matched · ${result.proposedSessions.length} activity slot(s) proposed · ${result.skipped.length} skipped`,
      );
    },
    onError: (e: Error) => alertAction({ title: 'Preview failed', message: e.message }),
  });

  const applyMutation = useMutation({
    mutationFn: () => scrapedScheduleApplyApi.apply(applyPayload()),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.offerings(orgId, periodId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.offeringPackages(orgId) });
      alertAction({
        title: 'Pattern updated',
        message: `${result.resultSessionCount} activity slot(s) saved on "${selectedOffering?.label}". Open Build & publish to review, then publish to Schedule.`,
      });
      setPreviewSummary(null);
    },
    onError: (e: Error) => alertAction({ title: 'Apply failed', message: e.message }),
  });

  const handleApply = () => {
    if (!selectedOfferingId || events.length === 0) return;
    confirmAction({
      title: replaceExisting ? 'Replace weekly pattern?' : 'Append to weekly pattern?',
      message: replaceExisting
        ? 'This replaces the existing activity pattern on the offering. You can edit on Build & publish before publishing to Schedule.'
        : 'New activities will be appended to the existing pattern.',
      destructive: replaceExisting,
      confirmText: replaceExisting ? 'Replace' : 'Append',
      onConfirm: () => applyMutation.mutate(),
    });
  };

  const suggestionsFor = useCallback(
    (kind: PickerKind, label: string) => {
      if (!resolution) return [];
      if (kind === 'activity') return resolution.activityTypes.find((r) => r.scrapedLabel === label)?.suggestions ?? [];
      if (kind === 'professor') return resolution.professors.find((r) => r.scrapedLabel === label)?.suggestions ?? [];
      if (kind === 'room') return resolution.rooms.find((r) => r.scrapedLabel === label)?.suggestions ?? [];
      if (kind === 'group') return resolution.studyGroups.find((r) => r.scrapedLabel === label)?.suggestions ?? [];
      if (kind === 'subject') return resolution.subjects.find((r) => r.scrapedLabel === label)?.suggestions ?? [];
      return [];
    },
    [resolution],
  );

  const pickerOptions = useMemo(() => {
    if (!picker) return [];
    const suggestions = suggestionsFor(picker.kind, picker.label);

    if (picker.kind === 'offering' || picker.kind === 'subject') {
      return mergeMappingPickerOptions(catalogs.offeringOptions, suggestions);
    }
    if (picker.kind === 'activity') {
      return mergeMappingPickerOptions(
        catalogs.eventTypeOptions,
        suggestions,
        `Create event type for "${picker.label}"…`,
      );
    }
    if (picker.kind === 'professor') {
      return mergeMappingPickerOptions(catalogs.hostOptions, suggestions);
    }
    if (picker.kind === 'room') {
      return mergeMappingPickerOptions(catalogs.roomOptions, suggestions, `Create room "${picker.label}"…`);
    }
    return mergeMappingPickerOptions(
      catalogs.groupOptions,
      suggestions,
      `Create group "${picker.label}"…`,
    );
  }, [picker, catalogs, suggestionsFor]);

  const pickerSelected = useMemo(() => {
    if (!picker) return null;
    if (picker.kind === 'offering') return selectedOfferingId;
    if (picker.kind === 'subject') return subjectMap[picker.label] ?? null;
    if (picker.kind === 'activity') return activityMap[picker.label] ?? null;
    if (picker.kind === 'professor') return professorMap[picker.label] ?? null;
    if (picker.kind === 'room') return roomMap[picker.label] ?? null;
    return groupMap[picker.label] ?? null;
  }, [picker, selectedOfferingId, subjectMap, activityMap, professorMap, roomMap, groupMap]);

  const setMapForKind = (kind: PickerKind, label: string, value: string | null) => {
    setPreviewSummary(null);
    if (kind === 'offering') setSelectedOfferingId(value);
    else if (kind === 'subject') setSubjectMap((m) => ({ ...m, [label]: value }));
    else if (kind === 'activity') setActivityMap((m) => ({ ...m, [label]: value }));
    else if (kind === 'professor') setProfessorMap((m) => ({ ...m, [label]: value }));
    else if (kind === 'room') setRoomMap((m) => ({ ...m, [label]: value }));
    else setGroupMap((m) => ({ ...m, [label]: value }));
  };

  const handlePickerSelect = (value: string | null) => {
    if (!picker) return;
    if (value === CREATE_MAPPING_OPTION) {
      const kind: CreateEntityKind =
        picker.kind === 'activity' ? 'eventType' : picker.kind === 'room' ? 'room' : 'group';
      setCreateState({ kind, scrapedLabel: picker.label, mapKind: picker.kind });
      setPicker(null);
      return;
    }
    setMapForKind(picker.kind, picker.label, value);
    setPicker(null);
  };

  const handleCreateEntity = async (payload: {
    kind: CreateEntityKind;
    name: string;
    groupType?: string;
    parentGroupId?: string | null;
  }) => {
    if (!createState) return;
    setCreateBusy(true);
    try {
      let newId: string | undefined;
      if (payload.kind === 'eventType') {
        const created = await unwrap(
          eventTypesApi.create(new CreateEventTypeRequest({ name: payload.name, colorHex: '#3b82f6' })),
        );
        newId = created.id ?? undefined;
        await catalogs.refetchEventTypes();
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.eventTypes(orgId) });
      } else if (payload.kind === 'group') {
        const created = await unwrap(
          groupsApi.createGroup(
            new CreateGroupRequest({
              name: payload.name,
              type: payload.groupType ?? 'group',
              parentGroupId: payload.parentGroupId ?? undefined,
            }),
          ),
        );
        newId = created.id ?? undefined;
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups.tree(orgId) });
      } else {
        const created = await unwrap(roomsApi.create(new CreateRoomRequest({ name: payload.name })));
        newId = created.id ?? undefined;
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.rooms(orgId, 'timetable-picker') });
      }

      if (!newId) throw new Error('Created entity did not return an id.');
      setMapForKind(createState.mapKind, createState.scrapedLabel, newId);
      setCreateState(null);
    } catch (e) {
      alertAction({
        title: 'Could not create',
        message: e instanceof Error ? e.message : 'Request failed.',
      });
    } finally {
      setCreateBusy(false);
    }
  };

  const defaultGroupTypeForLabel =
    createState?.kind === 'group'
      ? resolution?.studyGroups.find((g) => g.scrapedLabel === createState.scrapedLabel)?.suggestedGroupType
      : null;

  if (!periodId) {
    return (
      <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: 6 }}>
          APPLY TO NATIVE TIMETABLE
        </AppText>
        <AppText variant="body" style={{ color: colors.subtle }}>
          Select a reporting period on the View tab scope before applying scraped sessions to a course offering.
        </AppText>
      </ClayView>
    );
  }

  if (events.length === 0) {
    return (
      <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: 6 }}>
          APPLY TO NATIVE TIMETABLE
        </AppText>
        <AppText variant="body" style={{ color: colors.subtle }}>
          Enable at least one session in the list above to map fields and apply.
        </AppText>
      </ClayView>
    );
  }

  return (
    <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: 6 }}>
        MAP & APPLY
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18, marginBottom: 10 }}>
        Match scraped labels to Omada — e.g. Curs → Lecture, 934 → Group, professor → host. You can pick any org record
        or create a new event type, group, or room. Only enabled sessions above are included.
        {studyGroupLabel ? ` Scope: ${formatGroupLabel(studyGroupLabel)}.` : ''}
      </AppText>

      {resolutionQuery.isLoading ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
          Building mapping suggestions…
        </AppText>
      ) : null}

      {resolutionQuery.isError ? (
        <ClayView depth={1} color={colors.background} style={{ borderRadius: 10, padding: 10, marginBottom: 10 }}>
          <AppText variant="caption" style={{ color: colors.text, lineHeight: 18 }}>
            Could not load suggestions. You can still map manually using the sections below.
          </AppText>
        </ClayView>
      ) : null}

      {resolution ? (
        <ClayView depth={1} color={colors.background} style={{ borderRadius: 10, padding: 10, marginBottom: 12 }}>
          <AppText variant="caption" style={{ color: colors.text, lineHeight: 18 }}>
            {resolution.scopeSummary}
          </AppText>
          {resolution.implicitCourseName ? (
            <AppText variant="caption" style={{ color: colors.primary, marginTop: 6 }}>
              Course from page: {resolution.implicitCourseName}
            </AppText>
          ) : null}
        </ClayView>
      ) : null}

      <PressClay onPress={() => setPicker({ kind: 'offering', label: '' })}>
        <ClayView depth={1} color={colors.background} style={{ borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
            Target course offering
          </AppText>
          <AppText variant="body" weight="bold" style={{ color: colors.text }}>
            {selectedOffering?.label ?? 'Select course…'}
          </AppText>
        </ClayView>
      </PressClay>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <AppButton
          title={importAllScopedRows ? 'All rows → this offering' : 'Match by course name'}
          variant="outline"
          size="sm"
          onPress={() => {
            setImportAllScopedRows((v) => !v);
            setPreviewSummary(null);
          }}
        />
        <AppButton
          title={replaceExisting ? 'Mode: Replace pattern' : 'Mode: Append'}
          variant="outline"
          size="sm"
          onPress={() => setReplaceExisting((v) => !v)}
        />
      </View>

      {(resolution?.activityTypes.length ?? 0) > 0 ? (
        <MappingSection
          colors={colors}
          title="Activity → Event type"
          subtitle='Map "Curs", "Laborator", etc. to your org types — or create a new type.'
          expanded={expanded.activities}
          onToggle={() => setExpanded((e) => ({ ...e, activities: !e.activities }))}
        >
          {resolution!.activityTypes.map((row) => (
            <MappingRow
              key={row.scrapedLabel}
              colors={colors}
              scrapedLabel={row.scrapedLabel}
              eventCount={row.eventCount}
              selectedLabel={labelFromCatalog(
                catalogs.eventTypeOptions,
                activityMap[row.scrapedLabel],
                row.suggestedTargetLabel,
              )}
              hint={row.confidence >= 0.7 ? 'Suggested match' : 'Tap to pick or create'}
              onPress={() => setPicker({ kind: 'activity', label: row.scrapedLabel })}
            />
          ))}
        </MappingSection>
      ) : null}

      {(resolution?.professors.length ?? 0) > 0 ? (
        <MappingSection
          colors={colors}
          title="Teacher → Host"
          subtitle="Link scraped names to members who host sessions."
          expanded={expanded.professors}
          onToggle={() => setExpanded((e) => ({ ...e, professors: !e.professors }))}
        >
          {resolution!.professors.map((row) => (
            <MappingRow
              key={row.scrapedLabel}
              colors={colors}
              scrapedLabel={row.scrapedLabel}
              eventCount={row.eventCount}
              selectedLabel={labelFromCatalog(
                catalogs.hostOptions,
                professorMap[row.scrapedLabel],
                row.suggestedTargetLabel,
              )}
              hint="Pick a member or leave unmapped"
              onPress={() => setPicker({ kind: 'professor', label: row.scrapedLabel })}
            />
          ))}
        </MappingSection>
      ) : null}

      {(resolution?.rooms.length ?? 0) > 0 ? (
        <MappingSection
          colors={colors}
          title="Room"
          subtitle="Map room codes — or create a new room."
          expanded={expanded.rooms}
          onToggle={() => setExpanded((e) => ({ ...e, rooms: !e.rooms }))}
        >
          {resolution!.rooms.map((row) => (
            <MappingRow
              key={row.scrapedLabel}
              colors={colors}
              scrapedLabel={row.scrapedLabel}
              eventCount={row.eventCount}
              selectedLabel={labelFromCatalog(
                catalogs.roomOptions,
                roomMap[row.scrapedLabel],
                row.suggestedTargetLabel,
              )}
              hint="Pick a room or create new"
              onPress={() => setPicker({ kind: 'room', label: row.scrapedLabel })}
            />
          ))}
        </MappingSection>
      ) : null}

      {(resolution?.studyGroups.length ?? 0) > 0 ? (
        <MappingSection
          colors={colors}
          title="Group → Program / series / group / subgroup"
          subtitle="Choose the Omada group for cohort delivery — or create with the right type."
          expanded={expanded.groups}
          onToggle={() => setExpanded((e) => ({ ...e, groups: !e.groups }))}
        >
          {resolution!.studyGroups.map((row) => {
            const mappedId = groupMap[row.scrapedLabel];
            const mappedType = mappedId ? model.groupTypeById.get(mappedId) : row.suggestedGroupType;
            return (
              <MappingRow
                key={row.scrapedLabel}
                colors={colors}
                scrapedLabel={row.scrapedLabel}
                eventCount={row.eventCount}
                selectedLabel={labelFromCatalog(
                  catalogs.groupOptions,
                  mappedId,
                  row.suggestedGroupLabel,
                )}
                hint={groupTypeLabel(mappedType) ?? 'Tap to pick type via group or create new'}
                onPress={() => setPicker({ kind: 'group', label: row.scrapedLabel })}
              />
            );
          })}
        </MappingSection>
      ) : null}

      {resolution && !importAllScopedRows && resolution.subjects.length > 1 ? (
        <MappingSection
          colors={colors}
          title="Course → Offering"
          subtitle="For multi-course imports, map each scraped subject to a term offering."
          expanded={expanded.subjects}
          onToggle={() => setExpanded((e) => ({ ...e, subjects: !e.subjects }))}
        >
          {resolution.subjects.map((row) => (
            <MappingRow
              key={row.scrapedLabel}
              colors={colors}
              scrapedLabel={row.scrapedLabel}
              eventCount={row.eventCount}
              selectedLabel={labelFromCatalog(
                catalogs.offeringOptions,
                subjectMap[row.scrapedLabel],
                row.suggestedTargetLabel,
              )}
              hint="Suggested offering when names match"
              onPress={() => setPicker({ kind: 'subject', label: row.scrapedLabel })}
            />
          ))}
        </MappingSection>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
        <AppButton
          title={previewMutation.isPending ? 'Previewing…' : 'Preview apply'}
          variant="outline"
          size="sm"
          onPress={() => previewMutation.mutate()}
          disabled={!selectedOfferingId || previewMutation.isPending || applyMutation.isPending}
        />
        <AppButton
          title={applyMutation.isPending ? 'Applying…' : 'Apply to offering'}
          size="sm"
          onPress={handleApply}
          disabled={!selectedOfferingId || previewMutation.isPending || applyMutation.isPending}
        />
      </View>

      {previewSummary ? (
        <AppText variant="caption" style={{ color: colors.text, lineHeight: 18, marginTop: 10 }}>
          {previewSummary}
        </AppText>
      ) : null}

      <SearchableOptionPickerSheet
        isVisible={!!picker}
        onClose={() => setPicker(null)}
        title={
          picker?.kind === 'offering'
            ? 'Course offering'
            : picker?.kind === 'activity'
              ? 'Event type'
              : picker?.kind === 'professor'
                ? 'Host (member)'
                : picker?.kind === 'room'
                  ? 'Room'
                  : picker?.kind === 'group'
                    ? 'Omada group'
                    : 'Offering'
        }
        options={pickerOptions}
        selected={pickerSelected}
        onSelect={handlePickerSelect}
        includeAllOption={picker?.kind !== 'offering'}
        allLabel="Not mapped"
        searchPlaceholder="Search org records…"
      />

      <ImportScheduleCreateEntitySheet
        visible={!!createState}
        kind={createState?.kind ?? null}
        defaultName={createState?.scrapedLabel ?? ''}
        defaultGroupType={defaultGroupTypeForLabel}
        parentGroupOptions={catalogs.groupOptions}
        onClose={() => setCreateState(null)}
        onConfirm={handleCreateEntity}
        busy={createBusy}
      />
    </ClayView>
  );
}
