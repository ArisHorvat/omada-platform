import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useAuth } from '../../../context/AuthContext';
import OrganizationRepository from '@/repositories/OrganizationRepository';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const colors = useThemeColors();
  const { setToken } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => setToken(null) }
      ]
    );
  };

  useEffect(() => {
    // Subscribe to the repository (Observer pattern)
    const unsubscribe = OrganizationRepository.getInstance().subscribe(
      (data, offline) => {
        setOrganizations(data);
        setIsOffline(offline);
      },
      (error) => Alert.alert('Error', error) // Retrieve errors handled in this view
    );
    return () => unsubscribe();
  }, []);

  const deleteOrganization = async (id: string) => {
    console.log('[SuperAdminDashboard] Requesting delete for:', id);
    // Delegate to repository
    await OrganizationRepository.getInstance().deleteOrganization(id);
  };

  const filteredOrganizations = useMemo(() => {
    if (!searchQuery) return organizations;
    const lower = searchQuery.toLowerCase();
    return organizations.filter(org => 
      (org.name && org.name.toLowerCase().includes(lower)) || 
      (org.emailDomain && org.emailDomain.toLowerCase().includes(lower))
    );
  }, [organizations, searchQuery]);

  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    orgItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    logo: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
    logoPlaceholder: {
      width: 50, height: 50, borderRadius: 25, marginRight: 16,
      backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center'
    },
    orgInfo: { flex: 1 },
    orgName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    orgDomain: { fontSize: 14, color: colors.subtle },
    actions: { flexDirection: 'row' },
    actionButton: { padding: 8 },
    offlineBanner: { backgroundColor: colors.notification, padding: 8, alignItems: 'center' },
    offlineText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      height: 48,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 16,
      color: colors.text,
    },
  }), [colors]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.orgItem} onPress={() => router.push(`/organization/${item.id}`)}>
      {item.logoUrl ? (
        <Image source={{ uri: item.logoUrl }} style={styles.logo} />
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
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/organization/edit/${item.id}`)}>
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
        {isOffline && (
          <View style={styles.offlineBanner}><Text style={styles.offlineText}>Offline Mode - Changes will sync when online</Text></View>
        )}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Organizations</Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
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
          data={filteredOrganizations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id ? item.id.toString() : `temp-${Math.random()}`}
        />
      </View>
    </SafeAreaView>
  );
}
