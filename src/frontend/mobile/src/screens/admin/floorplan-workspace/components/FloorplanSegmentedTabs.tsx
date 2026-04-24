import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { AppText, ClayView } from '@/src/components/ui';
import type { FloorplanWorkspaceModel } from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';

type Props = {
  model: FloorplanWorkspaceModel;
};

const TABS: { key: 'setup' | 'rooms' | 'pins'; label: string }[] = [
  { key: 'setup', label: 'Setup' },
  { key: 'rooms', label: 'Rooms' },
  { key: 'pins', label: 'Pins' },
];

export function FloorplanSegmentedTabs({ model }: Props) {
  const { colors, activeTab, setActiveTab } = model;

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 4,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
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
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  width: '100%',
                  alignItems: 'center',
                }}
              >
                <AppText variant="caption" weight="bold" style={{ color: '#fff' }}>
                  {label}
                </AppText>
              </ClayView>
            ) : (
              <View style={{ paddingVertical: 10, paddingHorizontal: 12, width: '100%', alignItems: 'center' }}>
                <AppText variant="caption" style={{ color: colors.text }}>
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
