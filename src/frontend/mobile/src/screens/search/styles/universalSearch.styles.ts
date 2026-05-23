import { StyleSheet } from 'react-native';

export const createUniversalSearchStyles = (colors: {
  background: string;
  card: string;
  text: string;
  subtle: string;
  primary: string;
  primaryContainer: string;
  border: string;
}) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 120,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginTop: 20,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 13,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.subtle,
    },
    sectionCount: {
      color: colors.subtle,
    },
    hitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 18,
      marginBottom: 10,
    },
    hitIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    hitTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    hitTitle: {
      color: colors.text,
    },
    hitSubtitle: {
      marginTop: 2,
      color: colors.subtle,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 12,
      overflow: 'hidden',
    },
    appGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    appItem: {
      width: '30%',
      minWidth: 96,
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderRadius: 18,
    },
    appIconBox: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    appName: {
      textAlign: 'center',
    },
    hintCard: {
      padding: 18,
      borderRadius: 20,
      marginTop: 8,
    },
    skeletonRow: {
      height: 72,
      borderRadius: 18,
      marginBottom: 10,
    },
  });
