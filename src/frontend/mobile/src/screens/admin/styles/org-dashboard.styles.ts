import { StyleSheet } from 'react-native';

import { PAGE_HORIZONTAL_PADDING } from '@/src/constants/layout';

export const createOrgDashboardStyles = (colors: {
  background: string;
  text: string;
  subtle: string;
  border: string;
  card: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  success: string;
}) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    sidebarPad: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      paddingTop: 8,
      paddingBottom: 16,
      gap: 16,
    },
    orgCard: {
      paddingVertical: 20,
      paddingHorizontal: 18,
    },
    orgRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    orgLogo: {
      width: 56,
      height: 56,
      borderRadius: 14,
      backgroundColor: colors.card,
    },
    orgLogoFallback: {
      width: 56,
      height: 56,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    adminBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryContainer,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      marginTop: 8,
    },
    accountCard: {
      paddingVertical: 18,
      paddingHorizontal: 18,
    },
    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    avatarFallback: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rolePill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryContainer,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      marginTop: 4,
    },
    accountLinks: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    catalogScroll: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      paddingTop: 12,
      paddingBottom: 32,
    },
    catalogHeader: {
      marginBottom: 16,
    },
    sectionBlock: {
      marginBottom: 22,
    },
    sectionTitle: {
      marginBottom: 10,
      marginLeft: 2,
    },
    tileGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    tile: {
      width: '47%',
      minWidth: 140,
      flexGrow: 1,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 14,
    },
    tileIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    loadingBox: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checklistCard: {
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: 4,
    },
    checklistScrollCompact: {
      maxHeight: 280,
    },
    checklistHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
    },
    progressTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginHorizontal: 16,
      marginBottom: 8,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingHorizontal: 12,
      minHeight: 52,
    },
    stepRail: {
      width: 28,
      alignItems: 'center',
      paddingTop: 14,
    },
    stepDot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    stepLine: {
      flex: 1,
      width: 2,
      marginTop: 4,
      borderRadius: 1,
    },
    stepBody: {
      flex: 1,
      paddingVertical: 12,
      paddingRight: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    stepBodyLast: {
      borderBottomWidth: 0,
    },
  });
