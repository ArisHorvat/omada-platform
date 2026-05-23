import React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { AppText, ClayView } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { useAuditLogWorkspace } from './hooks/useAuditLogWorkspace';

export default function AuditWorkspaceScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { logs, totalCount, loading } = useAuditLogWorkspace();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <PageContainer>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <ClayBackButton />
          <AppText variant="h3" weight="bold">
            Audit log
          </AppText>
        </View>

        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 14 }}>
          {totalCount} recent admin action{totalCount === 1 ? '' : 's'}
        </AppText>

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
            {logs.length === 0 ? (
              <AppText variant="body" style={{ color: colors.subtle, textAlign: 'center', marginTop: 24 }}>
                No admin actions recorded yet.
              </AppText>
            ) : (
              logs.map((log) => (
                <ClayView key={log.id} depth={2} color={colors.card} style={{ borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <AppText weight="bold">{log.summary}</AppText>
                  <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                    {log.action} · {log.actorName ?? 'Unknown'} · {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                  </AppText>
                </ClayView>
              ))
            )}
          </ScrollView>
        )}
      </PageContainer>
    </View>
  );
}
