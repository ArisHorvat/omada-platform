import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { jwtDecode } from 'jwt-decode';
import {
  LoginRequest,
  RegisterOrganizationRequest,
  SwitchOrgRequest,
} from '@/src/api/generatedClient';
import { ToolsService } from '@/src/services/ToolsService';
import { orgApi, authApi, unwrap } from '@/src/api';
import { useAuth } from '@/src/context/AuthContext';
import { secureSetItem } from '@/src/lib/secureStorage';
import { formatApiErrorMessage } from '@/src/utils/formatApiError';
import {
  setCompletingRegistrationSuccess,
} from '@/src/utils/registrationSuccessFlow';

export type AdminAccountMode = 'new' | 'existing';

interface RegistrationContextType {
  orgData: { name: string; shortName: string; type: string };
  setOrgData: (data: { name: string; shortName: string; type: string }) => void;
  setOrganizationType: (type: 'university' | 'corporate') => void;

  adminAccountMode: AdminAccountMode;
  setAdminAccountMode: (mode: AdminAccountMode) => void;

  branding: { primary: string; secondary: string; tertiary: string };
  setBranding: (data: { primary: string; secondary: string; tertiary: string }) => void;

  logo: { uri: string; mimeType?: string; name?: string } | null;
  setLogo: (file: { uri: string; mimeType?: string; name?: string } | null) => void;

  adminData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    repeatPassword: string;
  };
  setAdminData: (data: RegistrationContextType['adminData']) => void;

  submitRegistration: () => Promise<void>;
  isSubmitting: boolean;
}

const RegistrationContext = createContext<RegistrationContextType>({} as RegistrationContextType);

function readOrgIdFromToken(token: string): string | undefined {
  const decoded = jwtDecode<Record<string, string>>(token);
  return decoded.organizationId ?? decoded.OrganizationId ?? decoded.orgId;
}

export const RegistrationProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [orgData, setOrgData] = useState({ name: '', shortName: '', type: 'corporate' });
  const [branding, setBranding] = useState({
    primary: '#3b82f6',
    secondary: '#64748b',
    tertiary: '#eab308',
  });
  const [logo, setLogo] = useState<RegistrationContextType['logo']>(null);
  const [adminAccountMode, setAdminAccountMode] = useState<AdminAccountMode>('new');
  const [adminData, setAdminData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    repeatPassword: '',
  });

  const setOrganizationType = (type: 'university' | 'corporate') => {
    setOrgData((prev) => ({ ...prev, type }));
  };

  const signInToCreatedOrg = async (orgId: string, email: string, password: string) => {
    const loginReq = new LoginRequest();
    loginReq.email = email;
    loginReq.password = password;

    const loginResponse = await unwrap(authApi.login(loginReq));
    if (!loginResponse.accessToken) {
      throw new Error('The server did not return a valid authentication token.');
    }

    let accessToken = loginResponse.accessToken;
    let refreshToken = loginResponse.refreshToken || '';

    await secureSetItem('jwt_token', accessToken);
    await secureSetItem('refresh_token', refreshToken);

    const currentOrgId = readOrgIdFromToken(accessToken);
    if (!currentOrgId || currentOrgId.toLowerCase() !== orgId.toLowerCase()) {
      const switchReq = new SwitchOrgRequest();
      switchReq.organizationId = orgId;
      const switched = await unwrap(authApi.switchOrganization(switchReq));
      if (!switched.accessToken) {
        throw new Error('Failed to start your new organization session.');
      }
      accessToken = switched.accessToken;
      refreshToken = switched.refreshToken ?? refreshToken;
    }

    await login(accessToken, refreshToken);
  };

  const submitRegistration = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let uploadedLogoUrl: string | null = null;
      if (logo?.uri) {
        uploadedLogoUrl = await ToolsService.uploadLogo(logo.uri, {
          mimeType: logo.mimeType,
          fileName: logo.name,
        });
      }

      const extractedDomain = adminData.email.includes('@')
        ? `@${adminData.email.split('@')[1]}`
        : '@general.com';

      const adminFirstName =
        adminAccountMode === 'existing'
          ? adminData.email.split('@')[0] || 'Admin'
          : adminData.firstName;
      const adminLastName = adminAccountMode === 'existing' ? 'Admin' : adminData.lastName;

      const request = new RegisterOrganizationRequest({
        name: orgData.name,
        shortName: orgData.shortName,
        organizationType: orgData.type,
        emailDomain: extractedDomain,
        adminFirstName,
        adminLastName,
        adminEmail: adminData.email,
        password: adminData.password,
        logoUrl: uploadedLogoUrl || undefined,
        primaryColor: branding.primary,
        secondaryColor: branding.secondary,
        tertiaryColor: branding.tertiary,
      });

      const created = await unwrap(orgApi.create(request));

      try {
        setCompletingRegistrationSuccess(true);
        router.replace('/register-flow/registration-success');
        await signInToCreatedOrg(created.id, adminData.email, adminData.password);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (loginError: unknown) {
        setCompletingRegistrationSuccess(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          'Organization created',
          'Your organization is ready. Sign in with your admin account to finish setup.',
          [{ text: 'Go to sign in', onPress: () => router.replace('/login-flow') }],
        );
        console.warn('Post-registration sign-in failed', loginError);
      }
    } catch (error: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Registration Failed', formatApiErrorMessage(error, 'Could not create organization.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RegistrationContext.Provider
      value={{
        orgData,
        setOrgData,
        setOrganizationType,
        adminAccountMode,
        setAdminAccountMode,
        branding,
        setBranding,
        logo,
        setLogo,
        adminData,
        setAdminData,
        submitRegistration,
        isSubmitting,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistrationContext = () => useContext(RegistrationContext);
