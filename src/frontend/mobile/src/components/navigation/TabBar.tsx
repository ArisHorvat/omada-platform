import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// UI Kit
import { GlassView, Icon, IconName } from '@/src/components/ui';
import { PressScale } from '@/src/components/animations';
import { useOrganizationTheme } from '@/src/context/OrganizationThemeContext';
import { CurrentOrganizationService } from '@/src/services/CurrentOrganizationService';
import { useThemeColors } from '@/src/hooks';

const { width } = Dimensions.get('window');

// FIXED ICONS MAPPING
const ROUTE_ICONS: Record<string, IconName> = {
  news: 'campaign',          // Left Edge
  chat: 'chat',              // Inner Left
  dashboard: 'dashboard',    // (Hidden, accessed via FAB)
  schedule: 'calendar-today',// Inner Right
  profile: 'person',         // Right Edge
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

  // 1. RENDER TAB BUTTON
  const renderTab = (name: string, index: number) => {
    const route = state.routes.find(r => r.name === name);
    if (!route) return <View key={`empty-${index}`} style={styles.tabItem} />;

    const isFocused = state.index === state.routes.indexOf(route);
    const iconName = ROUTE_ICONS[name] as IconName;

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
    };

    return (
      <View key={route.key} style={styles.tabItem}>
        <PressScale onPress={onPress}>
          <View style={[
             styles.iconContainer,
             isFocused && { backgroundColor: primary + '15' }
          ]}>
             <Icon 
                name={iconName} 
                size={24} 
                color={isFocused ? primary : colors.subtle} 
             />
             {isFocused && <View style={[styles.activeDot, { backgroundColor: primary }]} />}
          </View>
        </PressScale>
      </View>
    );
  };

  const isDashboardFocused = state.routes[state.index].name === 'dashboard';
  const BOTTOM_PADDING = Math.max(insets.bottom, 10);
  const BUTTON_SIZE = 80; 

  return (
    <View style={styles.container}>
      
      {/* 2. THE GLASS BAR */}
      <GlassView 
        intensity={80} 
        style={[
            styles.glassBar, 
            { 
                paddingBottom: BOTTOM_PADDING + 1,
                paddingTop: 10,
                borderTopColor: colors.border,
                backgroundColor: colors.card + 'E6',
                marginBottom: -1 
            }
        ]}
      >
        {/* LEFT GROUP: News & Chat */}
        <View style={styles.sideGroup}>
           {renderTab('news', 0)}
           {renderTab('chat', 1)}
        </View>

        {/* CENTER SPACER (For FAB) */}
        <View style={{ width: BUTTON_SIZE + 10 }} />

        {/* RIGHT GROUP: Schedule & Profile */}
        <View style={styles.sideGroup}>
           {renderTab('schedule', 2)}
           {renderTab('profile', 3)}
        </View>
      </GlassView>

      {/* 3. FLOATING ACTION BUTTON (DASHBOARD) */}
      <View 
        style={[
            styles.floatingContainer, 
            { top: -10, height: BUTTON_SIZE, width: BUTTON_SIZE }
        ]} 
        pointerEvents="box-none"
      >
         <PressScale 
            onPress={() => navigation.navigate('dashboard')}
            style={[
                styles.floatingButton,
                { 
                    width: BUTTON_SIZE,
                    height: BUTTON_SIZE,
                    borderRadius: BUTTON_SIZE / 2,
                    backgroundColor: colors.card,
                    borderColor: isDashboardFocused ? primary : colors.border,
                    shadowColor: isDashboardFocused ? primary : '#000',
                }
            ]}
         >
             {logoUrl ? (
                <Image 
                    source={{ uri: logoUrl }} 
                    style={[
                        styles.logo,
                        { width: BUTTON_SIZE - 6, height: BUTTON_SIZE - 6, borderRadius: (BUTTON_SIZE - 6) / 2 },
                        isDashboardFocused && { borderWidth: 2, borderColor: primary }
                    ]} 
                />
             ) : (
                <View style={[
                    styles.logoPlaceholder, 
                    { 
                        width: BUTTON_SIZE - 6, height: BUTTON_SIZE - 6, borderRadius: (BUTTON_SIZE - 6) / 2,
                        backgroundColor: primary 
                    }
                ]}>
                    <Icon name="business" size={32} color="#fff" />
                </View>
             )}
         </PressScale>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', backgroundColor: 'transparent', zIndex: 100, elevation: 20 },
  glassBar: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 10, borderTopWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5,
  },
  sideGroup: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  tabItem: { alignItems: 'center', justifyContent: 'center', height: 50, width: 60 },
  iconContainer: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  activeDot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2 },
  floatingContainer: { position: 'absolute', left: (width / 2) - 40, zIndex: 20, alignItems: 'center', justifyContent: 'center' },
  floatingButton: { alignItems: 'center', justifyContent: 'center', borderWidth: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
  logo: { resizeMode: 'cover' },
  logoPlaceholder: { alignItems: 'center', justifyContent: 'center' }
});