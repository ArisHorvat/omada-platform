import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { useThemeColors } from '@/src/hooks';

interface ClayBackButtonProps {
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** * If true, floats top-left over content. 
   * If false (default), sits in the layout flow (good for Headers).
   */
  absolute?: boolean; 
}

export const ClayBackButton = ({ style, onPress, absolute = false }: ClayBackButtonProps) => {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  // 1. Determine positioning logic
  const containerStyle: ViewStyle = absolute 
    ? {
        position: 'absolute',
        left: 20,
        top: insets.top + 10,
        zIndex: 999,
      }
    : {
        // When NOT absolute, we just act like a normal block
        // No top/left/absolute properties
      };

  return (
    <PressClay 
      onPress={handlePress}
      style={[
        containerStyle, // Apply positioning logic first
        style // Allow overrides
      ]}
    >
      <ClayView
        depth={10}
        puffy={15}
        color={colors.card}
        style={styles.button}
      >
        <Icon name="arrow-back" size={24} color={colors.primary} />
      </ClayView>
    </PressClay>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  }
});