import React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { AppButton, AppText, ClayView, WidgetEmptyState, WidgetErrorState } from '@/src/components/ui';
import { useAssignableGroups, useThemeColors } from '@/src/hooks';
import { usePermission } from '@/src/context/PermissionContext';
import { GradesFilterChips } from '@/src/screens/widgets/grades/components/GradesFilterChips';
import {
  attendanceStatusLabel,
  isCorporateKind,
} from '@/src/screens/widgets/attendance/utils/attendanceLabels';
import { useAttendanceWorkspace } from '../grades-workspace/hooks/useGradesAdminWorkspaces';

export default function AttendanceWorkspaceScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { can, isLoading: permissionsLoading } = usePermission();
  const canViewAll = can('attendance.view_all');

  const {
    records,
    totalCount,
    loading,
    isError,
    refetch,
    page,
    setPage,
    totalPages,
    groupId,
    setGroupId,
    organizationKind,
  } = useAttendanceWorkspace();

  const assignableQuery = useAssignableGroups('attendance');
  const groupChips = (assignableQuery.data ?? []).map((g) => ({
    id: g.id,
    label: g.name,
  }));

  const onGroupChange = (id: string | null) => {
    setGroupId(id);
    setPage(1);
  };

  const title = isCorporateKind(organizationKind) ? 'Participation records' : 'Attendance records';
  const subtitle = `Organization-wide records from the last 60 days · ${totalCount} record${totalCount === 1 ? '' : 's'}`;

  if (!permissionsLoading && !canViewAll) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <PageContainer>
            <ScreenHeader title={title} />
            <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 24 }}>
              <WidgetEmptyState
                title="Attendance admin unavailable"
                description="You need attendance edit access to review organization-wide records."
                icon="lock"
              />
            </View>
          </PageContainer>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageContainer>
          <ScreenHeader title={title} subtitle={subtitle} />

          <GradesFilterChips
            chips={groupChips}
            activeId={groupId}
            onSelect={onGroupChange}
            allLabel="All groups"
          />

          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : isError ? (
              <WidgetErrorState message="Could not load attendance records." onRetry={() => void refetch()} />
            ) : !records.length ? (
              <WidgetEmptyState
                title="No records yet"
                description="Members mark attendance from schedule sessions. Try another group filter."
                icon="history"
              />
            ) : (
              records.map((record) => (
                <ClayView
                  key={record.id}
                  depth={2}
                  color={colors.card}
                  style={{ borderRadius: 12, padding: 14, marginBottom: 10 }}
                >
                  <AppText weight="bold">{record.studentName}</AppText>
                  <AppText variant="body">{record.eventTitle}</AppText>
                  <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                    {new Date(record.instanceDate).toLocaleString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {record.groupName ? ` · ${record.groupName}` : ''}
                  </AppText>
                  <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginTop: 6 }}>
                    {attendanceStatusLabel(record.status, organizationKind)}
                  </AppText>
                </ClayView>
              ))
            )}

            {totalPages > 1 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                <AppButton
                  title="Previous"
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                />
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  Page {page} of {totalPages}
                </AppText>
                <AppButton
                  title="Next"
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                />
              </View>
            ) : null}
          </ScrollView>
        </PageContainer>
      </SafeAreaView>
    </View>
  );
}
