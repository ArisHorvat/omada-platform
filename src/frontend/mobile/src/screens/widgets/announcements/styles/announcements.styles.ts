import { StyleSheet } from 'react-native';

import type { AppThemeColors } from '@/src/hooks/useThemeColors';

export function createAnnouncementsStyles(colors: AppThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    threadHeader: {
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    threadTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    channelSubtitle: {
      color: colors.subtle,
      marginTop: 4,
    },
    listContent: {
      padding: 16,
      flexGrow: 1,
    },
    postCard: {
      marginBottom: 12,
      borderRadius: 18,
      padding: 16,
    },
    postTitle: {
      color: colors.text,
      marginBottom: 6,
    },
    postMeta: {
      color: colors.subtle,
      marginBottom: 8,
    },
    postBody: {
      color: colors.text,
    },
    messageBubble: {
      maxWidth: '85%',
      padding: 12,
      borderRadius: 16,
      marginBottom: 8,
    },
    ownMessage: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    otherMessage: {
      alignSelf: 'flex-start',
      backgroundColor: colors.card,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ownText: {
      color: '#fff',
    },
    otherText: {
      color: colors.text,
    },
    senderName: {
      color: colors.subtle,
      marginBottom: 4,
    },
    modeRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 12,
      paddingTop: 8,
    },
    modeChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modeChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryContainer,
    },
    titleInput: {
      marginHorizontal: 12,
      marginTop: 8,
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'flex-end',
    },
    input: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
      maxHeight: 120,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendButton: {
      marginLeft: 12,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.45,
    },
    composePanel: {
      padding: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
    },
    composeInput: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      minHeight: 80,
      maxHeight: 160,
      marginBottom: 10,
    },
    publishButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    commentsToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
    },
    commentsBlock: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    commentRow: {
      marginBottom: 10,
      borderRadius: 12,
      padding: 12,
    },
    commentInputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginTop: 4,
    },
    commentInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      maxHeight: 80,
    },
    commentSend: {
      marginLeft: 8,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    channelSection: {
      marginBottom: 16,
    },
    channelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    channelRowActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryContainer,
    },
    channelRowUnread: {
      borderColor: colors.error,
      backgroundColor: `${colors.error}12`,
    },
  });
}
