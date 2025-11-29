import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-color';
import * as SecureStore from 'expo-secure-store';
import OrganizationRepository from '@/repositories/OrganizationRepository';

export default function OrganizationDetails() {
  const colors = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [organization, setOrganization] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to the repository to get real-time updates (reusing cached data)
    const unsubscribe = OrganizationRepository.getInstance().subscribe((data) => {
      const org = data.find(o => o.id === id);
      if (org) {
        setOrganization(org);
        setIsLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [id]);

  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: colors.border },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginLeft: 16, flex: 1 },
    content: { padding: 20 },
    section: { marginBottom: 24 },
    label: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
    value: { fontSize: 16, color: colors.text, marginBottom: 4 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    colorContainer: { flexDirection: 'row', gap: 16, marginTop: 8 },
    colorSwatch: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.border },
    logo: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center', marginBottom: 16 },
    listItem: { backgroundColor: colors.card, padding: 12, borderRadius: 8, marginBottom: 8 },
    listItemText: { fontSize: 16, color: colors.text },
    editButton: { position: 'absolute', right: 16 },
  }), [colors]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!organization) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={{ color: colors.text }}>Organization not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Details</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push(`/organization/edit/${id}`)}>
            <MaterialIcons name="edit" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          {organization.logoUrl ? (
            <Image source={{ uri: organization.logoUrl }} style={styles.logo} />
          ) : (
            <View style={[styles.logo, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
              <MaterialIcons name="business" size={40} color={colors.subtle} />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Organization Name</Text>
            <Text style={styles.value}>{organization.name}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Email Domain</Text>
            <Text style={styles.value}>{organization.emailDomain}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Color Scheme</Text>
            <View style={styles.colorContainer}>
              <View style={[styles.colorSwatch, { backgroundColor: organization.primaryColor }]} />
              <View style={[styles.colorSwatch, { backgroundColor: organization.secondaryColor }]} />
              <View style={[styles.colorSwatch, { backgroundColor: organization.accentColor }]} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Custom Roles</Text>
            {organization.roles?.map((role: string, index: number) => (
              <View key={index} style={styles.listItem}><Text style={styles.listItemText}>{role}</Text></View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Enabled Widgets</Text>
            {organization.widgets?.map((widget: string, index: number) => (
              <View key={index} style={styles.listItem}><Text style={styles.listItemText}>{widget}</Text></View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}