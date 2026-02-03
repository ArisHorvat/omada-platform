import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { useThemeColors } from '@/src/hooks';

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  status?: StatusVariant;
  style?: ViewStyle;
}

export const StatusBadge = ({ label, status = 'neutral', style }: StatusBadgeProps) => {
  const colors = useThemeColors();

  const getColors = () => {
    switch (status) {
      case 'success': return { bg: '#E6F6EB', text: '#00875A' }; // Light Green / Dark Green
      case 'warning': return { bg: '#FFFAE6', text: '#FF991F' }; // Light Yellow / Dark Orange
      case 'error':   return { bg: '#FFEBE6', text: '#DE350B' }; // Light Red / Dark Red
      case 'info':    return { bg: '#DEEBFF', text: '#0747A6' }; // Light Blue / Dark Blue
      default:        return { bg: colors.border, text: colors.text };
    }
  };

  const theme = getColors();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: theme.text }]} />
      <AppText variant="label" style={{ color: theme.text, fontSize: 12 }}>
        {label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
});