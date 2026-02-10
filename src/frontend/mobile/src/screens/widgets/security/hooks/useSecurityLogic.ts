import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useUserPreferences } from '@/src/context/UserPreferencesContext';
import { UserService } from '@/src/services/UserService';
import apiClient from '@/src/services/apiClient'; // Import for direct call if needed

export const useSecurityLogic = () => {
  const { activeSession } = useAuth();
  const { isBiometricEnabled, toggleBiometric } = useUserPreferences();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        if (activeSession) {
          const data = await UserService.getMe();
          setIs2FAEnabled(data.isTwoFactorEnabled);
        }
      } catch (e) { console.error(e); }
    };
    fetchSettings();
  }, [activeSession]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { 
        Alert.alert('Error', 'Please fill in all password fields.'); return; 
    }
    if (newPassword !== confirmPassword) { 
        Alert.alert('Error', 'New passwords do not match.'); return; 
    }
    
    setIsLoading(true);
    try {
      // Assuming endpoint is /users/change-password
      // If not in UserService, we call it directly or add it there.
      await apiClient.post('/users/change-password', { 
          oldPassword: currentPassword, 
          newPassword 
      });
      
      Alert.alert('Success', 'Password updated successfully.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e: any) { 
        Alert.alert('Error', e.message || 'Network error.'); 
    } finally { 
        setIsLoading(false); 
    }
  };

  const handleToggle2FA = async (value: boolean) => {
    setIs2FAEnabled(value);
    try {
      await UserService.updateSecurity({ isTwoFactorEnabled: value });
    } catch (e) { 
        setIs2FAEnabled(!value); // Revert
        Alert.alert('Error', 'Failed to update settings.'); 
    }
  };

  return { 
      currentPassword, setCurrentPassword, 
      newPassword, setNewPassword, 
      confirmPassword, setConfirmPassword, 
      is2FAEnabled, handleToggle2FA, 
      isBiometricEnabled, toggleBiometric, 
      handleChangePassword, isLoading 
  };
};