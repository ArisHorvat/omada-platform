import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { PAGE_HORIZONTAL_PADDING } from '@/src/constants/layout';
import { useBreakpoint, useThemeColors } from '@/src/hooks';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Defaults to hidden on wide shell when navigation can go back. */
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Search bars, filters, etc. below the title row. */
  footer?: React.ReactNode;
  /** Smaller title (e.g. inside colored hero panels). */
  compact?: boolean;
  /** Light controls on dark / tinted backgrounds. */
  tone?: 'default' | 'inverse';
  /** Floating bar over maps and full-bleed content. */
  overlay?: boolean;
  borderBottom?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack,
  onBack,
  right,
  footer,
  compact = false,
  tone = 'default',
  overlay = false,
  borderBottom = false,
  style,
}: ScreenHeaderProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { isWideShell } = useBreakpoint();

  const inverse = tone === 'inverse';
  const titleColor = inverse ? colors.onSecondary : colors.text;
  const subtitleColor = inverse ? colors.onSecondary : colors.subtle;
  const puckColor = inverse ? 'rgba(255,255,255,0.18)' : colors.card;
  const iconColor = inverse ? colors.onSecondary : colors.primary;

  const shouldShowBack =
    showBack ?? ((Platform.OS === 'web' || !isWideShell) && router.canGoBack());

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  };

  const rootStyle: ViewStyle[] = [
    styles.root,
    overlay && {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      paddingTop: insets.top,
      backgroundColor: colors.background + (Platform.OS === 'web' ? 'F5' : 'F2'),
      ...Platform.select({
        web: { backdropFilter: 'blur(12px)' as const },
        default: {},
      }),
    },
    borderBottom && {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
  ];

  return (
    <View style={[rootStyle, style]}>
      <View style={styles.row}>
        {shouldShowBack ? (
          <PressClay
            onPress={handleBack}
            style={styles.backHit}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ClayView depth={inverse ? 4 : 6} puffy={10} color={puckColor} style={styles.backPuck}>
              <Icon name="arrow-back" size={20} color={iconColor} />
            </ClayView>
          </PressClay>
        ) : null}

        <View style={[styles.titleBlock, !shouldShowBack && styles.titleBlockFlush]}>
          <AppText
            variant={compact ? 'h3' : 'h2'}
            weight="bold"
            numberOfLines={2}
            style={{ color: titleColor }}
          >
            {title}
          </AppText>
          {subtitle ? (
            <AppText
              variant="caption"
              numberOfLines={3}
              style={{ color: subtitleColor, marginTop: 4, opacity: inverse ? 0.85 : 1 }}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>

        {right ? <View style={styles.right}>{right}</View> : null}
      </View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    paddingBottom: 12,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backHit: {
    flexShrink: 0,
  },
  backPuck: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleBlockFlush: {
    marginLeft: 0,
  },
  right: {
    flexShrink: 0,
    marginLeft: 4,
  },
  footer: {
    marginTop: 14,
  },
});
