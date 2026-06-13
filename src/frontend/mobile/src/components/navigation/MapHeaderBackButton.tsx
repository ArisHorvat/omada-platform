import React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { ClayView, Icon } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';

/** Stack header back control — same clay puck as campus map, without PressClay (safe in nav headers). */
export function MapHeaderBackButton() {
  const router = useRouter();
  const colors = useThemeColors();

  const onPress = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={styles.hit}
    >
      <ClayView depth={6} puffy={10} color={colors.card} style={styles.puck}>
        <Icon name="arrow-back" size={20} color={colors.primary} />
      </ClayView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    marginLeft: Platform.OS === 'web' ? 8 : 0,
  },
  puck: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
