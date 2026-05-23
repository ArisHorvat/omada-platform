import { StyleSheet } from 'react-native';

import type { AppThemeColors } from '@/src/hooks/useThemeColors';

export function createChatStyles(colors: AppThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    threadHeader: {
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    listContent: {
      padding: 16,
      flexGrow: 1,
    },
    messageBubble: {
      maxWidth: '80%',
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
  });
}
