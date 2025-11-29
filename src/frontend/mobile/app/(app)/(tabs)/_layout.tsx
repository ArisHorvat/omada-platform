import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-color';
import MyOrganizationRepository from '@/repositories/MyOrganizationRepository';

export default function TabLayout() {
  const colors = useThemeColors();
  const [widgets, setWidgets] = useState<string[]>([]);
  const [orgColors, setOrgColors] = useState<{ primary: string; secondary: string; accent: string } | null>(null);

  useEffect(() => {
    const unsubscribe = MyOrganizationRepository.getInstance().subscribe((data) => {
      if (data) {
        setWidgets(data.widgets || []);
        setOrgColors({
          primary: data.primaryColor || colors.primary,
          secondary: data.secondaryColor || colors.subtle,
          accent: data.accentColor || colors.border,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Define which widgets have actual tab screens implemented
  const TABS_WITH_FILES = ['news', 'schedule', 'grades', 'map', 'users', 'assignments', 'tasks', 'attendance'];
  
  // Filter user's widgets to those that have screens, and take the first 3
  const mainTabWidgets = TABS_WITH_FILES.filter(id => widgets.includes(id)).slice(0, 3);

  const showTab = (id: string) => mainTabWidgets.includes(id);
  
  const activeColor = orgColors?.primary || colors.primary;
  const inactiveColor = orgColors?.secondary || colors.subtle;

  return (
     <Tabs screenOptions={{ 
       headerShown: false, 
       tabBarActiveTintColor: activeColor,
       tabBarInactiveTintColor: inactiveColor,
       tabBarStyle: {
         borderTopColor: orgColors?.accent || colors.border,
         borderTopWidth: 2,
       }
     }}>
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          href: showTab('news') ? '/news' : null,
          tabBarIcon: ({ color }) => <MaterialIcons name="article" size={28} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          href: showTab('schedule') ? '/schedule' : null,
          tabBarIcon: ({ color }) => <MaterialIcons name="calendar-today" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="grades"
        options={{
          title: 'Grades',
          href: showTab('grades') ? '/grades' : null,
          tabBarIcon: ({ color }) => <MaterialIcons name="school" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          href: showTab('map') ? '/map' : null,
          tabBarIcon: ({ color }) => <MaterialIcons name="map" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          href: showTab('users') ? '/users' : null,
          tabBarIcon: ({ color }) => <MaterialIcons name="people" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="assignments"
        options={{
          title: 'Assignments',
          href: showTab('assignments') ? '/assignments' : null,
          tabBarIcon: ({ color }) => <MaterialIcons name="assignment" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          href: showTab('tasks') ? '/tasks' : null,
          tabBarIcon: ({ color }) => <MaterialIcons name="list-alt" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          href: showTab('attendance') ? '/attendance' : null,
          tabBarIcon: ({ color }) => <MaterialIcons name="check-circle" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <MaterialIcons name="menu" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}