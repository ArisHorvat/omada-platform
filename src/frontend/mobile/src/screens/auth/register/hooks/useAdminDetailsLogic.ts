import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useRegistration } from '@/src/screens/auth/register/context/RegistrationContext';

export const useAdminDetailsLogic = () => {
  const router = useRouter();
  const { adminData, setAdminData } = useRegistration();

  const handleNext = () => {
    if (!adminData.firstName.trim() || !adminData.lastName.trim() || !adminData.email.trim() || !adminData.password) {
        Alert.alert('Validation Error', 'Please fill all admin details.');
        return;
    }
    if (adminData.password !== adminData.repeatPassword) {
        Alert.alert('Validation Error', 'Passwords do not match.');
        return;
    }
    router.push('/register-flow/branding');
  };
  return { adminData, setAdminData, handleNext };
};