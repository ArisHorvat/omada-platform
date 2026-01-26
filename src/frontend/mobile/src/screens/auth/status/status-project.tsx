import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/hooks/use-theme-color';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

type Status = 'Done' | 'In Progress' | 'Todo';

interface ProjectItem {
  title: string;
  status: Status;
  description: string;
  technicalDetails?: string[];
}

interface ProjectSection {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  items: ProjectItem[];
}

const PROJECT_DATA: ProjectSection[] = [
  {
    title: 'Registration Flow',
    icon: 'app-registration',
    items: [
      {
        title: 'Step 1: Identity',
        status: 'Done',
        description: 'Organization type selection (University vs Corporate).',
        technicalDetails: [
          'Sets default roles based on type.',
          'Validates unique organization name.',
          'Initializes RegistrationContext.'
        ]
      },
      {
        title: 'Step 2: Admin',
        status: 'Done',
        description: 'Super Admin account creation.',
        technicalDetails: [
          'Client-side validation.',
          'Password strength checks.',
          'Stores admin data in context state.'
        ]
      },
      {
        title: 'Step 3: Branding',
        status: 'Done',
        description: 'Dynamic theme generation from logo.',
        technicalDetails: [
          'Image upload to backend (SixLabors.ImageSharp).',
          'Color extraction algorithm (K-Means clustering).',
          'Palette generation (Monochromatic, Analogous).',
          'Live Digital ID preview.'
        ]
      },
      {
        title: 'Step 4: Roles',
        status: 'Done',
        description: 'Role-Based Access Control (RBAC) setup.',
        technicalDetails: [
          'Pre-seeded roles based on Org Type.',
          'Custom role addition/editing.',
          'Mapped to backend Role entities.'
        ]
      },
      {
        title: 'Step 5: Widgets',
        status: 'Done',
        description: 'Feature selection and assignment.',
        technicalDetails: [
          'Smart defaults based on Org Type.',
          'Role-Widget mapping (Many-to-Many).',
          'Filtering logic for incompatible widgets.'
        ]
      },
      {
        title: 'Step 6: Users',
        status: 'Done',
        description: 'Bulk user import and invitation.',
        technicalDetails: [
          'Excel/CSV parsing (ExcelDataReader).',
          'Transactional bulk insert.',
          'Auto-group creation logic.',
          'Email invitation simulation.'
        ]
      }
    ]
  },
  {
    title: 'Widget Status',
    icon: 'widgets',
    items: [
      {
        title: 'News Widget',
        status: 'Done',
        description: 'Announcements and alerts system.',
        technicalDetails: [
          'CRUD operations via API.',
          'Attachment support (Images/Files).',
          'Role-based permission (Create vs View).',
          'Cover image cropping.'
        ]
      },
      {
        title: 'Tasks Widget',
        status: 'Done',
        description: 'Personal productivity tool.',
        technicalDetails: [
          'Local state management.',
          'Filtering (Today, Upcoming).',
          'Date picker integration.',
          'Optimistic UI updates.'
        ]
      },
      {
        title: 'Users Directory',
        status: 'Done',
        description: 'Searchable member list.',
        technicalDetails: [
          'Server-side filtering.',
          'Profile view integration.',
          'Role badge display.'
        ]
      },
      {
        title: 'Schedule',
        status: 'In Progress',
        description: 'Class/Meeting timetable.',
        technicalDetails: [
          'Backend: Group/Event entities created.',
          'Frontend: Static mock data currently.',
          'TODO: Connect to Groups API.',
          'TODO: Calendar view implementation.'
        ]
      },
      {
        title: 'Chat',
        status: 'In Progress',
        description: 'Real-time messaging.',
        technicalDetails: [
          'Backend: WebSocketHandler implemented.',
          'Frontend: Static UI.',
          'TODO: Connect WebSocket client.',
          'TODO: Message persistence.'
        ]
      },
      {
        title: 'Grades',
        status: 'Todo',
        description: 'Academic record tracking.',
        technicalDetails: [
          'Backend: Schema needed.',
          'Frontend: Static mock data.',
          'TODO: Gradebook entity.',
          'TODO: Teacher input interface.'
        ]
      },
      {
        title: 'Assignments',
        status: 'Todo',
        description: 'Homework submission system.',
        technicalDetails: [
          'Backend: Schema needed.',
          'Frontend: Static mock data.',
          'TODO: File upload for submissions.',
          'TODO: Deadline enforcement.'
        ]
      }
    ]
  },
  {
    title: 'Core Architecture',
    icon: 'architecture',
    items: [
      {
        title: 'Authentication',
        status: 'Done',
        description: 'Secure JWT-based auth.',
        technicalDetails: [
          'Multi-session support.',
          'SecureStore for tokens.',
          'AsyncStorage for session metadata.',
          'Auto-refresh logic.'
        ]
      },
      {
        title: 'Theming Engine',
        status: 'Done',
        description: 'Context-aware styling.',
        technicalDetails: [
          'OrganizationThemeContext.',
          'Automatic contrast calculation (WCAG).',
          'Light/Dark mode variants generation.'
        ]
      },
      {
        title: 'Offline Sync',
        status: 'In Progress',
        description: 'Resiliency layer.',
        technicalDetails: [
          'Repository pattern implementation.',
          'NetInfo integration.',
          'TODO: Queue processing logic refinement.',
          'TODO: Conflict resolution.'
        ]
      }
    ]
  }
];

export default function StatusScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Registration Flow']));

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 24, paddingBottom: 16 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text },
    headerSubtitle: { fontSize: 16, color: colors.subtle, marginTop: 4 },
    content: { padding: 16 },
    section: { marginBottom: 16, backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' },
    sectionTitleContainer: { flexDirection: 'row', alignItems: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginLeft: 12 },
    sectionContent: { padding: 16, paddingTop: 0 },
    item: { marginBottom: 16, paddingLeft: 12, borderLeftWidth: 2, borderColor: colors.border },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    itemTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    itemDesc: { fontSize: 14, color: colors.subtle, marginBottom: 8 },
    techDetails: { backgroundColor: colors.background, padding: 12, borderRadius: 8 },
    techItem: { fontSize: 12, color: colors.subtle, marginBottom: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8, backgroundColor: colors.card, borderRadius: 20, elevation: 2, borderWidth: 1, borderColor: colors.border },
  }), [colors]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Done': return '#22c55e'; // Green
      case 'In Progress': return '#eab308'; // Yellow
      case 'Todo': return '#ef4444'; // Red
      default: return colors.subtle;
    }
  };

  const toggleSection = (title: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = new Set(expandedSections);
    if (next.has(title)) {
      next.delete(title);
    } else {
      next.add(title);
    }
    setExpandedSections(next);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <MaterialIcons name="close" size={24} color={colors.text} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Project Status</Text>
          <Text style={styles.headerSubtitle}>Degree Project Progress Report</Text>
        </View>

        <View style={styles.content}>
          {PROJECT_DATA.map((section, index) => {
            const isExpanded = expandedSections.has(section.title);
            return (
              <View key={index} style={styles.section}>
                <TouchableOpacity 
                  style={styles.sectionHeader} 
                  onPress={() => toggleSection(section.title)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionTitleContainer}>
                    <MaterialIcons name={section.icon} size={24} color={colors.primary} />
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                  </View>
                  <MaterialIcons 
                    name={isExpanded ? "expand-less" : "expand-more"} 
                    size={24} 
                    color={colors.subtle} 
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.sectionContent}>
                    {section.items.map((item, idx) => (
                      <View key={idx} style={[styles.item, { borderColor: getStatusColor(item.status) }]}>
                        <View style={styles.itemHeader}>
                          <Text style={styles.itemTitle}>{item.title}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                          </View>
                        </View>
                        <Text style={styles.itemDesc}>{item.description}</Text>
                        {item.technicalDetails && (
                          <View style={styles.techDetails}>
                            {item.technicalDetails.map((detail, dIdx) => (
                              <Text key={dIdx} style={styles.techItem}>• {detail}</Text>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

