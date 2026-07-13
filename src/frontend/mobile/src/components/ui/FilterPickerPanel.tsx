import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import { filterPickerRowStyles as pickerStyles, filterPanelCardStyles as panelStyles } from '@/src/styles/filterPickerRow';
import type { IconName } from '@/src/components/ui';

type FilterPickerRowProps = {
  icon: IconName;
  caption: string;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
};

export function FilterPickerRow({ icon, caption, label, onPress, disabled }: FilterPickerRowProps) {
  const colors = useThemeColors();

  return (
    <PressClay onPress={disabled ? undefined : onPress}>
      <View style={[pickerStyles.row, { backgroundColor: colors.background }]}>
        <View style={pickerStyles.iconColumn}>
          <Icon name={icon} size={22} color={colors.primary} />
        </View>
        <View style={pickerStyles.labelBlock}>
          <AppText variant="caption" style={[pickerStyles.caption, { color: colors.subtle }]}>
            {caption}
          </AppText>
          <AppText variant="body" weight="bold" numberOfLines={1}>
            {label}
          </AppText>
        </View>
        {!disabled && onPress ? <Icon name="expand-more" size={22} color={colors.subtle} /> : null}
      </View>
    </PressClay>
  );
}

type FilterPickerPanelProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Stacked filter panel — flat inner rows avoid Clay stroke clipping text at rounded corners. */
export function FilterPickerPanel({ children, style }: FilterPickerPanelProps) {
  const colors = useThemeColors();

  return (
    <ClayView depth={6} contentOverflow="visible" color={colors.card} style={[panelStyles.card, style]}>
      {children}
    </ClayView>
  );
}
