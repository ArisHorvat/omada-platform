import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import type { AppThemeColors } from '@/src/hooks/useThemeColors';
import type { ScrapedScheduleEvent } from '@/src/screens/admin/web-spider-workspace/utils/schedulePreviewGrouping';
import {
  buildImportScopeCatalog,
  formatGroupLabel,
  formatPageLabel,
  importScopeSummary,
  isImportScopeReady,
  requiresImportScopeSelection,
  type ImportScheduleScope,
} from '../utils/importScheduleScope';

type Props = {
  colors: AppThemeColors;
  events: ScrapedScheduleEvent[];
  scope: ImportScheduleScope;
  onScopeChange: (next: ImportScheduleScope) => void;
  scopedCount: number;
};

export function ImportScheduleScopePanel({ colors, events, scope, onScopeChange, scopedCount }: Props) {
  const [pagePickerOpen, setPagePickerOpen] = useState(false);
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);

  const summary = useMemo(() => importScopeSummary(events), [events]);
  const catalog = useMemo(() => buildImportScopeCatalog(events), [events]);
  const selectedPage = catalog.find((p) => p.key === scope.pageKey) ?? null;

  const pageOptions = useMemo(
    () =>
      catalog.map((p) => ({
        value: p.key,
        label: formatPageLabel(p.key),
        subtitle: `${p.eventCount} sessions · ${p.groups.length} groups`,
      })),
    [catalog],
  );

  const groupOptions = useMemo(
    () =>
      (selectedPage?.groups ?? []).map((g) => ({
        value: g.key,
        label: formatGroupLabel(g.key),
        subtitle: `${g.eventCount} sessions`,
      })),
    [selectedPage],
  );

  const mustPickGroup = requiresImportScopeSelection(events.length);
  const scopeReady = isImportScopeReady(scope, events.length);

  return (
    <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginTop: 12, marginBottom: 12 }}>
      <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: 6 }}>
        PREVIEW SCOPE
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18, marginBottom: 12 }}>
        {summary.total.toLocaleString()} sessions across {summary.pageCount} program pages. Pick a page and one
        study group to preview that group&apos;s full schedule.
      </AppText>

      <PressClay onPress={() => setPagePickerOpen(true)}>
        <ClayView depth={1} color={colors.background} style={{ borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
            Program / year page
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="body" weight="bold" style={{ color: colors.text, flex: 1 }}>
              {scope.pageKey ? formatPageLabel(scope.pageKey) : 'Select page…'}
            </AppText>
            <Icon name="expand-more" size={22} color={colors.subtle} />
          </View>
        </ClayView>
      </PressClay>

      <PressClay onPress={() => scope.pageKey && setGroupPickerOpen(true)}>
        <ClayView
          depth={1}
          color={colors.background}
          style={{
            borderRadius: 12,
            padding: 12,
            marginBottom: 10,
            opacity: scope.pageKey ? 1 : 0.55,
          }}
        >
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
            Study group (required)
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="body" weight="bold" style={{ color: colors.text, flex: 1 }}>
              {scope.groupKey ? formatGroupLabel(scope.groupKey) : 'Select group…'}
            </AppText>
            <Icon name="expand-more" size={22} color={colors.subtle} />
          </View>
        </ClayView>
      </PressClay>

      {scopeReady ? (
        <AppText variant="caption" style={{ color: colors.primary }}>
          Showing {scopedCount.toLocaleString()} session{scopedCount === 1 ? '' : 's'} in preview
        </AppText>
      ) : (
        <AppText variant="caption" style={{ color: colors.subtle }}>
          {mustPickGroup
            ? 'Select a program page and a group to preview sessions.'
            : 'Select a program page to preview sessions.'}
        </AppText>
      )}

      <SearchableOptionPickerSheet
        isVisible={pagePickerOpen}
        onClose={() => setPagePickerOpen(false)}
        title="Program / year page"
        options={pageOptions}
        selected={scope.pageKey}
        onSelect={(id) => {
          if (!id) return;
          const page = catalog.find((p) => p.key === id);
          onScopeChange({
            pageKey: id,
            groupKey: mustPickGroup ? (page?.groups[0]?.key ?? null) : null,
          });
          setPagePickerOpen(false);
        }}
        includeAllOption={false}
        searchPlaceholder="Search programs (I1, M2…)"
      />

      <SearchableOptionPickerSheet
        isVisible={groupPickerOpen}
        onClose={() => setGroupPickerOpen(false)}
        title="Study group"
        options={groupOptions}
        selected={scope.groupKey}
        onSelect={(id) => {
          onScopeChange({ ...scope, groupKey: id });
          setGroupPickerOpen(false);
        }}
        includeAllOption={false}
        searchPlaceholder="Search groups (934/1, Grupa 934…)"
      />
    </ClayView>
  );
}
