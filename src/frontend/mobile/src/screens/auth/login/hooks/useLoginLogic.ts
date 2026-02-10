import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store'; // Need this to pass token temporarily
import { AuthService } from '@/src/services/AuthService';
import { useAuth } from '@/src/context/AuthContext';
import { UserOrganizationDto } from '@/src/types/api';

export const useLoginLogic = () => {
  const router = useRouter();
  const { login } = useAuth(); // We use the global login action

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Org Selection State
  const [showOrgSelector, setShowOrgSelector] = useState(false);
  const [userOrgs, setUserOrgs] = useState<UserOrganizationDto[]>([]);
  const [tempToken, setTempToken] = useState<string | null>(null);

  /**
   * STEP 1: Authenticate with Email/Password
   */
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Call API to get initial token (logs into default/last org)
      const response = await AuthService.login({ email, password });
      
      // 2. Save token temporarily to make the next call
      // We manually set it in SecureStore so apiClient can pick it up for getMyOrganizations()
      await SecureStore.setItemAsync('jwt_token', response.token);
      setTempToken(response.token);

      // 3. Fetch User's Organizations
      const orgs = await AuthService.getMyOrganizations();

      if (orgs.length > 1) {
        // CASE A: Multiple Orgs -> Show Selector
        setUserOrgs(orgs);
        setShowOrgSelector(true);
      } else {
        // CASE B: Single Org -> Finish Login
        await finalizeLogin(response.token);
      }

    } catch (error: any) {
      // Cleanup on error
      await SecureStore.deleteItemAsync('jwt_token'); 
      Alert.alert('Login Failed', error.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * STEP 2: Handle Organization Selection
   */
  const handleOrgSelect = async (orgId: string) => {
    setIsLoading(true);
    try {
      // 1. Switch Token (Get a new token scoped to the selected Org)
      const response = await AuthService.switchOrganization(orgId);
      
      // 2. Finish
      await finalizeLogin(response.token);

    } catch (error: any) {
      Alert.alert('Error', 'Failed to switch organization.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * FINAL STEP: Commit to Context and Navigate
   */
  const finalizeLogin = async (finalToken: string) => {
    // 1. Update Global Context (Persists token & updates state)
    await login(finalToken);

    setTimeout(() => {
        router.replace('/(app)'); 
        // OR checks roles:
        // if (role === 'Admin') router.replace('/org-dashboard');
    }, 100);
  };

  return {
    email, setEmail,
    password, setPassword,
    isLoading,
    handleLogin,
    // Org Selection Props
    showOrgSelector,
    userOrgs,
    handleOrgSelect,
    setShowOrgSelector // Exposed in case user wants to cancel/back out of selection
  };
};