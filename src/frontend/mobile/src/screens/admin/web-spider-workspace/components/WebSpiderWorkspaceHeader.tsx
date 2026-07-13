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
        title="Schedule import"
        subtitle="Paste a public timetable URL, preview scraped rows, and sync to the import store. Use Discover to find year pages (e.g. I1.html) on the same site."
        onBack={goBack}
        style={{ paddingHorizontal: 0 }}
      />
    </View>
  );
}
