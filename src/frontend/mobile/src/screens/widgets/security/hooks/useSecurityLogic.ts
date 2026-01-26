import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useUserPreferences } from '@/src/context/UserPreferencesContext';
import { UserService } from '@/src/services/UserService';

export const useSecurityLogic = () => {
  const { token } = useAuth();
  const { isBiometricEnabled, toggleBiometric } = useUserPreferences();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        if (token) {
          //const data = await UserService.getMe(token);
          const data = await UserService.getMe();
          setIs2FAEnabled(data.isTwoFactorEnabled);
        }
      } catch (e) { console.error(e); }
    };
    fetchSettings();
  }, [token]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { Alert.alert('Error', 'Please fill in all password fields.'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'New passwords do not match.'); return; }
    setIsLoading(true);
    try {
      if (!token) return;
      await UserService.changePassword({ oldPassword: currentPassword, newPassword });
      Alert.alert('Success', 'Password updated successfully.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e: any) { Alert.alert('Error', e.message || 'Network error.'); } finally { setIsLoading(false); }
  };

  const handleToggle2FA = async (value: boolean) => {
    setIs2FAEnabled(value);
    try {
      if (!token) return;
      await UserService.updateSecurity({ isTwoFactorEnabled: value });
    } catch (e) { setIs2FAEnabled(!value); Alert.alert('Error', 'Failed to update settings.'); }
  };

  return { currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, is2FAEnabled, isLoading, isBiometricEnabled, toggleBiometric, handleChangePassword, handleToggle2FA };
};