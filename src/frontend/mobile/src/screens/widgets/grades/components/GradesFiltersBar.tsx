import React, { useState } from 'react';

import { AppText } from '@/src/components/ui';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { FilterPickerPanel, FilterPickerRow } from '@/src/components/ui/FilterPickerPanel';
import { useThemeColors } from '@/src/hooks';

interface GradesFiltersBarProps {
  periodOptions: { value: string; label: string; subtitle?: string }[];
  activePeriodId: string | null;
  onPeriodChange: (periodId: string | null) => void;
  offeringOptions: { value: string; label: string; subtitle?: string }[];
  activeOfferingId: string | null;
  onOfferingChange: (offeringId: string | null) => void;
}

export function GradesFiltersBar({
  periodOptions,
  activePeriodId,
  onPeriodChange,
  offeringOptions,
  activeOfferingId,
  onOfferingChange,
}: GradesFiltersBarProps) {
  const colors = useThemeColors();
  const [termOpen, setTermOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);

  const activeTermLabel =
    periodOptions.find((p) => p.value === activePeriodId)?.label ?? 'Select term';
  const activeCourseLabel =
    offeringOptions.find((o) => o.value === activeOfferingId)?.label ?? 'All courses';

  return (
    <FilterPickerPanel>
      <FilterPickerRow
        icon="date-range"
        caption="Term"
        label={periodOptions.length === 0 ? 'No terms configured yet' : activeTermLabel}
        onPress={periodOptions.length > 0 ? () => setTermOpen(true) : undefined}
        disabled={periodOptions.length === 0}
      />

      <FilterPickerRow
        icon="school"
        caption="Course"
        label={offeringOptions.length === 0 ? 'No enrolled courses' : activeCourseLabel}
        onPress={offeringOptions.length > 0 ? () => setCourseOpen(true) : undefined}
        disabled={offeringOptions.length === 0}
      />

      {offeringOptions.length === 0 ? (
        <AppText variant="caption" style={{ color: colors.subtle, paddingHorizontal: 4 }}>
          Enroll in term offerings to see task grades here.
        </AppText>
      ) : null}

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
        searchPlaceholder="Search enrolled courses…"
        options={[
          { value: '', label: 'All courses', subtitle: 'Show every enrolled course' },
          ...offeringOptions,
        ]}
        selected={activeOfferingId ?? ''}
        onSelect={(id) => onOfferingChange(id ? id : null)}
        includeAllOption={false}
        height={440}
      />
    </FilterPickerPanel>
  );
}
