import React from 'react';
import { View } from 'react-native';
import { AppText, ClayView } from '@/src/components/ui';
import type { WebSpiderWorkspaceModel } from '../hooks/useWebSpiderWorkspace';
import {
  activityTypeColor,
  activityTypeOf,
  subjectNameOf,
  type ScrapedScheduleEvent,
} from '../utils/schedulePreviewGrouping';

type Props = {
  model: WebSpiderWorkspaceModel;
  event: ScrapedScheduleEvent;
};

export function ScrapedEventCompactRow({ model, event }: Props) {
  const { colors } = model;
  const type = activityTypeOf(event);
  const typeColor = activityTypeColor(type, colors);

  return (
    <ClayView
      depth={1}
      color={colors.background}
      style={{
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        {type ? (
          <View
            style={{
              backgroundColor: typeColor + '28',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
              marginTop: 2,
            }}
          >
            <AppText variant="caption" weight="bold" style={{ color: typeColor }}>
              {type}
            </AppText>
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <AppText variant="body" weight="bold" style={{ color: colors.text }} numberOfLines={2}>
            {subjectNameOf(event)}
          </AppText>
          <AppText variant="caption" style={{ color: colors.primary, marginTop: 4 }}>
            {event.time || '—'}
          </AppText>
          <View style={{ marginTop: 6, gap: 2 }}>
            {event.room?.trim() ? (
              <AppText variant="caption" style={{ color: colors.subtle }}>
                Room: {event.room}
              </AppText>
            ) : null}
            {event.professor?.trim() ? (
              <AppText variant="caption" style={{ color: colors.subtle }} numberOfLines={1}>
                Teacher: {event.professor}
              </AppText>
            ) : null}
            {event.groupNumber?.trim() ? (
              <AppText variant="caption" style={{ color: colors.subtle }}>
                Group: {event.groupNumber}
              </AppText>
            ) : null}
          </View>
        </View>
      </View>
    </ClayView>
  );
}
