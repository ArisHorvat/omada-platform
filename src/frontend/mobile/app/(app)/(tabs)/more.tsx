import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useAuth } from '../../../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MyOrganizationRepository from '@/repositories/MyOrganizationRepository';

const WIDGET_INFO: Record<string, { name: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  news: { name: 'News', icon: 'article' },
  schedule: { name: 'Schedule', icon: 'calendar-today' },
  grades: { name: 'Grades', icon: 'school' },
  map: { name: 'Map', icon: 'map' },
  users: { name: 'Users', icon: 'people' },
  assignments: { name: 'Assignments', icon: 'assignment' },
  tasks: { name: 'Tasks', icon: 'list-alt' },
  attendance: { name: 'Attendance', icon: 'check-circle' },
};

export default function MoreScreen() {
  const colors = useThemeColors();
  const { setToken } = useAuth();
  const router = useRouter();
  const [overflowWidgets, setOverflowWidgets] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = MyOrganizationRepository.getInstance().subscribe((data) => {
      if (data) {
        const allWidgets: string[] = data.widgets || [];
        // Logic must match _layout.tsx
        const TABS_WITH_FILES = ['news', 'schedule', 'grades', 'map', 'users', 'assignments', 'tasks', 'attendance'];
        const mainTabWidgets = TABS_WITH_FILES.filter(id => allWidgets.includes(id)).slice(0, 3);
        
        const overflow = allWidgets.filter(w => !mainTabWidgets.includes(w));
        setOverflowWidgets(overflow);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>More Tools</Text>
        
        {overflowWidgets.length > 0 ? (
          overflowWidgets.map((widgetId) => {
            const info = WIDGET_INFO[widgetId] || { name: widgetId, icon: 'widgets' };
            return (
              <TouchableOpacity key={widgetId} style={[styles.button, { backgroundColor: colors.card }]} onPress={() => router.push(`/${widgetId}` as any)}>
                <MaterialIcons name={info.icon} size={24} color={colors.primary} />
                <Text style={[styles.buttonText, { color: colors.text }]}>{info.name}</Text>
                <MaterialIcons name="chevron-right" size={24} color={colors.subtle} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={{ color: colors.subtle, marginBottom: 20 }}>No additional widgets available.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
