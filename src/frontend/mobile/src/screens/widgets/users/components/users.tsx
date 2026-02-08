import React from 'react';
import { View, Text, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { useThemeColors } from '@/src/hooks';
import { MaterialIcons } from '@expo/vector-icons';
import { createStyles } from '@/src/screens/widgets/users/styles/users.styles';
import { useUsersListLogic } from '@/src/screens/widgets/users/hooks/useUsersListLogic';
import { ScreenTransition } from '@/src/components/animations';


export default function UsersScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { search, setSearch, filteredUsers } = useUsersListLogic();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ClayBackButton />
      
      <ScreenTransition style={{ flex: 1 }} >
        <SafeAreaView style={[styles.container, { flex: 1, paddingTop: 60 }]}>
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
                    <Text style={[styles.avatarText, { color: colors.onPrimary }]}>{item.name.charAt(0)}</Text>
                </View>
                <View>
                    <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.role, { color: colors.subtle }]}>{item.role}</Text>
                </View>
              </View>
            )}
          />
        </SafeAreaView>
      </ScreenTransition>
    </View>
  );
}