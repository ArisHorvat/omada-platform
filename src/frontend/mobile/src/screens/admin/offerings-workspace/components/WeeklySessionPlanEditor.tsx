import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { AppButton, AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { useQuery } from '@tanstack/react-query';
import { eventTypesApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

import {
  createEmptySession,
  syncCohortGroupIds,
  filterInstructorOptionsForActivity,
  type OfferingWeeklySession,
  type WeeklySessionPlanContext,
} from '../utils/offeringSessionPlan';
import { WeeklySessionRow } from './WeeklySessionRow';

type Props = {
  sessions: OfferingWeeklySession[];
  onChange: (sessions: OfferingWeeklySession[]) => void;
  readOnly?: boolean;
  planContext?: WeeklySessionPlanContext;
};

function initialExpandedIndices(sessions: OfferingWeeklySession[]): Set<number> {
  const set = new Set<number>();
  sessions.forEach((s, i) => {
    if (!s.eventTypeId) set.add(i);
  });
  return set;
}

export function WeeklySessionPlanEditor({ sessions, onChange, readOnly, planContext }: Props) {
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

  const instructorOptions = planContext?.instructorOptions ?? [];

  const updateSession = (index: number, patch: Partial<OfferingWeeklySession>) => {
    onChange(sessions.map((s, i) => (i === index ? syncCohortGroupIds({ ...s, ...patch }) : s)));
  };

  const handleAddActivity = () => {
    const nextIndex = sessions.length;
    onChange([...sessions, createEmptySession(nextIndex)]);
    setExpandedIndices((prev) => new Set(prev).add(nextIndex));
  };

  return (
    <View style={{ marginTop: 4, gap: 8 }}>
      {sessions.length === 0 ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
          Add activities below. Each stays open while you configure it — collapse the row when done.
        </AppText>
      ) : (
        sessions.map((session, index) => (
          <WeeklySessionRow
            key={`session-${index}`}
            session={session}
            index={index}
            expanded={expandedIndices.has(index)}
            onExpandedChange={(open) => {
              setExpandedIndices((prev) => {
                const next = new Set(prev);
                if (open) next.add(index);
                else next.delete(index);
                return next;
              });
            }}
            readOnly={readOnly}
            colors={colors}
            planContext={planContext}
            typeOptions={typeOptions}
            instructorOptions={filterInstructorOptionsForActivity(instructorOptions, session)}
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

      {!readOnly ? (
        <AppButton title="Add activity" variant="outline" icon="add" onPress={handleAddActivity} />
      ) : null}
    </View>
  );
}
