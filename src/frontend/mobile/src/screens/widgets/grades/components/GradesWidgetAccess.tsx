import React from 'react';
import { View } from 'react-native';

import { Skeleton, WidgetEmptyState } from '@/src/components/ui';

interface GradesWidgetAccessProps {
  canView: boolean;
  permissionsLoading: boolean;
  children: React.ReactNode;
}

/** Hides grade data when the user lacks `grades.view_own`. */
export function GradesWidgetAccess({ canView, permissionsLoading, children }: GradesWidgetAccessProps) {
  if (permissionsLoading) {
    return (
      <View style={{ minHeight: 100, justifyContent: 'center' }}>
        <Skeleton height={72} borderRadius={16} />
      </View>
    );
  }

  if (!canView) {
    return (
      <WidgetEmptyState
        title="Grades unavailable"
        description="Enable the Grades widget for your role to see standing here."
        icon="school"
      />
    );
  }

  return <>{children}</>;
}
