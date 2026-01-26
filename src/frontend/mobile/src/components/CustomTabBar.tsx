import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { useOrganizationTheme } from '@/src/context/OrganizationThemeContext';
import { CurrentOrganizationService } from '@/src/services/CurrentOrganizationService';

// Define priority for default widgets if user hasn't pinned enough
const DEFAULT_PRIORITY = ['news', 'chat', 'schedule', 'tasks', 'grades', 'assignments', 'map', 'users'];

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useThemeColors();
  const { primary, tertiary } = useOrganizationTheme();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [enabledWidgets, setEnabledWidgets] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = CurrentOrganizationService.subscribe((data) => {
      if (data) {
        setLogoUrl(data.logoUrl);
        setEnabledWidgets(data.widgets || []);
      }
    });
    return () => unsubscribe();
  }, []);

  // 1. Identify available routes (tabs)
  const availableRoutes = state.routes.filter(route => {
    const { options } = descriptors[route.key];
    // Filter out hidden tabs and the dashboard/profile (handled separately or via center button)
    return (options as any).href !== null && route.name !== 'dashboard' && route.name !== 'more';
  });

  // Find the dedicated profile route, which will be fixed in the last slot
  const profileRoute = state.routes.find(route => route.name === 'profile');

  // 2. Determine which 3 widgets to show in the dynamic slots
  const getDisplayWidgets = () => {
    const slots: any[] = [];
    // Exclude profile from the list of potential dynamic widgets
    const availableWidgetRoutes = availableRoutes.filter(r => r.name !== 'profile');
    
    // B. Fill remaining slots with Default Priority widgets
    if (slots.length < 3) {
      DEFAULT_PRIORITY.forEach(id => {
        if (slots.length >= 3) return;
        // Check if enabled for org AND not already added
        if (enabledWidgets.includes(id) && !slots.find(s => s.name === id)) {
          const route = availableWidgetRoutes.find(r => r.name === id);
          if (route) slots.push(route);
        }
      });
    }

    // C. If still < 4, fill with any remaining available routes
    if (slots.length < 3) {
      availableWidgetRoutes.forEach(route => {
        if (slots.length >= 3) return;
        if (!slots.find(s => s.name === route.name)) {
          slots.push(route);
        }
      });
    }

    return slots;
  };

  const displayWidgets = getDisplayWidgets();

  // Distribute into Left (0,1) and Right (2 + Profile)
  const leftSlots = [displayWidgets[0] || null, displayWidgets[1] || null];
  const rightSlots = [displayWidgets[2] || null, profileRoute || null];

  const renderTab = (route: any, index: number) => {
    if (!route) {
      return <View key={`empty-${index}`} style={styles.tabItem} />;
    }

    const { options } = descriptors[route.key];
    const isFocused = state.index === state.routes.indexOf(route);

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={(options as any).tabBarTestID}
        onPress={onPress}
        style={styles.tabItem}
      >
        {options.tabBarIcon && options.tabBarIcon({ 
            focused: isFocused, 
            color: isFocused ? primary : colors.subtle, 
            size: 24 
        })}
      </TouchableOpacity>
    );
  };

  // Check if Dashboard is focused
  const isDashboardFocused = state.routes[state.index].name === 'dashboard';

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {/* Left Slots */}
      {leftSlots.map((route, index) => renderTab(route, index))}

      {/* Center Home Button */}
      <TouchableOpacity 
        style={[styles.centerButton, { backgroundColor: colors.card, borderColor: isDashboardFocused ? primary : colors.border }]}
        onPress={() => navigation.navigate('dashboard')}
      >
        {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.logo} />
        ) : (
            <MaterialIcons name="business" size={32} color={primary} />
        )}
      </TouchableOpacity>

      {/* Right Slots */}
      {rightSlots.map((route, index) => renderTab(route, index + 2))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 70,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -30, 
    borderWidth: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  }
});
