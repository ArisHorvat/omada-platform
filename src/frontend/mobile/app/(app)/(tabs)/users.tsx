import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-color';
import { MaterialIcons } from '@expo/vector-icons';

const USERS = [
  { id: '1', name: 'Alice Johnson', role: 'Student', email: 'alice@example.com' },
  { id: '2', name: 'Bob Smith', role: 'Teacher', email: 'bob@example.com' },
  { id: '3', name: 'Charlie Brown', role: 'Student', email: 'charlie@example.com' },
  { id: '4', name: 'Dr. Emily Davis', role: 'Admin', email: 'emily@example.com' },
];

export default function UsersScreen() {
  const colors = useThemeColors();
  const [search, setSearch] = useState('');

  const filteredUsers = USERS.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialIcons name="search" size={24} color={colors.subtle} />
        <TextInput 
            style={[styles.input, { color: colors.text }]} 
            placeholder="Search users..." 
            placeholderTextColor={colors.subtle}
            value={search}
            onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.userItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.role, { color: colors.subtle }]}>{item.role}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  role: {
    fontSize: 14,
  },
});