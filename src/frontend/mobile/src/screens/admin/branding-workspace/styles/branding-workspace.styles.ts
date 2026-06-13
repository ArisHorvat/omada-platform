import { StyleSheet } from 'react-native';
import type { useThemeColors } from '@/src/hooks';

/** Inner padding clears ClayView's inset stroke so borders don't sit on content. */
const CLAY_INSET = 18;

export const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 16, paddingBottom: 120 },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
    sectionCard: {
      borderRadius: 20,
      marginBottom: 20,
      padding: CLAY_INSET,
      overflow: 'hidden',
    },
    sectionLabel: { color: colors.subtle, marginBottom: 12 },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      overflow: 'hidden',
    },
    logoCenter: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoInner: {
      width: 64,
      height: 64,
      borderRadius: 32,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoImage: {
      width: 64,
      height: 64,
      borderRadius: 32,
    },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    colorSwatchHit: {
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorSwatchOuter: {
      width: 56,
      height: 56,
      borderRadius: 28,
      overflow: 'hidden',
    },
    colorSwatchCenter: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorSwatchInner: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    presetGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 12,
    },
    presetItem: { width: '48%' },
    presetOuter: {
      borderRadius: 18,
      borderWidth: 2,
      borderColor: 'transparent',
      padding: 2,
    },
    presetCard: { borderRadius: 16, padding: CLAY_INSET, overflow: 'hidden' },
    typeOuter: {
      borderRadius: 18,
      borderWidth: 2,
      borderColor: 'transparent',
      padding: 2,
    },
    typeOption: {
      borderRadius: 16,
      alignItems: 'center',
      gap: 8,
      padding: CLAY_INSET,
      overflow: 'hidden',
    },
    presetStrip: {
      flexDirection: 'row',
      height: 40,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 8,
    },
    typeRow: { flexDirection: 'row', gap: 12 },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
      marginTop: 24,
    },
    actionButton: {
      minWidth: 168,
    },
  });
