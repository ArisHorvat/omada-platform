import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useAuth } from '../../../context/AuthContext';
import MyOrganizationRepository from '@/repositories/MyOrganizationRepository';

export default function ProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { setToken } = useAuth();

  const [organization, setOrganization] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = MyOrganizationRepository.getInstance().subscribe((data) => {
      if (data) {
        setOrganization(data);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => {
          MyOrganizationRepository.getInstance().clear();
          setToken(null);
        }}
      ]
    );
  };

  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: colors.border },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    content: { padding: 20 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
    logo: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center', marginBottom: 16 },
    orgName: { fontSize: 24, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
    orgDomain: { fontSize: 16, color: colors.subtle, textAlign: 'center', marginBottom: 24 },
    colorContainer: { flexDirection: 'row', justifyContent: 'space-around' },
    colorSwatch: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: colors.border },
    listItem: { backgroundColor: colors.card, padding: 12, borderRadius: 8, marginBottom: 8 },
    listItemText: { fontSize: 16, color: colors.text },
    button: { backgroundColor: colors.notification, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    buttonText: { color: colors.card, fontSize: 18, fontWeight: 'bold' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  }), [colors]);

  if (isLoading) {
    return <View style={[styles.container, styles.loadingContainer]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!organization) {
    return <View style={[styles.container, styles.loadingContainer]}><Text style={{ color: colors.text }}>Could not load organization details.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Organization</Text>
          <TouchableOpacity onPress={() => router.push(`/organization/edit/${organization.id}`)}>
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
          <Text style={styles.orgName}>{organization.name}</Text>
          <Text style={styles.orgDomain}>{organization.emailDomain}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color Scheme</Text>
            <View style={styles.colorContainer}>
              <View style={[styles.colorSwatch, { backgroundColor: organization.primaryColor }]} />
              <View style={[styles.colorSwatch, { backgroundColor: organization.secondaryColor }]} />
              <View style={[styles.colorSwatch, { backgroundColor: organization.accentColor }]} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enabled Widgets</Text>
            {organization.widgets?.map((widget: string) => (
              <View key={widget} style={styles.listItem}><Text style={styles.listItemText}>{widget}</Text></View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Custom Roles</Text>
            {organization.roles?.map((role: string) => (
              <View key={role} style={styles.listItem}><Text style={styles.listItemText}>{role}</Text></View>
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
