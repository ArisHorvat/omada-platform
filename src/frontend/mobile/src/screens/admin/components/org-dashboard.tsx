import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useThemeColors } from '@/src/hooks';
import { AppButton, AppText, ClayView } from '@/src/components/ui';
import { useOrgAdminDashboardLogic } from '../hooks/useOrgAdminDashboardLogic';

/**
 * Organization admin home: map/floorplan tooling for **Admin** and **SuperAdmin**.
 * Floor creation, AI extraction, room polygons, and POI pins live in **Floorplan extraction**.
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
          <AppButton
            title="Floorplan extraction"
            onPress={() => router.push('/floorplan-workspace' as never)}
            style={{ minWidth: 168 }}
          />
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

      <ClayView
        depth={2}
        color={colors.card}
        style={{
          marginHorizontal: 16,
          padding: 16,
          borderRadius: 14,
          marginBottom: insets.bottom + 16,
        }}
      >
        <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
          Map setup
        </AppText>
        <AppText variant="body" style={{ color: colors.text, marginBottom: 10 }}>
          Create floors, run AI room extraction, refine polygons, and place entrance / elevator / stairs pins in one
          place—open <AppText weight="bold">Floorplan extraction</AppText> above.
        </AppText>
      </ClayView>
    </View>
  );
}
