import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { AppText, ClayView } from '@/src/components/ui';
import type { TimetablesTab, TimetablesWorkspaceModel } from '../hooks/useTimetablesWorkspace';
import { createTimetablesWorkspaceStyles } from '../styles/timetables-workspace.styles';

const TABS: { key: TimetablesTab; label: string }[] = [
  { key: 'view', label: 'View' },
  { key: 'build', label: 'Build & publish' },
  { key: 'import', label: 'Import schedule' },
];

type Props = { model: TimetablesWorkspaceModel };

export function TimetablesSegmentedTabs({ model }: Props) {
  const { colors, activeTab, setActiveTab } = model;
  const styles = createTimetablesWorkspaceStyles(colors);

  return (
    <View style={styles.tabRow}>
      {TABS.map(({ key, label }) => {
        const active = activeTab === key;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => setActiveTab(key)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}
            activeOpacity={0.85}
          >
            {active ? (
              <ClayView
                depth={2}
                color={colors.primary}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 8,
                  borderRadius: 10,
                  width: '100%',
                  alignItems: 'center',
                }}
              >
                <AppText variant="caption" weight="bold" style={{ color: '#fff' }} numberOfLines={1}>
                  {label}
                </AppText>
              </ClayView>
            ) : (
              <View style={{ paddingVertical: 10, paddingHorizontal: 6, width: '100%', alignItems: 'center' }}>
                <AppText variant="caption" style={{ color: colors.text }} numberOfLines={1}>
                  {label}
                </AppText>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
