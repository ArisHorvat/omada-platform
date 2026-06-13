import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Icon } from '@/src/components/ui';
import { eventTypeColorOptions } from '@/src/constants/eventTypeColors';
import { useThemeColors } from '@/src/hooks';
import { createEventTypesWorkspaceStyles } from '../styles/event-types-workspace.styles';

type Props = {
  value: string;
  onChange: (hex: string) => void;
};

export function EventTypeColorPicker({ value, onChange }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createEventTypesWorkspaceStyles(colors), [colors]);
  const options = useMemo(() => eventTypeColorOptions(value), [value]);

  return (
    <View style={styles.colorGrid}>
      {options.map((hex) => {
        const selected = value === hex;
        return (
          <TouchableOpacity key={hex} onPress={() => onChange(hex)} activeOpacity={0.85}>
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: hex },
                selected && styles.colorSwatchSelected,
              ]}
            >
              {selected ? <Icon name="check" size={18} color="#FFF" /> : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
