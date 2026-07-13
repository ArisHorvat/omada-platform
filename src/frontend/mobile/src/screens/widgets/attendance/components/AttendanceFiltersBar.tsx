import React, { useState } from 'react';

import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { FilterPickerPanel, FilterPickerRow } from '@/src/components/ui/FilterPickerPanel';

type Option = { value: string; label: string; subtitle?: string };

type Props = {
  groupOptions: Option[];
  activeGroupId: string | null;
  onGroupChange: (groupId: string | null) => void;
};

export function AttendanceFiltersBar({ groupOptions, activeGroupId, onGroupChange }: Props) {
  const [groupOpen, setGroupOpen] = useState(false);

  const activeLabel =
    groupOptions.find((g) => g.value === activeGroupId)?.label ?? 'All groups & cohorts';

  return (
    <>
      <FilterPickerPanel>
        <FilterPickerRow
          icon="groups"
          caption="Group / cohort"
          label={groupOptions.length === 0 ? 'No groups to filter' : activeLabel}
          onPress={groupOptions.length > 0 ? () => setGroupOpen(true) : undefined}
          disabled={groupOptions.length === 0}
        />
      </FilterPickerPanel>

      <SearchableOptionPickerSheet
        isVisible={groupOpen}
        onClose={() => setGroupOpen(false)}
        title="Group or cohort"
        searchPlaceholder="Search groups…"
        options={groupOptions}
        selected={activeGroupId}
        onSelect={(id) => onGroupChange(id)}
        allLabel="All groups & cohorts"
        height={480}
        zIndexBase={300}
      />
    </>
  );
}
