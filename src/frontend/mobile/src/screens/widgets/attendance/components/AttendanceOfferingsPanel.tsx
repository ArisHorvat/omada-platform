import React, { useState } from 'react';
import { View, Platform } from 'react-native';

import { AppText, ClayView, Skeleton, WidgetEmptyState } from '@/src/components/ui';
import { AnimatedItem } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';
import { attendanceExtendedApi, unwrapAttendanceExtendedAxios } from '@/src/api/attendanceExtendedApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useThemeColors } from '@/src/hooks';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { FilterPickerPanel, FilterPickerRow } from '@/src/components/ui/FilterPickerPanel';
import { useOrganizationPeriods } from '../../grades/hooks/useOrganizationPeriods';
import { useQuery } from '@tanstack/react-query';

type Props = {
  enabled?: boolean;
};

export function AttendanceOfferingsPanel({ enabled = true }: Props) {
  const colors = useThemeColors();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const periods = useOrganizationPeriods();
  const [termOpen, setTermOpen] = useState(false);

  const query = useQuery({
    queryKey: QUERY_KEYS.attendance.myOfferings(orgId, periods.activePeriodId),
    queryFn: () =>
      unwrapAttendanceExtendedAxios(attendanceExtendedApi.getMyOfferings(periods.activePeriodId)),
    enabled: enabled && !!orgId,
    staleTime: 1000 * 60,
  });

  const offerings = query.data?.offerings ?? [];
  const periodOptions = periods.periodOptions.map((p) => ({ value: p.value, label: p.label, subtitle: p.subtitle }));
  const activeTermLabel =
    periods.activePeriodId == null
      ? 'All terms'
      : periodOptions.find((p) => p.value === periods.activePeriodId)?.label ?? 'Select term';

  if (periods.isLoading) {
    return <Skeleton height={120} borderRadius={20} />;
  }

  return (
    <View style={{ marginBottom: 16, gap: 10 }}>
      <AppText variant="h3" weight="bold" style={{ color: colors.text, marginHorizontal: 20 }}>
        By course
      </AppText>

      {periodOptions.length > 0 ? (
        <FilterPickerPanel>
          <FilterPickerRow
            icon="date-range"
            caption="Term"
            label={activeTermLabel}
            onPress={() => setTermOpen(true)}
          />
        </FilterPickerPanel>
      ) : null}

      {query.isLoading ? (
        <Skeleton height={100} borderRadius={16} style={{ marginHorizontal: 20 }} />
      ) : offerings.length === 0 ? (
        <WidgetEmptyState
          title="No course attendance yet"
          description="Enroll in offerings and attend published schedule sessions to see breakdowns here."
          icon="school"
        />
      ) : (
        offerings.map((offering, index) => (
          <AnimatedItem
            key={offering.offeringId}
            animation={Platform.OS === 'web' ? null : ClayAnimations.SlideInFlow(index)}
            layout={Platform.OS === 'web' ? null : undefined}
          >
            <ClayView
              depth={4}
              contentOverflow="visible"
              color={colors.card}
              style={{ marginHorizontal: 20, marginBottom: 10, padding: 14, borderRadius: 16, gap: 8 }}
            >
              <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                {offering.offeringName}
              </AppText>
              {offering.offeringCode ? (
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  {offering.offeringCode}
                </AppText>
              ) : null}

              <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18 }}>
                {offering.presentCount} present · {offering.heldCount} sessions held
                {offering.heldCount > 0 ? ` · ${offering.ratePercent.toFixed(0)}% marked present` : ''}
              </AppText>

              {offering.requiredAttendancePercent != null ? (
                <View
                  style={{
                    alignSelf: 'flex-start',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 10,
                    backgroundColor:
                      offering.meetsRequirement === false ? colors.error + '20' : colors.success + '20',
                  }}
                >
                  <AppText
                    variant="caption"
                    weight="bold"
                    style={{
                      color: offering.meetsRequirement === false ? colors.error : colors.success,
                    }}
                  >
                    Required {offering.requiredAttendancePercent}%{' '}
                    {offering.meetsRequirement === false
                      ? '— below requirement'
                      : offering.meetsRequirement
                        ? '— on track'
                        : ''}
                  </AppText>
                </View>
              ) : null}

              {offering.activities.length > 0 ? (
                <View style={{ marginTop: 6, gap: 6 }}>
                  <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
                    By activity (from schedule)
                  </AppText>
                  {offering.activities.map((a) => (
                    <View
                      key={a.eventTypeId}
                      style={{ flexDirection: 'row', justifyContent: 'space-between' }}
                    >
                      <AppText variant="caption" style={{ color: colors.text }}>
                        {a.eventTypeName}
                      </AppText>
                      <AppText variant="caption" style={{ color: colors.subtle }}>
                        {a.presentCount}/{a.heldCount} ({a.ratePercent.toFixed(0)}%)
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : null}
            </ClayView>
          </AnimatedItem>
        ))
      )}

      <SearchableOptionPickerSheet
        isVisible={termOpen}
        onClose={() => setTermOpen(false)}
        title="Term"
        searchPlaceholder="Search terms…"
        options={periodOptions}
        selected={periods.activePeriodId}
        onSelect={(id) => periods.setActivePeriodId(id)}
        allLabel="All terms"
        height={480}
        zIndexBase={300}
      />
    </View>
  );
}
