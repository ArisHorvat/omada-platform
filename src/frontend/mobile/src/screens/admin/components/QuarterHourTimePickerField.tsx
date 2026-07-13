import React, { useEffect, useMemo, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { ClayTimeSpinner } from '@/src/components/ui/ClayTimeSpinner';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import {
  dateFromQuarterHourTime,
  formatQuarterHourTimeLabel,
  normalizeQuarterHourTime,
  quarterHourTimeFromDate,
} from '@/src/utils/quarterHourTime';

type Props = {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fieldStyle?: StyleProp<ViewStyle>;
  zIndexBase?: number;
  placeholder?: string;
  sheetTitle?: string;
};

export function QuarterHourTimePickerField({
  value,
  onChange,
  label,
  disabled,
  style,
  fieldStyle,
  zIndexBase = 430,
  placeholder = 'Pick time',
  sheetTitle = 'Start time',
}: Props) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const normalized = normalizeQuarterHourTime(value);

  const [draftDate, setDraftDate] = useState(() => dateFromQuarterHourTime(normalized));

  useEffect(() => {
    if (!open) return;
    setDraftDate(dateFromQuarterHourTime(normalizeQuarterHourTime(value)));
  }, [open, value]);

  const display = value?.trim() ? formatQuarterHourTimeLabel(normalized) : placeholder;

  const preview = useMemo(
    () => formatQuarterHourTimeLabel(quarterHourTimeFromDate(draftDate)),
    [draftDate],
  );

  const handleConfirm = () => {
    onChange(quarterHourTimeFromDate(draftDate));
    setOpen(false);
  };

  return (
    <View style={style}>
      {label ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6 }}>
          {label}
        </AppText>
      ) : null}
      <PressClay onPress={() => !disabled && setOpen(true)} disabled={disabled}>
        <ClayView
          depth={1}
          color={colors.card}
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              gap: 12,
              minHeight: 48,
            },
            fieldStyle,
          ]}
        >
          <View style={{ width: 22, alignItems: 'center' }}>
            <Icon name="schedule" size={18} color={colors.primary} />
          </View>
          <AppText variant="body" style={{ flex: 1, color: value?.trim() ? colors.text : colors.subtle }}>
            {display}
          </AppText>
          {!disabled ? <Icon name="expand-more" size={20} color={colors.subtle} /> : null}
        </ClayView>
      </PressClay>

      <BottomSheet isVisible={open} onClose={() => setOpen(false)} height={380} zIndexBase={zIndexBase} contentPadding={16}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <AppText variant="h3" weight="bold" style={{ flex: 1 }}>
            {sheetTitle}
          </AppText>
          <PressClay onPress={() => setOpen(false)}>
            <ClayView depth={4} color={colors.card} style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={20} color={colors.text} />
            </ClayView>
          </PressClay>
        </View>

        <ClayView depth={2} color={colors.primary + '14'} style={{ padding: 14, borderRadius: 14, marginBottom: 8, alignItems: 'center' }}>
          <AppText variant="caption" style={{ color: colors.subtle }}>
            Selected
          </AppText>
          <AppText variant="h2" weight="bold" style={{ color: colors.text }}>
            {preview}
          </AppText>
        </ClayView>

        <ClayTimeSpinner minuteIncrement={15} value={draftDate} onChange={setDraftDate} />

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <AppButton title="Cancel" variant="outline" onPress={() => setOpen(false)} style={{ flex: 1 }} />
          <AppButton title="Set time" onPress={handleConfirm} style={{ flex: 1 }} />
        </View>
      </BottomSheet>
    </View>
  );
}
