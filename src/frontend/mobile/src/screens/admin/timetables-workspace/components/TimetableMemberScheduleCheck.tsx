import React, { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { orgAdminApi, unwrap } from '@/src/api';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { offeringsApi, unwrapOfferingsAxios } from '@/src/api/offeringsApi';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import type { TimetablesWorkspaceModel } from '../hooks/useTimetablesWorkspace';
import { parseApiUtc } from '@/src/utils/apiUtcDate';

type Props = {
  model: TimetablesWorkspaceModel;
};

function formatTimeRange(startIso: string, endIso: string): string {
  const fmt = (iso: string) =>
    parseApiUtc(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fmt(startIso)}–${fmt(endIso)}`;
}

function formatDay(iso: string): string {
  return parseApiUtc(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function TimetableMemberScheduleCheck({ model }: Props) {
  const { colors, periodId, weekAnchor, hostOptions } = model;
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const [userId, setUserId] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const weekStartIso = useMemo(() => {
    const y = weekAnchor.getFullYear();
    const m = String(weekAnchor.getMonth() + 1).padStart(2, '0');
    const d = String(weekAnchor.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [weekAnchor]);

  const userLabel = hostOptions.find((o) => o.value === userId)?.label ?? 'Choose member';

  const previewQuery = useQuery({
    queryKey: ['timetables-member-schedule', periodId, userId, weekStartIso],
    queryFn: () =>
      unwrapOfferingsAxios(
        offeringsApi.memberSchedulePreview(periodId, {
          userId,
          weekStartDate: weekStartIso,
        }),
      ),
    enabled: expanded && !!periodId && !!userId,
    staleTime: 0,
  });

  const membersQuery = useQuery({
    queryKey: ['timetable-member-options', orgId],
    queryFn: async () => {
      const page = await unwrap(orgAdminApi.getMembers(1, 100, null, null));
      return (page.items ?? [])
        .filter((m) => m.userId)
        .map((m) => ({
          value: m.userId!,
          label: m.displayName?.trim() || m.email?.trim() || 'Member',
          subtitle: m.roleName ?? undefined,
        }));
    },
    enabled: expanded && !!orgId,
    staleTime: 1000 * 60 * 2,
  });

  const memberOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string; subtitle?: string }>();
    for (const o of membersQuery.data ?? []) map.set(o.value, o);
    for (const o of hostOptions) {
      if (!map.has(o.value)) map.set(o.value, { ...o, subtitle: o.subtitle ?? 'Instructor' });
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [hostOptions, membersQuery.data]);

  if (!periodId) return null;

  const result = previewQuery.data;
  const sessions = result?.sessions ?? [];

  return (
    <ClayView depth={2} color={colors.card} style={{ borderRadius: 16, padding: 14, marginBottom: 12 }}>
      <PressClay onPress={() => setExpanded((v) => !v)}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <ClayView
            depth={2}
            color={colors.primary + '22'}
            style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="person-search" size={22} color={colors.primary} />
          </ClayView>
          <View style={{ flex: 1 }}>
            <AppText variant="label" weight="bold" style={{ color: colors.text }}>
              Member Schedule check
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4, lineHeight: 18 }}>
              After publish, verify what a student or teacher sees on the Schedule tab (My schedule) for this week.
            </AppText>
          </View>
          <Icon name={expanded ? 'expand-less' : 'expand-more'} size={24} color={colors.primary} />
        </View>
      </PressClay>

      {expanded ? (
        <View style={{ marginTop: 12, gap: 10 }}>
          <PressClay onPress={() => setPickerOpen(true)}>
            <ClayView depth={1} color={colors.background} style={{ borderRadius: 12, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Icon name="person" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  Member
                </AppText>
                <AppText variant="body" weight="bold" style={{ color: userId ? colors.text : colors.subtle }}>
                  {userLabel}
                </AppText>
              </View>
              <Icon name="expand-more" size={20} color={colors.subtle} />
            </ClayView>
          </PressClay>

          <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 17 }}>
            Uses the same rules as the member app: host, teaching team, enrollment + cohort audience, and expected
            attendance.
          </AppText>

          {!userId ? (
            <AppText variant="caption" style={{ color: colors.subtle }}>
              Pick a member to load their schedule for the week shown above.
            </AppText>
          ) : previewQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
          ) : previewQuery.isError ? (
            <AppText variant="caption" style={{ color: colors.error }}>
              Could not load member schedule.
            </AppText>
          ) : sessions.length === 0 ? (
            <ClayView depth={1} color={colors.background} style={{ borderRadius: 12, padding: 12 }}>
              <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                No sessions this week
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6, lineHeight: 17 }}>
                {result?.userDisplayName ?? 'This member'} sees nothing on My schedule for this week. Check publish,
                enrollment, cohort audience, or teaching-team assignment.
              </AppText>
            </ClayView>
          ) : (
            <>
              <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
                {result?.userDisplayName ?? 'Member'} · {sessions.length} session{sessions.length === 1 ? '' : 's'}
              </AppText>
              {sessions.map((s) => (
                <ClayView key={`${s.eventId}-${s.startTime}`} depth={1} color={colors.background} style={{ borderRadius: 12, padding: 12 }}>
                  <AppText variant="body" weight="bold" style={{ color: colors.text }} numberOfLines={2}>
                    {s.title}
                  </AppText>
                  <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                    {formatDay(s.startTime)} · {formatTimeRange(s.startTime, s.endTime)}
                  </AppText>
                  <AppText variant="caption" style={{ color: colors.text, marginTop: 4, lineHeight: 17 }}>
                    {[s.typeName, s.roomName, s.hostName, s.cohortGroupName, s.offeringName].filter(Boolean).join(' · ')}
                  </AppText>
                </ClayView>
              ))}
            </>
          )}

          {userId ? (
            <AppButton
              title="Refresh member view"
              size="sm"
              variant="outline"
              icon="refresh"
              onPress={() => void previewQuery.refetch()}
              loading={previewQuery.isFetching}
            />
          ) : null}
        </View>
      ) : null}

      <SearchableOptionPickerSheet
        isVisible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Member"
        options={memberOptions}
        selected={userId || null}
        searchPlaceholder="Search members…"
        onSelect={(id) => {
          setUserId(id ?? '');
          setPickerOpen(false);
        }}
        height={440}
        zIndexBase={360}
      />
    </ClayView>
  );
}
