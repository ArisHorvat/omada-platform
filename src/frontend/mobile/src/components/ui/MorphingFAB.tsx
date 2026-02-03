import React, { useState } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  useSharedValue,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { Icon, IconName } from './Icon';
import { AppText } from './AppText';
import { useThemeColors } from '@/src/hooks';
import * as Haptics from 'expo-haptics';

export const MorphingFab = () => {
  const colors = useThemeColors();
  const [isOpen, setIsOpen] = useState(false);
  const animation = useSharedValue(0);

  const toggleMenu = () => {
    Haptics.selectionAsync();
    const nextState = !isOpen;
    setIsOpen(nextState);
    // Spring animation for "alive" feel
    animation.value = withSpring(nextState ? 1 : 0, { damping: 12 });
  };

  // 1. ROTATE THE PLUS ICON
  const iconStyle = useAnimatedStyle(() => {
    const rotate = interpolate(animation.value, [0, 1], [0, 45]);
    return { transform: [{ rotate: `${rotate}deg` }] };
  });

  // 2. EXPAND THE MENU (Morphing Effect)
  const menuStyle = useAnimatedStyle(() => {
    // Moves from bottom (behind button) to top
    const translateY = interpolate(animation.value, [0, 1], [20, -70]);
    const opacity = interpolate(animation.value, [0, 0.5, 1], [0, 0, 1]);
    const scale = interpolate(animation.value, [0, 1], [0.5, 1]);

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  return (
    <View style={styles.container}>
      {/* THE MENU (Initially Hidden) */}
      <Animated.View style={[styles.menuContainer, menuStyle]}>
        <QuickAction label="Scan QR" icon="qr-code-scanner" color={colors.primary} />
        <QuickAction label="New Task" icon="add-task" color={colors.secondary} />
      </Animated.View>

      {/* THE FAB */}
      <TouchableWithoutFeedback onPress={toggleMenu}>
        <Animated.View style={[styles.fab, { backgroundColor: colors.primary }]}>
          <Animated.View style={iconStyle}>
            <Icon name="add" size={30} color="#fff" />
          </Animated.View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const QuickAction = ({ label, icon, color }: { label: string, icon: IconName, color: string }) => {
  return (
    <View style={styles.actionRow}>
      <View style={styles.actionLabel}>
        <AppText variant="caption" weight="bold" style={{ color: '#fff' }}>{label}</AppText>
      </View>
      <View style={[styles.miniFab, { backgroundColor: color }]}>
        <Icon name={icon} size={20} color="#fff" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Position above the TabBar
    right: 20,
    alignItems: 'center',
    zIndex: 999,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  menuContainer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'flex-end',
    width: 150,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'flex-end',
  },
  miniFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  actionLabel: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  }
});