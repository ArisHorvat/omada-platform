import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthContentShell } from '@/src/components/layout';
import { useThemeColors } from '@/src/hooks';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { AppText, IconInput, AppButton, ClayView } from '@/src/components/ui';
import { useResetPasswordLogic } from '../hooks/useResetPasswordLogic';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const {
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
  } = useResetPasswordLogic();

  const showForm = !linkInvalid && status !== 'success';

  return (
    <AuthContentShell style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ClayBackButton absolute variant="plain" onPress={() => router.back()} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            <View style={styles.header}>
              <AppText variant="h1" style={{ marginBottom: 8 }}>
                Reset password
              </AppText>
              <AppText style={{ color: colors.subtle, textAlign: 'center' }}>
                {status === 'success'
                  ? 'You can now sign in with your new password.'
                  : linkInvalid
                    ? 'This reset link is incomplete or invalid.'
                    : `Choose a new password for ${email}.`}
              </AppText>
            </View>

            {statusMessage ? (
              <ClayView
                depth={4}
                puffy={8}
                color={colors.card}
                style={{
                  marginBottom: 16,
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: status === 'success' ? colors.primary : colors.error,
                  backgroundColor: status === 'success' ? `${colors.primary}14` : `${colors.error}14`,
                }}
              >
                <AppText
                  variant="body"
                  weight="medium"
                  style={{ color: status === 'success' ? colors.text : colors.error, textAlign: 'center' }}
                >
                  {statusMessage}
                </AppText>
              </ClayView>
            ) : null}

            <ClayView depth={8} puffy={12} color={colors.card} style={styles.formContainer}>
              {status === 'success' ? (
                <AppButton title="Go to sign in" onPress={goToLogin} variant="primary" size="lg" />
              ) : linkInvalid ? (
                <View style={{ gap: 12 }}>
                  <AppButton title="Request new reset link" onPress={requestNewLink} variant="primary" size="lg" />
                  <AppButton title="Back to sign in" onPress={goToLogin} variant="secondary" size="lg" />
                </View>
              ) : (
                <>
                  <IconInput
                    icon="lock"
                    placeholder="New password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    rightIcon={showNewPassword ? 'visibility-off' : 'visibility'}
                    onRightIconPress={() => setShowNewPassword((v) => !v)}
                    style={{ marginBottom: 16 }}
                  />
                  <IconInput
                    icon="lock"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    rightIcon={showConfirmPassword ? 'visibility-off' : 'visibility'}
                    onRightIconPress={() => setShowConfirmPassword((v) => !v)}
                    style={{ marginBottom: 24 }}
                  />
                  {showForm ? (
                    <AppButton
                      title={isSubmitting ? 'Saving…' : 'Reset password'}
                      onPress={() => void handleSubmit()}
                      loading={isSubmitting}
                      disabled={isSubmitting}
                      variant="primary"
                      size="lg"
                    />
                  ) : null}
                </>
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
    marginBottom: 24,
    alignItems: 'center',
  },
  formContainer: {
    padding: 24,
    borderRadius: 24,
  },
});
