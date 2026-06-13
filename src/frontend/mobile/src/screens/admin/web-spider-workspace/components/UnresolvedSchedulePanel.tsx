import React from 'react';
import { View } from 'react-native';
import { AppText, ClayView } from '@/src/components/ui';
import type { UnresolvedScrapedEventDto } from '@/src/api/generatedClient';

type Props = {
  colors: { card: string; text: string; subtle: string; border: string; primary: string };
  events: UnresolvedScrapedEventDto[];
  loading?: boolean;
};

export function UnresolvedSchedulePanel({ colors, events, loading }: Props) {
  return (
    <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
      <AppText variant="label" style={{ color: colors.subtle, marginBottom: 6 }}>
        Unresolved entities
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10, lineHeight: 18 }}>
        Scraped rows where a professor or room label could not be matched to directory users or map rooms.
      </AppText>
      {loading ? (
        <AppText variant="caption" style={{ color: colors.subtle }}>
          Loading…
        </AppText>
      ) : !events.length ? (
        <AppText variant="caption" style={{ color: colors.subtle }}>
          All scraped professors and rooms are resolved, or no sync has run yet.
        </AppText>
      ) : (
        events.slice(0, 12).map((event) => (
          <View
            key={event.id}
            style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}
          >
            <AppText variant="body" weight="bold" style={{ color: colors.text }}>
              {event.className}
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle }}>
              {event.time} · Group {event.groupNumber}
            </AppText>
            {event.missingHost ? (
              <AppText variant="caption" style={{ color: colors.primary, marginTop: 2 }}>
                Unmatched professor: {event.professor || '—'}
              </AppText>
            ) : null}
            {event.missingRoom ? (
              <AppText variant="caption" style={{ color: colors.primary, marginTop: 2 }}>
                Unmatched room: {event.roomText || '—'}
              </AppText>
            ) : null}
          </View>
        ))
      )}
    </ClayView>
  );
}
