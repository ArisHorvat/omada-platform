import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-color';
import * as SecureStore from 'expo-secure-store';

const AVAILABLE_WIDGETS = [
  { id: 'news', name: 'News/Announcements' },
  { id: 'schedule', name: 'Schedule' },
  { id: 'map', name: 'Map' },
  { id: 'attendance', name: 'Attendance' },
  { id: 'grades', name: 'Grades' },
  { id: 'assignments', name: 'Assignments' },
  { id: 'users', name: 'Employees/Students' },
  { id: 'tasks', name: 'Tasks/Teachers' },
];

const API_BASE_URL = 'http://192.168.72.240:5069';

export default function SuperAdminEditOrganization() {
  const colors = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [organization, setOrganization] = useState<any>(null);
  const [name, setName] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedWidgets, setSelectedWidgets] = useState(new Set<string>());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const token = await SecureStore.getItemAsync('authToken');
        const response = await fetch(`${API_BASE_URL}/api/organizations/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch organization details.');
        const data = await response.json();
        setOrganization(data);
        setName(data.name);
        setEmailDomain(data.emailDomain);
        setRoles(data.roles || []);
        setSelectedWidgets(new Set(data.widgets || []));
      } catch (error: any) {
        Alert.alert('Error', error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrganization();
  }, [id]);

  const addRole = () => setRoles([...roles, '']);
  const deleteRole = (indexToDelete: number) => setRoles(roles.filter((_, index) => index !== indexToDelete));
  const updateRole = (text: string, indexToUpdate: number) => setRoles(roles.map((role, index) => (index === indexToUpdate ? text : role)));

  const handleWidgetSelect = (widgetId: string) => {
    const newSelection = new Set(selectedWidgets);
    if (newSelection.has(widgetId)) {
      newSelection.delete(widgetId);
    } else {
      newSelection.add(widgetId);
    }
    setSelectedWidgets(newSelection);
  };

  const handleSubmit = async () => {
    if (!name || !emailDomain) {
      Alert.alert('Validation Error', 'Name and Email Domain are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const payload = {
        name,
        emailDomain,
        roles: roles.filter(r => r.trim() !== ''), // Filter out empty roles
        widgets: Array.from(selectedWidgets),
      };

      const response = await fetch(`${API_BASE_URL}/api/organizations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to update organization.');

      Alert.alert('Success', 'Organization updated successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: colors.border },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginLeft: 16 },
    form: { padding: 20 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
    input: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text },
    button: { backgroundColor: colors.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { color: colors.card, fontSize: 18, fontWeight: 'bold' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    colorContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
    colorSwatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.border },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    roleInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingRight: 8, marginBottom: 12 },
    widgetItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
    widgetName: { fontSize: 16, color: colors.text },
    inputDescription: { fontSize: 12, color: colors.subtle, marginTop: 4, paddingHorizontal: 4 },
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
          <Text style={styles.headerTitle}>Edit: {organization.name}</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Organization Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Domain</Text>
            <TextInput style={styles.input} value={emailDomain} onChangeText={setEmailDomain} />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Color Scheme</Text>
            <View style={styles.colorContainer}>
              <View style={[styles.colorSwatch, { backgroundColor: organization.primaryColor }]} />
              <View style={[styles.colorSwatch, { backgroundColor: organization.secondaryColor }]} />
              <View style={[styles.colorSwatch, { backgroundColor: organization.accentColor }]} />
            </View>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Custom Roles</Text>
              <TouchableOpacity onPress={addRole}><MaterialIcons name="add" size={24} color={colors.primary} /></TouchableOpacity>
            </View>
            {roles.length === 0 && <Text style={styles.inputDescription}>Add roles like 'Teacher', 'Student', 'Manager', etc.</Text>}
            {roles.map((role, index) => (
              <View key={index} style={styles.roleInputContainer}>
                <TextInput style={[styles.input, { marginBottom: 0, flex: 1, borderWidth: 0 }]} value={role} onChangeText={(text) => updateRole(text, index)} placeholder="e.g., Department Head" placeholderTextColor={colors.subtle} />
                <TouchableOpacity onPress={() => deleteRole(index)}><MaterialIcons name="delete" size={20} color={colors.notification} style={{ marginLeft: 8 }}/></TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Enabled Widgets</Text>
            {AVAILABLE_WIDGETS.map(widget => (
              <View key={widget.id} style={styles.widgetItem}>
                <Text style={styles.widgetName}>{widget.name}</Text>
                <Switch
                  value={selectedWidgets.has(widget.id)}
                  onValueChange={() => handleWidgetSelect(widget.id)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.card}
                />
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color={colors.card} /> :
            <Text style={styles.buttonText}>Update Organization</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
