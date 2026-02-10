import React, { useMemo } from 'react';
import { View, TouchableOpacity, DimensionValue } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useAnimatedScrollHandler, 
  useSharedValue, 
  useAnimatedStyle, 
  interpolate, 
} from 'react-native-reanimated';

import { useThemeColors } from '@/src/hooks';
import { createStyles, SNAP_INTERVAL } from '@/src/screens/widgets/dashboard/styles/dashboard.styles'; 
import { useDashboardLogic } from '@/src/screens/widgets/dashboard/hooks/useDashboardLogic';
import { DashboardWidget } from '@/src/components/dashboard/DashboardWidget';
import { AppText, ClayView, BentoGrid, Divider } from '@/src/components/ui';
import { AnimatedItem } from '@/src/components/animations';
import { SearchBar } from '@/src/components/dashboard/SearchBar';
import { DateStrip } from '@/src/components/dashboard/DateStrip';
import { ClayAnimations } from '@/src/constants/animations';
import { BOTTOM_SPACER } from '@/src/constants/layout';

export default function DashboardScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  
  const { meta, data, config, user } = useDashboardLogic();

  // 1. HELPERS
  const getWidgetSize = (id: string) => {
      if (id === 'map') return 'large';      
      if (id === 'schedule') return 'wide';  
      if (id === 'news') return 'wide';      
      if (id === 'grades') return 'wide';
      return 'small';                        
  };

  // 2. SCROLL ANIMATION LOGIC (STICKY HEADER)
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    // Fade in between scroll Y 110 and 160
    const opacity = interpolate(scrollY.value, [110, 160], [0, 1], 'clamp');
    const translateY = interpolate(scrollY.value, [110, 160], [-10, 0], 'clamp');
    return { 
        opacity, 
        transform: [{ translateY }],
        // Hide pointer events when invisible so it doesn't block touch
        pointerEvents: opacity === 0 ? 'none' : 'auto', 
    };
  });

  // 3. DEFINE HIGHLIGHTS (Widgets meant for the top carousel)
  const highlightWidgets = data.allWidgets.filter(w => 
    ['schedule', 'tasks', 'news', 'grades', 'assignments', 'attendance', 'chat', 'map', 'users'].includes(w)
  );

  return (
    <View style={styles.container}>
      
      {/* --- STICKY HEADER (Restored) --- */}
      <Animated.View style={[
          styles.stickyHeaderWrapper,
          { top: -50, height: 120 + insets.top }, // Adjust height to fit content
          headerStyle
      ]}>
         <ClayView 
            depth={10} 
            puffy={5} 
            color={colors.card} 
            style={[
                styles.stickyHeaderContent,
                { paddingTop: insets.top + 50 } 
            ]}
         >
             <View style={styles.stickyHeaderTitleContainer}>
                 <AppText variant="h3" weight="bold" numberOfLines={1} style={styles.stickyHeaderTitleText}>
                     {data.organization?.name || 'Dashboard'}
                 </AppText>
             </View>

             <View style={styles.stickyHeaderSearchContainer}>
                <SearchBar onPress={() => router.push('..')} compact />
             </View>
         </ClayView>
      </Animated.View>

      <Animated.ScrollView 
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: BOTTOM_SPACER }} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* --- MAIN HEADER --- */}
        <AnimatedItem animation={ClayAnimations.Header}>
            <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 10, marginBottom: 10 }}>
                <View style={styles.greetingContainer}>
                    <AppText style={styles.dateText}>{meta.currentDate}</AppText>
                    <AppText variant="display" weight="bold" style={styles.greeting}>{meta.greeting}</AppText>
                    <AppText variant="h3" style={styles.orgName}>{data.organization?.name || 'Loading...'}</AppText>
                </View>
            </View>
        </AnimatedItem>

        {/* --- SEARCH & DATE --- */}
        <AnimatedItem index={0}>
          <View style={{ paddingHorizontal: 20 }}>
            <SearchBar onPress={() => router.push('..')} />
          </View>
        </AnimatedItem>
        
        <View style={styles.spacer} />

        <AnimatedItem index={1}>
             <DateStrip />
        </AnimatedItem>
        
        <View style={styles.spacer} />

        {/* --- 1. HIGHLIGHTS SECTION (Restored) --- */}
        <AnimatedItem index={2}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <AppText style={styles.sectionTitle}>Highlights</AppText>
            </View>
            
            <Animated.ScrollView 
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={SNAP_INTERVAL} 
              decelerationRate="fast" 
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}
              onScroll={scrollHandler}
              scrollEventThrottle={16}
            >
              {highlightWidgets.map((w, i) => (
                <AnimatedItem key={w} animation={ClayAnimations.SlideInFlow(i)}>
                    {/* Note: using config[w] instead of config.definitions[w] based on new hook */}
                    <DashboardWidget id={w} config={config.definitions[w]} variant="card" />
                </AnimatedItem>
              ))}
            </Animated.ScrollView>
          </View>
        </AnimatedItem>

        <Divider margin={24} />

        {/* --- 2. FAVORITES BENTO --- */}
        <AnimatedItem index={3}>
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <AppText style={styles.sectionTitle}>My Favorites</AppText>
                <TouchableOpacity onPress={() => router.push('/manage-favorites')}>
                  <AppText style={styles.sectionAction}>Arrange</AppText>
                </TouchableOpacity>
              </View>
              
              <View style={{ paddingHorizontal: 20 }}>
                  <BentoGrid gap={12}>
                    {user.favorites.filter(w => data.allWidgets.includes(w)).map((w, i) => {
                        const size = getWidgetSize(w);
                        const isWide = size === 'large' || size === 'wide';

                        const wrapperStyle: { width: DimensionValue } = {
                            width: isWide ? '100%' : '48%',
                        };


                        return (
                            <AnimatedItem 
                                key={w} 
                                style={wrapperStyle}
                            >
                                <DashboardWidget 
                                    id={w} 
                                    config={config.definitions[w]} 
                                    variant="bento" 
                                    size={size} 
                                />
                            </AnimatedItem>
                        );
                    })}
                  </BentoGrid>
              </View>
            </View>
        </AnimatedItem>

        <Divider margin={24} />

        {/* --- 3. APPS RAIL --- */}
        <AnimatedItem index={4}>
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <AppText style={styles.sectionTitle}>All Apps</AppText>
                <TouchableOpacity onPress={() => router.push('/more')}>
                    <AppText style={styles.sectionAction}>See All</AppText>
                </TouchableOpacity>
              </View>
              <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.appsContainer}>
                {data.sortedWidgets.map((w, i) => (
                  <AnimatedItem key={w} animation={ClayAnimations.SlideInFlow(i)}>
                      <DashboardWidget id={w} config={config.definitions[w]} variant="rail" />
                  </AnimatedItem>
                ))}
              </Animated.ScrollView>
            </View>
        </AnimatedItem>

      </Animated.ScrollView>
    </View>
  );
}