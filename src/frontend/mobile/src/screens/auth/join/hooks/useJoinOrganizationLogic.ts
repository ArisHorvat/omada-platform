import { useCallback, useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { authApi, orgApi, unwrap } from '@/src/api';
import { useAuth } from '@/src/context/AuthContext';
import { JoinOrganizationRequest } from '@/src/api/generatedClient';

export const useJoinOrganizationLogic = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const { login } = useAuth();

  const [inviteCode, setInviteCode] = useState((params.code as string) ?? '');
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loadPreview = useCallback(async (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (normalized.length < 4) {
      setPreviewName(null);
      return;
    }
    setIsLoadingPreview(true);
    try {
      const preview = await unwrap(orgApi.getInvitePreview(normalized));
      setPreviewName(preview.name);
    } catch {
      setPreviewName(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    if (params.code) {
      void loadPreview(String(params.code));
    }
  }, [params.code, loadPreview]);

  const onInviteCodeBlur = () => {
    void loadPreview(inviteCode);
  };

  const handleJoin = async () => {
    setIsSubmitting(true);
    try {
      const request = new JoinOrganizationRequest({
        inviteCode: inviteCode.trim().toUpperCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });

      const response = await unwrap(authApi.joinOrganization(request));
      if (!response.accessToken) {
        throw new Error('Missing access token after join.');
      }

      await login(response.accessToken, response.refreshToken);
      router.replace('/(app)/(tabs)/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not join organization.';
      Alert.alert('Could not join', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    inviteCode,
    setInviteCode,
    previewName,
    isLoadingPreview,
    isSubmitting,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    onInviteCodeBlur,
    handleJoin,
  };
};
