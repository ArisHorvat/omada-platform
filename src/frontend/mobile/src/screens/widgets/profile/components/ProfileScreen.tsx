import React, { useMemo } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClayView } from '@/src/components/ui/ClayView';
import { ClayGroupedSection } from '@/src/components/ui/ClayGroupedSection';
import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Icon } from '@/src/components/ui/Icon';
import { PressClay } from '@/src/components/animations/PressClay';
import { ProgressiveImage } from '@/src/components/ui/ProgressiveImage';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { useThemeColors, useTabContentBottomPadding } from '@/src/hooks';
import { createStyles } from '@/src/screens/widgets/profile/styles/profile.styles';
import { useProfileLogic } from '@/src/screens/widgets/profile/hooks/useProfileLogic';
import { resolveMediaUrl } from '@/src/utils/resolveMediaUrl';
import { alertAction } from '@/src/utils/confirmAction';
import OrganizationPickerModal from '@/src/screens/auth/login/components/select-organization';

export default function ProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const bottomPad = useTabContentBottomPadding(24);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    user,
    organization,
    isLoading,
    showAccountSwitcher,
    setShowAccountSwitcher,
    myOrganizations,
    openOrgSwitcher,
    handleSwitchOrg,
    handleJoinOrganization,
    handleLogout,
    email,
    role,
    canAccessAdminConsole,
    goToAdminConsole,
    goToMemberApp,
  } = useProfileLogic();

  if (isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const displayName = user ? `${user.firstName} ${user.lastName}` : email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUri = resolveMediaUrl(user?.avatarUrl);
  const phoneDisplay = user?.phoneNumber || user?.phone;
  const addressDisplay = user?.address;
  const bioDisplay = user?.bio;

  const menuRow = (
    icon: React.ComponentProps<typeof Icon>['name'],
    label: string,
    onPress: () => void,
    last?: boolean,
    destructive?: boolean
  ) => (
    <PressClay onPress={onPress}>
      <View style={[styles.menuRow, last && styles.menuRowLast]}>
        <Icon name={icon} size={22} color={destructive ? colors.error : colors.primary} />
        <AppText
          variant="body"
          weight="medium"
          style={[styles.menuLabel, destructive ? { color: colors.error } : { color: colors.text }]}
        >
          {label}
        </AppText>
        <Icon name="chevron-right" size={22} color={colors.subtle} />
      </View>
    </PressClay>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <PageContainer>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <ClayView depth={12} puffy={18} style={{ paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20 }}>
          <View style={styles.headerRow}>
            <AppText variant="h2" weight="bold" style={{ flex: 1 }}>
              Profile
            </AppText>
            <PressClay onPress={() => router.push('/settings')}>
              <View style={{ padding: 8, borderRadius: 12 }}>
                <Icon name="settings" size={26} color={colors.text} />
              </View>
            </PressClay>
          </View>
        </ClayView>

        <ClayView depth={14} puffy={20} style={{ paddingVertical: 24, paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <ProgressiveImage
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                borderWidth={2}
                borderColor={colors.primary}
                fallback={
                  <View style={[styles.avatarFallback, { position: 'absolute' }]}>
                    <AppText variant="display" weight="extra" style={{ color: colors.onPrimary }}>
                      {initial}
                    </AppText>
                  </View>
                }
              />
            ) : (
              <View style={styles.avatarFallback}>
                <AppText variant="display" weight="extra" style={{ color: colors.onPrimary }}>
                  {initial}
                </AppText>
              </View>
            )}
          </View>
          <AppText variant="h2" weight="bold" style={styles.name}>
            {displayName}
          </AppText>
          <View style={styles.rolePill}>
            <AppText variant="label" weight="bold" style={{ color: colors.onPrimaryContainer }}>
              {(role || 'Member').toUpperCase()}
            </AppText>
          </View>

          <AppButton
            title="Edit profile"
            onPress={() => router.push('/edit-profile')}
            variant="primary"
            size="md"
            icon="edit"
            style={{ alignSelf: 'stretch', marginTop: 8 }}
          />

          {canAccessAdminConsole ? (
            <AppButton
              title="Admin console"
              onPress={goToAdminConsole}
              variant="secondary"
              size="md"
              icon="admin-panel-settings"
              style={{ alignSelf: 'stretch', marginTop: 10 }}
            />
          ) : null}

          {(bioDisplay || phoneDisplay || addressDisplay) && (
            <View style={{ marginTop: 20, gap: 12 }}>
              {bioDisplay ? (
                <View>
                  <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
                    Bio
                  </AppText>
                  <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
                    {bioDisplay}
                  </AppText>
                </View>
              ) : null}
              {phoneDisplay ? (
                <View>
                  <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
                    Phone
                  </AppText>
                  <AppText variant="body" style={{ color: colors.text }}>
                    {phoneDisplay}
                  </AppText>
                </View>
              ) : null}
              {addressDisplay ? (
                <View>
                  <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
                    Address
                  </AppText>
                  <AppText variant="body" style={{ color: colors.text }}>
                    {addressDisplay}
                  </AppText>
                </View>
              ) : null}
            </View>
          )}
        </ClayView>

        <ClayGroupedSection>
          <PressClay onPress={() => router.push('/digital-id' as never)}>
            <View style={[styles.menuRow, styles.menuRowLast]}>
              <Icon name="badge" size={22} color={colors.info} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <AppText variant="body" weight="medium">
                  Digital ID
                </AppText>
                <AppText variant="caption">Tap to view your ID</AppText>
              </View>
              <Icon name="chevron-right" size={22} color={colors.subtle} />
            </View>
          </PressClay>
        </ClayGroupedSection>

        <ClayGroupedSection title="Menu">
          {menuRow('tune', 'Preferences', () => router.push('/settings'))}
          {menuRow('security', 'Security', () => router.push('/security'))}
          {menuRow(
            'info',
            'About',
            () =>
              alertAction({
                title: 'Omada',
                message: 'Campus & workplace companion.\nVersion 1.0.0',
              }),
            true,
          )}
        </ClayGroupedSection>

        <ClayGroupedSection title="Workspace">
          {menuRow('business', 'Organization', openOrgSwitcher)}
          {menuRow('star', 'Favorites', () => router.push('/manage-favorites' as never))}
          {menuRow('logout', 'Log out', handleLogout, true, true)}
        </ClayGroupedSection>
      </ScrollView>
      </PageContainer>

      <OrganizationPickerModal
        visible={showAccountSwitcher}
        organizations={myOrganizations}
        onSelect={handleSwitchOrg}
        onJoinOrganization={handleJoinOrganization}
        onCancel={() => setShowAccountSwitcher(false)}
        mode="switch"
        title="Switch organization"
        subtitle="Pick a workspace. You will see the same transition as when signing in."
      />
    </SafeAreaView>
  );
}
