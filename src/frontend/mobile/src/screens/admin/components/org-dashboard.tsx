import React, { useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageContainer, WidgetPageShell } from '@/src/components/layout';
import { useAppSidebar } from '@/src/hooks/useAppSidebar';
import { useThemeColors } from '@/src/hooks';
import { useOrgAdminDashboardLogic } from '../hooks/useOrgAdminDashboardLogic';
import { createOrgDashboardStyles } from '../styles/org-dashboard.styles';
import { OnboardingChecklist } from './OnboardingChecklist';
import { AdminWorkspaceCatalog } from './AdminWorkspaceCatalog';
import { AppText } from '@/src/components/ui';

export default function OrgAdminDashboard() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const showAdminSidebar = useAppSidebar();
  const styles = useMemo(() => createOrgDashboardStyles(colors), [colors]);
  const { org, memberCount, loading } = useOrgAdminDashboardLogic();

  const enabledWidgets = org?.enabledWidgets;

  if (loading && !org) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <WidgetPageShell>
        <PageContainer>
          <View style={{ flex: 1, minHeight: 0 }}>
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
              <AppText variant="h2" weight="bold">
                Organization overview
              </AppText>
              <AppText variant="body" style={{ color: colors.subtle, marginTop: 4, lineHeight: 22 }}>
                Finish setup steps for {org?.name ?? 'your organization'}, then open workspaces from
                the menu{showAdminSidebar ? ' on the left' : ''}.
              </AppText>
            </View>

            <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
              <OnboardingChecklist
                onboardingStep={org?.onboardingStep ?? 0}
                memberCount={memberCount}
                enabledWidgets={enabledWidgets}
              />
            </View>

            {!showAdminSidebar ? (
              <AdminWorkspaceCatalog enabledWidgets={enabledWidgets} bottomInset={insets.bottom + 24} />
            ) : null}
          </View>
        </PageContainer>
      </WidgetPageShell>
    </SafeAreaView>
  );
}
