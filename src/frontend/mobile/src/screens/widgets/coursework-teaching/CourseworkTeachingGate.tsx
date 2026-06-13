import React from 'react';
import { View } from 'react-native';

import { AppText, ClayView, WidgetEmptyState } from '@/src/components/ui';
import { usePermission } from '@/src/context/PermissionContext';
import { canTeachCoursework } from '@/src/utils/courseworkTeachingAccess';
import { useThemeColors } from '@/src/hooks';

type Props = {
  children: React.ReactNode;
};

export function CourseworkTeachingGate({ children }: Props) {
  const colors = useThemeColors();
  const { can, isLoading } = usePermission();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24 }}>
        <ClayView depth={2} color={colors.card} style={{ padding: 20, borderRadius: 16 }}>
          <AppText variant="body" style={{ color: colors.subtle, textAlign: 'center' }}>
            Loading…
          </AppText>
        </ClayView>
      </View>
    );
  }

  if (!canTeachCoursework(can)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24 }}>
        <WidgetEmptyState
          icon="lock"
          title="Teaching access required"
          description="Your role can view and submit coursework, but not post or grade it. Ask an admin to set Tasks to Edit (or Admin) on your role."
        />
      </View>
    );
  }

  return <>{children}</>;
}
