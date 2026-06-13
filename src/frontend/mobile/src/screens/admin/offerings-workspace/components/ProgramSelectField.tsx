import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { useThemeColors } from '@/src/hooks';
import type { PickerOption } from '@/src/components/filters/OptionPickerSheet';

type Props = {
  label?: string;
  hint?: string;
  options: PickerOption<string>[];
  selectedId: string;
  onChange: (id: string) => void;
  placeholder?: string;
  pickerTitle?: string;
  includeAllOption?: boolean;
  allLabel?: string;
};

export function ProgramSelectField({
  label,
  hint,
  options,
  selectedId,
  onChange,
  placeholder = 'Select program',
  pickerTitle = 'Program',
  includeAllOption = true,
  allLabel = 'Use package default',
}: Props) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);

  const summary = useMemo(() => {
    if (!selectedId) return placeholder;
    return options.find((o) => o.value === selectedId)?.label ?? placeholder;
  }, [options, placeholder, selectedId]);

  return (
    <>
      {label ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6 }}>
          {label}
        </AppText>
      ) : null}
      {hint ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8, lineHeight: 18 }}>
          {hint}
        </AppText>
      ) : null}
      <PressClay onPress={() => setOpen(true)}>
        <ClayView depth={2} color={colors.card} style={styles.selectField}>
          <AppText
            variant="body"
            weight="medium"
            numberOfLines={2}
            style={{ flex: 1, color: selectedId ? colors.text : colors.subtle }}
          >
            {summary}
          </AppText>
          <Icon name="expand-more" size={22} color={colors.subtle} />
        </ClayView>
      </PressClay>

      <SearchableOptionPickerSheet
        isVisible={open}
        onClose={() => setOpen(false)}
        title={pickerTitle}
        searchPlaceholder="Search programs…"
        options={options}
        selected={selectedId || null}
        onSelect={(id) => onChange(id ?? '')}
        includeAllOption={includeAllOption}
        allLabel={allLabel}
        height={440}
        zIndexBase={260}
      />
    </>
  );
}

const styles = {
  selectField: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
};
