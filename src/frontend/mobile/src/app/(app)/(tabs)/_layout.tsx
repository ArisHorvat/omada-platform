import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { CurrentOrganizationService } from '@/src/services/CurrentOrganizationService';
import { CustomTabBar } from '@/src/components/CustomTabBar';

export default function TabLayout() {
  const colors = useThemeColors();
  const [widgets, setWidgets] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = CurrentOrganizationService.subscribe((data) => {
      if (data) {
        setWidgets(data.widgets || []);
      }
    });
    return () => unsubscribe();
  }, []);

  // Helper to check if a widget is enabled for the organization
  const isEnabled = (id: string) => widgets.includes(id);
  
  return (
     <Tabs 
        tabBar={props => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
     >
      {/* Core Screens (Always Available) */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          // Profile is accessed via Dashboard header, but we keep it here for routing
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          // 'More' is accessed via Dashboard grid, but kept for routing
          tabBarIcon: ({ color }) => <MaterialIcons name="menu" size={28} color={color} />,
        }}
      />

      {/* Widget Screens (Conditionally Enabled) */}
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          href: isEnabled('news') ? '/news' : null,
          tabBarIcon: ({ color }) => <MaterialIcons name="article" size={28} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          href: isEnabled('schedule') ? '/schedule' : null,
          tabBarIcon: ({ color }) => <MaterialIcons name="calendar-today" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="grades"
        options={{
          title: 'Grades',
          href: isEnabled('grades') ? '/grades' : null,
          tabBarIcon: ({ color }) => <MaterialIcons name="school" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          href: isEnabled('map') ? '/map' : null,
          tabBarIcon: ({ color }) => <MaterialIcons name="map" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          href: isEnabled('users') ? '/users' : null,
          tabBarIcon: ({ color }) => <MaterialIcons name="people" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="assignments"
        options={{
          title: 'Assignments',
          href: isEnabled('assignments') ? '/assignments' : null,
          tabBarIcon: ({ color }) => <MaterialIcons name="assignment" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          href: isEnabled('tasks') ? '/tasks' : null,
          tabBarIcon: ({ color }) => <MaterialIcons name="list-alt" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          href: isEnabled('attendance') ? '/attendance' : null,
          tabBarIcon: ({ color }) => <MaterialIcons name="check-circle" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          href: isEnabled('chat') ? '/chat' : null,
          tabBarIcon: ({ color }) => <MaterialIcons name="chat" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="manage-favorites"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="digital-id"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
