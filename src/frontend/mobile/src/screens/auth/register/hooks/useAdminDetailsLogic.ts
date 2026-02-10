// src/register/hooks/useAdminDetailsLogic.ts
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useRegistrationContext } from '../context/RegistrationContext';

export const useAdminDetailsLogic = () => {
  const router = useRouter();
  const { adminData, setAdminData } = useRegistrationContext();

  const handleNext = () => {
    // 1. Check for empty fields
    if (
      !adminData.firstName.trim() || 
      !adminData.lastName.trim() || 
      !adminData.email.trim() || 
      !adminData.password
    ) {
        Alert.alert('Validation Error', 'Please fill in all admin details.');
        return;
    }

    // 2. Check Password Match
    if (adminData.password !== adminData.repeatPassword) {
        Alert.alert('Validation Error', 'Passwords do not match.');
        return;
    }

    // 3. Navigate
    router.push('/register-flow/branding');
  };

  return { 
    adminData, 
    setAdminData, // Pass this through so the UI can update state
    handleNext 
  };
};