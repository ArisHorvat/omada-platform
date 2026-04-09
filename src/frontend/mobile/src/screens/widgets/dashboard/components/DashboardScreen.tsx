import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useAnimatedScrollHandler, 
  useSharedValue, 
  useAnimatedStyle, 
  interpolate, 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useThemeColors, useTabContentBottomPadding } from '@/src/hooks';
import { createStyles, SNAP_INTERVAL } from '@/src/screens/widgets/dashboard/styles/dashboard.styles'; 
import { useDashboardLogic } from '@/src/screens/widgets/dashboard/hooks/useDashboardLogic';
import { DashboardWidget } from './DashboardWidget';
import { AppText, ClayView, BentoGrid, Divider, AppButton } from '@/src/components/ui';
import { AnimatedItem } from '@/src/components/animations';
import { SearchBar } from './SearchBar';
import { SmartHighlightFrame } from './SmartHighlightFrame';
import { computeBentoLayout } from '../utils/bentoLayout';
import { ClayAnimations } from '@/src/constants/animations';
import { CARD_MARGIN } from '../styles/dashboard.styles';

export default function DashboardScreen() {
  const colors = useThemeColors();
  const tabBottomPad = useTabContentBottomPadding(24);
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const { meta, data, config, user } = useDashboardLogic();

  const bentoItems = useMemo(() => {
    const favorites = user.favorites.filter((id: string) => id !== 'digital-id' && id !== 'groups');
    return computeBentoLayout(favorites, config.definitions);
  }, [user.favorites, config.definitions]);

  const handleRemoveWidget = (widgetId: string) => {
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
     const newFavorites = user.favorites.filter((id: string) => id !== widgetId);
     user.updateFavorites(newFavorites);
  };

  const onLongPressWidget = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    user.onLongPressWidget();
  };

  const BENTO_CONTAINER_PADDING = 20;
  const BENTO_GAP = 12;
  const availableWidth = Math.max(0, screenWidth - BENTO_CONTAINER_PADDING * 2);
  const smallWidth = (availableWidth - BENTO_GAP) / 2;
  const largeWidth = availableWidth;
  const smallHeight = Math.round(smallWidth);
  // Required formula: LARGE_HEIGHT = (SMALL_HEIGHT * 2) + GAP
  const largeHeight = smallHeight * 2 + BENTO_GAP;

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [110, 160], [0, 1], 'clamp');
    const translateY = interpolate(scrollY.value, [110, 160], [-10, 0], 'clamp');
    return { 
        opacity, 
        transform: [{ translateY }],
        pointerEvents: opacity === 0 ? 'none' : 'auto', 
    };
  });

  return (
    <View style={[styles.container, { flex: 1 }]}>
      
      {/* STICKY HEADER */}
      <Animated.View style={[
          styles.stickyHeaderWrapper,
          { top: -50, height: 120 + insets.top, zIndex: 10 },
          headerStyle
      ]}>
         <ClayView depth={10} puffy={5} color={colors.card} style={[styles.stickyHeaderContent, { paddingTop: insets.top + 50 }]}>
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
        contentContainerStyle={{ paddingBottom: tabBottomPad }} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* MAIN HEADER */}
        <AnimatedItem animation={ClayAnimations.Header}>
            <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 10, marginBottom: 10 }}>
                <View style={styles.greetingContainer}>
                    <AppText style={styles.dateText}>{meta.currentDate}</AppText>
                    <AppText variant="display" weight="bold" style={styles.greeting}>{meta.greeting}</AppText>
                    <AppText variant="h3" style={styles.orgName}>{data.organization?.name || 'Loading...'}</AppText>
                </View>
            </View>
        </AnimatedItem>

        {/* SEARCH & DATE */}
        <AnimatedItem index={0}>
          <View style={{ paddingHorizontal: 20 }}>
            <SearchBar onPress={() => router.push('..')} />
          </View>
        </AnimatedItem>
        <View style={styles.spacer} />

        {/* HIGHLIGHTS SECTION */}
        <AnimatedItem index={1}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <AppText style={styles.sectionTitle}>Smart Highlights</AppText>
                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                  Priorities for {format(new Date(), 'EEEE, MMM d')}
                </AppText>
              </View>
            </View>
            <Animated.ScrollView 
              horizontal showsHorizontalScrollIndicator={false} snapToInterval={SNAP_INTERVAL} 
              decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}
              onScroll={scrollHandler} scrollEventThrottle={16}
            >
              {data.highlights.map((w, i) => (
                <AnimatedItem key={w} animation={ClayAnimations.SlideInFlow(i)}>
                  <SmartHighlightFrame emphasized={i === 0}>
                    <DashboardWidget
                      id={w}
                      config={config.definitions[w]}
                      variant="card"
                      cardTrailingMargin={i === 0 ? 0 : CARD_MARGIN}
                      isEditing={false}
                      onLongPress={onLongPressWidget}
                      onRemove={handleRemoveWidget}
                    />
                  </SmartHighlightFrame>
                </AnimatedItem>
              ))}
            </Animated.ScrollView>
          </View>
        </AnimatedItem>

        <Divider margin={24} />

        {/* --- FAVORITES BENTO --- */}
        <AnimatedItem index={2}>
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <AppText style={styles.sectionTitle}>My Favorites</AppText>
              </View>

              <View style={{ paddingHorizontal: 20 }}>
                  {bentoItems.length === 0 ? (
                    <View style={{ paddingVertical: 6 }}>
                      <ClayView
                        color={colors.card}
                        depth={10}
                        puffy={16}
                        style={{ padding: 16, borderRadius: 20, alignItems: 'center' }}
                      >
                        <AppText weight="bold" style={{ textAlign: 'center' }}>
                          No favorites yet
                        </AppText>
                        <AppText
                          variant="caption"
                          style={{ textAlign: 'center', marginTop: 6, color: colors.subtle }}
                        >
                          Add apps you use most for quick access.
                        </AppText>
                        <View style={{ marginTop: 12, alignSelf: 'stretch' }}>
                          <AppButton
                            title="Manage favorites"
                            variant="outline"
                            onPress={() => router.push('/manage-favorites')}
                          />
                        </View>
                      </ClayView>
                    </View>
                  ) : null}
                  <BentoGrid>
                    {bentoItems.map(({ id: w, effectiveSize }, i) => {
                        const widgetConfig = config.definitions[w];
                        if (!widgetConfig) return null;

                        const isWide = effectiveSize === 'wide' || effectiveSize === 'large';

                        return (
                            <AnimatedItem 
                                key={w} 
                                animation={ClayAnimations.SlideInFlow(i)}
                                style={{
                                  width: isWide ? largeWidth : smallWidth,
                                  marginBottom: BENTO_GAP,
                                }}
                            >
                                <DashboardWidget 
                                    id={w} 
                                    config={widgetConfig} 
                                    variant="bento" 
                                    size={effectiveSize} 
                                    bentoSizing={{ smallHeight, largeHeight }}
                                    isEditing={user.isEditing}
                                    onLongPress={onLongPressWidget}
                                    onRemove={handleRemoveWidget}
                                />
                            </AnimatedItem>
                        );
                    })}
                  </BentoGrid>
              </View>
            </View>
        </AnimatedItem>

        <Divider margin={24} />

        {/* APPS RAIL */}
        <AnimatedItem index={3}>
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
                      <DashboardWidget
                        id={w}
                        config={config.definitions[w]}
                        variant="rail"
                        isEditing={false}
                        onLongPress={onLongPressWidget}
                        onRemove={handleRemoveWidget}
                      />
                  </AnimatedItem>
                ))}
              </Animated.ScrollView>
            </View>
        </AnimatedItem>

      </Animated.ScrollView>

      {/* --- 2. FIX THE BANNER! Place it outside the scroll view, at the bottom so it's always on top --- */}
      {user.isEditing && (
        <Animated.View 
            entering={ClayAnimations.SlideInFlow(0)} 
            style={{ 
                position: 'absolute', 
                bottom: insets.bottom + 100, // Floats nicely above bottom tabs
                left: 20, right: 20, 
                zIndex: 999, // Guarantees it's on top
                elevation: 10 // For Android
            }}
        >
          <ClayView color={colors.card} depth={20} puffy={20} style={{ padding: 16, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
             <AppText weight="bold" style={{ marginLeft: 8, flex: 1 }}>Dashboard Edit Mode</AppText>
             <View style={{ flexDirection: 'row', gap: 8, flexShrink: 0 }}>
                 <AppButton 
                    title="Cancel" 
                    variant="outline" 
                    size="sm" 
                    onPress={() => user.setIsEditing(false)} 
                 />
                 <AppButton 
                    title="Customize" 
                    variant="outline" 
                    size="sm" 
                    onPress={() => { router.push('/manage-favorites'); }} 
                 />
             </View>
          </ClayView>
        </Animated.View>
      )}

    </View>
  );
}