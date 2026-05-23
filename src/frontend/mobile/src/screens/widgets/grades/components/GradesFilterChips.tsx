import React from 'react';
import { ScrollView } from 'react-native';

import { AppText, ClayView } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';

export type GradesFilterChip = { id: string; label: string };

interface GradesFilterChipsProps {
  chips: GradesFilterChip[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  allLabel?: string;
}

export function GradesFilterChips({
  chips,
  activeId,
  onSelect,
  allLabel = 'All',
}: GradesFilterChipsProps) {
  const colors = useThemeColors();
  if (chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12, paddingTop: 4 }}
    >
      <PressClay onPress={() => onSelect(null)}>
        <ClayView
          depth={activeId === null ? 4 : 2}
          color={activeId === null ? colors.primary : colors.card}
          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 }}
        >
          <AppText weight="bold" style={{ color: activeId === null ? '#FFF' : colors.text }}>
            {allLabel}
          </AppText>
        </ClayView>
      </PressClay>
      {chips.map((chip) => {
        const active = activeId === chip.id;
        return (
          <PressClay key={chip.id} onPress={() => onSelect(chip.id)}>
            <ClayView
              depth={active ? 4 : 2}
              color={active ? colors.primary : colors.card}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 }}
            >
              <AppText
                weight="bold"
                numberOfLines={1}
                style={{ color: active ? '#FFF' : colors.text, maxWidth: 160 }}
              >
                {chip.label}
              </AppText>
            </ClayView>
          </PressClay>
        );
      })}
    </ScrollView>
  );
}
