import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { AppFormField, AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { useThemeColors } from '@/src/hooks';
import { useDebounce } from '@/src/hooks';
import { useGroupStaffPicker } from '../hooks/useGroupStaffPicker';

type Props = {
  label?: string;
  hint?: string;
  selectedId: string;
  onChange: (id: string) => void;
  placeholder?: string;
  pickerTitle?: string;
  includeAllOption?: boolean;
  allLabel?: string;
};

export function StaffSelectField({
  label,
  hint,
  selectedId,
  onChange,
  placeholder = 'Select staff',
  pickerTitle = 'Choose staff',
  includeAllOption = true,
  allLabel = 'No host yet',
}: Props) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const [groupFilterId, setGroupFilterId] = useState<string | null>(null);
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { groupOptions, groupFilterLabel, staffOptions, allStaffOptions, loading } = useGroupStaffPicker(
    groupFilterId,
    open ? debouncedQuery : '',
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      setGroupFilterId(null);
    }
  }, [open]);

  const summary = useMemo(() => {
    if (!selectedId) return placeholder;
    return allStaffOptions.find((o) => o.value === selectedId)?.label ?? placeholder;
  }, [allStaffOptions, placeholder, selectedId]);

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

      <BottomSheet isVisible={open} onClose={() => setOpen(false)} height={520} zIndexBase={270}>
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

          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6 }}>
            Filter by group
          </AppText>
          <PressClay onPress={() => setGroupPickerOpen(true)}>
            <ClayView depth={2} color={colors.card} style={styles.selectField}>
              <Icon name="account-tree" size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <AppText variant="body" numberOfLines={1} style={{ flex: 1 }}>
                {groupFilterLabel}
              </AppText>
              <Icon name="expand-more" size={22} color={colors.subtle} />
            </ClayView>
          </PressClay>

          <AppFormField
            value={query}
            onChangeText={setQuery}
            placeholder="Search staff…"
            icon="search"
            style={{ marginBottom: 10 }}
          />

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              {includeAllOption ? (
                <PressClay
                  onPress={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  <ClayView depth={1} color={colors.card} style={[styles.row, { borderColor: colors.border }]}>
                    <AppText variant="body" style={{ flex: 1 }}>
                      {allLabel}
                    </AppText>
                  </ClayView>
                </PressClay>
              ) : null}
              {staffOptions.length === 0 ? (
                <AppText variant="caption" style={{ color: colors.subtle, paddingVertical: 12 }}>
                  No staff match your search or group filter.
                </AppText>
              ) : null}
              {staffOptions.map((opt) => {
                const active = selectedId === opt.value;
                return (
                  <PressClay
                    key={opt.value}
                    onPress={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <ClayView
                      depth={active ? 3 : 1}
                      color={active ? colors.primary + '14' : colors.card}
                      style={[styles.row, { borderColor: active ? colors.primary : colors.border }]}
                    >
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText variant="body" weight={active ? 'bold' : 'medium'} numberOfLines={1}>
                          {opt.label}
                        </AppText>
                        {opt.subtitle ? (
                          <AppText variant="caption" style={{ color: colors.subtle }} numberOfLines={1}>
                            {opt.subtitle}
                          </AppText>
                        ) : null}
                      </View>
                      {active ? <Icon name="check" size={20} color={colors.primary} /> : null}
                    </ClayView>
                  </PressClay>
                );
              })}
            </ScrollView>
          )}
        </View>
      </BottomSheet>

      <SearchableOptionPickerSheet
        isVisible={groupPickerOpen}
        onClose={() => setGroupPickerOpen(false)}
        title="Filter by group"
        searchPlaceholder="Search faculty, department, program…"
        options={groupOptions}
        selected={groupFilterId}
        onSelect={setGroupFilterId}
        allLabel="All staff"
        height={480}
        zIndexBase={290}
      />
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
});
