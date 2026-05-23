import React from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContentShell } from '@/src/components/layout';
import { useThemeColors } from '@/src/hooks';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { AppText, ClayView, AppButton, Icon } from '@/src/components/ui';
import { useJoinOrganizationLogic } from '../hooks/useJoinOrganizationLogic';

export default function JoinOrganizationScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const {
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
  } = useJoinOrganizationLogic();

  return (
    <AuthContentShell style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ClayBackButton absolute onPress={() => router.back()} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            <View style={styles.header}>
              <AppText variant="h1" style={{ marginBottom: 8 }}>
                Join organization
              </AppText>
              <AppText style={{ color: colors.subtle, textAlign: 'center' }}>
                Enter the code from your invite email or organization admin.
              </AppText>
            </View>

            <ClayView depth={8} puffy={12} color={colors.card} style={styles.formContainer}>
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
                ORGANIZATION CODE
              </AppText>
              <TextInput
                value={inviteCode}
                onChangeText={(t) => setInviteCode(t.toUpperCase())}
                onBlur={onInviteCodeBlur}
                placeholder="e.g. AB12CD34"
                placeholderTextColor={colors.subtle}
                autoCapitalize="characters"
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                ]}
              />

              {isLoadingPreview && (
                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 8 }}>
                  Checking code…
                </AppText>
              )}
              {previewName && !isLoadingPreview && (
                <ClayView
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: colors.primaryContainer,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <Icon name="business" size={28} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <AppText weight="bold">{previewName}</AppText>
                    <AppText variant="caption" style={{ color: colors.subtle }}>
                      You will join this organization
                    </AppText>
                  </View>
                </ClayView>
              )}

              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 20, marginBottom: 8 }}>
                YOUR DETAILS
              </AppText>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={colors.subtle}
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                ]}
              />
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor={colors.subtle}
                style={[
                  styles.input,
                  { marginTop: 12, borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                ]}
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={colors.subtle}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[
                  styles.input,
                  { marginTop: 12, borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                ]}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password (min. 6 characters)"
                placeholderTextColor={colors.subtle}
                secureTextEntry
                style={[
                  styles.input,
                  { marginTop: 12, borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                ]}
              />

              <AppButton
                title={isSubmitting ? 'Joining…' : 'Create account & join'}
                onPress={handleJoin}
                loading={isSubmitting}
                variant="primary"
                size="lg"
                style={{ marginTop: 24 }}
              />
            </ClayView>

            <View style={styles.footer}>
              <AppText style={{ color: colors.subtle }}>Already have an account?</AppText>
              <TouchableOpacity onPress={() => router.replace('/login-flow')}>
                <AppText weight="bold" style={{ color: colors.primary, marginTop: 4 }}>
                  Sign in
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthContentShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 32, alignItems: 'center' },
  formContainer: { padding: 24, borderRadius: 24, marginBottom: 24 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14 },
  footer: { alignItems: 'center' },
});
