import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useThemeColors } from '@/src/hooks';
import { AppButton, AppText, ClayView } from '@/src/components/ui';
import { useOrgAdminDashboardLogic } from '../hooks/useOrgAdminDashboardLogic';
import AdminMappingToolScreen from './AdminMappingToolScreen';

/**
 * Organization admin home: map/floorplan tooling for **Admin** and **SuperAdmin**.
 * SuperAdmin can open the global platform screen from here.
 */
export default function OrgAdminDashboard() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeSession } = useAuth();
  const { org, loading, handleLogout } = useOrgAdminDashboardLogic();

  const isSuperAdmin = activeSession?.role === 'SuperAdmin';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <ClayView
        depth={3}
        color={colors.card}
        style={{
          marginHorizontal: 16,
          marginBottom: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 14,
        }}
      >
        <AppText variant="h3" weight="bold">
          Organization admin
        </AppText>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 8 }} color={colors.primary} />
        ) : (
          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6 }}>
            {org?.name ?? 'Your organization'}
          </AppText>
        )}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
          {isSuperAdmin ? (
            <AppButton
              title="Platform admin"
              variant="outline"
              onPress={() => router.push('/admin-dashboard')}
              style={{ minWidth: 140 }}
            />
          ) : null}
          <AppButton title="Sign out" variant="outline" onPress={handleLogout} style={{ minWidth: 120 }} />
        </View>
      </ClayView>

      <View style={{ flex: 1, paddingBottom: insets.bottom }}>
        <AdminMappingToolScreen />
      </View>
    </View>
  );
}
