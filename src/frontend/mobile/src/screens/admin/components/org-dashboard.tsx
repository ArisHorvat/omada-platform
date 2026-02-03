import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/hooks';
import { createStyles } from '@/src/screens/admin/styles/org-dashboard.styles';
import { useOrgAdminDashboardLogic } from '../hooks/useOrgAdminDashboardLogic';
import { ProgressiveImage } from '@/src/components/ui/ProgressiveImage';

export default function OrgAdminDashboard() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { org, loading, email, handleLogout, handleFeatureComingSoon } = useOrgAdminDashboardLogic();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.subtle }}>Loading Dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (!org) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <MaterialIcons name="error-outline" size={48} color={colors.notification} />
        <Text style={{ color: colors.text, fontSize: 18, marginTop: 16, textAlign: 'center' }}>Organization Not Found</Text>
        <Text style={{ color: colors.subtle, textAlign: 'center', marginTop: 8 }}>Could not find an organization associated with {email}.</Text>
        <TouchableOpacity onPress={handleLogout} style={{ marginTop: 24, padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Logout</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Organization Card */}
        <View style={styles.card}>
          <View style={styles.orgHeader}>
            {org.logoUrl ? (
              <ProgressiveImage source={{ uri: org.logoUrl }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, { justifyContent: 'center', alignItems: 'center' }]}>
                <MaterialIcons name="business" size={32} color={colors.subtle} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.orgName}>{org.name}</Text>
              <Text style={styles.orgDomain}>{org.emailDomain}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: org.primaryColor, marginRight: 8 }} />
            <Text style={{ color: colors.subtle }}>Primary Color</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{org.roles?.length || 0}</Text>
            <Text style={styles.statLabel}>Roles</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{org.widgets?.length || 0}</Text>
            <Text style={styles.statLabel}>Active Widgets</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Manage</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleFeatureComingSoon('User management')}>
            <MaterialIcons name="people" size={32} color={colors.primary} />
            <Text style={styles.actionText}>Users</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleFeatureComingSoon('Widget settings')}>
            <MaterialIcons name="widgets" size={32} color={colors.tertiary} />
            <Text style={styles.actionText}>Widgets</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleFeatureComingSoon('Role management')}>
            <MaterialIcons name="security" size={32} color={colors.secondary} />
            <Text style={styles.actionText}>Roles</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleFeatureComingSoon('Settings')}>
            <MaterialIcons name="settings" size={32} color={colors.subtle} />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Active Widgets List */}
        <Text style={styles.sectionTitle}>Enabled Widgets</Text>
        <View style={[styles.card, { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }]}>
          {org.widgets && org.widgets.length > 0 ? (
            org.widgets.map((widget: string, index: number) => (
              <View key={index} style={styles.widgetTag}>
                <MaterialIcons name="extension" size={16} color={colors.primary} />
                <Text style={styles.widgetText}>{widget}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.subtle }}>No widgets enabled.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
