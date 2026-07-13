import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppButton, AppText, ClayView, WidgetEmptyState } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { OrganizationType } from '@/src/api/generatedClient';
import { isUniversityOrg } from '@/src/screens/widgets/tasks/utils/taskLabels';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { FilterPickerPanel, FilterPickerRow } from '@/src/components/ui/FilterPickerPanel';
import { usePeriodOfferings } from '@/src/screens/admin/periods-workspace/hooks/usePeriodOfferings';
import { OfferingEnrollmentSheet } from '../components/OfferingEnrollmentSheet';
import { createOfferingsWorkspaceStyles } from '../styles/offerings-workspace.styles';

type PeriodOption = { value: string; label: string; subtitle?: string };

type Props = {
  periodId: string | null;
  periodOptions: PeriodOption[];
  onPeriodChange: (periodId: string | null) => void;
};

export function TermCoursesSection({ periodId, periodOptions, onPeriodChange }: Props) {
  const colors = useThemeColors();
  const router = useRouter();
  const styles = createOfferingsWorkspaceStyles(colors);
  const { organization } = useCurrentOrganization();
  const isUniversity = isUniversityOrg(organization?.organizationType ?? OrganizationType.University);
  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);

  const {
    offerings,
    loading,
    enrollLinkedPrograms,
    enrollCohort,
    unenrollUser,
    unenrollCohort,
    enrollmentOffering,
    setEnrollmentOffering,
    enrollmentRows,
    enrollmentsLoading,
    confirmDeleteOffering,
    isSaving,
  } = usePeriodOfferings(periodId);

  const periodLabel =
    periodId == null
      ? 'Select academic period'
      : periodOptions.find((o) => o.value === periodId)?.label ?? 'Selected period';

  if (!isUniversity) return null;

  return (
    <ClayView depth={3} color={colors.card} style={styles.clayShell}>
      <View style={styles.clayInner}>
        <AppText variant="h3" weight="bold">
          Courses in term
        </AppText>
        <AppText variant="caption" style={styles.sectionHint}>
          Offerings created when you apply a package. Credits and attendance rules live in the package editor; build
          the weekly schedule and publish in Timetables.
        </AppText>

        <FilterPickerPanel style={{ marginHorizontal: 0, marginBottom: 12 }}>
          <FilterPickerRow
            icon="date-range"
            caption="Academic period"
            label={periodOptions.length === 0 ? 'No periods yet — create one in Periods' : periodLabel}
            onPress={periodOptions.length > 0 ? () => setPeriodPickerOpen(true) : undefined}
            disabled={periodOptions.length === 0}
          />
        </FilterPickerPanel>

        {!periodId ? (
          <WidgetEmptyState
            icon="date-range"
            title="Pick a period"
            description="Choose the term above to see courses applied from your packages."
          />
        ) : loading && !offerings.length ? (
          <AppText variant="caption" style={{ color: colors.subtle }}>
            Loading…
          </AppText>
        ) : !offerings.length ? (
          <WidgetEmptyState
            icon="school"
            title="No courses in this term"
            description="Select a package above, then use Apply to period to create offerings for this term."
          />
        ) : (
          <>
            <AppButton
              title="Activities & publish schedule"
              variant="outline"
              icon="event-note"
              onPress={() =>
                router.push(`/timetables-workspace?tab=build&periodId=${periodId}` as never)
              }
              style={{ alignSelf: 'flex-start', marginBottom: 12 }}
            />

            {offerings.map((o) => (
              <ClayView
                key={o.id}
                depth={1}
                contentOverflow="visible"
                color={colors.background}
                style={{ padding: 12, borderRadius: 12, marginBottom: 10 }}
              >
                <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                  {o.name}
                  {o.code ? ` (${o.code})` : ''}
                </AppText>
                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                  {o.enrollmentCount} enrolled
                  {o.programGroupNames?.length
                    ? ` · ${o.programGroupNames.join(', ')}`
                    : o.programGroupName
                      ? ` · ${o.programGroupName}`
                      : ''}
                  {o.hostName ? ` · ${o.hostName}` : ''}
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  <AppButton
                    title="Enrollments"
                    size="sm"
                    variant="outline"
                    icon="groups"
                    onPress={() => setEnrollmentOffering(o)}
                  />
                  <AppButton
                    title="Timetable"
                    size="sm"
                    variant="outline"
                    icon="event-note"
                    onPress={() =>
                      router.push(
                        `/timetables-workspace?tab=build&periodId=${periodId}&offeringId=${o.id}` as never,
                      )
                    }
                  />
                  <AppButton
                    title="Enroll cohorts"
                    size="sm"
                    variant="outline"
                    onPress={() => enrollLinkedPrograms(o.id)}
                    disabled={isSaving}
                  />
                  <AppButton
                    title="Remove"
                    size="sm"
                    variant="outline"
                    onPress={() => confirmDeleteOffering(o)}
                    disabled={isSaving}
                  />
                </View>
              </ClayView>
            ))}
          </>
        )}
      </View>

      <SearchableOptionPickerSheet
        isVisible={periodPickerOpen}
        onClose={() => setPeriodPickerOpen(false)}
        title="Academic period"
        searchPlaceholder="Search periods…"
        options={periodOptions}
        selected={periodId}
        onSelect={(id) => onPeriodChange(id)}
        allLabel="No period"
        height={480}
        zIndexBase={300}
      />

      {enrollmentOffering && periodId ? (
        <OfferingEnrollmentSheet
          visible={!!enrollmentOffering}
          periodId={periodId}
          offering={enrollmentOffering}
          colors={colors}
          enrollments={enrollmentRows}
          loading={enrollmentsLoading}
          isSaving={isSaving}
          onClose={() => setEnrollmentOffering(null)}
          onEnrollCohort={(cohortGroupId) => enrollCohort(enrollmentOffering.id, cohortGroupId)}
          onEnrollLinkedPrograms={() => enrollLinkedPrograms(enrollmentOffering.id)}
          onUnenrollUser={(userId) => unenrollUser(enrollmentOffering.id, userId)}
          onUnenrollCohort={(cohortGroupId) => unenrollCohort(enrollmentOffering.id, cohortGroupId)}
        />
      ) : null}
    </ClayView>
  );
}
