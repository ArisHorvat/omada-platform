import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  SectionList,
  Alert,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-color';
import OrganizationRepository from '@/repositories/OrganizationRepository';
import { API_BASE_URL } from '../../config';

type Widget = {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  name: string;
  description: string;
};

const WIDGETS: { title: string; data: Widget[] }[] = [
  {
    title: 'Dashboard & News',
    data: [
      { id: 'news', icon: 'article', name: 'News/Announcements', description: 'Latest campus updates' },
      { id: 'schedule', icon: 'calendar-today', name: 'Schedule', description: 'Your daily classes and events' },
    ],
  },
  {
    title: 'Academic / Work',
    data: [
      { id: 'map', icon: 'map', name: 'Map', description: 'Navigate the campus easily' },
      { id: 'attendance', icon: 'check-circle', name: 'Attendance', description: 'Track your class attendance' },
      { id: 'grades', icon: 'school', name: 'Grades', description: 'View your academic results' },
      { id: 'assignments', icon: 'assignment', name: 'Assignments', description: 'Manage your assignments' },
    ],
  },
  {
    title: 'Admin Tools',
    data: [
      { id: 'users', icon: 'people', name: 'Employees/Students', description: 'View user profiles' },
      { id: 'tasks', icon: 'list-alt', name: 'Tasks/Teachers', description: 'Assign & manage tasks' },
    ],
  },
];

interface WidgetItemProps {
  item: {
    id: string;
    // This tells TypeScript that 'icon' is a valid MaterialIcons name
    icon: keyof typeof MaterialIcons.glyphMap;
    name: string;
    description: string;
  };
  onSelect: (id: string) => void;
  isSelected: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  colors: any;
}

const WidgetItem = ({ item, onSelect, isSelected, styles, colors }: WidgetItemProps) => (
  <TouchableOpacity
    style={[styles.widget, isSelected && styles.widgetSelected]}
    onPress={() => onSelect(item.id)}
  >
    <MaterialIcons name={item.icon} size={24} color={isSelected ? colors.card : colors.primary} />
    <Text style={[styles.widgetName, isSelected && { color: colors.card }]}>{item.name}</Text>
    <Text style={[styles.widgetDescription, isSelected && { color: colors.subtle, opacity: 0.8 }]}>{item.description}</Text>
  </TouchableOpacity>
);

export default function WidgetSelectionScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const [selectedWidgets, setSelectedWidgets] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: colors.border },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    progressContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16 },
    progressBar: { flex: 1, height: 4, backgroundColor: colors.border, borderRadius: 2, marginHorizontal: 4 },
    progressStepDone: { flex: 1, backgroundColor: colors.primary, borderRadius: 2 },
    progressStepActive: { flex: 1, backgroundColor: colors.primary, borderRadius: 2 },
    stepText: { alignSelf: 'center', color: colors.subtle, fontSize: 12, marginTop: 4, marginBottom: 16 },
    title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 8, paddingHorizontal: 16 },
    description: { fontSize: 16, color: colors.subtle, marginBottom: 16, paddingHorizontal: 16 },
    selectAllContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: colors.card, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
    selectAllText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', color: colors.text, backgroundColor: colors.background, paddingVertical: 8, paddingHorizontal: 16, marginTop: 8 },
    listContent: { paddingBottom: 100 },
    widgetContainer: { paddingHorizontal: 16, paddingVertical: 8 },
    widget: { backgroundColor: colors.card, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.border },
    widgetSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    widgetName: { fontSize: 16, fontWeight: 'bold', marginTop: 8, color: colors.primary },
    widgetDescription: { fontSize: 14, color: colors.subtle, marginTop: 4 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: colors.card, borderTopWidth: 1, borderColor: colors.border },
    footerButton: { flex: 1, padding: 16, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: colors.border, marginRight: 8 },
    nextButton: { backgroundColor: colors.primary, marginLeft: 8 },
    footerButtonText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    footerButtonTextPrimary: { color: colors.card },
  }), [colors]);

  const handleSelect = (id: string) => {
    const newSelection = new Set(selectedWidgets);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedWidgets(newSelection);
    setSelectAll(newSelection.size === WIDGETS.flatMap(s => s.data).length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedWidgets(new Set());
    } else {
      const allWidgetIds = new Set(WIDGETS.flatMap(s => s.data).map(w => w.id));
      setSelectedWidgets(allWidgetIds);
    }
    setSelectAll(!selectAll);
  };

  const handleFinish = async () => {
    if (isSubmitting) return;

    if (selectedWidgets.size === 0) {
      Alert.alert("No Widgets Selected", "Please select at least one widget to continue.");
      return;
    }

    setIsSubmitting(true);

    let logoUrl = null;
    if (params.logoUri) {
      try {
        const formData = new FormData();
        // The 'uri' needs to be cast to any for FormData, but it works correctly.
        formData.append('file', {
          uri: params.logoUri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image/jpeg',
        } as any);

        const uploadResponse = await fetch(`${API_BASE_URL}/api/files/upload`, {
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const uploadResult = await uploadResponse.json();
        if (uploadResponse.ok) {
          logoUrl = uploadResult.url;
        }
      } catch (uploadError) {
        console.error('Logo upload failed:', uploadError);
        // Optionally, alert the user that the logo upload failed but continue registration
        Alert.alert('Logo Upload Failed', 'Could not upload the logo, but will proceed with registration without it.');
        // Note: We don't stop submission here, but if you wanted to, you'd set isSubmitting(false) and return.
      }
    }

    const registrationData = {
      name: params.orgName,
      shortName: params.shortName,
      emailDomain: params.emailDomain,
      adminName: params.adminName,
      adminEmail: params.adminEmail,
      password: params.password,
      logoUrl: logoUrl,
      primaryColor: params.primaryColor,
      secondaryColor: params.secondaryColor,
      accentColor: params.accentColor,
      roles: JSON.parse(params.roles as string),
      widgets: Array.from(selectedWidgets),
    };

    console.log('[WidgetSelection] Submitting registration data...');
    try {
      await OrganizationRepository.getInstance().createOrganization(registrationData);
      router.replace('/registration-success');
    } catch (error: any) {
      console.error('[WidgetSelection] Registration error:', error);
      Alert.alert('Registration Error', error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Widget Selection</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.progressContainer}>
            <View style={styles.progressBar}><View style={styles.progressStepDone} /></View>
            <View style={styles.progressBar}><View style={styles.progressStepActive} /></View>
        </View>
        <Text style={styles.stepText}>Step 2 of 2</Text>

        <SectionList
          sections={WIDGETS}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              <Text style={styles.title}>Customize Your Dashboard</Text>
              <Text style={styles.description}>
                Choose the widgets you want to see. You can always change these later in settings.
              </Text>
              <View style={styles.selectAllContainer}>
                <Text style={styles.selectAllText}>Select All</Text>
                <Switch
                  value={selectAll}
                  onValueChange={toggleSelectAll}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.card}
                />
              </View>
            </>
          }
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          renderItem={({ item }) => (
            <View style={styles.widgetContainer}>
              <WidgetItem 
                item={item}
                onSelect={handleSelect}
                isSelected={selectedWidgets.has(item.id)}
                styles={styles}
                colors={colors}
              />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.footerButton, styles.cancelButton]} onPress={() => router.back()} disabled={isSubmitting}>
            <Text style={styles.footerButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.footerButton, styles.nextButton, isSubmitting && { opacity: 0.7 }]} onPress={handleFinish} disabled={isSubmitting}>
            <Text style={[styles.footerButtonText, styles.footerButtonTextPrimary]}>{isSubmitting ? 'Creating...' : 'Finish'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
