import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { AppButton, AppText, ClayView, Divider } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';

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
  children,
}: FilterBottomSheetProps) {
  const colors = useThemeColors();

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      height={height}
      contentInsetBottom={contentInsetBottom}
    >
      <View style={{ flex: 1, minHeight: 0 }}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
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

        <Divider margin={16} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 4 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ClayView depth={6} puffy={10} color={colors.background} style={styles.bodyCard}>
            {children}
          </ClayView>
        </ScrollView>
      </View>
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
  bodyCard: {
    borderRadius: 20,
    padding: 14,
  },
});

