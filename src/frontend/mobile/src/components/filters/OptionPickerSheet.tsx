import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { AppText, ClayView, Icon, type IconName } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';

export interface PickerOption<T> {
  value: T;
  label: string;
  /** Optional second line (e.g. long description). */
  subtitle?: string;
  icon?: string;
}

interface OptionPickerSheetProps<T> {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  options: PickerOption<T>[];
  selected: T | null;
  onSelect: (v: T | null) => void;
  height?: number;
  includeAllOption?: boolean;
  allLabel?: string;
  /** Stack above another sheet (e.g. filters). Default 220. */
  zIndexBase?: number;
  contentInsetBottom?: number;
}

/**
 * Reusable option picker sheet (full-width rows, close control top-right).
 * Render as a sibling of other bottom sheets so it is not clipped or stacked under them.
 */
export function OptionPickerSheet<T>({
  isVisible,
  onClose,
  title,
  options,
  selected,
  onSelect,
  height,
  includeAllOption = true,
  allLabel = 'All',
  zIndexBase = 220,
  contentInsetBottom = 0,
}: OptionPickerSheetProps<T>) {
  const colors = useThemeColors();

  const row = (active: boolean) => ({
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: active ? colors.primary : colors.border,
    backgroundColor: active ? colors.primary + '14' : colors.card,
    minHeight: 52,
  });

  const renderRow = (key: string, active: boolean, icon: string | undefined, label: string, subtitle: string | undefined, onPress: () => void) => (
    <PressClay key={key} onPress={onPress}>
      <ClayView depth={6} puffy={0} color={colors.card} style={row(active)}>
        <View style={styles.rowInner}>
          {icon ? <Icon name={icon as IconName} size={20} color={active ? colors.primary : colors.subtle} /> : null}
          <View style={styles.rowText}>
            <AppText weight="bold" numberOfLines={3} style={{ color: active ? colors.primary : colors.text }}>
              {label}
            </AppText>
            {subtitle ? (
              <AppText variant="caption" numberOfLines={4} style={{ color: colors.subtle, marginTop: 4 }}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {active ? <Icon name="check" size={22} color={colors.primary} /> : null}
        </View>
      </ClayView>
    </PressClay>
  );

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

        <ScrollView
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {includeAllOption
            ? renderRow(
                '__all__',
                selected === null,
                'filter-alt',
                allLabel,
                'Show every item in this list.',
                () => {
                  onSelect(null);
                  onClose();
                },
              )
            : null}

          {options.map((o) =>
            renderRow(
              String(o.label),
              selected === o.value,
              o.icon,
              o.label,
              o.subtitle,
              () => {
                onSelect(o.value);
                onClose();
              },
            ),
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetInner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    paddingRight: 8,
  },
  closeBtn: {
    borderRadius: 16,
  },
  scroll: {
    flex: 1,
  },
  list: {
    gap: 10,
    paddingBottom: 16,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
});
