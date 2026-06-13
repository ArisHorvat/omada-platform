import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ClayView } from '@/src/components/ui/ClayView';
import { ClayGroupedSection } from '@/src/components/ui/ClayGroupedSection';
import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { IconInput } from '@/src/components/ui/IconInput';
import { ToggleSwitch } from '@/src/components/ui/ToggleSwitch';
import { Icon } from '@/src/components/ui/Icon';
import { PressClay } from '@/src/components/animations/PressClay';
import { WidgetPageShell } from '@/src/components/layout';
import { useThemeColors } from '@/src/hooks';
import { useSecurityLogic } from '@/src/screens/widgets/security/hooks/useSecurityLogic';
import { ADMIN_ACCOUNT_HOME } from '@/src/screens/admin/utils/adminAccountRoutes';

export default function SecurityScreen({ adminConsole = false }: { adminConsole?: boolean }) {
  const colors = useThemeColors();
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    is2FAEnabled,
    handleToggle2FA,
    handleChangePassword,
    handleExportData,
    handleDeleteAccount,
    exportBusy,
    deleteBusy,
    changePasswordBusy,
  } = useSecurityLogic();

  const rowDivider = { borderBottomWidth: 1, borderBottomColor: colors.border };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <WidgetPageShell fullBleed={adminConsole}>
      <ClayView depth={12} puffy={16} style={{ marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 8, paddingVertical: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <PressClay
            onPress={() => {
              if (adminConsole) router.replace(ADMIN_ACCOUNT_HOME as never);
              else router.back();
            }}
          >
            <View style={{ padding: 8 }}>
              <Icon name="arrow-back" size={24} color={colors.text} />
            </View>
          </PressClay>
          <AppText variant="h2" weight="bold" style={{ marginLeft: 8 }}>
            Security
          </AppText>
        </View>
      </ClayView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <ClayGroupedSection title="Password">
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
            <AppText variant="caption">Current password</AppText>
            <IconInput
              icon="lock"
              placeholder="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              rightIcon={showCurrentPassword ? 'visibility-off' : 'visibility'}
              onRightIconPress={() => setShowCurrentPassword((v) => !v)}
              autoCapitalize="none"
              autoCorrect={false}
              style={{ marginTop: 6 }}
            />
          </View>
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <AppText variant="caption">New password</AppText>
            <IconInput
              icon="lock"
              placeholder="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              rightIcon={showNewPassword ? 'visibility-off' : 'visibility'}
              onRightIconPress={() => setShowNewPassword((v) => !v)}
              autoCapitalize="none"
              autoCorrect={false}
              style={{ marginTop: 6 }}
            />
          </View>
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <AppText variant="caption">Confirm new password</AppText>
            <IconInput
              icon="lock"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              rightIcon={showConfirmPassword ? 'visibility-off' : 'visibility'}
              onRightIconPress={() => setShowConfirmPassword((v) => !v)}
              autoCapitalize="none"
              autoCorrect={false}
              style={{ marginTop: 6 }}
            />
          </View>
          <View style={{ padding: 16 }}>
            <AppButton
              title="Update password"
              onPress={() => void handleChangePassword()}
              variant="primary"
              loading={changePasswordBusy}
              disabled={changePasswordBusy}
            />
          </View>
        </ClayGroupedSection>

        <ClayGroupedSection title="Authentication">
          <View style={[rowDivider, { borderBottomWidth: 0, paddingVertical: 14, paddingHorizontal: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <AppText variant="body" weight="medium">
                  Two-factor authentication
                </AppText>
                <AppText variant="caption" style={{ marginTop: 4 }}>
                  When enabled, each sign-in sends a 6-digit code to your email after your password is accepted.
                </AppText>
              </View>
              <ToggleSwitch value={is2FAEnabled} onValueChange={handleToggle2FA} />
            </View>
          </View>
        </ClayGroupedSection>

        <ClayGroupedSection title="Your data">
          <View style={{ padding: 16, gap: 12 }}>
            <AppButton
              title={exportBusy ? 'Preparing export…' : 'Export my data'}
              onPress={() => void handleExportData()}
              variant="secondary"
              disabled={exportBusy}
              loading={exportBusy}
              icon="download"
            />
            <AppButton
              title={deleteBusy ? 'Deleting…' : 'Delete account'}
              onPress={handleDeleteAccount}
              variant="danger"
              disabled={deleteBusy}
              loading={deleteBusy}
              icon="delete-forever"
            />
          </View>
        </ClayGroupedSection>
      </ScrollView>
      </WidgetPageShell>
    </SafeAreaView>
  );
}
