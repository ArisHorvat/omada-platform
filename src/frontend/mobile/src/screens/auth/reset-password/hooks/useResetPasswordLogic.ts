import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { authApi, unwrap } from '@/src/api';
import { ResetPasswordRequest } from '@/src/api/generatedClient';
import { formatApiErrorMessage } from '@/src/utils/formatApiError';
import { validatePassword } from '@/src/utils/passwordValidation';

function normalizeParam(value: string | string[] | undefined): string {
  if (value == null) return '';
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw == null || raw === 'null' || raw === 'undefined') return '';
  const trimmed = String(raw).trim();
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

export type ResetPasswordStatus = 'idle' | 'success' | 'error';

export const useResetPasswordLogic = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[]; token?: string | string[] }>();
  const email = useMemo(() => normalizeParam(params.email), [params.email]);
  const token = useMemo(() => normalizeParam(params.token), [params.token]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<ResetPasswordStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const linkInvalid = !email || !token;

  const handleSubmit = async () => {
    if (linkInvalid) {
      const message = 'Use the complete reset link from your email, or request a new one from the sign-in screen.';
      setStatus('error');
      setStatusMessage(message);
      Alert.alert('Invalid link', message);
      return;
    }
    if (!newPassword || !confirmPassword) {
      const message = 'Please fill in both password fields.';
      setStatus('error');
      setStatusMessage(message);
      Alert.alert('Error', message);
      return;
    }
    if (newPassword !== confirmPassword) {
      const message = 'Passwords do not match.';
      setStatus('error');
      setStatusMessage(message);
      Alert.alert('Error', message);
      return;
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setStatus('error');
      setStatusMessage(passwordError);
      Alert.alert('Error', passwordError);
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');
    setStatusMessage(null);
    try {
      await unwrap(
        authApi.resetPassword(
          new ResetPasswordRequest({
            email,
            token,
            newPassword,
          })
        )
      );
      setStatus('success');
      setStatusMessage('Your password was updated. Sign in with your new password.');
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error: unknown) {
      const message = formatApiErrorMessage(error, 'The link may have expired. Request a new reset email.');
      setStatus('error');
      setStatusMessage(message);
      Alert.alert('Could not reset password', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToLogin = () => router.replace('/(auth)/login-flow');
  const requestNewLink = () => router.replace('/(auth)/forgot-password');

  return {
    email,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isSubmitting,
    status,
    statusMessage,
    linkInvalid,
    handleSubmit,
    goToLogin,
    requestNewLink,
  };
};
