import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

interface SmartWidgetCardProps {
  id: string;
  config: any; // The config object from useDashboardLogic
  variant?: 'card' | 'row' | 'rail';
}

export const SmartWidgetCard = ({ id, config, variant = 'card' }: SmartWidgetCardProps) => {
  const router = useRouter();
  
  if (!config) return null;

  const handlePress = () => router.push(`/${id}` as any);

  // 1. Render Rail Item (Small Square)
  if (variant === 'rail') {
    return (
      <TouchableOpacity 
        style={[styles.railCard, { backgroundColor: '#fff', borderLeftColor: config.bg }]} 
        onPress={handlePress}
      >
        <MaterialIcons name={config.icon} size={28} color={config.bg} />
        <Text style={styles.railText} numberOfLines={1}>{config.name}</Text>
      </TouchableOpacity>
    );
  }

  // 2. Render List Row (Favorites)
  if (variant === 'row') {
    return (
      <TouchableOpacity style={styles.rowCard} onPress={handlePress} activeOpacity={0.7}>
        <View style={[styles.rowIcon, { backgroundColor: config.light }]}>
            <MaterialIcons name={config.icon} size={24} color={config.bg} />
        </View>
        <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>{config.name}</Text>
            <Text style={styles.rowSubtitle}>Tap to open</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#ccc" />
      </TouchableOpacity>
    );
  }

  // 3. Render Full Card (Highlights)
  let content = (
    <View>
       <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: config.text + '20' }]}>
            <MaterialIcons name={config.icon} size={24} color={config.text} />
          </View>
       </View>
       <Text style={[styles.cardTitle, { color: config.text }]}>{config.name}</Text>
       <Text style={[styles.cardSubtitle, { color: config.text }]}>Tap to view details</Text>
    </View>
  );

  // Custom Content for specific widgets
  if (id === 'news') {
    content = (
      <>
        <View>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: config.text + '20' }]}><MaterialIcons name="article" size={24} color={config.text} /></View>
            <View style={[styles.tag, { backgroundColor: '#ef4444' }]}><Text style={styles.tagText}>ALERT</Text></View>
          </View>
          <Text style={[styles.cardTitle, { color: config.text }]}>Campus Update</Text>
          <Text style={[styles.cardSubtitle, { color: config.text }]} numberOfLines={2}>Check latest announcements.</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={{ color: config.text, fontWeight: '600' }}>Read More →</Text>
        </View>
      </>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: config.bg }]} 
      onPress={handlePress}
      activeOpacity={0.9}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Rail
  railCard: { width: 100, height: 100, borderRadius: 16, padding: 12, marginRight: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee', borderLeftWidth: 4 },
  railText: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginTop: 8, color: '#333' },
  // Row
  rowCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  rowIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  rowSubtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  // Card
  card: { width: CARD_WIDTH, height: 180, borderRadius: 24, padding: 24, marginRight: 16, justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 12 },
  cardSubtitle: { fontSize: 15, marginTop: 4, fontWeight: '500', opacity: 0.9 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto' },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});
