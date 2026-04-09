import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { AppText, ClayView, Icon, type IconName } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import type { PickerOption } from './OptionPickerSheet';

interface MultiOptionPickerSheetProps<T extends string | number> {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  options: PickerOption<T>[];
  /** Selected option values (multi). */
  selected: T[];
  onChange: (next: T[]) => void;
  height?: number;
  zIndexBase?: number;
  contentInsetBottom?: number;
  /** Tap to clear all selections. */
  clearLabel?: string;
}

export function MultiOptionPickerSheet<T extends string | number>({
  isVisible,
  onClose,
  title,
  options,
  selected,
  onChange,
  height,
  zIndexBase = 220,
  contentInsetBottom = 0,
  clearLabel = 'Clear all',
}: MultiOptionPickerSheetProps<T>) {
  const colors = useThemeColors();
  const set = useMemo(() => new Set(selected.map(String)), [selected]);

  const row = (active: boolean) => ({
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: active ? colors.primary : colors.border,
    backgroundColor: active ? colors.primary + '14' : colors.card,
    minHeight: 52,
  });

  const toggle = (v: T) => {
    const key = String(v);
    const next = new Set(selected.map(String));
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    const ordered = options.filter((o) => next.has(String(o.value))).map((o) => o.value);
    onChange(ordered);
  };

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      height={height}
      zIndexBase={zIndexBase}
      contentInsetBottom={contentInsetBottom}
    >
      <View style={styles.sheetInner}>
        <View style={styles.header}>
          <AppText variant="h3" weight="bold" style={styles.headerTitle}>
            {title}
          </AppText>
          <PressClay onPress={onClose}>
            <ClayView depth={8} puffy={10} color={colors.card} style={styles.closeBtn}>
              <Icon name="close" size={22} color={colors.subtle} />
            </ClayView>
          </PressClay>
        </View>

        {selected.length > 0 ? (
          <PressClay onPress={() => onChange([])}>
            <ClayView depth={4} color={colors.card} style={styles.clearRow}>
              <Icon name="filter-alt" size={20} color={colors.subtle} />
              <AppText weight="bold" style={{ color: colors.primary, flex: 1, marginLeft: 10 }}>
                {clearLabel}
              </AppText>
            </ClayView>
          </PressClay>
        ) : null}

        <ScrollView
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {options.map((o) => {
            const active = set.has(String(o.value));
            return (
              <PressClay key={String(o.value)} onPress={() => toggle(o.value)}>
                <ClayView depth={6} puffy={0} color={colors.card} style={row(active)}>
                  <View style={styles.rowInner}>
                    {o.icon ? <Icon name={o.icon as IconName} size={20} color={active ? colors.primary : colors.subtle} /> : null}
                    <View style={styles.rowText}>
                      <AppText weight="bold" numberOfLines={3} style={{ color: active ? colors.primary : colors.text }}>
                        {o.label}
                      </AppText>
                      {o.subtitle ? (
                        <AppText variant="caption" numberOfLines={4} style={{ color: colors.subtle, marginTop: 4 }}>
                          {o.subtitle}
                        </AppText>
                      ) : null}
                    </View>
                    {active ? <Icon name="check" size={22} color={colors.primary} /> : null}
                  </View>
                </ClayView>
              </PressClay>
            );
          })}
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetInner: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  headerTitle: { flex: 1, paddingRight: 8 },
  closeBtn: { borderRadius: 16 },
  clearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  scroll: { flex: 1 },
  list: { gap: 10, paddingBottom: 16 },
  rowInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rowText: { flex: 1 },
});
