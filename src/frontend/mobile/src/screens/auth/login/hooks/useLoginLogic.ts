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
  ResendTwoFactorRequest,
  SwitchOrgRequest,
  VerifyTwoFactorRequest,
  type LoginResponse,
  type UserOrganizationDto,
} from '@/src/api/generatedClient';
import { promptLocalAuthentication } from '@/src/utils/promptLocalAuthentication';
import { formatApiErrorMessage } from '@/src/utils/formatApiError';
import { homeHrefForRole } from '@/src/utils/authRoutes';
import { setCompletingLoginOrgPick } from '@/src/utils/loginOrgPick';

export type TwoFactorChallenge = {
  sessionToken: string;
  email: string;
};

export const useLoginLogic = (pendingJoinCode?: string) => {
  const { login } = useAuth();
  const router = useRouter();
  const { isBiometricEnabled } = useUserPreferences();

  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showOrgSelector, setShowOrgSelector] = useState(false);
  const [userOrgs, setUserOrgs] = useState<UserOrganizationDto[]>([]);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<TwoFactorChallenge | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [twoFactorInfo, setTwoFactorInfo] = useState<string | null>(null);
  const [resendBusy, setResendBusy] = useState(false);

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

  const finalizeLogin = async (finalToken: string, refreshToken: string) => {
    await login(finalToken, refreshToken);
  };

  const completeAuthenticatedLogin = async (response: LoginResponse) => {
    const jwtToken = response.accessToken;
    const refreshToken = response.refreshToken || '';

    if (!jwtToken) {
      throw new Error('The server did not return a valid authentication token.');
    }

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
      return;
    }

    await finalizeLogin(jwtToken, refreshToken);
    navigateAfterLogin(response.role);
  };

  const handleLogin = async (email: string, password: string) => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    if (!(await requireBiometricGateIfEnabled())) return;

    setLoginError(null);
    setTwoFactorError(null);
    setTwoFactorInfo(null);
    setIsLoading(true);
    try {
      const request = new LoginRequest();
      request.email = email;
      request.password = password;

      const response = await unwrap(authApi.login(request));

      if (response.requiresTwoFactor) {
        if (!response.twoFactorSessionToken) {
          throw new Error('Two-factor verification is required but the session token is missing.');
        }
        setTwoFactorChallenge({
          sessionToken: response.twoFactorSessionToken,
          email: response.user?.email ?? email.trim(),
        });
        setTwoFactorCode('');
        setTwoFactorInfo('We sent a 6-digit code to your email. Enter it below to finish signing in.');
        return;
      }

      await completeAuthenticatedLogin(response);
    } catch (error: unknown) {
      await secureDeleteItem('jwt_token');
      await secureDeleteItem('refresh_token');
      const message = formatApiErrorMessage(error, 'Invalid email or password.');
      setLoginError(message);
      Alert.alert('Login Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTwoFactor = async () => {
    if (!twoFactorChallenge) return;

    const code = twoFactorCode.trim();
    if (!/^\d{6}$/.test(code)) {
      const message = 'Enter the 6-digit code from your email.';
      setTwoFactorError(message);
      Alert.alert('Error', message);
      return;
    }

    setTwoFactorError(null);
    setTwoFactorInfo(null);
    setIsLoading(true);
    try {
      const response = await unwrap(
        authApi.verifyTwoFactor(
          new VerifyTwoFactorRequest({
            twoFactorSessionToken: twoFactorChallenge.sessionToken,
            code,
          })
        )
      );

      if (response.requiresTwoFactor) {
        throw new Error('Verification did not complete. Try again or request a new code.');
      }

      setTwoFactorChallenge(null);
      setTwoFactorCode('');
      await completeAuthenticatedLogin(response);
    } catch (error: unknown) {
      const message = formatApiErrorMessage(error, 'Invalid or expired code.');
      setTwoFactorError(message);
      Alert.alert('Verification failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendTwoFactor = async () => {
    if (!twoFactorChallenge) return;

    setResendBusy(true);
    setTwoFactorError(null);
    try {
      await unwrap(
        authApi.resendTwoFactor(
          new ResendTwoFactorRequest({
            twoFactorSessionToken: twoFactorChallenge.sessionToken,
          })
        )
      );
      setTwoFactorInfo('A new code was sent to your email.');
    } catch (error: unknown) {
      const message = formatApiErrorMessage(error, 'Could not resend the code.');
      setTwoFactorError(message);
      Alert.alert('Could not resend', message);
    } finally {
      setResendBusy(false);
    }
  };

  const cancelTwoFactor = () => {
    setTwoFactorChallenge(null);
    setTwoFactorCode('');
    setTwoFactorError(null);
    setTwoFactorInfo(null);
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

  return {
    handleLogin,
    tryBiometricSessionRestore,
    isLoading,
    showOrgSelector,
    userOrgs,
    handleOrgSelect,
    setShowOrgSelector,
    loginError,
    setLoginError,
    twoFactorChallenge,
    twoFactorCode,
    setTwoFactorCode,
    twoFactorError,
    twoFactorInfo,
    handleVerifyTwoFactor,
    handleResendTwoFactor,
    cancelTwoFactor,
    resendBusy,
  };
};
