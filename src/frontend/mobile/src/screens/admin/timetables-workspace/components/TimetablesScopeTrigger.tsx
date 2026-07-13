import React from 'react';
import { View } from 'react-native';

import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import type { TimetablesWorkspaceModel } from '../hooks/useTimetablesWorkspace';
import {
  TimetablesScopeSheet,
  buildScopeSummary,
  countActiveScopeFilters,
} from './TimetablesScopeSheet';

type Props = { model: TimetablesWorkspaceModel };

export function TimetablesScopeTrigger({ model }: Props) {
  const { colors, periodId, resetScopeFilters, scopeSheetOpen, setScopeSheetOpen } = model;

  const summary = buildScopeSummary(model);
  const filterCount = countActiveScopeFilters(model);

  return (
    <>
      <ClayView depth={1} color={colors.card} style={{ borderRadius: 16, padding: 14, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <ClayView
            depth={2}
            color={colors.primary + '22'}
            style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="tune" size={22} color={colors.primary} />
          </ClayView>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
              TIMETABLE SCOPE
            </AppText>
            <AppText variant="body" numberOfLines={2} style={{ color: colors.text, marginTop: 4 }}>
              {summary}
            </AppText>
            {filterCount > 0 ? (
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                {filterCount} narrow filter{filterCount === 1 ? '' : 's'} active
              </AppText>
            ) : null}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <View style={{ flex: 1 }}>
            <AppButton
              title={periodId ? 'Edit scope' : 'Choose period'}
              variant="primary"
              icon="filter-list"
              onPress={() => setScopeSheetOpen(true)}
            />
          </View>
          {filterCount > 0 ? (
            <AppButton title="Clear" size="sm" variant="outline" onPress={resetScopeFilters} />
          ) : null}
        </View>
      </ClayView>

      <TimetablesScopeSheet
        visible={scopeSheetOpen}
        onClose={() => setScopeSheetOpen(false)}
        model={model}
      />
    </>
  );
}
