import React, { useMemo } from 'react';
import { View, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ClayView } from '@/src/components/ui/ClayView';
import { ClayGroupedSection } from '@/src/components/ui/ClayGroupedSection';
import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { ToggleSwitch } from '@/src/components/ui/ToggleSwitch';
import { Icon } from '@/src/components/ui/Icon';
import { PressClay } from '@/src/components/animations/PressClay';
import { useThemeColors } from '@/src/hooks';
import { useSecurityLogic } from '@/src/screens/widgets/security/hooks/useSecurityLogic';

export default function SecurityScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    is2FAEnabled,
    handleToggle2FA,
    isBiometricEnabled,
    onBiometricToggle,
    handleChangePassword,
    handleExportData,
    handleDeleteAccount,
    exportBusy,
    deleteBusy,
  } = useSecurityLogic();

  const inputStyle = useMemo(
    () => ({
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 16,
      marginTop: 6,
      backgroundColor: colors.card,
    }),
    [colors.border, colors.card, colors.text]
  );

  const rowDivider = { borderBottomWidth: 1, borderBottomColor: colors.border };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ClayView depth={12} puffy={16} style={{ marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 8, paddingVertical: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <PressClay onPress={() => router.back()}>
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
            <TextInput
              style={inputStyle}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.subtle}
            />
          </View>
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <AppText variant="caption">New password</AppText>
            <TextInput
              style={inputStyle}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.subtle}
            />
          </View>
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <AppText variant="caption">Confirm new password</AppText>
            <TextInput
              style={inputStyle}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.subtle}
            />
          </View>
          <View style={{ padding: 16 }}>
            <AppButton title="Update password" onPress={() => void handleChangePassword()} variant="primary" />
          </View>
        </ClayGroupedSection>

        <ClayGroupedSection title="Authentication">
          <View style={[rowDivider, { paddingVertical: 14, paddingHorizontal: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <AppText variant="body" weight="medium">
                  Enable biometrics (Face ID / Touch ID)
                </AppText>
                <AppText variant="caption" style={{ marginTop: 4 }}>
                  Use device biometrics for quick access where supported.
                </AppText>
              </View>
              <ToggleSwitch value={isBiometricEnabled} onValueChange={(v) => void onBiometricToggle(v)} />
            </View>
          </View>
          <View style={[rowDivider, { borderBottomWidth: 0, paddingVertical: 14, paddingHorizontal: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <AppText variant="body" weight="medium">
                  Two-factor authentication
                </AppText>
                <AppText variant="caption" style={{ marginTop: 4 }}>
                  Extra verification for your account.
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
    </SafeAreaView>
  );
}
