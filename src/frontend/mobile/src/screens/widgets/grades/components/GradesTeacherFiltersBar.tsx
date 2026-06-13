import React, { useState } from 'react';
import { View } from 'react-native';
import { AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { SearchBar } from '@/src/screens/widgets/dashboard/components/SearchBar';
import {
  filterPanelCardStyles as panelStyles,
  filterPickerRowStyles as pickerStyles,
} from '@/src/styles/filterPickerRow';

import type { TeacherRosterFilter } from '../hooks/useTeacherGradesScreenLogic';

interface GradesTeacherFiltersBarProps {
  periodOptions: { value: string; label: string; subtitle?: string }[];
  activePeriodId: string | null;
  onPeriodChange: (periodId: string | null) => void;
  offeringOptions: { value: string; label: string; subtitle?: string }[];
  activeOfferingId: string | null;
  onOfferingChange: (offeringId: string | null) => void;
  cohortOptions: { value: string; label: string; subtitle?: string }[];
  activeCohortId: string | null;
  onCohortChange: (cohortId: string | null) => void;
  rosterFilter: TeacherRosterFilter;
  onRosterFilterChange: (filter: TeacherRosterFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

const ROSTER_FILTER_OPTIONS: { value: TeacherRosterFilter; label: string; subtitle?: string }[] = [
  { value: 'all', label: 'All students', subtitle: 'Every enrolled student' },
  { value: 'graded', label: 'Fully graded', subtitle: 'All assignments have a grade' },
  { value: 'needs_grading', label: 'To grade', subtitle: 'Submitted work waiting for a grade' },
  { value: 'missing', label: 'Missing', subtitle: 'Overdue or not turned in' },
];

export function GradesTeacherFiltersBar({
  periodOptions,
  activePeriodId,
  onPeriodChange,
  offeringOptions,
  activeOfferingId,
  onOfferingChange,
  cohortOptions,
  activeCohortId,
  onCohortChange,
  rosterFilter,
  onRosterFilterChange,
  searchQuery,
  onSearchQueryChange,
}: GradesTeacherFiltersBarProps) {
  const colors = useThemeColors();
  const [termOpen, setTermOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [cohortOpen, setCohortOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const activeTermLabel =
    periodOptions.find((p) => p.value === activePeriodId)?.label ?? 'Select term';
  const activeCourseLabel =
    offeringOptions.find((o) => o.value === activeOfferingId)?.label ?? 'Select course';
  const activeCohortLabel =
    cohortOptions.find((c) => c.value === activeCohortId)?.label ?? 'All groups';
  const activeStatusLabel =
    ROSTER_FILTER_OPTIONS.find((o) => o.value === rosterFilter)?.label ?? 'All students';

  return (
    <ClayView depth={6} puffy={10} color={colors.card} style={panelStyles.card}>
      <PressClay onPress={periodOptions.length > 0 ? () => setTermOpen(true) : undefined}>
        <ClayView depth={2} color={colors.background} style={pickerStyles.row}>
          <View style={pickerStyles.iconColumn}>
            <Icon name="date-range" size={22} color={colors.primary} />
          </View>
          <View style={pickerStyles.labelBlock}>
            <AppText variant="caption" style={[pickerStyles.caption, { color: colors.subtle }]}>
              Term
            </AppText>
            <AppText variant="body" weight="bold" numberOfLines={1}>
              {periodOptions.length === 0 ? 'No terms configured yet' : activeTermLabel}
            </AppText>
          </View>
          {periodOptions.length > 0 ? <Icon name="expand-more" size={22} color={colors.subtle} /> : null}
        </ClayView>
      </PressClay>

      <PressClay onPress={offeringOptions.length > 0 ? () => setCourseOpen(true) : undefined}>
        <ClayView depth={2} color={colors.background} style={pickerStyles.row}>
          <View style={pickerStyles.iconColumn}>
            <Icon name="school" size={22} color={colors.primary} />
          </View>
          <View style={pickerStyles.labelBlock}>
            <AppText variant="caption" style={[pickerStyles.caption, { color: colors.subtle }]}>
              Course you teach
            </AppText>
            <AppText variant="body" weight="bold" numberOfLines={1}>
              {offeringOptions.length === 0 ? 'No teaching assignments' : activeCourseLabel}
            </AppText>
          </View>
          {offeringOptions.length > 0 ? <Icon name="expand-more" size={22} color={colors.subtle} /> : null}
        </ClayView>
      </PressClay>

      {cohortOptions.length > 0 ? (
        <PressClay onPress={() => setCohortOpen(true)}>
          <ClayView depth={2} color={colors.background} style={pickerStyles.row}>
            <View style={pickerStyles.iconColumn}>
              <Icon name="groups" size={22} color={colors.primary} />
            </View>
            <View style={pickerStyles.labelBlock}>
              <AppText variant="caption" style={[pickerStyles.caption, { color: colors.subtle }]}>
                Cohort / group
              </AppText>
              <AppText variant="body" weight="bold" numberOfLines={1}>
                {activeCohortLabel}
              </AppText>
            </View>
            <Icon name="expand-more" size={22} color={colors.subtle} />
          </ClayView>
        </PressClay>
      ) : null}

      <PressClay onPress={() => setStatusOpen(true)}>
        <ClayView depth={2} color={colors.background} style={pickerStyles.row}>
          <View style={pickerStyles.iconColumn}>
            <Icon name="filter-list" size={22} color={colors.primary} />
          </View>
          <View style={pickerStyles.labelBlock}>
            <AppText variant="caption" style={[pickerStyles.caption, { color: colors.subtle }]}>
              Student status
            </AppText>
            <AppText variant="body" weight="bold" numberOfLines={1}>
              {activeStatusLabel}
            </AppText>
          </View>
          <Icon name="expand-more" size={22} color={colors.subtle} />
        </ClayView>
      </PressClay>

      <View style={panelStyles.searchWrap}>
        <SearchBar
          compact
          value={searchQuery}
          onChangeText={onSearchQueryChange}
          placeholder="Search students…"
        />
      </View>

      <SearchableOptionPickerSheet
        isVisible={termOpen}
        onClose={() => setTermOpen(false)}
        title="Term"
        searchPlaceholder="Search terms…"
        options={periodOptions}
        selected={activePeriodId}
        onSelect={(id) => onPeriodChange(id || null)}
        includeAllOption={false}
        height={440}
      />

      <SearchableOptionPickerSheet
        isVisible={courseOpen}
        onClose={() => setCourseOpen(false)}
        title="Course"
        searchPlaceholder="Search courses you teach…"
        options={offeringOptions}
        selected={activeOfferingId}
        onSelect={(id) => onOfferingChange(id || null)}
        includeAllOption={false}
        height={440}
      />

      <SearchableOptionPickerSheet
        isVisible={cohortOpen}
        onClose={() => setCohortOpen(false)}
        title="Cohort / group"
        searchPlaceholder="Search groups…"
        options={[
          { value: '', label: 'All groups', subtitle: 'Every enrolled student' },
          ...cohortOptions,
        ]}
        selected={activeCohortId ?? ''}
        onSelect={(id) => onCohortChange(id ? id : null)}
        includeAllOption={false}
        height={440}
      />

      <SearchableOptionPickerSheet
        isVisible={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Student status"
        searchPlaceholder="Search filters…"
        options={ROSTER_FILTER_OPTIONS}
        selected={rosterFilter}
        onSelect={(id) => onRosterFilterChange((id as TeacherRosterFilter) || 'all')}
        includeAllOption={false}
        height={400}
      />
    </ClayView>
  );
}
