import React from 'react';
import { View } from 'react-native';

import { AppText, ClayView } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';

type Props = {
  title: string;
  description: string;
  selected: boolean;
  colors: { primary: string; border: string; background: string; text: string; subtle: string };
  onPress: () => void;
};

export function ImportWizardOptionRow({ title, description, selected, colors, onPress }: Props) {
  return (
    <PressClay onPress={onPress}>
      <ClayView
        depth={1}
        color={colors.background}
        style={{
          borderRadius: 12,
          padding: 12,
          marginBottom: 8,
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? colors.primary : colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              borderWidth: 2,
              borderColor: selected ? colors.primary : colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
            }}
          >
            {selected ? (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.primary,
                }}
              />
            ) : null}
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="body" weight="bold" style={{ color: colors.text }}>
              {title}
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4, lineHeight: 18 }}>
              {description}
            </AppText>
          </View>
        </View>
      </ClayView>
    </PressClay>
  );
}
