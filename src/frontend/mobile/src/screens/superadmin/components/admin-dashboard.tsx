import React, { useMemo } from 'react';
import { View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WidgetPageShell } from '@/src/components/layout';
import { AppButton, AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { createStyles } from '@/src/screens/superadmin/styles/admin-dashboard.styles';
import { useSuperAdminDashboardLogic } from '@/src/screens/superadmin/hooks/useSuperAdminDashboardLogic';
import { ProgressiveImage } from '@/src/components/ui/ProgressiveImage';
import type { OrganizationDetailsDto } from '@/src/api/generatedClient';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    organizations,
    searchQuery,
    setSearchQuery,
    isLoading,
    isRefreshing,
    refresh,
    page,
    setPage,
    totalPages,
    totalItems,
    deleteOrganization,
    deleting,
    enterOrganization,
  } = useSuperAdminDashboardLogic();

  const renderItem = ({ item }: { item: OrganizationDetailsDto }) => (
    <TouchableOpacity
      style={styles.orgItem}
      onPress={() => item.id && enterOrganization(item.id).then(() => router.push('/org-dashboard' as never))}
    >
      {item.logoUrl ? (
        <ProgressiveImage source={{ uri: item.logoUrl }} style={styles.logo} />
      ) : (
        <View style={styles.logoPlaceholder}>
          <MaterialIcons name="business" size={24} color={colors.subtle} />
        </View>
      )}
      <View style={styles.orgInfo}>
        <AppText weight="bold" style={styles.orgName}>
          {item.name}
        </AppText>
        <AppText variant="caption" style={styles.orgDomain}>
          {item.emailDomain}
        </AppText>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => item.id && enterOrganization(item.id).then(() => router.push('/org-dashboard' as never))}
          accessibilityLabel={`Manage ${item.name}`}
        >
          <MaterialIcons name="apartment" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          disabled={deleting}
          onPress={() => item.id && deleteOrganization(item.id, item.name ?? 'organization')}
        >
          <MaterialIcons name="delete" size={24} color={colors.notification} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <WidgetPageShell>
        <View style={styles.container}>
          <View style={styles.header}>
            <AppText variant="h3" weight="bold" style={styles.headerTitle}>
              Platform admin
            </AppText>
            <TouchableOpacity onPress={() => router.push('/org-dashboard')} accessibilityLabel="Organization admin">
              <MaterialIcons name="apartment" size={26} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/register-flow')}>
              <MaterialIcons name="add-business" size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
            {totalItems} organization{totalItems === 1 ? '' : 's'} on this platform
          </AppText>

          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={24} color={colors.subtle} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search organizations..."
              placeholderTextColor={colors.subtle}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={organizations}
              renderItem={renderItem}
              keyExtractor={(item) => item.id ?? item.name ?? Math.random().toString()}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />}
              ListEmptyComponent={
                <AppText variant="body" style={{ color: colors.subtle, textAlign: 'center', marginTop: 24 }}>
                  No organizations match your search.
                </AppText>
              }
            />
          )}

          {totalPages > 1 ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <AppButton
                title="Previous"
                variant="outline"
                disabled={page <= 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                style={{ minWidth: 100 }}
              />
              <AppText variant="caption" style={{ color: colors.subtle }}>
                Page {page} of {totalPages}
              </AppText>
              <AppButton
                title="Next"
                variant="outline"
                disabled={page >= totalPages}
                onPress={() => setPage((p) => p + 1)}
                style={{ minWidth: 100 }}
              />
            </View>
          ) : null}
        </View>
      </WidgetPageShell>
    </SafeAreaView>
  );
}
