import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-color';
import { MaterialIcons } from '@expo/vector-icons';

const NEWS_ITEMS = [
  { id: '1', title: 'Welcome to the new semester!', date: '2 hours ago', content: 'We are excited to welcome everyone back to campus. Check your schedule for updates.', type: 'announcement' },
  { id: '2', title: 'Library Maintenance', date: 'Yesterday', content: 'The main library will be closed for maintenance this Sunday.', type: 'alert' },
  { id: '3', title: 'Career Fair 2025', date: '2 days ago', content: 'Join us for the annual career fair at the Student Center.', type: 'event' },
  { id: '4', title: 'Campus Wi-Fi Upgrade', date: '3 days ago', content: 'Wi-Fi services might be intermittent during the weekend due to upgrades.', type: 'info' },
];

export default function NewsScreen() {
  const colors = useThemeColors();

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return 'warning';
      case 'event': return 'event';
      case 'info': return 'info';
      default: return 'campaign';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'alert': return colors.notification;
      case 'event': return colors.primary;
      case 'info': return colors.subtle;
      default: return colors.primary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Latest News</Text>
      <FlatList
        data={NEWS_ITEMS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.type) + '20' }]}>
                    <MaterialIcons name={getIcon(item.type) as any} size={24} color={getIconColor(item.type)} />
                </View>
                <View style={styles.headerText}>
                    <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.date, { color: colors.subtle }]}>{item.date}</Text>
                </View>
            </View>
            <Text style={[styles.content, { color: colors.text }]}>{item.content}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  listContent: {
    padding: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
});