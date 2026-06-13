import React from 'react';
import { View, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';

export type OrganizationTypeValue = 'corporate' | 'university';

type Props = {
  value: OrganizationTypeValue;
  onChange: (value: OrganizationTypeValue) => void;
  label?: string | null;
};

function TypeOption({
  label,
  description,
  icon,
  selected,
  onPress,
}: {
  label: string;
  description: string;
  icon: 'business' | 'school';
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.75}>
      <View
        style={[
          styles.outer,
          selected && { borderColor: colors.primary, backgroundColor: colors.primaryContainer },
        ]}
      >
        <ClayView
          depth={selected ? 8 : 4}
          color={selected ? colors.primaryContainer : colors.card}
          style={styles.option}
        >
          <Icon name={icon} size={24} color={selected ? colors.primary : colors.subtle} />
          <AppText
            variant="label"
            weight={selected ? 'bold' : 'medium'}
            style={{ color: selected ? colors.primary : colors.text, textAlign: 'center' }}
          >
            {label}
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'center' }}>
            {description}
          </AppText>
        </ClayView>
      </View>
    </TouchableOpacity>
  );
}

export function OrganizationTypePicker({ value, onChange, label = null }: Props) {
  const colors = useThemeColors();

  return (
    <View>
      {label ? (
        <AppText variant="caption" style={{ marginBottom: 12, color: colors.subtle }}>
          {label}
        </AppText>
      ) : null}
      <View style={styles.row}>
        <TypeOption
          label="Corporate"
          description="Company or business organization"
          icon="business"
          selected={value === 'corporate'}
          onPress={() => onChange('corporate')}
        />
        <TypeOption
          label="University"
          description="School, college, or campus"
          icon="school"
          selected={value === 'university'}
          onPress={() => onChange('university')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  outer: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 2,
  } as ViewStyle,
  option: {
    borderRadius: 16,
    alignItems: 'center',
    gap: 6,
    padding: 14,
    overflow: 'hidden',
    minHeight: 118,
    justifyContent: 'center',
  },
});
