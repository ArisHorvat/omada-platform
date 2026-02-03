import React, { useMemo } from 'react';
import { View, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  useAnimatedScrollHandler, 
  useSharedValue, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolate 
} from 'react-native-reanimated';

import { useThemeColors } from '@/src/hooks';
import { createStyles } from '@/src/screens/widgets/dashboard/styles/dashboard.styles';
import { useDashboardLogic } from '@/src/screens/widgets/dashboard/hooks/useDashboardLogic';
import { DashboardWidget } from '@/src/components/dashboard/DashboardWidget';
import { AppText, GlassView, Icon, BentoGrid } from '@/src/components/ui';
import { AnimatedItem } from '@/src/components/animations';
import { CARD_WIDTH, SNAP_INTERVAL } from '../styles/dashboard.styles';
import { SearchBar } from '@/src/components/dashboard/SearchBar';
import { DateStrip } from '@/src/components/dashboard/DateStrip';

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

  const getWidgetSize = (id: string) => {
      if (id === 'map') return 'large';      // 2x2
      if (id === 'schedule') return 'wide';  // 2x1
      if (id === 'news') return 'wide';      // 2x1
      return 'small';                        // 1x1
  };

  // 1. Scroll Handler for Sticky Blur
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // 2. Animated Header Styles
  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 60], [0, 1], Extrapolate.CLAMP);
    return { opacity };
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />
      
      {/* 3. STICKY GLASS HEADER (Absolute Positioned) */}
      {/* This sits ON TOP of the scrollview. Initially invisible, appears on scroll. */}
      <Animated.View style={[styles.stickyHeaderContainer, headerStyle, { zIndex: 100 }]}>
         <GlassView intensity={95} style={styles.stickyGlass}>
             <AppText variant="h3" weight="bold">{organization?.name || 'Dashboard'}</AppText>
             {/* Small Avatar or Menu icon here */}
         </GlassView>
      </Animated.View>

      <Animated.ScrollView 
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* BIG HEADER (Disappears on scroll) */}
        <SafeAreaView edges={['top']} style={{ paddingBottom: 10 }}>
          <View style={styles.header}>
            <View style={styles.greetingContainer}>
              <AppText style={styles.dateText}>{currentDate}</AppText>
              <AppText variant="display" weight="bold" style={styles.greeting}>{greeting}</AppText>
              <AppText variant="h3" style={styles.orgName}>{organization?.name || 'Loading...'}</AppText>
            </View>
          </View>
        </SafeAreaView>

        {/* 2. Universal Search */}
        <SearchBar onPress={() => router.push('..')} />
        <View style={{ height: 20 }} />

        {/* 3. Date Strip (Great for Schedule context) */}
        <DateStrip />
        <View style={{ height: 20 }} />

        {/* 4. CASCADING SECTIONS */}
        
        {/* Highlights Deck */}
        <AnimatedItem index={0}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <AppText style={styles.sectionTitle}>Highlights</AppText>
            </View>
            
            <Animated.ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.deckContainer}
              
              // SNAP PROPS
              snapToInterval={SNAP_INTERVAL} // The width of one item (Card + Margin)
              decelerationRate="fast"        // Makes it stop quickly like a carousel
              snapToAlignment="start"        // Aligns the card to the left edge (plus padding)
              disableIntervalMomentum={true} // Prevents scrolling through 10 cards at once
            >
              {widgets.filter(w => ['schedule', 'tasks', 'news', 'grades', 'assignments', 'attendance', 'chat', 'map', 'users'].includes(w)).map((w, i) => (
                // WRAPPER WITH EXACT MARGIN
                <View key={w} style={{ marginRight: 16 /* Must match CARD_MARGIN */ }}>
                    <AnimatedItem index={i} delay={50}>
                      <DashboardWidget id={w} config={widgetConfig[w]} variant="card" />
                    </AnimatedItem>
                </View>
              ))}
            </Animated.ScrollView>
          </View>
        </AnimatedItem>

        <View style={styles.divider} />

        {/* Apps Rail */}
        <AnimatedItem index={1}>
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <AppText style={styles.sectionTitle}>All Apps</AppText>
                <TouchableOpacity onPress={() => router.push('/more')}>
                    <AppText style={styles.sectionAction}>See All</AppText>
                </TouchableOpacity>
              </View>
              <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.appsContainer}>
                {sortedWidgets.map((w, i) => (
                  <AnimatedItem key={w} index={i} delay={30}>
                     <DashboardWidget id={w} config={widgetConfig[w]} variant="rail" />
                  </AnimatedItem>
                ))}
              </Animated.ScrollView>
            </View>
        </AnimatedItem>

        <View style={styles.divider} />

        {/* FAVORITES BENTO GRID */}
       <AnimatedItem index={2}>
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <AppText style={styles.sectionTitle}>My Favorites</AppText>
                <TouchableOpacity onPress={() => router.push('/manage-favorites')}>
                  <AppText style={styles.sectionAction}>Arrange</AppText>
                </TouchableOpacity>
              </View>
              
              <View style={{ paddingHorizontal: 20 }}>
                  <BentoGrid gap={12}>
                    {pinnedWidgets.filter(w => widgets.includes(w)).map((w, i) => (
                        <DashboardWidget 
                            key={w} 
                            id={w} 
                            config={widgetConfig[w]} 
                            variant="bento" 
                            size={getWidgetSize(w)} 
                        />
                    ))}
                  </BentoGrid>
              </View>

            </View>
        </AnimatedItem>

      </Animated.ScrollView>
    </View>
  );
}