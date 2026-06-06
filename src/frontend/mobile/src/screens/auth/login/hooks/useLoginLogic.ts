import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { secureDeleteItem, secureGetItem, secureSetItem } from '@/src/lib/secureStorage';
import { useRouter, type Href } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';

import { useAuth } from '@/src/context/AuthContext';
import { useUserPreferences } from '@/src/context/UserPreferencesContext';
import { authApi, unwrap } from '@/src/api';
import {
  LoginRequest,
  RefreshTokenRequest,
  SwitchOrgRequest,
  UserOrganizationDto,
} from '@/src/api/generatedClient';
import { promptLocalAuthentication } from '@/src/utils/promptLocalAuthentication';
import { formatApiErrorMessage } from '@/src/utils/formatApiError';
import { homeHrefForRole } from '@/src/utils/authRoutes';
import { setCompletingLoginOrgPick } from '@/src/utils/loginOrgPick';

export const useLoginLogic = (pendingJoinCode?: string) => {
  const { login } = useAuth();
  const router = useRouter();
  const { isBiometricEnabled } = useUserPreferences();

  const [isLoading, setIsLoading] = useState(false);
  const [showOrgSelector, setShowOrgSelector] = useState(false);
  const [userOrgs, setUserOrgs] = useState<UserOrganizationDto[]>([]);

  const requireBiometricGateIfEnabled = async (): Promise<boolean> => {
    if (!isBiometricEnabled) return true;
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) return true;

    const ok = await promptLocalAuthentication({
      promptMessage: 'Sign in to Omada',
      fallbackLabel: 'Use device passcode',
      cancelLabel: 'Cancel',
    });
    if (!ok) {
      Alert.alert(
        'Sign-in cancelled',
        'Use Face ID, Touch ID, or your device passcode when prompted to continue.',
      );
    }
    return ok;
  };

  const tryBiometricSessionRestore = useCallback(async () => {
    if (!isBiometricEnabled) return;
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) return;

    const refresh = await secureGetItem('refresh_token');
    const access = (await secureGetItem('jwt_token')) ?? '';
    if (!refresh) return;

    const ok = await promptLocalAuthentication({
      promptMessage: 'Unlock Omada',
      fallbackLabel: 'Use device passcode',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;

    try {
      const req = new RefreshTokenRequest();
      req.accessToken = access;
      req.refreshToken = refresh;
      const response = await unwrap(authApi.refreshToken(req));
      if (!response.accessToken) return;
      await login(response.accessToken, response.refreshToken || refresh);
      router.replace('/(app)/(tabs)/dashboard');
    } catch {
      // Refresh invalid — user signs in with password.
    }
  }, [isBiometricEnabled, login, router]);

  const navigateAfterLogin = (role?: string | null) => {
    if (pendingJoinCode) {
      router.replace({
        pathname: '/join-organization',
        params: { code: pendingJoinCode },
      } as never);
      return;
    }
    router.replace(homeHrefForRole(role) as Href);
  };

  const handleLogin = async (email: string, password: string) => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    if (!(await requireBiometricGateIfEnabled())) return;

    setIsLoading(true);
    try {
      const request = new LoginRequest();
      request.email = email;
      request.password = password;

      const response = await unwrap(authApi.login(request));

      const jwtToken = response.accessToken;
      const refreshToken = response.refreshToken || '';

      if (!jwtToken) throw new Error('The server did not return a valid authentication token.');

      await secureSetItem('jwt_token', jwtToken);
      await secureSetItem('refresh_token', refreshToken);

      const orgs = await unwrap(authApi.getMyOrganizations());

      if (pendingJoinCode) {
        await finalizeLogin(jwtToken, refreshToken);
        navigateAfterLogin(response.role);
        return;
      }

      if (orgs && orgs.length > 1) {
        setUserOrgs(orgs);
        setShowOrgSelector(true);
      } else {
        await finalizeLogin(jwtToken, refreshToken);
      }
    } catch (error: unknown) {
      await secureDeleteItem('jwt_token');
      await secureDeleteItem('refresh_token');
      Alert.alert('Login Failed', formatApiErrorMessage(error, 'Invalid credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrgSelect = async (org: UserOrganizationDto) => {
    if (!org.organizationId) {
      Alert.alert('Error', 'Missing Organization ID.');
      return;
    }

    setShowOrgSelector(false);
    setIsLoading(true);
    setCompletingLoginOrgPick(true);

    try {
      const request = new SwitchOrgRequest();
      request.organizationId = org.organizationId;

      const response = await unwrap(authApi.switchOrganization(request));
      const jwtToken = response.accessToken;
      const refreshToken = response.refreshToken ?? (await secureGetItem('refresh_token')) ?? '';

      if (!jwtToken) {
        throw new Error('Failed to start your workspace session.');
      }

      await login(jwtToken, refreshToken);
      setCompletingLoginOrgPick(false);

      navigateAfterLogin(org.role);
    } catch (error: unknown) {
      setCompletingLoginOrgPick(false);
      Alert.alert('Could not continue', formatApiErrorMessage(error, 'Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeLogin = async (finalToken: string, refreshToken: string) => {
    await login(finalToken, refreshToken);
  };

  return {
    handleLogin,
    tryBiometricSessionRestore,
    isLoading,
    showOrgSelector,
    userOrgs,
    handleOrgSelect,
    setShowOrgSelector,
  };
};
