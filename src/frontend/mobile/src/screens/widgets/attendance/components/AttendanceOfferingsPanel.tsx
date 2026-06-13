import React from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { AppText, ClayView, Skeleton, WidgetEmptyState } from '@/src/components/ui';
import { AnimatedItem, ClayAnimations } from '@/src/components/animations';
import { attendanceExtendedApi, unwrapAttendanceExtendedAxios } from '@/src/api/attendanceExtendedApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useThemeColors } from '@/src/hooks';
import { useOrganizationPeriods } from '../../grades/hooks/useOrganizationPeriods';
import { GradesFilterChips } from '../../grades/components/GradesFilterChips';

type Props = {
  enabled?: boolean;
};

export function AttendanceOfferingsPanel({ enabled = true }: Props) {
  const colors = useThemeColors();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const periods = useOrganizationPeriods();

  const query = useQuery({
    queryKey: QUERY_KEYS.attendance.myOfferings(orgId, periods.activePeriodId),
    queryFn: () =>
      unwrapAttendanceExtendedAxios(attendanceExtendedApi.getMyOfferings(periods.activePeriodId)),
    enabled: enabled && !!orgId && !!periods.activePeriodId,
    staleTime: 1000 * 60,
  });

  const offerings = query.data?.offerings ?? [];
  const periodChips = periods.periodOptions.map((p) => ({ id: p.value, label: p.label }));

  if (periods.isLoading) {
    return <Skeleton height={120} borderRadius={20} />;
  }

  return (
    <View style={{ marginBottom: 16, gap: 10 }}>
      <AppText variant="h3" weight="bold" style={{ color: colors.text }}>
        By course
      </AppText>

      {periodChips.length > 1 ? (
        <GradesFilterChips
          chips={periodChips}
          activeId={periods.activePeriodId}
          onSelect={periods.setActivePeriodId}
          allLabel="All terms"
        />
      ) : null}

      {query.isLoading ? (
        <Skeleton height={100} borderRadius={16} />
      ) : offerings.length === 0 ? (
        <WidgetEmptyState
          title="No course attendance yet"
          description="Enroll in offerings and attend linked schedule sessions to see breakdowns here."
          icon="school"
        />
      ) : (
        offerings.map((offering, index) => (
          <AnimatedItem key={offering.offeringId} animation={ClayAnimations.SlideInFlow(index)}>
            <ClayView depth={4} puffy={12} color={colors.card} style={{ marginBottom: 8, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                    {offering.offeringName}
                  </AppText>
                  {offering.offeringCode ? (
                    <AppText variant="caption" style={{ color: colors.subtle }}>
                      {offering.offeringCode}
                    </AppText>
                  ) : null}
                </View>
                <AppText variant="h3" weight="bold" style={{ color: colors.primary }}>
                  {offering.ratePercent.toFixed(0)}%
                </AppText>
              </View>

              <AppText variant="caption" style={{ color: colors.subtle }}>
                {offering.presentCount} present · {offering.heldCount} sessions held
              </AppText>

              {offering.requiredAttendancePercent != null ? (
                <AppText
                  variant="caption"
                  weight="bold"
                  style={{
                    color:
                      offering.meetsRequirement === false ? colors.error : colors.success,
                  }}
                >
                  Required {offering.requiredAttendancePercent}%{' '}
                  {offering.meetsRequirement === false
                    ? '— below requirement'
                    : offering.meetsRequirement
                      ? '— on track'
                      : ''}
                </AppText>
              ) : null}

              {offering.activities.length > 0 ? (
                <View style={{ marginTop: 6, gap: 4 }}>
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
    </View>
  );
}
