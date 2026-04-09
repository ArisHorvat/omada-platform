import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Imports from your system
import { AppText, Icon } from '@/src/components/ui';
import { PressScale } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';

// Import the new split components (We will create these next)
import { ProjectStatus, UiToolkit, AnimationGallery, HooksGallery } from '@/src/components/showcase';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TABS = ['Status', 'UI Kit', 'Motion', 'Logic'];

export default function DesignSystemScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState('Status');

  const handleTabChange = (tab: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <PressScale onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </PressScale>
        <View>
          <AppText variant="h3">Degree Project</AppText>
          <AppText variant="caption" style={{ color: colors.subtle }}>Omada System Showcase</AppText>
        </View>
      </View>

      {/* Segmented Tab Control */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <PressScale key={tab} onPress={() => handleTabChange(tab)}>
                <View style={[
                  styles.tab, 
                  isActive && { backgroundColor: colors.primary },
                  !isActive && { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
                ]}>
                  <AppText 
                    variant="caption" 
                    weight="bold" 
                    style={{ color: isActive ? '#fff' : colors.text }}
                  >
                    {tab}
                  </AppText>
                </View>
              </PressScale>
            );
          })}
        </ScrollView>
      </View>

      {/* Content Area */}
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {activeTab === 'Status' && <ProjectStatus />}
        {activeTab === 'UI Kit' && <UiToolkit />}
        {activeTab === 'Motion' && <AnimationGallery />}
        {activeTab === 'Logic' && <HooksGallery />}
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 10 },
  backButton: { marginRight: 16, padding: 8, borderRadius: 12 },
  tabContainer: { marginBottom: 20, height: 40 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
});