import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthContentShell } from '@/src/components/layout';
import { useThemeColors } from '@/src/hooks';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { AppText, IconInput, AppButton, ClayView } from '@/src/components/ui';
import { useForgotPasswordLogic } from '../hooks/useForgotPasswordLogic';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { email, setEmail, isSubmitting, submitted, handleSubmit, goToLogin } = useForgotPasswordLogic();

  return (
    <AuthContentShell style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ClayBackButton absolute variant="plain" onPress={() => router.back()} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            <View style={styles.header}>
              <AppText variant="h1" style={{ marginBottom: 8 }}>
                Forgot password
              </AppText>
              <AppText style={{ color: colors.subtle, textAlign: 'center' }}>
                {submitted
                  ? 'If an account exists for that email, we sent a reset link. Check your inbox (and spam folder).'
                  : 'Enter your email and we will send you a link to reset your password.'}
              </AppText>
            </View>

            <ClayView depth={8} puffy={12} color={colors.card} style={styles.formContainer}>
              {!submitted ? (
                <>
                  <IconInput
                    icon="mail"
                    placeholder="Email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{ marginBottom: 24 }}
                  />
                  <AppButton
                    title={isSubmitting ? 'Sending…' : 'Send reset link'}
                    onPress={() => void handleSubmit()}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    variant="primary"
                    size="lg"
                  />
                </>
              ) : (
                <AppButton title="Back to sign in" onPress={goToLogin} variant="primary" size="lg" />
              )}
            </ClayView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthContentShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  formContainer: {
    padding: 24,
    borderRadius: 24,
  },
});
