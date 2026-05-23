import React from 'react';
import { View } from 'react-native';

import { Skeleton, WidgetEmptyState } from '@/src/components/ui';

interface AttendanceWidgetAccessProps {
  canView: boolean;
  permissionsLoading: boolean;
  children: React.ReactNode;
}

export function AttendanceWidgetAccess({ canView, permissionsLoading, children }: AttendanceWidgetAccessProps) {
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
        title="Attendance unavailable"
        description="You do not have permission to view attendance in this organization."
        icon="lock"
      />
    );
  }

  return <>{children}</>;
}
