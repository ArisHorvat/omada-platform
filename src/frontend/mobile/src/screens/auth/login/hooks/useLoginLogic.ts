import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { AuthService } from '@/src/services/AuthService';

export const useLoginLogic = () => {
  const router = useRouter();
  const { addAccount } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Login Failed', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await AuthService.login({ email, password });
      
      if (data.organizations && data.organizations.length > 1) {
        router.push({ pathname: '/login-flow/select-organization', params: { token: data.token, organizations: JSON.stringify(data.organizations) } });
      } else {
        await addAccount(data.token);
      }
    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { email, setEmail, password, setPassword, isLoading, handleLogin };
};