import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { offeringsApi, unwrapOfferingsAxios, type CourseOfferingDto } from '@/src/api/offeringsApi';
import { AppButton, AppText, ClayView } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { useOfferingCohortOptions } from '../hooks/useOfferingCohortOptions';

type EnrollmentRow = {
  id: string;
  userId: string;
  userDisplayName: string;
  cohortGroupId?: string;
  cohortGroupName?: string;
};

type Props = {
  visible: boolean;
  periodId: string;
  offering: CourseOfferingDto;
  colors: ReturnType<typeof import('@/src/hooks').useThemeColors>;
  enrollments: EnrollmentRow[];
  loading: boolean;
  isSaving: boolean;
  onClose: () => void;
  onEnrollCohort: (cohortGroupId: string) => void;
  onEnrollLinkedPrograms: () => void;
  onUnenrollUser: (userId: string) => void;
  onUnenrollCohort: (cohortGroupId: string) => void;
};

export function OfferingEnrollmentSheet({
  visible,
  periodId,
  offering,
  colors,
  enrollments,
  loading,
  isSaving,
  onClose,
  onEnrollCohort,
  onEnrollLinkedPrograms,
  onUnenrollUser,
  onUnenrollCohort,
}: Props) {
  const [cohortPickerOpen, setCohortPickerOpen] = useState(false);
  const programIds = offering.programGroupIds ?? (offering.programGroupId ? [offering.programGroupId] : []);
  const { options: cohortOptions } = useOfferingCohortOptions(periodId, offering.id, programIds);

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; rows: EnrollmentRow[] }>();
    for (const row of enrollments) {
      const key = row.cohortGroupId ?? '__none__';
      const label = row.cohortGroupName ?? 'No cohort tag';
      const bucket = map.get(key) ?? { label, rows: [] };
      bucket.rows.push(row);
      map.set(key, bucket);
    }
    return [...map.entries()].sort((a, b) => a[1].label.localeCompare(b[1].label));
  }, [enrollments]);

  return (
    <>
      <BottomSheet isVisible={visible} onClose={onClose} height={560} zIndexBase={280}>
        <AppText variant="h3" weight="bold" style={{ marginBottom: 8 }}>
          Enrollments · {offering.name}
        </AppText>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12, lineHeight: 18 }}>
            Enroll student groups or remove individual students from this term offering.
          </AppText>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <AppButton
              title="Add group"
              size="sm"
              variant="outline"
              icon="group-add"
              onPress={() => setCohortPickerOpen(true)}
              disabled={isSaving || cohortOptions.length === 0}
            />
            <AppButton
              title="Enroll linked programs"
              size="sm"
              variant="outline"
              onPress={onEnrollLinkedPrograms}
              disabled={isSaving}
            />
          </View>

          {loading ? (
            <AppText variant="caption" style={{ color: colors.subtle }}>
              Loading enrollments…
            </AppText>
          ) : enrollments.length === 0 ? (
            <ClayView depth={1} color={colors.background} style={{ padding: 14, borderRadius: 12 }}>
              <AppText variant="body" weight="bold">
                No students enrolled
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6, lineHeight: 18 }}>
                Add a student group above, or use Enroll linked programs after applying a package.
              </AppText>
            </ClayView>
          ) : (
            grouped.map(([cohortKey, group]) => (
              <View key={cohortKey} style={{ marginBottom: 14 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    gap: 8,
                  }}
                >
                  <AppText variant="caption" weight="bold" style={{ color: colors.primary, flex: 1 }}>
                    {group.label} ({group.rows.length})
                  </AppText>
                  {cohortKey !== '__none__' ? (
                    <AppButton
                      title="Remove group"
                      size="sm"
                      variant="outline"
                      onPress={() => onUnenrollCohort(cohortKey)}
                      disabled={isSaving}
                    />
                  ) : null}
                </View>
                {group.rows.map((row) => (
                  <ClayView
                    key={row.id}
                    depth={1}
                    color={colors.background}
                    style={{ padding: 10, borderRadius: 10, marginBottom: 6 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <AppText variant="body" style={{ color: colors.text, flex: 1 }}>
                        {row.userDisplayName}
                      </AppText>
                      <PressClay onPress={() => onUnenrollUser(row.userId)} disabled={isSaving}>
                        <AppText variant="caption" style={{ color: colors.primary }}>
                          Remove
                        </AppText>
                      </PressClay>
                    </View>
                  </ClayView>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </BottomSheet>

      <SearchableOptionPickerSheet
        isVisible={cohortPickerOpen}
        onClose={() => setCohortPickerOpen(false)}
        title="Enroll student group"
        searchPlaceholder="Search groups…"
        options={cohortOptions.map((o) => ({
          value: o.value,
          label: o.label,
          subtitle: o.subtitle,
        }))}
        selected={null}
        onSelect={(id) => {
          if (!id) {
            setCohortPickerOpen(false);
            return;
          }
          onEnrollCohort(id);
          setCohortPickerOpen(false);
        }}
        height={480}
        zIndexBase={400}
      />
    </>
  );
}
