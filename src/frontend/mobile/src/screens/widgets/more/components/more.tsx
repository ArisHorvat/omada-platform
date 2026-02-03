import React from 'react';
import { Text, TouchableOpacity, ScrollView } from 'react-native';
import { useThemeColors } from '@/src/hooks';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createStyles } from '@/src/screens/widgets/more/styles/more.styles';
import { useMoreLogic } from '@/src/screens/widgets/more/hooks/useMoreLogic';

const WIDGET_INFO: Record<string, { name: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  // Core
  schedule: { name: 'Schedule', icon: 'calendar-today' },
  chat: { name: 'Chat', icon: 'chat' },
  news: { name: 'News', icon: 'campaign' },
  
  // Academic
  grades: { name: 'Grades', icon: 'analytics' },
  assignments: { name: 'Assignments', icon: 'assignment' },
  attendance: { name: 'Attendance', icon: 'how-to-reg' },
  
  // Corporate
  finance: { name: 'Finance', icon: 'attach-money' },
  documents: { name: 'Documents', icon: 'folder-shared' },
  tasks: { name: 'Tasks', icon: 'check-circle' },
  
  // Shared
  map: { name: 'Map', icon: 'map' },
  transport: { name: 'Transport', icon: 'directions-bus' },
  rooms: { name: 'Room Booking', icon: 'meeting-room' },
  events: { name: 'Events', icon: 'event' },
  users: { name: 'Directory', icon: 'group' },
  
  // Other
  profile: { name: 'Profile', icon: 'person' }, // Usually filtered out but good to have
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
