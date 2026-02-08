import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { TabBar } from '@/src/components/navigation/TabBar';
import { useThemeColors } from '@/src/hooks';

export default function TabLayout() {
  const colors = useThemeColors();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Make the background transparent so the floating bar looks correct
        tabBarBackground: () => <View style={{ flex: 1, backgroundColor: 'transparent' }} />,
        // Set the default background for the screens inside tabs
        sceneStyle: { backgroundColor: colors.background }
      }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="news" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}