import React, { useMemo, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { AppText, ClayView, Icon } from '@/src/components/ui';
import type { WebSpiderWorkspaceModel } from '../hooks/useWebSpiderWorkspace';
import {
  activityTypeColor,
  activityTypeOf,
  groupSectionTitle,
  type SchedulePreviewGroup,
  type SchedulePreviewViewMode,
} from '../utils/schedulePreviewGrouping';
import { ScrapedEventCompactRow } from './ScrapedEventCompactRow';

type Props = {
  model: WebSpiderWorkspaceModel;
  group: SchedulePreviewGroup;
  viewMode: SchedulePreviewViewMode;
  defaultExpanded?: boolean;
};

export function SchedulePreviewGroupSection({ model, group, viewMode, defaultExpanded = false }: Props) {
  const { colors } = model;
  const [expanded, setExpanded] = useState(defaultExpanded);

  const title = groupSectionTitle(group, viewMode);
  const typeBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ev of group.events) {
      const t = activityTypeOf(ev);
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [group.events]);

  return (
    <ClayView
      depth={2}
      color={colors.card}
      style={{ borderRadius: 16, marginBottom: 12, overflow: 'hidden' }}
    >
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.85}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 }}
      >
        <View
          style={{
            width: 4,
            alignSelf: 'stretch',
            borderRadius: 2,
            backgroundColor: colors.primary,
            marginRight: 4,
          }}
        />
        <View style={{ flex: 1 }}>
          <AppText variant="label" weight="bold" style={{ color: colors.text }} numberOfLines={2}>
            {title}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            <AppText variant="caption" style={{ color: colors.subtle }}>
              {group.events.length} sessions
            </AppText>
            {typeBreakdown.slice(0, 4).map(([t, n]) => (
              <View
                key={t}
                style={{
                  backgroundColor: activityTypeColor(t, colors) + '22',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <AppText variant="caption" style={{ color: activityTypeColor(t, colors) }}>
                  {t} {n}
                </AppText>
              </View>
            ))}
          </View>
        </View>
        <Icon name={expanded ? 'expand-less' : 'expand-more'} size={24} color={colors.primary} />
      </TouchableOpacity>

      {expanded ? (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 8 }}>
          {group.events.map((ev, i) => (
            <ScrapedEventCompactRow key={`${group.key}-${ev.time}-${ev.className}-${i}`} model={model} event={ev} />
          ))}
        </View>
      ) : null}
    </ClayView>
  );
}
