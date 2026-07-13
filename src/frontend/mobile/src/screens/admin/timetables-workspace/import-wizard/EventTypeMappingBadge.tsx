import React from 'react';
import { View } from 'react-native';

import { AppText, ClayView } from '@/src/components/ui';
import { normalizeEventTypeColor } from '@/src/constants/eventTypeColors';

type Props = {
  name: string;
  colorHex?: string | null;
  compact?: boolean;
};

export function EventTypeMappingBadge({ name, colorHex, compact = false }: Props) {
  const color = normalizeEventTypeColor(colorHex);
  const label = name.trim() || 'Event type';

  if (compact) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
        <AppText variant="caption" weight="bold" style={{ color }}>
          {label}
        </AppText>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <ClayView color={color} depth={3} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}>
        <AppText variant="caption" weight="bold" style={{ color: '#fff' }} numberOfLines={1}>
          {label}
        </AppText>
      </ClayView>
    </View>
  );
}
