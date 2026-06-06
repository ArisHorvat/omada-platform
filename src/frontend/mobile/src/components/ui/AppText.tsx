import React, { useMemo } from 'react';
import { Platform, Text, TextProps, TextStyle } from 'react-native';
import { useThemeColors } from '@/src/hooks';

export type AppTextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'display' | 'label';

interface AppTextProps extends TextProps {
  variant?: AppTextVariant;
  weight?: 'regular' | 'medium' | 'bold' | 'extra';
  adjustsToFit?: boolean;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<
  AppTextVariant,
  Pick<TextStyle, 'fontSize' | 'lineHeight' | 'letterSpacing' | 'textTransform'>
> = {
  display: { fontSize: 34, lineHeight: 40, letterSpacing: -0.5 },
  h1: { fontSize: 24, lineHeight: 30, letterSpacing: -0.25 },
  h2: { fontSize: 20, lineHeight: 26, letterSpacing: -0.15 },
  h3: { fontSize: 16, lineHeight: 22, letterSpacing: 0 },
  body: { fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  label: { fontSize: 11, lineHeight: 14, letterSpacing: 0.6, textTransform: 'uppercase' },
};

const WEB_FONT_WEIGHT: Record<NonNullable<AppTextProps['weight']>, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  bold: '600',
  extra: '800',
};

export const AppText = ({
  variant = 'body',
  weight = 'regular',
  adjustsToFit = false,
  style,
  ...props
}: AppTextProps) => {
  const colors = useThemeColors();

  const nativeFontFamily = useMemo(() => {
    switch (weight) {
      case 'extra':
        return 'Display';
      case 'bold':
        return 'Heading';
      case 'medium':
        return 'Body';
      default:
        return 'Body';
    }
  }, [weight]);

  const variantTypography = VARIANT_STYLES[variant];

  const defaultColor = useMemo(() => {
    if (variant === 'caption' || variant === 'label') {
      return colors.subtle;
    }
    return colors.text;
  }, [colors.subtle, colors.text, variant]);

  const fontStyle = useMemo((): TextStyle => {
    if (Platform.OS === 'web') {
      return {
        fontFamily: 'Outfit, system-ui, -apple-system, sans-serif',
        fontWeight: WEB_FONT_WEIGHT[weight],
      };
    }
    return { fontFamily: nativeFontFamily };
  }, [nativeFontFamily, weight]);

  return (
    <Text
      numberOfLines={adjustsToFit ? 1 : props.numberOfLines}
      adjustsFontSizeToFit={adjustsToFit}
      minimumFontScale={0.7}
      style={[
        {
          color: defaultColor,
          ...fontStyle,
          ...variantTypography,
        },
        style,
      ]}
      {...props}
    />
  );
};
