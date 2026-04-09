import { useState, useEffect } from 'react';
import { Alert, Share } from 'react-native';
import { promptLocalAuthentication } from '@/src/utils/promptLocalAuthentication';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/src/context/AuthContext';
import { useUserPreferences } from '@/src/context/UserPreferencesContext';
import { authApi, unwrap, usersApi } from '@/src/api';
import { fetchUserDataExportJson } from '@/src/api/exportUserData';
import {
  ResetPasswordRequest,
  UpdateSecurityRequest,
  type UserProfileDto,
} from '@/src/api/generatedClient';
import { QUERY_KEYS } from '@/src/api/queryKeys';

export const useSecurityLogic = () => {
  const queryClient = useQueryClient();
  const { activeSession, logout } = useAuth();
  const { isBiometricEnabled, toggleBiometric } = useUserPreferences();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const { data: profile } = useQuery({
    queryKey: QUERY_KEYS.userProfile,
    queryFn: async () => await unwrap(usersApi.getMe()),
    enabled: !!activeSession,
  });

  useEffect(() => {
    if (profile?.isTwoFactorEnabled !== undefined) {
      setIs2FAEnabled(!!profile.isTwoFactorEnabled);
    }
  }, [profile?.isTwoFactorEnabled]);

  const updateSecurityMutation = useMutation({
    mutationFn: async (req: UpdateSecurityRequest) => await unwrap(usersApi.updateSecurity(req)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userProfile });
      Alert.alert('Success', 'Security settings updated.');
    },
    onError: () => {
      const cached = queryClient.getQueryData<UserProfileDto>(QUERY_KEYS.userProfile);
      setIs2FAEnabled(!!cached?.isTwoFactorEnabled);
      Alert.alert('Error', 'Failed to update settings.');
    },
  });

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    try {
      const request = new ResetPasswordRequest({ token: '', email: '', newPassword });
      await unwrap(authApi.resetPassword(request));
      Alert.alert('Success', 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error.';
      Alert.alert('Error', msg);
    }
  };

  const handleToggle2FA = (value: boolean) => {
    setIs2FAEnabled(value);
    updateSecurityMutation.mutate(new UpdateSecurityRequest({ isTwoFactorEnabled: value }));
  };

  const onBiometricToggle = async (enable: boolean) => {
    if (enable) {
      const LocalAuthentication = await import('expo-local-authentication');
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Unavailable', 'This device does not support Face ID or Touch ID.');
        return;
      }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert('Not set up', 'Add Face ID or Touch ID in your device settings first.');
        return;
      }
      const ok = await promptLocalAuthentication({
        promptMessage: 'Confirm to enable biometric unlock for Omada',
        fallbackLabel: 'Use device passcode',
        cancelLabel: 'Cancel',
      });
      if (!ok) return;
    }
    await toggleBiometric(enable);
  };

  const handleExportData = async () => {
    setExportBusy(true);
    try {
      const json = await fetchUserDataExportJson();
      await Share.share({
        message: json,
        title: 'Omada data export',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Export failed.';
      Alert.alert('Export failed', msg);
    } finally {
      setExportBusy(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'Your personal data will be anonymized. This cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleteBusy(true);
            try {
              await unwrap(usersApi.deleteMe());
              queryClient.clear();
              await logout();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Could not delete account.';
              Alert.alert('Error', msg);
            } finally {
              setDeleteBusy(false);
            }
          },
        },
      ]
    );
  };

  return {
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
  };
};
