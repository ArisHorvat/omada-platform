import React, { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';

import { AppButton, AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import type { CourseOfferingDto } from '@/src/api/offeringsApi';
import { createPeriodsWorkspaceStyles } from '../styles/periods-workspace.styles';

type Props = {
  offering: CourseOfferingDto;
  saving?: boolean;
  onSave: (offering: CourseOfferingDto, credits: number) => void;
};

export function OfferingCreditsField({ offering, saving, onSave }: Props) {
  const colors = useThemeColors();
  const styles = createPeriodsWorkspaceStyles(colors);
  const [value, setValue] = useState(String(offering.credits ?? 0));

  useEffect(() => {
    setValue(String(offering.credits ?? 0));
  }, [offering.id, offering.credits]);

  const parsed = Number(value.replace(',', '.'));
  const dirty = Number.isFinite(parsed) && parsed !== (offering.credits ?? 0);

  return (
    <View style={{ marginTop: 10, gap: 8 }}>
      <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
        Credits (transcript)
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TextInput
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.subtle}
          style={[styles.input, { flex: 1, minHeight: 44 }]}
        />
        <AppButton
          title={saving ? 'Saving…' : 'Save'}
          size="sm"
          variant="secondary"
          disabled={!dirty || saving || !Number.isFinite(parsed) || parsed < 0}
          onPress={() => onSave(offering, parsed)}
        />
      </View>
    </View>
  );
}
