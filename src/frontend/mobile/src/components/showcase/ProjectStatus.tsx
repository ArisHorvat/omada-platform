import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, GlassView, Icon, StatusBadge } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';

// UPDATED MASTER LIST
const WIDGETS = [
  // Core
  { name: 'Schedule', status: 'Done', icon: 'calendar-today' },
  { name: 'Chat', status: 'In Progress', icon: 'chat' },
  { name: 'News', status: 'Done', icon: 'campaign' },
  { name: 'Profile', status: 'Done', icon: 'person' },
  
  // Org Controlled
  { name: 'Assignments', status: 'Todo', icon: 'assignment' },
  { name: 'Attendance', status: 'Todo', icon: 'how-to-reg' },
  { name: 'Documents', status: 'Todo', icon: 'folder-shared' },
  { name: 'Events', status: 'Todo', icon: 'event' },
  { name: 'Finance', status: 'Todo', icon: 'attach-money' },
  { name: 'Grades', status: 'Done', icon: 'analytics' },
  { name: 'Map', status: 'Done', icon: 'map' },
  { name: 'Room Booking', status: 'Todo', icon: 'meeting-room' },
  { name: 'Tasks', status: 'Done', icon: 'check-circle' },
  { name: 'Transport', status: 'Todo', icon: 'directions-bus' },
  { name: 'Users', status: 'Done', icon: 'group' },
];

export const ProjectStatus = () => {
  const colors = useThemeColors();

  const getStatusVariant = (status: string) => {
    switch(status) {
      case 'Done': return 'success';
      case 'In Progress': return 'warning';
      default: return 'error';
    }
  };

  return (
    <View style={styles.container}>
      <AppText variant="h2" style={{ marginBottom: 16 }}>Widget Ecosystem</AppText>
      <View style={styles.grid}>
        {WIDGETS.map((widget, index) => (
          <GlassView key={index} intensity={20} style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
              <Icon name={widget.icon as any} size={24} color={colors.primary} />
            </View>
            <View style={{ marginTop: 12 }}>
              <AppText variant="body" weight="bold">{widget.name}</AppText>
              <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                <StatusBadge 
                  status={getStatusVariant(widget.status)} 
                  label={widget.status} 
                />
              </View>
            </View>
          </GlassView>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '48%', padding: 16, borderRadius: 20, marginBottom: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});