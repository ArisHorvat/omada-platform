import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PressClay } from '@/src/components/animations';
import { OptionPickerSheet } from '@/src/components/filters/OptionPickerSheet';
import { AppFormField, AppText, ClayView, Icon, type IconName } from '@/src/components/ui';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { useThemeColors } from '@/src/hooks';
import type { DirectoryGroupOptionDto } from '@/src/api/usersDirectoryApi';
import { groupsWorkspaceStyles as groupStyles } from '@/src/screens/admin/groups-workspace/styles/groupsWorkspace.styles';
import {
  canonicalGroupTypeKey,
  typeKeysMatchingFilter,
} from '@/src/screens/admin/groups-workspace/utils/groupTypeLabels';
import { getDirectoryGroupTypeCatalog } from '../utils/directoryGroupTypeCatalog';

type Props = {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  allLabel: string;
  searchPlaceholder: string;
  typeFilterAllLabel: string;
  typeFilterLabel: string;
  typeFilterPickerTitle: string;
  orgType?: string | null;
  groups: DirectoryGroupOptionDto[];
  selected: string | null;
  onSelect: (groupId: string | null) => void;
  height?: number;
  zIndexBase?: number;
};

function memberCountLabel(count: number): string {
  return `${count} member${count === 1 ? '' : 's'}`;
}

export function DirectoryGroupPickerSheet({
  isVisible,
  onClose,
  title,
  allLabel,
  searchPlaceholder,
  typeFilterAllLabel,
  typeFilterLabel,
  typeFilterPickerTitle,
  orgType,
  groups,
  selected,
  onSelect,
  height = 560,
  zIndexBase = 220,
}: Props) {
  const colors = useThemeColors();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setQuery('');
      setTypeFilter(null);
      setTypePickerOpen(false);
    }
  }, [isVisible]);

  const typeCatalog = useMemo(() => getDirectoryGroupTypeCatalog(orgType), [orgType]);

  const typePickerOptions = useMemo(
    () =>
      typeCatalog
        .filter((type) => {
          const keys = typeKeysMatchingFilter(type.key);
          return groups.some((g) => keys.has(canonicalGroupTypeKey(g.type ?? 'group')));
        })
        .map((type) => ({
          value: type.key,
          label: type.label,
          icon: 'category' as const,
        })),
    [groups, typeCatalog],
  );

  const typeFilterSummary =
    typeFilter === null
      ? typeFilterAllLabel
      : (typePickerOptions.find((o) => o.value === typeFilter)?.label ?? typeFilterAllLabel);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const typeKeys = typeFilter ? typeKeysMatchingFilter(typeFilter) : null;

    return groups.filter((g) => {
      if (typeKeys && !typeKeys.has(canonicalGroupTypeKey(g.type ?? 'group'))) return false;
      if (!q) return true;
      return g.name.toLowerCase().includes(q);
    });
  }, [groups, query, typeFilter]);

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
    <>
      <BottomSheet
        isVisible={isVisible}
        onClose={onClose}
        height={height}
        zIndexBase={zIndexBase}
      >
        <View style={styles.sheetInner}>
          <View style={styles.header}>
            <AppText variant="h3" weight="bold" style={{ flex: 1 }}>
              {title}
            </AppText>
            <PressClay onPress={onClose}>
              <ClayView depth={4} color={colors.card} style={styles.closeBtn}>
                <Icon name="close" size={22} color={colors.subtle} />
              </ClayView>
            </PressClay>
          </View>

          {typePickerOptions.length > 1 ? (
            <View style={{ marginBottom: 12 }}>
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6 }}>
                {typeFilterLabel}
              </AppText>
              <PressClay onPress={() => setTypePickerOpen(true)}>
                <ClayView depth={2} color={colors.card} style={groupStyles.selectField}>
                  <AppText variant="body" weight="medium" numberOfLines={1} style={{ flex: 1 }}>
                    {typeFilterSummary}
                  </AppText>
                  <Icon name="expand-more" size={22} color={colors.subtle} />
                </ClayView>
              </PressClay>
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
              <PickerRow
                active={selected === null}
                icon="filter-alt"
                label={allLabel}
                onPress={() => {
                  onSelect(null);
                  onClose();
                }}
                colors={colors}
                rowStyle={rowStyle}
              />
              {filteredGroups.map((g) => (
                <PickerRow
                  key={g.id}
                  active={selected === g.id}
                  icon="groups"
                  label={g.name}
                  subtitle={memberCountLabel(g.memberCount)}
                  onPress={() => {
                    onSelect(g.id);
                    onClose();
                  }}
                  colors={colors}
                  rowStyle={rowStyle}
                />
              ))}
              {filteredGroups.length === 0 ? (
                <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'center', marginTop: 8 }}>
                  {query.trim() ? `No matches for “${query.trim()}”.` : 'No groups for this type.'}
                </AppText>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </BottomSheet>

      <OptionPickerSheet
        isVisible={typePickerOpen}
        onClose={() => setTypePickerOpen(false)}
        title={typeFilterPickerTitle}
        options={typePickerOptions}
        selected={typeFilter}
        onSelect={setTypeFilter}
        allLabel={typeFilterAllLabel}
        height={480}
        zIndexBase={zIndexBase + 20}
      />
    </>
  );
}

function PickerRow({
  active,
  icon,
  label,
  subtitle,
  onPress,
  colors,
  rowStyle,
}: {
  active: boolean;
  icon: IconName;
  label: string;
  subtitle?: string;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
  rowStyle: (active: boolean) => object;
}) {
  return (
    <PressClay onPress={onPress}>
      <ClayView depth={4} color={colors.card} style={rowStyle(active)}>
        <View style={styles.rowInner}>
          <Icon name={icon} size={20} color={active ? colors.primary : colors.subtle} />
          <View style={styles.rowText}>
            <AppText weight="bold" numberOfLines={2} style={{ color: active ? colors.primary : colors.text }}>
              {label}
            </AppText>
            {subtitle ? (
              <AppText variant="caption" numberOfLines={1} style={{ color: colors.subtle, marginTop: 2 }}>
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
  closeBtn: { padding: 8, borderRadius: 12 },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { flex: 1, minWidth: 0 },
});
