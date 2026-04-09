import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { AppText, ClayView, Icon, IconName } from '@/src/components/ui';
import { useThemeColors, useDebounce } from '@/src/hooks'; 
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { SearchBar } from '@/src/screens/widgets/dashboard/components/SearchBar';
import { PressClay } from '@/src/components/animations/PressClay'; // <--- UPDATED
import { AnimatedItem } from '@/src/components/animations';
import { useDashboardLogic } from '@/src/screens/widgets/dashboard/hooks/useDashboardLogic';
import { ClayAnimations } from '@/src/constants/animations'; // <--- UPDATED

export default function AllAppsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { data, config } = useDashboardLogic();

  // Search State
  const [searchInput, setSearchInput] = useState('');
  const debouncedQuery = useDebounce(searchInput, 300);

  // Grouping Logic
  const groupedWidgets = useMemo(() => {
    const groups: Record<string, string[]> = {};
    const query = debouncedQuery.toLowerCase();

    const filtered = data.allWidgets.filter(id => {
      const def = config.definitions[id];
      if (!def) return false;
      return (
        def.name.toLowerCase().includes(query) || 
        def.category.toLowerCase().includes(query)
      );
    });

    filtered.forEach(id => {
      const def = config.definitions[id];
      if (!groups[def.category]) groups[def.category] = [];
      groups[def.category].push(id);
    });

    return groups;
  }, [data.allWidgets, debouncedQuery, config]);

  const categories = Object.keys(groupedWidgets).sort();
  const isSearching = debouncedQuery.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
            <ClayBackButton />
            <AppText variant="h3" weight="bold">All Apps</AppText>
            <View style={{ width: 44 }} /> 
        </View>
        
        <View style={{ marginTop: 16 }}>
             <SearchBar 
                autoFocus={false} // Better UX not to auto-pop keyboard on nav
                placeholder="Filter apps..."
                value={searchInput} 
                onChangeText={setSearchInput}
             />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}>
        
        {categories.map((category, index) => (
            <Animated.View 
                key={category} 
                // Smoothly slide categories when filtering
                layout={ClayAnimations.LayoutStable}
                // Only stagger animation on first load, not during search
                entering={isSearching ? FadeIn : ClayAnimations.SlideInFlow(index)}
                exiting={FadeOut}
                style={styles.sectionContainer}
            >
                <AppText style={[styles.sectionTitle, { color: colors.text }]}>{category}</AppText>
                
                <View style={styles.grid}>
                    {groupedWidgets[category].map((id) => {
                        const def = config.definitions[id];
                        
                        return (
                            <Animated.View 
                                key={id}
                                // The magic fix for "dizzy" movement
                                layout={ClayAnimations.LayoutStable}
                                entering={FadeIn}
                                exiting={FadeOut}
                            >
                                <PressClay onPress={() => router.push(`/${id}` as any)}>
                                    <ClayView 
                                        depth={5} // Deeper shadow for buttons
                                        puffy={10} 
                                        color={colors.card}
                                        style={styles.appItem}
                                    >
                                        <View style={[styles.iconBox, { backgroundColor: def.bg }]}>
                                            <Icon name={def.icon as IconName} size={28} color={def.iconColor} />
                                        </View>
                                        <AppText 
                                            variant="caption" 
                                            weight="bold" 
                                            style={[styles.appName, { color: colors.text }]}
                                            numberOfLines={1}
                                        >
                                            {def.name}
                                        </AppText>
                                    </ClayView>
                                </PressClay>
                            </Animated.View>
                        );
                    })}
                </View>
            </Animated.View>
        ))}

        {categories.length === 0 && (
            <View style={{ marginTop: 50, alignItems: 'center' }}>
                <AppText style={{ color: colors.subtle }}>No apps found.</AppText>
            </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  appItem: {
    width: 100,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 20,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  appName: {
    textAlign: 'center',
    fontSize: 12,
  }
});