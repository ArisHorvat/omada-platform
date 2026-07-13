import React, { useMemo, useState } from 'react';

import { View } from 'react-native';



import { AppButton, AppText, ClayView } from '@/src/components/ui';

import { OptionPickerSheet } from '@/src/components/filters/OptionPickerSheet';

import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';

import type { TimetablesWorkspaceModel } from '../hooks/useTimetablesWorkspace';

import { useImportScheduleMappingCatalogs } from '../hooks/useImportScheduleMappingCatalogs';

import type { ImportScheduleWizardModel } from './useImportScheduleWizard';

import { ImportWizardOptionRow } from './ImportWizardOptionRow';

import { ImportWizardSelectField } from './ImportWizardSelectField';

import {

  GROUP_KIND_OPTIONS,

  SCOPE_KIND_OPTIONS,

  groupKindLabel,
  needsOfferingInContext,
  scopeKindLabel,

  shouldShowImplicitCourseName,

  type GroupTimetableKind,

} from './importWizardTypes';



type Props = {

  model: TimetablesWorkspaceModel;

  wizard: ImportScheduleWizardModel;

  studyGroupLabel: string | null;

  onNext: () => void;

};



export function ImportWizardContextStep({ model, wizard, studyGroupLabel, onNext }: Props) {

  const { colors } = model;

  const catalogs = useImportScheduleMappingCatalogs(model);

  const { context, setContext, setScopeKind, setGroupKind, resolution, canProceedFromContext } = wizard;



  const [scopePickerOpen, setScopePickerOpen] = useState(false);

  const [groupKindPickerOpen, setGroupKindPickerOpen] = useState(false);

  const [offeringOpen, setOfferingOpen] = useState(false);

  const [groupOpen, setGroupOpen] = useState(false);



  const scopeSelected = context.scopeKind != null;

  const isGroupTimetable = context.scopeKind === 'groupTimetable';

  const isMultiCourse = context.scopeKind === 'multiCourse';

  const isSingleCourse = context.scopeKind === 'singleCourse';

  const needsGroupKind = isGroupTimetable;

  const needsAnchorGroup = isGroupTimetable && context.groupKind != null;

  const needsOffering = scopeSelected && needsOfferingInContext(context);

  const filteredGroupOptions = useMemo(
    () => catalogs.filterGroupsByKind(context.groupKind),
    [catalogs, context.groupKind],
  );

  const offeringLabel =
    catalogs.offeringOptions.find((o) => o.value === context.offeringId)?.label ?? null;
  const groupLabel =
    filteredGroupOptions.find((g) => g.value === context.anchorGroupId)?.label ?? null;



  const scopeHint = useMemo(
    () => SCOPE_KIND_OPTIONS.find((o) => o.value === context.scopeKind)?.subtitle,
    [context.scopeKind],
  );

  const showImplicitCourse =

    shouldShowImplicitCourseName(context) && !!resolution?.implicitCourseName;



  return (

    <View>

      <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18, marginBottom: 12 }}>

        Choose what this scrape represents. Day, time, and frequency are read from the table automatically.

        {studyGroupLabel ? ` Scraped group hint: ${studyGroupLabel}.` : ''}

      </AppText>



      {resolution?.scopeSummary && scopeSelected ? (

        <ClayView depth={1} color={colors.background} style={{ borderRadius: 10, padding: 10, marginBottom: 12 }}>

          <AppText variant="caption" style={{ color: colors.text, lineHeight: 18 }}>

            {resolution.scopeSummary}

          </AppText>

          {showImplicitCourse ? (

            <AppText variant="caption" style={{ color: colors.primary, marginTop: 4 }}>

              Page course title: {resolution.implicitCourseName}

            </AppText>

          ) : null}

        </ClayView>

      ) : null}



      <ImportWizardSelectField

        label="Import type"

        value={context.scopeKind ? scopeKindLabel(context.scopeKind) : null}

        placeholder="Select import type…"

        hint={scopeHint}

        colors={colors}

        onPress={() => setScopePickerOpen(true)}

      />



      {scopeSelected && needsGroupKind ? (

        <ImportWizardSelectField

          label="Group type"

          value={context.groupKind ? groupKindLabel(context.groupKind) : null}

          placeholder="Select group type…"

          hint={GROUP_KIND_OPTIONS.find((o) => o.value === context.groupKind)?.subtitle}

          colors={colors}

          onPress={() => setGroupKindPickerOpen(true)}

        />

      ) : null}



      {scopeSelected && needsOffering ? (
        <ImportWizardSelectField
          label={
            isGroupTimetable
              ? 'Target course offering (all rows)'
              : 'Target course offering'
          }
          value={offeringLabel}
          placeholder="Select course offering…"
          hint={
            isGroupTimetable
              ? 'Only needed when importing every scraped row into one offering. Otherwise map each course on the next step.'
              : 'Weekly session pattern is saved on this term offering.'
          }

          colors={colors}

          onPress={() => setOfferingOpen(true)}

        />

      ) : null}



      {scopeSelected && needsAnchorGroup ? (

        <ImportWizardSelectField

          label="Omada group"

          value={groupLabel}

          placeholder="Select group…"

          hint={
            context.groupKind
              ? `Showing ${groupKindLabel(context.groupKind)} groups only.`
              : 'Select a group type first.'
          }

          colors={colors}

          onPress={() => setGroupOpen(true)}

        />

      ) : null}



      {scopeSelected && !isMultiCourse ? (
        <View style={{ marginBottom: 14 }}>
          <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: 8 }}>
            ROW MATCHING
          </AppText>
          <ImportWizardOptionRow
            title="Import all scraped rows to one offering"
            description={
              isGroupTimetable
                ? 'Every enabled session goes to a single offering — pick that offering above. Use when the scrape has no per-course columns.'
                : 'Use when rows do not include a subject column. Every enabled session goes to the target offering.'
            }
            selected={context.importAllScopedRows}
            colors={colors}
            onPress={() => setContext((c) => ({ ...c, importAllScopedRows: true }))}
          />
          <ImportWizardOptionRow
            title="Map each course separately"
            description={
              isGroupTimetable
                ? 'Default for group timetables with multiple courses. Map course names to offerings on the next step — apply once per offering.'
                : 'Only sessions whose subject matches the target offering name are applied.'
            }
            selected={!context.importAllScopedRows}
            colors={colors}
            onPress={() => setContext((c) => ({ ...c, importAllScopedRows: false, offeringId: null }))}
          />
        </View>
      ) : null}



      {scopeSelected ? (

        <View style={{ marginBottom: 14 }}>

          <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: 8 }}>

            WEEKLY PATTERN

          </AppText>

          <ImportWizardOptionRow

            title="Replace existing activities"

            description="Clears the offering's current weekly pattern and replaces it with the mapped import. Use when this scrape is the new source of truth."

            selected={context.replaceExisting}

            colors={colors}

            onPress={() => setContext((c) => ({ ...c, replaceExisting: true }))}

          />

          <ImportWizardOptionRow

            title="Append to existing activities"

            description="Keeps current weekly activities and adds imported sessions on top. Use to merge a partial scrape or extra slots."

            selected={!context.replaceExisting}

            colors={colors}

            onPress={() => setContext((c) => ({ ...c, replaceExisting: false }))}

          />

        </View>

      ) : null}



      <AppButton title="Continue to mapping" onPress={onNext} disabled={!canProceedFromContext} />



      <OptionPickerSheet

        isVisible={scopePickerOpen}

        onClose={() => setScopePickerOpen(false)}

        title="Import type"

        options={SCOPE_KIND_OPTIONS.map((o) => ({

          value: o.value,

          label: o.label,

          subtitle: o.subtitle,

        }))}

        selected={context.scopeKind}

        onSelect={(v) => {

          if (v) setScopeKind(v);

          setScopePickerOpen(false);

        }}

        includeAllOption={false}

        height={420}

      />



      <OptionPickerSheet

        isVisible={groupKindPickerOpen}

        onClose={() => setGroupKindPickerOpen(false)}

        title="Group type"

        options={GROUP_KIND_OPTIONS.map((o) => ({

          value: o.value,

          label: o.label,

          subtitle: o.subtitle,

        }))}

        selected={context.groupKind}

        onSelect={(v) => {

          if (v) setGroupKind(v as GroupTimetableKind);

          setGroupKindPickerOpen(false);

        }}

        includeAllOption={false}

        height={440}

      />



      <SearchableOptionPickerSheet

        isVisible={offeringOpen}

        onClose={() => setOfferingOpen(false)}

        title="Course offering"

        options={catalogs.offeringOptions}

        selected={context.offeringId}

        onSelect={(id) => {

          setContext((c) => ({ ...c, offeringId: id }));

          setOfferingOpen(false);

        }}

        includeAllOption={false}

        searchPlaceholder="Search courses…"

      />



      <SearchableOptionPickerSheet

        isVisible={groupOpen}

        onClose={() => setGroupOpen(false)}

        title="Omada group"

        options={filteredGroupOptions}

        selected={context.anchorGroupId}

        onSelect={(id) => {

          setContext((c) => ({ ...c, anchorGroupId: id }));

          setGroupOpen(false);

        }}

        includeAllOption={false}

        searchPlaceholder="Search groups…"

      />

    </View>

  );

}


