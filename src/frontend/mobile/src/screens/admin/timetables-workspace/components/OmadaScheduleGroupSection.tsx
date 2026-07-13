import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import type { TimetableDisplaySlot } from '../utils/timetableDisplaySlots';
import {
  displaySlotGroupsLabel,
  displaySlotSummary,
  resolveSlotColor,
} from '../utils/timetableDisplaySlots';

type Colors = {
  card: string;
  text: string;
  subtle: string;
  primary: string;
};

type Props = {
  colors: Colors;
  group: { key: string; label: string; slots: TimetableDisplaySlot[] };
  defaultExpanded?: boolean;
  themePrimary?: string;
};

export function TimetableDisplaySlotRow({
  colors,
  slot,
  themePrimary,
}: {
  colors: Colors;
  slot: TimetableDisplaySlot;
  themePrimary: string;
}) {
  const accent = resolveSlotColor(slot, themePrimary);
  return (
    <ClayView depth={1} color={colors.card} style={{ borderRadius: 10, padding: 10, flexDirection: 'row', gap: 10 }}>
      <View style={{ width: 4, borderRadius: 2, backgroundColor: accent, alignSelf: 'stretch' }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="body" weight="bold" numberOfLines={2} style={{ color: colors.text }}>
          {slot.title}
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
          {displaySlotSummary(slot)}
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }}>
          {displaySlotGroupsLabel(slot)}
        </AppText>
      </View>
    </ClayView>
  );
}

export function TimetableDisplayGroupSection({
  colors,
  group,
  defaultExpanded = false,
  themePrimary = colors.primary,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

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
            {group.label}
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
            {group.slots.length} session{group.slots.length === 1 ? '' : 's'}
          </AppText>
        </View>
        <Icon name={expanded ? 'expand-less' : 'expand-more'} size={24} color={colors.primary} />
      </TouchableOpacity>

      {expanded ? (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 8 }}>
          {group.slots.map((slot) => (
            <TimetableDisplaySlotRow key={slot.displayKey} colors={colors} slot={slot} themePrimary={themePrimary} />
          ))}
        </View>
      ) : null}
    </ClayView>
  );
}

export const OmadaScheduleGroupSection = TimetableDisplayGroupSection;
