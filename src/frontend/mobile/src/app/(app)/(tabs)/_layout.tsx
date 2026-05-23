import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';

import { TabBar } from '@/src/components/navigation/TabBar';
import { TabShell } from '@/src/components/layout/TabShell';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { useThemeColors } from '@/src/hooks';

export default function TabLayout() {
  const colors = useThemeColors();
  const { isWideShell } = useBreakpoint();

  return (
    <TabShell>
      <Tabs
        tabBar={isWideShell ? () => null : (props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarBackground: () => <View style={{ flex: 1, backgroundColor: 'transparent' }} />,
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen name="dashboard" />
        <Tabs.Screen name="tasks" />
        <Tabs.Screen name="chat" />
        <Tabs.Screen name="schedule" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </TabShell>
  );
}
