import React from 'react';
import { Text, TouchableOpacity, ScrollView } from 'react-native';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createStyles } from '@/src/screens/widgets/more/styles/more.styles';
import { useMoreLogic } from '@/src/screens/widgets/more/hooks/useMoreLogic';

const WIDGET_INFO: Record<string, { name: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  news: { name: 'News', icon: 'article' },
  schedule: { name: 'Schedule', icon: 'calendar-today' },
  grades: { name: 'Grades', icon: 'school' },
  assignments: { name: 'Assignments', icon: 'assignment' },
  attendance: { name: 'Attendance', icon: 'check-circle' },
  library: { name: 'Library Loans', icon: 'menu-book' },
  digital_id: { name: 'Digital ID', icon: 'badge' },
  tuition: { name: 'Tuition', icon: 'payment' },
  directory: { name: 'Directory', icon: 'supervisor-account' },
  map: { name: 'Campus Map', icon: 'map' },
  room_booking: { name: 'Room Booking', icon: 'meeting-room' },
  parking: { name: 'Parking', icon: 'local-parking' },
  chat: { name: 'Chat', icon: 'chat' },
  tasks: { name: 'Tasks', icon: 'list-alt' },
};

export default function MoreScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const styles = createStyles(colors);
  const { allWidgets } = useMoreLogic(WIDGET_INFO);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>All Tools</Text>
        
        {allWidgets.length > 0 ? (
          allWidgets.map((widgetId) => {
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
