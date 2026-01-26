import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { useAuth } from '@/src/context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '@/src/config/config';

export default function SelectOrganizationScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addAccount } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const token = params.token as string;
  const organizations = params.organizations ? JSON.parse(params.organizations as string) : [];

  const handleSelect = async (org: any) => {
    setIsLoading(true);
    try {
      // Check if the current token is already for this organization
      const decoded: any = jwtDecode(token);
      
      if (decoded.organizationId === org.organizationId) {
        await addAccount(token);
      } else {
        // We need to switch
        const response = await fetch(`${API_BASE_URL}/api/auth/switch-org`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ organizationId: org.organizationId })
        });

        if (!response.ok) throw new Error('Failed to switch organization');
        
        const data = await response.json();
        await addAccount(data.token);
      }
      // Navigation is handled by AuthContext/RootLayout upon token change
    } catch (error) {
      Alert.alert('Error', 'Failed to select organization.');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Select Organization</Text>
        <Text style={[styles.subtitle, { color: colors.subtle }]}>Choose where you want to start</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.subtle }}>Switching...</Text>
        </View>
      ) : (
        <FlatList
          data={organizations}
          keyExtractor={(item) => item.organizationId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSelect(item)}
            >
              {item.logoUrl ? (
                <Image source={{ uri: item.logoUrl }} style={styles.logo} />
              ) : (
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <MaterialIcons name="business" size={24} color={colors.primary} />
                </View>
              )}
              <View style={styles.info}>
                <Text style={[styles.orgName, { color: colors.text }]}>{item.organizationName}</Text>
                <Text style={[styles.role, { color: colors.subtle }]}>{item.role}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.subtle} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: '#f0f0f0',
  },
  info: { flex: 1 },
  orgName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  role: { fontSize: 14 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
