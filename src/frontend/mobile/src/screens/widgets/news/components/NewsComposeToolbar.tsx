import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PressClay } from '@/src/components/animations';
import { ClayView, Icon, type IconName } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';

export interface NewsComposeToolbarProps {
  visible: boolean;
  onText: () => void;
  onH1: () => void;
  onH2: () => void;
  onBullet: () => void;
  onNumbered: () => void;
  onQuote: () => void;
  onDivider: () => void;
  onBold: () => void;
  onItalic: () => void;
  onLink: () => void;
  onImage: () => void;
}

/**
 * Single horizontal strip: all block + inline tools (scroll when needed).
 */
export function NewsComposeToolbar({
  visible,
  onText,
  onH1,
  onH2,
  onBullet,
  onNumbered,
  onQuote,
  onDivider,
  onBold,
  onItalic,
  onLink,
  onImage,
}: NewsComposeToolbarProps) {
  const colors = useThemeColors();

  const btn = (icon: IconName, onPress: () => void) => (
    <PressClay onPress={onPress}>
      <ClayView depth={6} puffy={10} color={colors.card} style={styles.toolBtn}>
        <Icon name={icon} size={22} color={colors.primary} />
      </ClayView>
    </PressClay>
  );

  return (
    <View
      style={[styles.bar, { borderTopColor: colors.border, backgroundColor: colors.background }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.rowInner}
      >
        {btn('subject', onText)}
        {btn('title', onH1)}
        {btn('text-fields', onH2)}
        {btn('format-list-bulleted', onBullet)}
        {btn('format-list-numbered', onNumbered)}
        {btn('format-quote', onQuote)}
        {btn('remove', onDivider)}
        {btn('format-bold', onBold)}
        {btn('format-italic', onItalic)}
        {btn('link', onLink)}
        {btn('image', onImage)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minHeight: 52,
  },
  toolBtn: {
    borderRadius: 14,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
