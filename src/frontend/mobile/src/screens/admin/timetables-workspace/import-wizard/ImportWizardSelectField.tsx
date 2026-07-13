import React from 'react';
import { View } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';

type Props = {
  label: string;
  value: string | null;
  placeholder: string;
  hint?: string;
  colors: { card: string; text: string; subtle: string };
  onPress: () => void;
};

export function ImportWizardSelectField({
  label,
  value,
  placeholder,
  hint,
  colors,
  onPress,
}: Props) {
  return (
    <View style={{ marginBottom: 12 }}>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6 }}>
        {label}
      </AppText>
      <PressClay onPress={onPress}>
        <ClayView
          depth={2}
          color={colors.card}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 12,
            minHeight: 48,
          }}
        >
          <AppText
            variant="body"
            weight="medium"
            numberOfLines={2}
            style={{ flex: 1, color: value ? colors.text : colors.subtle }}
          >
            {value ?? placeholder}
          </AppText>
          <Icon name="expand-more" size={22} color={colors.subtle} />
        </ClayView>
      </PressClay>
      {hint ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6, lineHeight: 16 }}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
