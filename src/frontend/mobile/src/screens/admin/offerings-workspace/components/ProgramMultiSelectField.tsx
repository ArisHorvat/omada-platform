import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import { AppFormField } from '@/src/components/ui/AppFormField';

type ProgramOption = { value: string; label: string };

type Props = {
  label?: string;
  hint?: string;
  options: ProgramOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  emptyHint?: string;
  pickerTitle?: string;
  placeholder?: string;
};

export function ProgramMultiSelectField({
  label,
  hint,
  options,
  selectedIds,
  onChange,
  emptyHint,
  pickerTitle = 'Programs',
  placeholder = 'Select programs',
}: Props) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const summary = useMemo(() => {
    if (selectedIds.length === 0) return placeholder;
    const labels = selectedIds
      .map((id) => options.find((o) => o.value === id)?.label)
      .filter(Boolean);
    if (labels.length <= 2) return labels.join(', ');
    return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
  }, [options, placeholder, selectedIds]);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  if (options.length === 0) {
    return (
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
        {emptyHint ?? 'Create program groups in Groups workspace first.'}
      </AppText>
    );
  }

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
            style={{ flex: 1, color: selectedIds.length ? colors.text : colors.subtle }}
          >
            {summary}
          </AppText>
          <Icon name="expand-more" size={22} color={colors.subtle} />
        </ClayView>
      </PressClay>

      <BottomSheet isVisible={open} onClose={() => setOpen(false)} height={480} zIndexBase={280}>
        <View style={styles.sheetInner}>
          <View style={styles.header}>
            <AppText variant="h3" weight="bold" style={{ flex: 1 }}>
              {pickerTitle}
            </AppText>
            <PressClay onPress={() => setOpen(false)}>
              <ClayView depth={4} color={colors.card} style={styles.closeBtn}>
                <Icon name="close" size={18} color={colors.subtle} />
              </ClayView>
            </PressClay>
          </View>

          <AppFormField
            value={query}
            onChangeText={setQuery}
            placeholder="Search programs…"
            icon="search"
            style={{ marginBottom: 10 }}
          />

          <ScrollView keyboardShouldPersistTaps="handled">
            {filtered.map((opt) => {
              const active = selectedIds.includes(opt.value);
              return (
                <PressClay key={opt.value} onPress={() => toggle(opt.value)}>
                  <ClayView
                    depth={active ? 3 : 1}
                    color={active ? colors.primary + '14' : colors.card}
                    style={[
                      styles.row,
                      { borderColor: active ? colors.primary : colors.border },
                    ]}
                  >
                    <AppText variant="body" weight={active ? 'bold' : 'medium'} style={{ flex: 1 }}>
                      {opt.label}
                    </AppText>
                    {active ? <Icon name="check" size={20} color={colors.primary} /> : null}
                  </ClayView>
                </PressClay>
              );
            })}
          </ScrollView>

          <PressClay onPress={() => setOpen(false)}>
            <ClayView depth={3} color={colors.primary + '22'} style={styles.doneBtn}>
              <AppText variant="label" weight="bold" style={{ color: colors.primary, textAlign: 'center' }}>
                Done ({selectedIds.length} selected)
              </AppText>
            </ClayView>
          </PressClay>
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  sheetInner: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginBottom: 8,
    minHeight: 48,
  },
  doneBtn: { marginTop: 12, paddingVertical: 14, borderRadius: 14 },
});
