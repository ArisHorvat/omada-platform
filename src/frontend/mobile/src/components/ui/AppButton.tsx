import React from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
  TextStyle,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/src/hooks';
import { ClayPressContext } from '@/src/context/ClayPressContext';
import { Icon, IconName } from './Icon';
import { ClayView } from './ClayView';
import { AppText } from './AppText';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  rightIcon?: IconName;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const pressEase = { duration: 300, easing: Easing.out(Easing.ease) };

export const AppButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  rightIcon,
  style,
  textStyle,
}: AppButtonProps) => {
  const colors = useThemeColors();
  const pressProgress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pressProgress.value, [0, 1], [1, 0.97]) },
      { translateY: interpolate(pressProgress.value, [0, 1], [0, 4]) },
    ],
  }));

  const baseRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const sizeStyles: Record<'sm' | 'md' | 'lg', ViewStyle> = {
    sm: { paddingVertical: 8, paddingHorizontal: 12 },
    md: { paddingVertical: 14, paddingHorizontal: 20 },
    lg: { paddingVertical: 18, paddingHorizontal: 24 },
  };

  const getSurfaceColor = (): string => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return colors.background;
      case 'secondary':
        return colors.card;
      case 'danger':
        return colors.error;
      case 'primary':
      default:
        return colors.primary;
    }
  };

  const getVariantClayStyle = (): ViewStyle => {
    switch (variant) {
      case 'outline':
        return { borderWidth: 1, borderColor: colors.border };
      case 'ghost':
        return { borderWidth: 0 };
      default:
        return {};
    }
  };

  const getTextColor = (): string => {
    if (variant === 'outline' || variant === 'ghost' || variant === 'secondary') {
      return colors.text;
    }
    if (variant === 'primary') {
      return colors.onPrimary;
    }
    if (variant === 'danger') {
      return '#FFFFFF';
    }
    return colors.onPrimary;
  };

  const textColor = getTextColor();
  const labelSize: 'sm' | 'md' | 'lg' =
    size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';
  const labelFontSize = labelSize === 'sm' ? 14 : labelSize === 'lg' ? 18 : 16;

  const inactive = disabled || loading;
  const depth = variant === 'ghost' ? 6 : variant === 'outline' ? 10 : 12;
  const puffy = variant === 'ghost' ? 14 : 18;

  const handlePressIn = () => {
    if (inactive) return;
    pressProgress.value = withTiming(1, pressEase);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    pressProgress.value = withTiming(0, pressEase);
  };

  const clayBody = (
    <ClayView
      color={getSurfaceColor()}
      depth={depth}
      puffy={puffy}
      style={[
        baseRow,
        sizeStyles[size],
        { borderRadius: 14, opacity: inactive ? 0.6 : 1 },
        getVariantClayStyle(),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && (
            <View style={styles.iconLeft}>
              <Icon name={icon} size={20} color={textColor} />
            </View>
          )}
          <AppText
            variant="body"
            weight="bold"
            style={[{ color: textColor, fontSize: labelFontSize, lineHeight: labelFontSize + 4 }, textStyle]}
          >
            {title}
          </AppText>
          {rightIcon && (
            <View style={styles.iconRight}>
              <Icon name={rightIcon} size={20} color={textColor} />
            </View>
          )}
        </>
      )}
    </ClayView>
  );

  return (
    <ClayPressContext.Provider value={pressProgress}>
      <Pressable
        onPress={onPress}
        disabled={inactive}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={animatedStyle}>{clayBody}</Animated.View>
      </Pressable>
    </ClayPressContext.Provider>
  );
};

const styles = StyleSheet.create({
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});
