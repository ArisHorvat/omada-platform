import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';

import type { TasksListMode, TasksTimeFilter } from '../utils/taskFilters';
import {
  getGroupFilterLabels,
  getListModeOptions,
  getTimeFilterOptions,
  isCourseworkInboxMode,
  type TasksInboxMode,
} from '../utils/taskLabels';
import { scopeSelectionKey, type TasksScopeOption } from '../utils/taskScopeOptions';
import { createTasksInboxStyles } from '../styles/tasksInbox.styles';
import { filterPickerRowStyles as pickerStyles } from '@/src/styles/filterPickerRow';

type Props = {
  inboxMode: TasksInboxMode;
  scopeOptions: TasksScopeOption[];
  activeScopeKey: string | null;
  onScopeChange: (key: string | null) => void;
  listMode: TasksListMode;
  onListModeChange: (mode: TasksListMode) => void;
  timeFilter: TasksTimeFilter;
  onTimeFilterChange: (filter: TasksTimeFilter) => void;
};

export function TasksInboxFilters({
  inboxMode,
  scopeOptions,
  activeScopeKey,
  onScopeChange,
  listMode,
  onListModeChange,
  timeFilter,
  onTimeFilterChange,
}: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createTasksInboxStyles(colors), [colors]);
  const [scopePickerOpen, setScopePickerOpen] = useState(false);

  const isCourseworkInbox = isCourseworkInboxMode(inboxMode);
  const groupLabels = getGroupFilterLabels(inboxMode);
  const listModeOptions = getListModeOptions();
  const timeFilterOptions = getTimeFilterOptions(inboxMode);

  const scopeIcon = isCourseworkInbox ? 'school' : 'groups';
  const scopeTitle = isCourseworkInbox ? 'Course offering' : 'Group';
  const activeScopeLabel =
    scopeOptions.find((o) => scopeSelectionKey({ filterKind: o.filterKind, id: o.id }) === activeScopeKey)
      ?.label ?? groupLabels.all;

  const handleListMode = (mode: TasksListMode) => {
    onListModeChange(mode);
    if (mode === 'completed') {
      onTimeFilterChange('all');
    }
  };

  return (
    <ClayView depth={6} puffy={10} color={colors.card} style={styles.card}>
      {scopeOptions.length > 0 || isCourseworkInbox ? (
        <>
          <PressClay onPress={scopeOptions.length > 0 ? () => setScopePickerOpen(true) : undefined}>
            <ClayView depth={2} color={colors.background} style={pickerStyles.row}>
              <View style={pickerStyles.iconColumn}>
                <Icon name={scopeIcon} size={22} color={colors.primary} />
              </View>
              <View style={pickerStyles.labelBlock}>
                <AppText variant="caption" style={[pickerStyles.caption, { color: colors.subtle }]}>
                  {scopeTitle}
                </AppText>
                <AppText variant="body" weight="bold" numberOfLines={1}>
                  {scopeOptions.length === 0
                    ? 'No enrolled courses yet'
                    : activeScopeLabel}
                </AppText>
                {scopeOptions.length === 0 ? (
                  <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                    Courses appear after term offerings are applied and you are enrolled.
                  </AppText>
                ) : null}
              </View>
              {scopeOptions.length > 0 ? (
                <Icon name="expand-more" size={22} color={colors.subtle} />
              ) : null}
            </ClayView>
          </PressClay>

          <SearchableOptionPickerSheet
            isVisible={scopePickerOpen}
            onClose={() => setScopePickerOpen(false)}
            title={isCourseworkInbox ? 'Your courses' : 'Group'}
            searchPlaceholder={isCourseworkInbox ? 'Search enrolled courses…' : 'Search groups…'}
            options={[
              { value: '', label: groupLabels.all, subtitle: 'Show everything' },
              ...scopeOptions.map((o) => ({
                value: scopeSelectionKey({ filterKind: o.filterKind, id: o.id })!,
                label: o.label,
                subtitle: o.subtitle,
              })),
            ]}
            selected={activeScopeKey ?? ''}
            onSelect={(key) => onScopeChange(key ? key : null)}
            includeAllOption={false}
            height={440}
          />
        </>
      ) : null}

      <View style={styles.segmentRow}>
        {listModeOptions.map((option) => {
          const active = listMode === option.id;
          return (
            <PressClay
              key={option.id}
              onPress={() => handleListMode(option.id)}
              style={{ flex: 1 }}
            >
              <ClayView
                depth={active ? 6 : 2}
                color={active ? colors.primary : colors.background}
                style={styles.segmentBtn}
              >
                <AppText weight="bold" style={{ color: active ? '#FFF' : colors.subtle, textAlign: 'center' }}>
                  {option.label}
                </AppText>
              </ClayView>
            </PressClay>
          );
        })}
      </View>

      {listMode === 'open' ? (
        <View style={styles.timeRow}>
          {timeFilterOptions.map((option) => {
            const active = timeFilter === option.id;
            return (
              <PressClay key={option.id} onPress={() => onTimeFilterChange(option.id)}>
                <ClayView
                  depth={active ? 4 : 1}
                  color={active ? colors.secondary : colors.background}
                  style={styles.timeChip}
                >
                  <AppText
                    variant="caption"
                    weight="bold"
                    style={{ color: active ? '#FFF' : colors.subtle }}
                  >
                    {option.label}
                  </AppText>
                </ClayView>
              </PressClay>
            );
          })}
        </View>
      ) : null}
    </ClayView>
  );
}
