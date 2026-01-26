import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { useUserPreferences } from '@/src/context/UserPreferencesContext';
import { CurrentOrganizationService } from '@/src/services/CurrentOrganizationService';

const WIDGET_INFO: Record<string, { name: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  news: { name: 'News', icon: 'article' },
  schedule: { name: 'Schedule', icon: 'calendar-today' },
  grades: { name: 'Grades', icon: 'school' },
  map: { name: 'Map', icon: 'map' },
  users: { name: 'Users', icon: 'people' },
  assignments: { name: 'Assignments', icon: 'assignment' },
  tasks: { name: 'Tasks', icon: 'list-alt' },
  attendance: { name: 'Attendance', icon: 'check-circle' },
  chat: { name: 'Chat', icon: 'chat' },
  room_booking: { name: 'Room Booking', icon: 'meeting-room' },
  parking: { name: 'Parking', icon: 'local-parking' },
  library: { name: 'Library', icon: 'menu-book' },
};

export default function ManageFavoritesScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { isWidgetPinned, togglePinWidget } = useUserPreferences();
  const [availableWidgets, setAvailableWidgets] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = CurrentOrganizationService.subscribe((data) => {
      if (data) {
        const widgets: string[] = data.widgets || [];
        setAvailableWidgets(widgets.filter(w => WIDGET_INFO[w]));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleToggle = async (widgetId: string) => {
    const success = await togglePinWidget(widgetId);
    if (!success) {
      Alert.alert("Limit Reached", "You can only pin 4 widgets to your favorites.");
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: colors.border },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginLeft: 16 },
    content: { padding: 20 },
    description: { color: colors.subtle, marginBottom: 24, fontSize: 14, lineHeight: 20 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    rowLeft: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    widgetName: { fontSize: 16, fontWeight: '600', color: colors.text },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Favorites</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Pin widgets to your "My Favorites" section on the dashboard for quick access.
        </Text>
        
        {availableWidgets.map(widgetId => {
          const info = WIDGET_INFO[widgetId];
          const isPinned = isWidgetPinned(widgetId);
          return (
            <View key={widgetId} style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name={info.icon} size={24} color={colors.primary} />
                </View>
                <Text style={styles.widgetName}>{info.name}</Text>
              </View>
              <Switch
                value={isPinned}
                onValueChange={() => handleToggle(widgetId)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
