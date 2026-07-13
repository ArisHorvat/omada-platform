import React, { useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageContainer, WidgetPageShell } from '@/src/components/layout';
import { AppText, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useAppSidebar } from '@/src/hooks/useAppSidebar';
import { useThemeColors } from '@/src/hooks';
import { useOrgAdminDashboardLogic } from '../hooks/useOrgAdminDashboardLogic';
import { createOrgDashboardStyles } from '../styles/org-dashboard.styles';
import { OnboardingChecklist } from './OnboardingChecklist';
import { AdminWorkspaceCatalog } from './AdminWorkspaceCatalog';

export default function OrgAdminDashboard() {
  const colors = useThemeColors();
  const router = useRouter();
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
      <WidgetPageShell fullBleed>
        <PageContainer>
          <View style={{ flex: 1, minHeight: 0 }}>
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText variant="h2" weight="bold">
                    Organization overview
                  </AppText>
                  <AppText variant="body" style={{ color: colors.subtle, marginTop: 4, lineHeight: 22 }}>
                    Finish setup steps for {org?.name ?? 'your organization'}, then open workspaces from
                    the menu{showAdminSidebar ? ' on the left' : ' below'}.
                  </AppText>
                </View>
                {!showAdminSidebar ? (
                  <PressClay
                    onPress={() => router.push('/admin-profile' as never)}
                    accessibilityRole="button"
                    accessibilityLabel="Open profile"
                  >
                    <View
                      style={{
                        padding: 10,
                        borderRadius: 14,
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Icon name="person" size={24} color={colors.primary} />
                    </View>
                  </PressClay>
                ) : null}
              </View>
            </View>

            <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
              <OnboardingChecklist
                completedOnboardingSteps={org?.completedOnboardingSteps}
                memberCount={memberCount}
                enabledWidgets={enabledWidgets}
                organizationType={org?.organizationType}
              />
            </View>

            {!showAdminSidebar ? (
              <AdminWorkspaceCatalog
                enabledWidgets={enabledWidgets}
                organizationType={org?.organizationType}
                bottomInset={insets.bottom + 24}
              />
            ) : null}
          </View>
        </PageContainer>
      </WidgetPageShell>
    </SafeAreaView>
  );
}
