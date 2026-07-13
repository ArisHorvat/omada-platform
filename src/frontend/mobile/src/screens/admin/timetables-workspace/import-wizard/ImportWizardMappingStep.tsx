import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import {
  CreateEventTypeRequest,
  CreateGroupRequest,
  CreateRoomRequest,
} from '@/src/api/generatedClient';
import { eventTypesApi, groupsApi, roomsApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { AppButton, AppText, ClayView } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { alertAction } from '@/src/utils/confirmAction';
import type { TimetablesWorkspaceModel } from '../hooks/useTimetablesWorkspace';
import {
  mergeMappingPickerOptions,
  SAVED_PENDING_HOST_PREFIX,
  useImportScheduleMappingCatalogs,
} from '../hooks/useImportScheduleMappingCatalogs';
import {
  ImportScheduleCreateEntitySheet,
  type CreateEntityKind,
} from '../components/ImportScheduleCreateEntitySheet';
import { ImportScheduleCreateOfferingSheet } from '../components/ImportScheduleCreateOfferingSheet';
import { EventTypeMappingBadge } from './EventTypeMappingBadge';
import { ImportWizardHostSheet } from './ImportWizardHostSheet';
import { ImportWizardSelectField } from './ImportWizardSelectField';
import type { ImportScheduleWizardModel } from './useImportScheduleWizard';
import { mappingTabLabel, type ImportMappingTab } from './importWizardTypes';
import { importWizardSheetHeight } from './importWizardSheetLayout';
import {
  createImportOfferingViaPackage,
  type CreateImportOfferingInput,
} from './importOfferingViaPackage';
import { buildSeedPackageActivitiesFromActivityMap } from './buildSeedPackageActivities';


type Props = {

  model: TimetablesWorkspaceModel;

  wizard: ImportScheduleWizardModel;

  onBack: () => void;

  onNext: () => void;

};



type PickerState = { tab: ImportMappingTab; label: string } | null;

type CreateState = { kind: CreateEntityKind; label: string; tab: ImportMappingTab } | null;



function MappingRow({

  colors,

  scrapedLabel,

  count,

  onPress,

  children,

  hint,

}: {

  colors: { background: string; text: string; subtle: string; primary: string };

  scrapedLabel: string;

  count: number;

  onPress: () => void;

  children: React.ReactNode;

  hint?: string;

}) {

  return (

    <PressClay onPress={onPress}>

      <ClayView depth={1} color={colors.background} style={{ borderRadius: 10, padding: 10, marginBottom: 8 }}>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>

          <AppText variant="body" weight="bold" style={{ color: colors.text, flex: 1 }}>

            {scrapedLabel}

          </AppText>

          <AppText variant="caption" style={{ color: colors.subtle }}>

            {count}×

          </AppText>

        </View>

        <View style={{ marginTop: 8 }}>{children}</View>

        {hint ? (

          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6 }}>

            {hint}

          </AppText>

        ) : null}

      </ClayView>

    </PressClay>

  );

}



export function ImportWizardMappingStep({ model, wizard, onBack, onNext }: Props) {
  const { colors, periodId } = model;
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const catalogs = useImportScheduleMappingCatalogs(model);
  const {

    resolution,

    mappingTab,

    setMappingTab,

    targetKind,

    courseMappingMode,

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

    mappingProgress,
    activeTabStats,
  } = wizard;



  const [picker, setPicker] = useState<PickerState>(null);
  const [sectionPickerOpen, setSectionPickerOpen] = useState(false);
  const [createState, setCreateState] = useState<CreateState>(null);
  const [createOfferingLabel, setCreateOfferingLabel] = useState<string | null>(null);
  const [hostSheet, setHostSheet] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);



  const tabs = useMemo((): ImportMappingTab[] => {

    const base: ImportMappingTab[] = ['eventTypes', 'teachers', 'rooms', 'groups'];

    if (courseMappingMode) return ['course', ...base];

    return base;

  }, [courseMappingMode]);

  useEffect(() => {
    if (!tabs.includes(mappingTab)) setMappingTab(tabs[0] ?? 'eventTypes');
  }, [tabs, mappingTab, setMappingTab]);

  const programOptions = useMemo(
    () => catalogs.filterGroupsByKind('program'),
    [catalogs],
  );

  const labelFromCatalog = (
    options: { value: string; label: string }[],
    id: string | null | undefined,
  ) => {
    if (!id?.trim()) return null;
    return options.find((o) => o.value === id)?.label ?? 'Mapped record';
  };

  const sectionPickerValue = useMemo(() => {
    const stat = activeTabStats ?? mappingProgress.tabStats[mappingTab];
    const unmapped = stat?.unmapped ?? 0;
    const total = stat?.total ?? 0;
    if (total === 0) return mappingTabLabel(mappingTab);
    if (unmapped === 0) return `${mappingTabLabel(mappingTab)} · all mapped`;
    return `${mappingTabLabel(mappingTab)} · ${unmapped} remaining`;
  }, [mappingTab, activeTabStats, mappingProgress.tabStats]);

  const sectionPickerOptions = useMemo(
    () =>
      tabs.map((tab) => {
        const stat = mappingProgress.tabStats[tab];
        const unmapped = stat?.unmapped ?? 0;
        const total = stat?.total ?? 0;
        return {
          value: tab,
          label: mappingTabLabel(tab),
          subtitle:
            total === 0
              ? 'No items in this scrape'
              : unmapped === 0
                ? `${total} mapped`
                : `${unmapped} remaining · ${stat?.mapped ?? 0}/${total} mapped`,
        };
      }),
    [tabs, mappingProgress.tabStats],
  );



  const hostLabel = (scraped: string) => {

    const v = professorMap[scraped];

    if (!v || v.mode === 'unmapped') return 'Tap to map…';

    if (v.mode === 'pendingName') return `${v.displayName ?? scraped} (pending)`;

    return labelFromCatalog(catalogs.hostLookupOptions, v.userId, scraped);

  };

  const scrapedProfessors = useMemo(
    () => (resolution?.professors ?? []).filter((r) => (r.eventCount ?? 0) > 0),
    [resolution?.professors],
  );



  const suggestionsFor = (tab: ImportMappingTab, label: string) => {

    if (!resolution) return [];

    if (tab === 'eventTypes') return resolution.activityTypes.find((r) => r.scrapedLabel === label)?.suggestions ?? [];

    if (tab === 'teachers') return resolution.professors.find((r) => r.scrapedLabel === label)?.suggestions ?? [];

    if (tab === 'rooms') return resolution.rooms.find((r) => r.scrapedLabel === label)?.suggestions ?? [];

    if (tab === 'groups') return resolution.studyGroups.find((r) => r.scrapedLabel === label)?.suggestions ?? [];

    if (tab === 'course') return resolution.subjects.find((r) => r.scrapedLabel === label)?.suggestions ?? [];

    return [];

  };



  const pickerOptions = useMemo(() => {
    if (!picker) return [];

    const suggestions = suggestionsFor(picker.tab, picker.label);

    if (picker.tab === 'course') {
      return mergeMappingPickerOptions(catalogs.offeringOptions, suggestions);
    }

    if (picker.tab === 'eventTypes') {
      return mergeMappingPickerOptions(catalogs.eventTypeOptions, suggestions);
    }

    if (picker.tab === 'teachers') {
      const base = mergeMappingPickerOptions(catalogs.hostOptions, suggestions);
      const seen = new Set(base.map((o) => o.value));
      const extras = catalogs.unmappedHostOptions.filter((o) => !seen.has(o.value));
      return [...base, ...extras];
    }

    if (picker.tab === 'rooms') {
      return mergeMappingPickerOptions(catalogs.roomOptions, suggestions);
    }

    return mergeMappingPickerOptions(catalogs.groupOptions, suggestions);
  }, [picker, catalogs, resolution]);

  const pickerCreateAction = useMemo(() => {
    if (!picker) return undefined;

    const closeAnd =
      (fn: () => void) =>
      () => {
        fn();
        setPicker(null);
      };

    if (picker.tab === 'course') {
      return {
        label: 'Add course',
        onPress: closeAnd(() => setCreateOfferingLabel(picker.label)),
      };
    }
    if (picker.tab === 'eventTypes') {
      return {
        label: 'New type',
        onPress: closeAnd(() => setCreateState({ kind: 'eventType', label: picker.label, tab: picker.tab })),
      };
    }
    if (picker.tab === 'rooms') {
      return {
        label: 'New room',
        onPress: closeAnd(() => setCreateState({ kind: 'room', label: picker.label, tab: picker.tab })),
      };
    }
    if (picker.tab === 'groups') {
      return {
        label: 'New group',
        onPress: closeAnd(() => setCreateState({ kind: 'group', label: picker.label, tab: picker.tab })),
      };
    }
    return undefined;
  }, [picker]);

  const pickerHeaderActions = useMemo(() => {
    if (!picker || picker.tab !== 'teachers') return undefined;
    const scrapedLabel = picker.label;
    return [
      {
        label: 'Use name only (pending)',
        onPress: () => {
          setProfessorMap((m) => ({
            ...m,
            [scrapedLabel]: { mode: 'pendingName', displayName: scrapedLabel },
          }));
          setPicker(null);
        },
      },
      {
        label: 'Invite by email…',
        onPress: () => {
          setHostSheet(scrapedLabel);
          setPicker(null);
        },
      },
    ];
  }, [picker, setProfessorMap]);

  const pickerSelected = useMemo(() => {

    if (!picker) return null;

    if (picker.tab === 'eventTypes') return activityMap[picker.label] ?? null;

    if (picker.tab === 'teachers') {

      const v = professorMap[picker.label];

      return v?.mode === 'member' ? (v.userId ?? null) : null;

    }

    if (picker.tab === 'rooms') return roomMap[picker.label] ?? null;

    if (picker.tab === 'groups') return groupMap[picker.label] ?? null;

    if (picker.tab === 'course') return subjectMap[picker.label] ?? null;

    return null;

  }, [picker, activityMap, professorMap, roomMap, groupMap, subjectMap]);



  const handlePickerSelect = (value: string | null) => {
    if (!picker) return;

    if (picker.tab === 'teachers') {
      if (!value) {
        setProfessorMap((m) => ({ ...m, [picker.label]: { mode: 'unmapped' } }));
        setPicker(null);
        return;
      }

      if (value.startsWith(SAVED_PENDING_HOST_PREFIX)) {
        const saved = catalogs.unmappedHostOptions.find((o) => o.value === value);
        setProfessorMap((m) => ({
          ...m,
          [picker.label]: {
            mode: 'pendingName',
            displayName: saved?.label ?? picker.label,
          },
        }));
        setPicker(null);
        return;
      }

      setProfessorMap((m) => ({ ...m, [picker.label]: { mode: 'member', userId: value } }));
      setPicker(null);
      return;
    }

    if (picker.tab === 'eventTypes') setActivityMap((m) => ({ ...m, [picker.label]: value }));
    else if (picker.tab === 'rooms') setRoomMap((m) => ({ ...m, [picker.label]: value }));
    else if (picker.tab === 'groups') setGroupMap((m) => ({ ...m, [picker.label]: value }));
    else if (picker.tab === 'course') setSubjectMap((m) => ({ ...m, [picker.label]: value }));

    setPicker(null);

  };



  const handleCreateOffering = async (payload: CreateImportOfferingInput) => {
    if (!createOfferingLabel || !periodId) return;
    setCreateBusy(true);
    try {
      const seedWeeklySessions = buildSeedPackageActivitiesFromActivityMap(
        activityMap,
        resolution?.activityTypes ?? [],
        catalogs.eventTypeOptions,
      );
      const newId = await createImportOfferingViaPackage({
        ...payload,
        seedWeeklySessions,
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.offerings(orgId, periodId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.offeringPackages(orgId) });
      setSubjectMap((m) => ({ ...m, [createOfferingLabel]: newId }));
      setCreateOfferingLabel(null);
    } catch (e) {
      alertAction({
        title: 'Could not add course',
        message: e instanceof Error ? e.message : 'Request failed.',
      });
    } finally {
      setCreateBusy(false);
    }
  };

  const handleCreateEntity = async (payload: {

    kind: CreateEntityKind;

    name: string;

    colorHex?: string;

    groupType?: string;

    parentGroupId?: string | null;

    capacity?: number;

    isBookable?: boolean;

  }) => {

    if (!createState) return;

    setCreateBusy(true);

    try {

      let newId: string | undefined;

      if (payload.kind === 'eventType') {

        const created = await unwrap(

          eventTypesApi.create(

            new CreateEventTypeRequest({

              name: payload.name,

              colorHex: payload.colorHex ?? '#3b82f6',

            }),

          ),

        );

        newId = created.id ?? undefined;

        await catalogs.refetchEventTypes();

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

        await catalogs.refetchGroups();

      } else {

        const created = await unwrap(

          roomsApi.create(

            new CreateRoomRequest({

              name: payload.name,

              capacity: payload.capacity ?? 30,

              isBookable: payload.isBookable ?? true,

            }),

          ),

        );

        newId = created.id ?? undefined;

        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.orgAdmin.rooms(orgId, 'timetable-picker'),
        });
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.orgAdmin.rooms(orgId, 'unassigned'),
        });

      }

      if (!newId) throw new Error('No id returned');
      if (createState.tab === 'eventTypes') setActivityMap((m) => ({ ...m, [createState.label]: newId! }));
      else if (createState.tab === 'rooms') setRoomMap((m) => ({ ...m, [createState.label]: newId! }));
      else if (createState.tab === 'groups') setGroupMap((m) => ({ ...m, [createState.label]: newId! }));

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



  if (!resolution) {

    return <AppText variant="body" style={{ color: colors.subtle }}>Loading mapping suggestions…</AppText>;

  }



  const renderEventTypeTarget = (scrapedLabel: string) => {

    const id = activityMap[scrapedLabel];

    const row = resolution.activityTypes.find((r) => r.scrapedLabel === scrapedLabel);

    if (!id) {

      return (

        <AppText variant="caption" style={{ color: colors.subtle }}>

          Tap to map…

        </AppText>

      );

    }

    const et = catalogs.getEventType(id);

    return (

      <EventTypeMappingBadge

        name={et?.name ?? row?.suggestedTargetLabel ?? scrapedLabel}

        colorHex={et?.color}

      />

    );

  };



  return (

    <View>

      <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18, marginBottom: 10 }}>

        Map scraped labels to Omada records or create new ones. Day, time, and frequency are applied automatically.

      </AppText>



      <ImportWizardSelectField
        label="Map labels section"
        value={sectionPickerValue}
        placeholder="Choose section…"
        hint="Switch between courses, event types, teachers, rooms, and groups."
        colors={colors}
        onPress={() => setSectionPickerOpen(true)}
      />



      {mappingTab === 'course' && courseMappingMode

        ? resolution.subjects.length > 0

          ? resolution.subjects.map((row) => (

              <MappingRow

                key={row.scrapedLabel}

                colors={colors}

                scrapedLabel={row.scrapedLabel}

                count={row.eventCount}

                onPress={() => setPicker({ tab: 'course', label: row.scrapedLabel })}

              >

                {(() => {
                  const mapped = labelFromCatalog(catalogs.offeringOptions, subjectMap[row.scrapedLabel]);
                  return mapped ? (
                    <AppText variant="caption" style={{ color: colors.primary }}>
                      → {mapped}
                    </AppText>
                  ) : (
                    <AppText variant="caption" style={{ color: colors.subtle }}>
                      Tap to map…
                    </AppText>
                  );
                })()}

              </MappingRow>

            ))

          : (

            <AppText variant="body" style={{ color: colors.subtle, marginBottom: 12 }}>

              No distinct course names found in this scrape. Switch import type to One course or Group timetable.

            </AppText>

          )

        : null}



      {mappingTab === 'eventTypes'

        ? resolution.activityTypes.map((row) => (

            <MappingRow

              key={row.scrapedLabel}

              colors={colors}

              scrapedLabel={row.scrapedLabel}

              count={row.eventCount}

              hint="e.g. Curs → Lecture"

              onPress={() => setPicker({ tab: 'eventTypes', label: row.scrapedLabel })}

            >

              {renderEventTypeTarget(row.scrapedLabel)}

            </MappingRow>

          ))

        : null}



      {mappingTab === 'teachers'

        ? scrapedProfessors.map((row) => (

            <MappingRow

              key={row.scrapedLabel}

              colors={colors}

              scrapedLabel={row.scrapedLabel}

              count={row.eventCount}

              hint="Pick a member, saved pending name, invite, or use scraped name only"

              onPress={() => setPicker({ tab: 'teachers', label: row.scrapedLabel })}

            >

              <AppText variant="caption" style={{ color: colors.primary }}>

                → {hostLabel(row.scrapedLabel)}

              </AppText>

            </MappingRow>

          ))

        : null}



      {mappingTab === 'rooms'

        ? resolution.rooms.map((row) => (

            <MappingRow

              key={row.scrapedLabel}

              colors={colors}

              scrapedLabel={row.scrapedLabel}

              count={row.eventCount}

              hint="New rooms can stay without a building"

              onPress={() => setPicker({ tab: 'rooms', label: row.scrapedLabel })}

            >

              {(() => {
                const mapped = labelFromCatalog(catalogs.roomOptions, roomMap[row.scrapedLabel]);
                return mapped ? (
                  <AppText variant="caption" style={{ color: colors.primary }}>
                    → {mapped}
                  </AppText>
                ) : (
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    Tap to map…
                  </AppText>
                );
              })()}

            </MappingRow>

          ))

        : null}



      {mappingTab === 'groups'

        ? resolution.studyGroups.map((row) => (

            <MappingRow

              key={row.scrapedLabel}

              colors={colors}

              scrapedLabel={row.scrapedLabel}

              count={row.eventCount}

              hint={row.suggestedGroupType ?? undefined}

              onPress={() => setPicker({ tab: 'groups', label: row.scrapedLabel })}

            >

              {(() => {
                const mapped = labelFromCatalog(catalogs.groupOptions, groupMap[row.scrapedLabel]);
                return mapped ? (
                  <AppText variant="caption" style={{ color: colors.primary }}>
                    → {mapped}
                  </AppText>
                ) : (
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    Tap to map…
                  </AppText>
                );
              })()}

            </MappingRow>

          ))

        : null}



      <ClayView depth={1} color={colors.background} style={{ borderRadius: 10, padding: 10, marginVertical: 12 }}>

        <AppText variant="caption" style={{ color: colors.text }}>

          Progress: {mappingProgress.mapped} / {mappingProgress.total} fields mapped

        </AppText>

      </ClayView>



      <View style={{ flexDirection: 'row', gap: 8 }}>

        <AppButton title="Back" variant="outline" onPress={onBack} />

        <AppButton title="Review" onPress={onNext} style={{ flex: 1 }} />

      </View>



      <SearchableOptionPickerSheet
        isVisible={sectionPickerOpen}
        onClose={() => setSectionPickerOpen(false)}
        title="Map labels section"
        options={sectionPickerOptions}
        selected={mappingTab}
        onSelect={(tab) => {
          if (tab) setMappingTab(tab as ImportMappingTab);
          setSectionPickerOpen(false);
        }}
        includeAllOption={false}
        searchPlaceholder="Search sections…"
        height={importWizardSheetHeight(0.7, 520)}
        zIndexBase={225}
      />

      <SearchableOptionPickerSheet
        isVisible={!!picker}
        onClose={() => setPicker(null)}
        title={picker ? (picker.tab === 'course' ? 'Courses' : picker.tab === 'teachers' ? 'Teachers' : picker.tab) : 'Map'}
        options={pickerOptions}
        selected={pickerSelected}
        onSelect={handlePickerSelect}
        includeAllOption={picker?.tab !== 'course'}
        allLabel="Not mapped"
        searchPlaceholder={picker?.tab === 'teachers' ? 'Search members or saved names…' : 'Search…'}
        height={importWizardSheetHeight()}
        zIndexBase={230}
        createAction={pickerCreateAction}
        headerActions={pickerHeaderActions}
      />

      <ImportScheduleCreateOfferingSheet
        visible={!!createOfferingLabel}
        defaultName={createOfferingLabel ?? ''}
        periodId={periodId}
        programOptions={programOptions}
        onClose={() => setCreateOfferingLabel(null)}
        busy={createBusy}
        onConfirm={handleCreateOffering}
      />

      <ImportScheduleCreateEntitySheet

        visible={!!createState}

        kind={createState?.kind ?? null}

        defaultName={createState?.label ?? ''}

        defaultGroupType={

          createState?.tab === 'groups'

            ? resolution.studyGroups.find((g) => g.scrapedLabel === createState.label)?.suggestedGroupType

            : null

        }

        groupTypeCatalog={catalogs.groupTypeCatalog}

        parentGroupOptions={catalogs.parentGroupPickerOptions}

        typeLabelForKey={(key) => catalogs.typeLabelByKey.get(key.toLowerCase()) ?? key}

        roomUnassignedHint={createState?.kind === 'room'}

        onClose={() => setCreateState(null)}

        busy={createBusy}

        onConfirm={handleCreateEntity}

      />



      <ImportWizardHostSheet

        visible={!!hostSheet}

        scrapedName={hostSheet ?? ''}

        inviteableRoles={catalogs.inviteableRoles}

        onClose={() => setHostSheet(null)}

        onNameOnly={(displayName) => {

          if (!hostSheet) return;

          setProfessorMap((m) => ({ ...m, [hostSheet]: { mode: 'pendingName', displayName } }));

          setHostSheet(null);

        }}

      />

    </View>

  );

}


