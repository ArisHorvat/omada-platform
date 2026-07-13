import React from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';

import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import { useThemeColors, useBreakpoint } from '@/src/hooks';
import { AnnouncementTextField } from './AnnouncementTextField';

interface AnnouncementComposePanelProps {
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onPublish: () => void;
  isPublishing: boolean;
}

export function AnnouncementComposePanel({
  title,
  content,
  onTitleChange,
  onContentChange,
  onPublish,
  isPublishing,
}: AnnouncementComposePanelProps) {
  const colors = useThemeColors();
  const { isWideShell } = useBreakpoint();
  const canSubmit = title.trim().length > 0 && content.trim().length > 0 && !isPublishing;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? (isWideShell ? 0 : 90) : 0}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        <ClayView depth={10} puffy={0} color={colors.card} style={{ borderRadius: 20, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primaryContainer,
              }}
            >
              <Icon name="campaign" size={22} color={colors.primary} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                New announcement
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }}>
                Visible to everyone in this channel
              </AppText>
            </View>
          </View>

          <AppText variant="label" weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
            TITLE
          </AppText>
          <AnnouncementTextField
            value={title}
            onChangeText={onTitleChange}
            placeholder="Give it a clear headline"
            returnKeyType="next"
          />

          <AppText variant="label" weight="bold" style={{ color: colors.subtle, marginTop: 14, marginBottom: 8 }}>
            MESSAGE
          </AppText>
          <AnnouncementTextField
            value={content}
            onChangeText={onContentChange}
            placeholder="What do you want to share?"
            multiline
            minHeight={96}
          />

          <View style={{ marginTop: 16 }}>
            <AppButton
              title={isPublishing ? 'Posting…' : 'Post announcement'}
              icon="campaign"
              onPress={onPublish}
              disabled={!canSubmit}
              loading={isPublishing}
            />
          </View>
        </ClayView>
      </View>
    </KeyboardAvoidingView>
  );
}
