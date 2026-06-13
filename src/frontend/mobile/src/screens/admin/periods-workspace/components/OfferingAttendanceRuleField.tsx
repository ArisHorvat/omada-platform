import React, { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';

import { AppButton, AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import type { CourseOfferingDto } from '@/src/api/offeringsApi';
import { createPeriodsWorkspaceStyles } from '../styles/periods-workspace.styles';

type Props = {
  offering: CourseOfferingDto;
  saving?: boolean;
  onSave: (offering: CourseOfferingDto, percent: number | null) => void;
};

export function OfferingAttendanceRuleField({ offering, saving, onSave }: Props) {
  const colors = useThemeColors();
  const styles = createPeriodsWorkspaceStyles(colors);
  const initial =
    offering.requiredAttendancePercent != null ? String(offering.requiredAttendancePercent) : '';
  const [value, setValue] = useState(initial);

  useEffect(() => {
    setValue(
      offering.requiredAttendancePercent != null ? String(offering.requiredAttendancePercent) : '',
    );
  }, [offering.id, offering.requiredAttendancePercent]);

  const trimmed = value.trim();
  const parsed = trimmed === '' ? null : Number(trimmed.replace(',', '.'));
  const current =
    offering.requiredAttendancePercent != null ? offering.requiredAttendancePercent : null;
  const dirty =
    trimmed === ''
      ? current != null
      : Number.isFinite(parsed!) && parsed !== current;

  return (
    <View style={{ marginTop: 10, gap: 8 }}>
      <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
        Required attendance (%)
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle }}>
        Leave empty for no minimum. Students see progress against this on the Attendance screen.
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TextInput
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          placeholder="e.g. 80"
          placeholderTextColor={colors.subtle}
          style={[styles.input, { flex: 1, minHeight: 44 }]}
        />
        <AppButton
          title={saving ? 'Saving…' : 'Save'}
          size="sm"
          variant="secondary"
          disabled={
            !dirty ||
            saving ||
            (trimmed !== '' && (!Number.isFinite(parsed!) || parsed! < 0 || parsed! > 100))
          }
          onPress={() => onSave(offering, parsed)}
        />
      </View>
    </View>
  );
}
