import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Icon } from '@/src/components/ui';
import type { WebSpiderWorkspaceModel } from '../hooks/useWebSpiderWorkspace';

type Props = { model: WebSpiderWorkspaceModel };

export function WebSpiderWorkspaceHeader({ model }: Props) {
  const { colors, horizontalPad, goBack } = model;

  return (
    <View style={{ paddingHorizontal: horizontalPad, paddingBottom: 8 }}>
      <Pressable onPress={goBack} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }} hitSlop={12}>
        <Icon name="arrow-back" size={22} color={colors.text} />
        <AppText variant="h2" weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>
          Web crawling
        </AppText>
      </Pressable>
      <AppText variant="caption" style={{ color: colors.subtle }}>
        Paste links, tap Save URLs for your organization, then preview or sync. Discovery helps find the right timetable or
        article page on the same site.
      </AppText>
    </View>
  );
}
