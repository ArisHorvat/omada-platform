import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { TabBar } from '@/src/components/navigation/TabBar';

export default function TabLayout() {
  return (
     <Tabs 
        tabBar={props => <TabBar {...props} />}
        screenOptions={{ 
          headerShown: false,
          tabBarBackground: () => <View style={{ flex: 1 }} /> 
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
