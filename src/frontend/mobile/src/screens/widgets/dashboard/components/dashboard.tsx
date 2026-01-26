import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { createStyles } from '@/src/screens/widgets/dashboard/styles/dashboard.styles';
import { useDashboardLogic } from '@/src/screens/widgets/dashboard/hooks/useDashboardLogic';
import { SmartWidgetCard } from '@/src/components/SmartWidgetCard';
import { MaterialIcons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { 
    organization, 
    widgets, 
    sortedWidgets, 
    widgetConfig, 
    pinnedWidgets, 
    greeting, 
    currentDate 
  } = useDashboardLogic();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={styles.dateText}>{currentDate}</Text>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.orgName}>{organization?.name || 'Loading...'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. Highlights Deck (Horizontal Scroll) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Highlights</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deckContainer}>
            {/* Prioritize specific widgets for the deck */}
            {widgets.filter(w => ['schedule', 'tasks', 'news', 'grades'].includes(w)).map(w => (
              <SmartWidgetCard key={w} id={w} config={widgetConfig[w]} variant="card" />
            ))}
            
            {/* Fallback if no "smart" widgets are enabled */}
            {widgets.length > 0 && !widgets.some(w => ['schedule', 'tasks', 'news', 'grades'].includes(w)) && (
               <SmartWidgetCard id={widgets[0]} config={widgetConfig[widgets[0]]} variant="card" />
            )}
          </ScrollView>
        </View>

        <View style={styles.divider} />

        {/* 2. Apps Rail (Horizontal Scroll) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Apps</Text>
            <TouchableOpacity onPress={() => router.push('/more')}><Text style={styles.sectionAction}>See All</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.appsContainer}>
            {sortedWidgets.map(w => (
              <SmartWidgetCard key={w} id={w} config={widgetConfig[w]} variant="rail" />
            ))}
          </ScrollView>
        </View>

        <View style={styles.divider} />

        {/* 3. Pinned Widgets (Vertical Stack) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Favorites</Text>
            <TouchableOpacity onPress={() => router.push('/manage-favorites')}>
              <Text style={styles.sectionAction}>Manage</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{ paddingHorizontal: 20 }}>
            {pinnedWidgets.filter(w => widgets.includes(w)).length > 0 ? (
               <View>
                 {pinnedWidgets.filter(w => widgets.includes(w)).map(w => (
                   <SmartWidgetCard key={w} id={w} config={widgetConfig[w]} variant="row" />
                 ))}
               </View>
            ) : (
               <View style={styles.emptyState}>
                  <MaterialIcons name="push-pin" size={32} color={colors.border} />
                  <Text style={styles.emptyStateText}>Pin widgets in your Profile to see them here.</Text>
               </View>
            )}
          </View>
        </View>
        
        {widgets.length === 0 && (
            <Text style={{ color: colors.subtle, width: '100%', textAlign: 'center', marginTop: 40 }}>
                No widgets enabled for this organization.
            </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
