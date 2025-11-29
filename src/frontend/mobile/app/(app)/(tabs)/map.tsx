import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-color';
import { MaterialIcons } from '@expo/vector-icons';

const LOCATIONS = [
  { id: '1', name: 'Main Library', type: 'Study' },
  { id: '2', name: 'Student Center', type: 'Social' },
  { id: '3', name: 'Science Building', type: 'Classroom' },
  { id: '4', name: 'Cafeteria', type: 'Food' },
  { id: '5', name: 'Gymnasium', type: 'Sports' },
];

export default function MapScreen() {
  const colors = useThemeColors();

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
                    <MaterialIcons name="place" size={24} color="#fff" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  mapPlaceholder: {
    height: 200,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  type: {
    fontSize: 14,
  },
});