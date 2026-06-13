import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { AppButton, AppText, Divider } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import type { WebOverlayAnchor } from '@/src/hooks/usePaneOverlayAnchor';

interface FilterBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  onApply: () => void;
  onReset?: () => void;
  applyLabel?: string;
  resetLabel?: string;
  height?: number;
  /** Clears floating tab bar when opened from tab screens. */
  contentInsetBottom?: number;
  webAnchor?: WebOverlayAnchor | null;
  children: React.ReactNode;
}

/**
 * Reusable filter bottom sheet.
 * - No data refresh is triggered until caller runs `onApply`.
 * - Caller owns draft state; `onReset` is optional.
 */
export function FilterBottomSheet({
  isVisible,
  onClose,
  title,
  onApply,
  onReset,
  applyLabel = 'Done',
  resetLabel = 'Reset',
  height,
  contentInsetBottom = 0,
  webAnchor = null,
  children,
}: FilterBottomSheetProps) {
  const colors = useThemeColors();

  const sheetHeight =
    webAnchor && Platform.OS === 'web'
      ? Math.round(webAnchor.height * 0.88)
      : height;

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      height={sheetHeight}
      contentInsetBottom={contentInsetBottom}
      webAnchor={webAnchor}
      contentPadding={12}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="h3" weight="bold">
              {title}
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
              Changes apply only when you press {applyLabel}.
            </AppText>
          </View>
          <View style={styles.headerActions}>
            {onReset ? (
              <AppButton title={resetLabel} variant="outline" size="sm" onPress={onReset} />
            ) : null}
            <AppButton title={applyLabel} size="sm" onPress={onApply} />
          </View>
        </View>

        <Divider margin={12} />

        {children}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    flexShrink: 0,
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 8,
    gap: 0,
  },
});

