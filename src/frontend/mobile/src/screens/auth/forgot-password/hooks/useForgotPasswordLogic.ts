import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { authApi, unwrap } from '@/src/api';
import { ForgotPasswordRequest } from '@/src/api/generatedClient';
import { formatApiErrorMessage } from '@/src/utils/formatApiError';

export const useForgotPasswordLogic = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await unwrap(authApi.forgotPassword(new ForgotPasswordRequest({ email: trimmed })));
      setSubmitted(true);
    } catch (error: unknown) {
      Alert.alert('Could not send reset link', formatApiErrorMessage(error, 'Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToLogin = () => router.replace('/(auth)/login-flow');

  return {
    email,
    setEmail,
    isSubmitting,
    submitted,
    handleSubmit,
    goToLogin,
  };
};
