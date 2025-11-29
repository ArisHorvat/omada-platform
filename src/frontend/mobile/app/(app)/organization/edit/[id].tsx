import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Switch, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useAuth } from '../../../../context/AuthContext';
import ColorPicker from 'react-native-wheel-color-picker';
import OrganizationRepository from '@/repositories/OrganizationRepository';

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

export default function EditOrganization() {
  const colors = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { role } = useAuth();

  const [organization, setOrganization] = useState<any>(null);
  const [name, setName] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedWidgets, setSelectedWidgets] = useState(new Set<string>());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [accentColor, setAccentColor] = useState('');
  const [activeColorPicker, setActiveColorPicker] = useState<'primary' | 'secondary' | 'accent' | null>(null);
  const [isColorPickerVisible, setColorPickerVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = OrganizationRepository.getInstance().subscribe((data) => {
      const org = data.find(o => o.id === id);
      if (org) {
        setOrganization(org);
        setName(org.name);
        setEmailDomain(org.emailDomain);
        setRoles(Array.isArray(org.roles) ? org.roles : []);
        setSelectedWidgets(new Set(org.widgets || []));
        setPrimaryColor(org.primaryColor || '#3b82f6');
        setSecondaryColor(org.secondaryColor || '#64748b');
        setAccentColor(org.accentColor || '#eab308');
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
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

  const openColorPicker = (type: 'primary' | 'secondary' | 'accent') => {
    setActiveColorPicker(type);
    setColorPickerVisible(true);
  };

  const handleColorChange = (color: string) => {
    if (!activeColorPicker) return;
    switch (activeColorPicker) {
      case 'primary': setPrimaryColor(color); break;
      case 'secondary': setSecondaryColor(color); break;
      case 'accent': setAccentColor(color); break;
    }
  };

  const handleSubmit = async () => {
    if (!name || !emailDomain) {
      Alert.alert('Validation Error', 'Name and Email Domain are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        emailDomain,
        roles: roles.filter(r => r.trim() !== ''),
        widgets: Array.from(selectedWidgets),
        primaryColor,
        secondaryColor,
        accentColor,
      };

      console.log('[EditOrganization] Submitting update for:', id);
      await OrganizationRepository.getInstance().updateOrganization(id as string, payload);
      Alert.alert('Success', 'Organization updated successfully.', [{ text: 'OK', onPress: () => {
        if (role === 'SuperAdmin') {
          router.back();
        } else {
          router.replace('/profile');
        }
      }}]);
    } catch (error: any) {
      console.error('[EditOrganization] Update error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: colors.border },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginLeft: 16, flex: 1 },
    form: { padding: 20 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
    input: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text },
    button: { backgroundColor: colors.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { color: colors.card, fontSize: 18, fontWeight: 'bold' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    colorSelectionContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
    colorSelector: { alignItems: 'center' },
    colorSwatch: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
    colorLabel: { marginTop: 8, fontSize: 14, color: colors.text },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    roleInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingRight: 8, marginBottom: 12 },
    widgetItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
    widgetName: { fontSize: 16, color: colors.text },
    inputDescription: { fontSize: 12, color: colors.subtle, marginTop: 4, paddingHorizontal: 4 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    colorPickerWrapper: { width: '80%', height: '60%', backgroundColor: colors.card, borderRadius: 12, padding: 20 },
    colorPickerButton: { marginTop: 20, backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
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
          <Text style={styles.headerTitle} numberOfLines={1}>Edit: {organization.name}</Text>
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
            <View style={styles.colorSelectionContainer}>
              <TouchableOpacity style={styles.colorSelector} onPress={() => openColorPicker('primary')}>
                <View style={[styles.colorSwatch, { backgroundColor: primaryColor }]} />
                <Text style={styles.colorLabel}>Primary</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.colorSelector} onPress={() => openColorPicker('secondary')}>
                <View style={[styles.colorSwatch, { backgroundColor: secondaryColor }]} />
                <Text style={styles.colorLabel}>Secondary</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.colorSelector} onPress={() => openColorPicker('accent')}>
                <View style={[styles.colorSwatch, { backgroundColor: accentColor }]} />
                <Text style={styles.colorLabel}>Accent</Text>
              </TouchableOpacity>
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
      <Modal
        visible={isColorPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setColorPickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.colorPickerWrapper}>
            <ColorPicker
              color={activeColorPicker === 'primary' ? primaryColor : activeColorPicker === 'secondary' ? secondaryColor : accentColor}
              onColorChange={handleColorChange}
              thumbSize={30}
            />
            <TouchableOpacity style={styles.colorPickerButton} onPress={() => setColorPickerVisible(false)}>
              <Text style={{ color: colors.card, fontWeight: 'bold' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}