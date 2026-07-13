import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { AppFormField, AppText, ClayView, Icon, type IconName } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import type { WebOverlayAnchor } from '@/src/hooks/usePaneOverlayAnchor';
import type { PickerOption } from '@/src/components/filters/OptionPickerSheet';

type Props<T> = {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  options: PickerOption<T>[];
  selected: T | null;
  onSelect: (v: T | null) => void;
  height?: number;
  includeAllOption?: boolean;
  allLabel?: string;
  searchPlaceholder?: string;
  zIndexBase?: number;
  webAnchor?: WebOverlayAnchor | null;
  /** Shown as a button beside close — for “create new” flows instead of a list row. */
  createAction?: { label: string; onPress: () => void };
  /** Extra header actions (e.g. pending host / invite) shown above the search field. */
  headerActions?: { label: string; onPress: () => void }[];
};

export function SearchableOptionPickerSheet<T extends string>({
  isVisible,
  onClose,
  title,
  options,
  selected,
  onSelect,
  height,
  includeAllOption = true,
  allLabel = 'All',
  searchPlaceholder = 'Search…',
  zIndexBase = 220,
  webAnchor = null,
  createAction,
  headerActions,
}: Props<T>) {
  const colors = useThemeColors();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isVisible) setQuery('');
  }, [isVisible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subtitle?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query]);

  const rowStyle = (active: boolean) => ({
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: active ? colors.primary : colors.border,
    backgroundColor: active ? colors.primary + '14' : colors.card,
    minHeight: 48,
  });

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      height={height}
      zIndexBase={zIndexBase}
      webAnchor={webAnchor}
    >
      <View style={styles.sheetInner}>
        <View style={styles.header}>
          <AppText variant="h3" weight="bold" style={{ flex: 1 }}>
            {title}
          </AppText>
          <View style={styles.headerActions}>
            {createAction ? (
              <PressClay onPress={createAction.onPress}>
                <ClayView depth={4} color={colors.card} style={styles.createBtn}>
                  <Icon name="add" size={20} color={colors.primary} />
                  <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
                    {createAction.label}
                  </AppText>
                </ClayView>
              </PressClay>
            ) : null}
            <PressClay onPress={onClose}>
              <ClayView depth={4} color={colors.card} style={styles.closeBtn}>
                <Icon name="close" size={22} color={colors.subtle} />
              </ClayView>
            </PressClay>
          </View>
        </View>

        {headerActions?.length ? (
          <View style={{ gap: 8, marginBottom: 12 }}>
            {headerActions.map((action) => (
              <PressClay key={action.label} onPress={action.onPress}>
                <ClayView depth={4} color={colors.card} style={styles.headerActionBtn}>
                  <Icon name="add" size={18} color={colors.primary} />
                  <AppText variant="caption" weight="bold" style={{ color: colors.primary, flex: 1 }}>
                    {action.label}
                  </AppText>
                </ClayView>
              </PressClay>
            ))}
          </View>
        ) : null}

        <AppFormField
          value={query}
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
          icon="search"
          autoCapitalize="none"
          autoCorrect={false}
          style={{ marginBottom: 12 }}
        />

        <ScrollView
          style={styles.listScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <View style={{ gap: 8, paddingBottom: 16 }}>
            {includeAllOption
              ? renderRow(
                  '__all__',
                  selected === null,
                  'filter-alt',
                  allLabel,
                  undefined,
                  () => {
                    onSelect(null);
                    onClose();
                  },
                  colors,
                  rowStyle,
                )
              : null}
            {filtered.map((o) =>
              renderRow(
                String(o.value),
                selected === o.value,
                o.icon,
                o.label,
                o.subtitle,
                () => {
                  onSelect(o.value);
                  onClose();
                },
                colors,
                rowStyle,
              ),
            )}
            {filtered.length === 0 ? (
              <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'center', marginTop: 8 }}>
                No matches for “{query}”.
              </AppText>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

function renderRow(
  key: string,
  active: boolean,
  icon: string | undefined,
  label: string,
  subtitle: string | undefined,
  onPress: () => void,
  colors: ReturnType<typeof useThemeColors>,
  rowStyle: (active: boolean) => object,
) {
  return (
    <PressClay key={key} onPress={onPress}>
      <ClayView depth={4} color={colors.card} style={rowStyle(active)}>
        <View style={styles.rowInner}>
          {icon ? (
            <Icon name={icon as IconName} size={20} color={active ? colors.primary : colors.subtle} />
          ) : null}
          <View style={styles.rowText}>
            <AppText weight="bold" numberOfLines={2} style={{ color: active ? colors.primary : colors.text }}>
              {label}
            </AppText>
            {subtitle ? (
              <AppText variant="caption" numberOfLines={2} style={{ color: colors.subtle, marginTop: 2 }}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {active ? <Icon name="check" size={22} color={colors.primary} /> : null}
        </View>
      </ClayView>
    </PressClay>
  );
}

const styles = StyleSheet.create({
  sheetInner: { flex: 1, minHeight: 0 },
  listScroll: { flex: 1, minHeight: 0 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  closeBtn: { padding: 8, borderRadius: 12 },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { flex: 1 },
});
