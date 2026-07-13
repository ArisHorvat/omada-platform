import React from 'react';
import { View } from 'react-native';

import { AppText } from '@/src/components/ui';
import type { ImportWizardStep } from './importWizardTypes';

const STEPS: { id: ImportWizardStep; label: string }[] = [
  { id: 'context', label: 'Context' },
  { id: 'map', label: 'Map labels' },
  { id: 'review', label: 'Review & apply' },
];

type Props = {
  colors: { primary: string; subtle: string; border: string; text: string };
  current: ImportWizardStep;
};

export function ImportWizardStepper({ colors, current }: Props) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);

  return (
    <View style={{ flexDirection: 'row', marginBottom: 14, gap: 4 }}>
      {STEPS.map((s, i) => {
        const active = s.id === current;
        const done = i < currentIdx;
        return (
          <View key={s.id} style={{ flex: 1, alignItems: 'center' }}>
            <View
              style={{
                height: 4,
                width: '100%',
                borderRadius: 2,
                backgroundColor: active || done ? colors.primary : colors.border,
                marginBottom: 6,
              }}
            />
            <AppText
              variant="caption"
              weight={active ? 'bold' : 'regular'}
              style={{ color: active ? colors.primary : colors.subtle, fontSize: 10, textAlign: 'center' }}
            >
              {s.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}
