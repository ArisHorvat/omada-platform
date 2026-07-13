import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { AppButton, AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { useQuery } from '@tanstack/react-query';
import { eventTypesApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

import {
  createEmptyPackageActivity,
  type OfferingWeeklySession,
  type WeeklySessionPlanContext,
} from '../utils/offeringSessionPlan';
import { PackageActivityRow } from './PackageActivityRow';

type Props = {
  sessions: OfferingWeeklySession[];
  onChange: (sessions: OfferingWeeklySession[]) => void;
  teamInstructorOptions: WeeklySessionPlanContext['instructorOptions'];
};

function initialExpandedIndices(sessions: OfferingWeeklySession[]): Set<number> {
  const set = new Set<number>();
  sessions.forEach((s, i) => {
    if (!s.eventTypeId) set.add(i);
  });
  return set;
}

export function PackageActivityPlanEditor({ sessions, onChange, teamInstructorOptions }: Props) {
  const colors = useThemeColors();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(() => initialExpandedIndices(sessions));
  const prevSessionCount = useRef(sessions.length);

  useEffect(() => {
    if (sessions.length > prevSessionCount.current) {
      setExpandedIndices((prev) => new Set(prev).add(sessions.length - 1));
    }
    prevSessionCount.current = sessions.length;
  }, [sessions.length]);

  const typesQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.eventTypes(orgId),
    queryFn: () => unwrap(eventTypesApi.getAll()),
    enabled: !!orgId,
  });

  const typeOptions = useMemo(
    () => (typesQuery.data ?? []).map((t) => ({ value: t.id!, label: t.name ?? 'Type' })),
    [typesQuery.data],
  );

  const updateSession = (index: number, patch: Partial<OfferingWeeklySession>) => {
    onChange(sessions.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const handleAddActivity = () => {
    const nextIndex = sessions.length;
    onChange([...sessions, createEmptyPackageActivity(nextIndex)]);
    setExpandedIndices((prev) => new Set(prev).add(nextIndex));
  };

  return (
    <View style={{ marginTop: 8, gap: 8 }}>
      <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
        Activities
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4, lineHeight: 18 }}>
        Define what runs on this course — who can teach each activity and attendance rules. Day, time, room, and groups
        are set later in Timetables.
      </AppText>

      {sessions.length === 0 ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
          Add lecture, lab, seminar, or other activity types for this course.
        </AppText>
      ) : (
        sessions.map((session, index) => (
          <PackageActivityRow
            key={`package-activity-${index}`}
            session={session}
            expanded={expandedIndices.has(index)}
            onExpandedChange={(open) => {
              setExpandedIndices((prev) => {
                const next = new Set(prev);
                if (open) next.add(index);
                else next.delete(index);
                return next;
              });
            }}
            colors={colors}
            teamInstructorOptions={teamInstructorOptions}
            typeOptions={typeOptions}
            onUpdate={(patch) => updateSession(index, patch)}
            onRemove={() => {
              onChange(sessions.filter((_, i) => i !== index));
              setExpandedIndices((prev) => {
                const next = new Set<number>();
                prev.forEach((i) => {
                  if (i < index) next.add(i);
                  else if (i > index) next.add(i - 1);
                });
                return next;
              });
            }}
          />
        ))
      )}

      <AppButton title="Add activity" variant="outline" icon="add" onPress={handleAddActivity} />
    </View>
  );
}
