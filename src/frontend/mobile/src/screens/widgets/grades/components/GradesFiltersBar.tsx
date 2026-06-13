import React, { useState } from 'react';
import { View } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { filterPickerRowStyles as pickerStyles, filterPanelCardStyles as panelStyles } from '@/src/styles/filterPickerRow';

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
              Course
            </AppText>
            <AppText variant="body" weight="bold" numberOfLines={1}>
              {offeringOptions.length === 0 ? 'No enrolled courses' : activeCourseLabel}
            </AppText>
            {offeringOptions.length === 0 ? (
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                Enroll in term offerings to see task grades here.
              </AppText>
            ) : null}
          </View>
          {offeringOptions.length > 0 ? <Icon name="expand-more" size={22} color={colors.subtle} /> : null}
        </ClayView>
      </PressClay>

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
    </ClayView>
  );
}