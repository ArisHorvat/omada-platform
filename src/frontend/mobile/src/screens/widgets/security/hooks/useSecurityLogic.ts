import { useState, useEffect } from 'react';
import { Alert, Share } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/src/context/AuthContext';
import { unwrap, usersApi } from '@/src/api';
import { fetchUserDataExportJson } from '@/src/api/exportUserData';
import {
  ChangePasswordRequest,
  UpdateSecurityRequest,
  type UserProfileDto,
} from '@/src/api/generatedClient';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { formatApiErrorMessage } from '@/src/utils/formatApiError';
import { validatePassword } from '@/src/utils/passwordValidation';

export const useSecurityLogic = () => {
  const queryClient = useQueryClient();
  const { activeSession, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [changePasswordBusy, setChangePasswordBusy] = useState(false);

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
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Error', passwordError);
      return;
    }
    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from your current password.');
      return;
    }

    setChangePasswordBusy(true);
    try {
      const request = new ChangePasswordRequest({
        oldPassword: currentPassword,
        newPassword,
      });
      await unwrap(usersApi.changePassword(request));
      Alert.alert('Success', 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: unknown) {
      Alert.alert('Error', formatApiErrorMessage(e, 'Could not update password.'));
    } finally {
      setChangePasswordBusy(false);
    }
  };

  const handleToggle2FA = (value: boolean) => {
    setIs2FAEnabled(value);
    updateSecurityMutation.mutate(new UpdateSecurityRequest({ isTwoFactorEnabled: value }), {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userProfile });
        Alert.alert(
          value ? 'Two-factor enabled' : 'Two-factor disabled',
          value
            ? 'Next time you sign in, we will email you a 6-digit code after your password.'
            : 'Sign-in will only require your password again.'
        );
      },
    });
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
    handleChangePassword,
    handleExportData,
    handleDeleteAccount,
    exportBusy,
    deleteBusy,
    changePasswordBusy,
  };
};
