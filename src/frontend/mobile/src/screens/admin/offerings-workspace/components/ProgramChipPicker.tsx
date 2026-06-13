import { useMemo } from 'react';
import { View } from 'react-native';

import { AppText, ClayView } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';

type ProgramOption = { value: string; label: string };

type Props = {
  options: ProgramOption[];
  selectedIds: string[];
  onToggle: (programId: string) => void;
  emptyHint?: string;
};

export function ProgramChipPicker({ options, selectedIds, onToggle, emptyHint }: Props) {
  const colors = useThemeColors();

  if (options.length === 0) {
    return (
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
        {emptyHint ?? 'Create program groups in Groups workspace first.'}
      </AppText>
    );
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
      {options.map((opt) => {
        const active = selectedIds.includes(opt.value);
        return (
          <PressClay key={opt.value} onPress={() => onToggle(opt.value)}>
            <ClayView
              depth={active ? 3 : 1}
              color={active ? colors.primary + '22' : colors.card}
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}
            >
              <AppText variant="caption" weight={active ? 'bold' : 'medium'} style={{ color: active ? colors.primary : colors.text }}>
                {opt.label}
              </AppText>
            </ClayView>
          </PressClay>
        );
      })}
    </View>
  );
}
