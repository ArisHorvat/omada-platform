import React, { useMemo } from 'react';
import { View } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { normalizeEventTypeColor } from '@/src/constants/eventTypeColors';
import { useThemeColors } from '@/src/hooks';
import { createEventTypesWorkspaceStyles } from '../styles/event-types-workspace.styles';

type Props = {
  name: string;
  color: string;
};

export function EventTypeUsagePreview({ name, color }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createEventTypesWorkspaceStyles(colors), [colors]);
  const displayColor = normalizeEventTypeColor(color);
  const label = name.trim() || 'Event type';

  return (
    <View style={styles.previewSection}>
      <AppText variant="label" style={styles.previewLabel}>
        PREVIEW
      </AppText>
      <View style={styles.previewRow}>
        <ClayView color={displayColor} depth={3} style={styles.previewCard}>
          <AppText variant="caption" style={{ color: '#fff', opacity: 0.9 }}>
            09:00 – 10:30
          </AppText>
          <AppText weight="bold" style={{ color: '#fff', fontSize: 14 }} numberOfLines={1}>
            {label}
          </AppText>
          <AppText variant="caption" style={{ color: '#fff', opacity: 0.75 }}>
            Schedule card
          </AppText>
        </ClayView>

        <ClayView color={displayColor} depth={6} style={styles.previewBookingCard}>
          <AppText weight="bold" style={{ color: '#fff', flex: 1 }} numberOfLines={1}>
            {label}
          </AppText>
          <Icon name="check" size={20} color="#FFF" />
        </ClayView>
      </View>
      <AppText variant="caption" style={{ color: colors.subtle, marginTop: 8, lineHeight: 18 }}>
        Colors appear on schedule agenda cards and as the selected pill in room booking.
      </AppText>
    </View>
  );
}
