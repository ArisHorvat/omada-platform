import React from 'react';
import { View } from 'react-native';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import type { WebSpiderWorkspaceModel } from '../hooks/useWebSpiderWorkspace';

type Props = { model: WebSpiderWorkspaceModel };

export function WebSpiderWorkspaceHeader({ model }: Props) {
  const { horizontalPad, goBack } = model;

  return (
    <View style={{ paddingHorizontal: horizontalPad }}>
      <ScreenHeader
        title="Web crawling"
        subtitle="Paste links, tap Save URLs for your organization, then preview or sync. Discovery helps find the right timetable or article page on the same site."
        onBack={goBack}
        style={{ paddingHorizontal: 0 }}
      />
    </View>
  );
}
