import React from 'react';
import { Platform, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { useThemeColors } from '@/src/hooks';

/**
 * Low-level back control. Prefer {@link ScreenHeader} on stack / widget screens.
 * Kept for auth overlays and legacy call sites during migration.
 */
interface ClayBackButtonProps {
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** Float top-left over content (auth screens). */
  absolute?: boolean;
  /** Lighter control for forms; default is clay puck. `header` matches {@link ScreenHeader} / campus map. */
  variant?: 'clay' | 'plain' | 'header';
}

export const ClayBackButton = ({
  style,
  onPress,
  absolute = false,
  variant = 'clay',
}: ClayBackButtonProps) => {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  };

  const containerStyle: ViewStyle = absolute
    ? {
        position: 'absolute',
        left: 16,
        top: insets.top + (Platform.OS === 'android' ? 8 : 4),
        zIndex: 999,
      }
    : {};

  const icon = <Icon name="arrow-back" size={22} color={colors.text} />;

  if (variant === 'plain') {
    return (
      <Pressable
        onPress={handlePress}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={[containerStyle, styles.plainHit, style]}
      >
        {icon}
      </Pressable>
    );
  }

  const headerPuck = variant === 'header';

  return (
    <PressClay onPress={handlePress} style={[containerStyle, style]}>
      <ClayView
        depth={headerPuck ? 6 : 8}
        puffy={headerPuck ? 10 : 12}
        color={colors.card}
        style={headerPuck ? styles.headerButton : styles.button}
      >
        <Icon
          name="arrow-back"
          size={headerPuck ? 20 : 22}
          color={headerPuck ? colors.primary : colors.primary}
        />
      </ClayView>
    </PressClay>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plainHit: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
