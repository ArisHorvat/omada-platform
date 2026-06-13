import { StyleSheet } from 'react-native';

export const createEventTypesWorkspaceStyles = (colors: {
  background: string;
  text: string;
  subtle: string;
  border: string;
  card: string;
  primary: string;
  primaryContainer: string;
}) =>
  StyleSheet.create({
    scroll: {
      paddingHorizontal: 16,
      paddingBottom: 120,
    },
    clayShell: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 14,
    },
    clayInner: {
      borderRadius: 16,
      padding: 16,
    },
    sectionHint: {
      color: colors.subtle,
      marginTop: 6,
      marginBottom: 14,
      lineHeight: 20,
    },
    sectionLabel: {
      color: colors.subtle,
      marginBottom: 10,
      letterSpacing: 0.6,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 12,
      padding: 12,
      backgroundColor: colors.background,
      borderColor: colors.border,
      color: colors.text,
      fontSize: 16,
      marginBottom: 14,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 14,
    },
    colorSwatch: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorSwatchSelected: {
      borderWidth: 3,
      borderColor: colors.card,
    },
    previewSection: {
      marginTop: 4,
      marginBottom: 14,
    },
    previewLabel: {
      color: colors.subtle,
      marginBottom: 8,
      fontSize: 12,
      fontWeight: '600',
    },
    previewRow: {
      flexDirection: 'row',
      gap: 10,
      alignSelf: 'flex-start',
      maxWidth: '100%',
    },
    previewCard: {
      width: 168,
      maxWidth: '48%',
      borderRadius: 14,
      padding: 12,
      minHeight: 72,
      justifyContent: 'space-between',
    },
    previewBookingCard: {
      width: 188,
      maxWidth: '52%',
      borderRadius: 14,
      padding: 14,
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    typeCard: {
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
    },
    typeCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    typeCardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    typeColorDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    typeActions: {
      flexDirection: 'row',
      gap: 8,
    },
    miniPreviewRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
      alignSelf: 'flex-start',
      maxWidth: '100%',
    },
    miniPreviewChip: {
      width: 132,
      maxWidth: '46%',
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    miniBookingChip: {
      width: 148,
      maxWidth: '54%',
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    infoBox: {
      borderRadius: 12,
      padding: 12,
      marginTop: 4,
    },
    infoRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-start',
    },
    editActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
  });
