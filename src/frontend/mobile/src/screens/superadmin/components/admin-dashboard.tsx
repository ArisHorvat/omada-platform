import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks';
import { createStyles } from '@/src/screens/superadmin/styles/admin-dashboard.styles';
import { useSuperAdminDashboardLogic } from '@/src/screens/superadmin/hooks/useSuperAdminDashboardLogic';
import { ProgressiveImage } from '@/src/components/ui/ProgressiveImage';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { searchQuery, setSearchQuery, handleLogout, deleteOrganization } = useSuperAdminDashboardLogic();

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.orgItem} onPress={() => router.push("..")}>
      {item.logoUrl ? (
        <ProgressiveImage source={{ uri: item.logoUrl }} style={styles.logo} />
      ) : (
        <View style={styles.logoPlaceholder}>
          <MaterialIcons name="business" size={24} color={colors.subtle} />
        </View>
      )}
      <View style={styles.orgInfo}>
        <Text style={styles.orgName}>{item.name}</Text>
        <Text style={styles.orgDomain}>{item.emailDomain}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`..`)}>
          <MaterialIcons name="edit" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Delete', `Are you sure you want to delete ${item.name}?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteOrganization(item.id) }
        ])}>
          <MaterialIcons name="delete" size={24} color={colors.notification} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
          <View style={styles.offlineBanner}><Text style={styles.offlineText}>Offline Mode - Changes will sync when online</Text></View>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Organizations</Text>
          <TouchableOpacity onPress={() => router.push('/org-dashboard')} accessibilityLabel="Organization admin">
            <MaterialIcons name="apartment" size={26} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/register-flow')}>
            <MaterialIcons name="add-business" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color={colors.subtle} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search organizations..."
            placeholderTextColor={colors.subtle}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={[]}
          renderItem={renderItem}
          keyExtractor={(item) => item.id ? item.id.toString() : `temp-${Math.random()}`}
        />
      </View>
    </SafeAreaView>
  );
}
