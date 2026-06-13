import React from 'react';
import { Linking, View } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import type { TaskAttachment } from '@/src/api/tasksWorkApi';
import { useThemeColors } from '@/src/hooks';
import { toAbsoluteUrl } from '@/src/utils/toAbsoluteMediaUrl';

type Props = {
  title: string;
  attachments: TaskAttachment[];
  emptyHint?: string;
  onRemove?: (index: number) => void;
  disabled?: boolean;
};

export function TaskAttachmentsList({ title, attachments, emptyHint, onRemove, disabled }: Props) {
  const colors = useThemeColors();

  if (!attachments.length && !emptyHint) return null;

  return (
    <View>
      {title ? (
        <AppText variant="label" weight="bold" style={{ marginBottom: 8 }}>
          {title}
        </AppText>
      ) : null}
      {attachments.length === 0 && emptyHint ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
          {emptyHint}
        </AppText>
      ) : null}
      {attachments.map((file, idx) => (
        <ClayView
          key={`${file.url}-${idx}`}
          depth={2}
          color={colors.background}
          style={{
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="attach-file" size={20} color={colors.primary} />
          <PressClay
            onPress={() => void Linking.openURL(toAbsoluteUrl(file.url))}
            style={{ flex: 1, minWidth: 0 }}
          >
            <AppText variant="body" numberOfLines={1} style={{ color: colors.text }}>
              {file.fileName?.trim() || file.url}
            </AppText>
          </PressClay>
          <PressClay
            onPress={() => void Linking.openURL(toAbsoluteUrl(file.url))}
            accessibilityLabel="Open file"
          >
            <ClayView depth={1} color={colors.card} style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="open-in-new" size={18} color={colors.primary} />
            </ClayView>
          </PressClay>
          {onRemove ? (
            <PressClay
              onPress={() => onRemove(idx)}
              disabled={disabled}
              accessibilityLabel="Remove file"
            >
              <ClayView depth={1} color={colors.card} style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="delete-outline" size={18} color={colors.error} />
              </ClayView>
            </PressClay>
          ) : null}
        </ClayView>
      ))}
    </View>
  );
}
