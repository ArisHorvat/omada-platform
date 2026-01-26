import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { MaterialIcons } from '@expo/vector-icons';
import { createStyles } from '@/src/screens/widgets/map/styles/map.styles';

const LOCATIONS = [
  { id: '1', name: 'Main Library', type: 'Study' },
  { id: '2', name: 'Student Center', type: 'Social' },
  { id: '3', name: 'Science Building', type: 'Classroom' },
  { id: '4', name: 'Cafeteria', type: 'Food' },
  { id: '5', name: 'Gymnasium', type: 'Sports' },
];

export default function MapScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.mapPlaceholder, { backgroundColor: colors.border }]}>
        <MaterialIcons name="map" size={64} color={colors.subtle} />
        <Text style={{ color: colors.subtle, marginTop: 8 }}>Interactive Map Loading...</Text>
      </View>
      
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Campus Locations</Text>
      <ScrollView>
        {LOCATIONS.map(loc => (
            <TouchableOpacity 
                key={loc.id} 
                style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => Alert.alert("Navigate", `Navigating to ${loc.name}...`)}
            >
                <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
                    <MaterialIcons name="place" size={24} color={colors.onPrimary} />
                </View>
                <View>
                    <Text style={[styles.name, { color: colors.text }]}>{loc.name}</Text>
                    <Text style={[styles.type, { color: colors.subtle }]}>{loc.type}</Text>
                </View>
                <MaterialIcons name="directions" size={24} color={colors.primary} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}