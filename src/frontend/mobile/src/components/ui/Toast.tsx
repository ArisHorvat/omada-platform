import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, Easing } from 'react-native-reanimated';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';
import { useThemeColors } from '@/src/hooks';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onHide?: () => void;
}

export const Toast = ({ visible, message, type = 'info', onHide }: ToastProps) => {
  const colors = useThemeColors();

  useEffect(() => {
    if (visible && onHide) {
      const timer = setTimeout(onHide, 3000); // Auto hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const getTheme = () => {
    switch (type) {
      case 'success': return { bg: '#E6F6EB', icon: 'check-circle', color: '#00875A' };
      case 'error': return { bg: '#FFEBE6', icon: 'error', color: '#DE350B' };
      default: return { bg: colors.card, icon: 'info', color: colors.text };
    }
  };

  const theme = getTheme();

  return (
    <Animated.View 
      entering={FadeInUp.duration(300).easing(Easing.out(Easing.ease))} 
      exiting={FadeOutUp}
      style={[
        styles.container, 
        { backgroundColor: theme.bg, shadowColor: '#000' }
      ]}
    >
      <Icon name={theme.icon as IconName} size={24} color={theme.color} />
      <AppText weight="medium" style={{ marginLeft: 12, color: theme.color }}>
        {message}
      </AppText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Safe Area top padding
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999, // Stay on top
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
});