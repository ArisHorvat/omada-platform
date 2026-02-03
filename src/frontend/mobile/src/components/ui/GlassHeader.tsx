import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from './GlassView';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';
import { useThemeColors } from '@/src/hooks';
import { useNavigation } from 'expo-router';

interface GlassHeaderProps {
  title: string;
  showBack?: boolean;
  rightIcon?: IconName;
  onRightPress?: () => void;
}

export const GlassHeader = ({ title, showBack, rightIcon, onRightPress }: GlassHeaderProps) => {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const navigation = useNavigation();

  // Padding top ensures we don't cover the Status Bar text
  const paddingTop = Platform.OS === 'ios' ? insets.top : (StatusBar.currentHeight || 20) + 10;

  return (
    <GlassView 
       intensity={80} 
       style={[
         styles.container, 
         { paddingTop, borderBottomColor: colors.border }
       ]}
    >
      <View style={styles.content}>
        {/* Left Side (Back or Empty) */}
        <View style={styles.side}>
          {showBack && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Icon name="arrow-back" size={24} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center Title */}
        <View style={styles.center}>
          <AppText variant="h3" weight="bold" numberOfLines={1}>{title}</AppText>
        </View>

        {/* Right Side (Action) */}
        <View style={styles.side}>
          {rightIcon && (
            <TouchableOpacity onPress={onRightPress} style={styles.iconBtn}>
              <Icon name={rightIcon} size={24} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </GlassView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100, // Always on top
    borderBottomWidth: 1,
    borderRadius: 0, // Reset default GlassView radius
    borderTopWidth: 0,
  },
  content: {
    height: 50, // Standard header height
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  side: { width: 40 },
  center: { flex: 1, alignItems: 'center' },
  iconBtn: { padding: 4 },
});