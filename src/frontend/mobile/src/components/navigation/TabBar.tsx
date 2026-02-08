import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Dimensions, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClayView, Icon, IconName } from '@/src/components/ui'; 
import { PressClay } from '@/src/components/animations/PressClay'; 
import { useOrganizationTheme } from '@/src/context/OrganizationThemeContext';
import { CurrentOrganizationService } from '@/src/services/CurrentOrganizationService';
import { useThemeColors } from '@/src/hooks';
import { AnimatedItem } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';

const { width } = Dimensions.get('window');

const ROUTE_ICONS: Record<string, IconName> = {
  news: 'campaign',
  chat: 'chat',
  dashboard: 'dashboard',
  schedule: 'calendar-today',
  profile: 'person',
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { primary } = useOrganizationTheme();
  
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = CurrentOrganizationService.subscribe((data) => {
      if (data) setLogoUrl(data.logoUrl);
    });
    return () => unsubscribe();
  }, []);

  // --- CONFIGURATION ---
  const BAR_HEIGHT = 70;
  const FAB_SIZE = 90; 
  const FLOAT_MARGIN = 20; 
  
  // Center Alignment
  const BAR_CENTER_Y = FLOAT_MARGIN + insets.bottom + (BAR_HEIGHT / 2);
  const FAB_BOTTOM = BAR_CENTER_Y - (FAB_SIZE / 2);

  const isDashboardFocused = state.routes[state.index].name === 'dashboard';

  const renderTab = (name: string) => {
    const route = state.routes.find(r => r.name === name);
    if (!route) return <View style={styles.slot} />;

    const isFocused = state.index === state.routes.indexOf(route);
    const iconName = ROUTE_ICONS[name] as IconName;

    return (
      <View key={route.key} style={styles.slot}>
        <PressClay onPress={() => navigation.navigate(route.name)}>
            <View style={styles.iconContainer}>
                <Icon 
                    name={iconName} 
                    size={28} 
                    color={isFocused ? primary : colors.subtle} 
                />
                {isFocused && (
                    <View style={[styles.activeDot, { backgroundColor: primary }]} />
                )}
            </View>
        </PressClay>
      </View>
    );
  };

  return (
    <AnimatedItem
      style={styles.container}
      pointerEvents="box-none" // Essential for click-through
      animation={ClayAnimations.TabBarSlideUp} // Slide Up on mount
      exiting={ClayAnimations.TabBarSlideDown} // Slide Down on unmount
    >
        
        {/* 1. THE BAR (Background Strap) */}
        <View 
            style={[
                styles.beltPosition, 
                { 
                    bottom: FLOAT_MARGIN + insets.bottom, 
                    height: BAR_HEIGHT,
                }
            ]}
        >
            <ClayView 
                depth={15} 
                puffy={10} 
                color={colors.card}
                style={styles.beltStrap}
            >
                <View style={styles.gridContainer}>
                    {renderTab('news')}
                    {renderTab('chat')}
                    <View style={[ { width: FAB_SIZE }]} /> 
                    {renderTab('schedule')}
                    {renderTab('profile')}
                </View>
            </ClayView>
        </View>

        {/* 2. THE FAB (Centered Button) */}
        <View 
            style={[
                styles.bucklePosition, 
                { 
                    left: (width / 2) - (FAB_SIZE / 2),
                    bottom: FAB_BOTTOM,
                    width: FAB_SIZE, 
                    height: FAB_SIZE,
                }
            ]} 
            pointerEvents="box-none"
        >
            <PressClay 
                onPress={() => navigation.navigate('dashboard')} 
                style={{ width: '100%', height: '100%' }}
            >
                <ClayView
                    // 1. The ClayView acts as the BORDER/FRAME
                    depth={isDashboardFocused ? 10 : 20} 
                    puffy={20} 
                    // This color becomes the "Border" color
                    color={isDashboardFocused ? primary : colors.card}
                    style={[
                        styles.buckle, 
                        { 
                            borderRadius: FAB_SIZE / 2,
                            // 2. We add PADDING to create the border thickness
                            // This pushes the image inside, leaving the clay rim exposed
                            padding: 5, 
                        }
                    ]}
                >
                    {/* 3. Inner Container clips the image to a perfect circle */}
                    <View style={styles.buckleInner}>
                        {logoUrl ? (
                            <Image 
                                source={{ uri: logoUrl }} 
                                style={styles.logo} 
                                // 4. CRITICAL FIX: 'cover' zooms the photo to fill the circle
                                resizeMode="cover" 
                            />
                        ) : (
                            <Icon name="grid-view" size={38} color={isDashboardFocused ? '#FFF' : primary} />
                        )}
                    </View>
                </ClayView>
            </PressClay>
        </View>
    </AnimatedItem>
  );
}

const styles = StyleSheet.create({
  container: { 
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 180, 
      justifyContent: 'flex-end',
      backgroundColor: 'transparent',
      elevation: 0, 
      zIndex: 9999,
  },
  
  // STRAP
  beltPosition: {
      position: 'absolute',
      left: 15, 
      right: 15,
      zIndex: 1, 
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
  },
  beltStrap: {
      flex: 1,
      borderRadius: 40, 
      justifyContent: 'center',
  },
  
  gridContainer: {
      flexDirection: 'row',
      width: '100%',
      height: '100%',
  },
  slot: {
      flex: 1, 
      alignItems: 'center',
      justifyContent: 'center',
  },

  iconContainer: {
      width: 50, 
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
  },
  activeDot: {
      position: 'absolute', 
      bottom: 6, 
      width: 4, 
      height: 4, 
      borderRadius: 2, 
  },

  // FAB STYLES
  bucklePosition: {
      position: 'absolute', 
      zIndex: 10, 
      alignItems: 'center', 
      justifyContent: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 12,
  },
  buckle: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      // No overflow hidden here, we want the clay shadow to exist
  },
  buckleInner: { 
     width: '100%', 
     height: '100%', 
     // This ensures the image stays circular inside the border
     borderRadius: 100,
     overflow: 'hidden', 
     justifyContent: 'center', 
     alignItems: 'center',
     // Optional: Add a subtle background color if image has transparency
     backgroundColor: '#f0f0f0', 
  },
  logo: {
      width: '100%',
      height: '100%',
      // Ensures the image fills the circle completely
  }
});