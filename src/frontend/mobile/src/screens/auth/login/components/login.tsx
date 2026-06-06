import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { AuthContentShell } from '@/src/components/layout';
import { useThemeColors } from '@/src/hooks';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { AppText, IconInput, AppButton, ClayView } from '@/src/components/ui';
import { useLoginLogic } from '../hooks/useLoginLogic';
import SelectOrganization from './select-organization';
import { setCompletingLoginOrgPick } from '@/src/utils/loginOrgPick';

// 1. Define the Validation Schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [showPassword, setShowPassword] = useState(false);
  const params = useLocalSearchParams<{ joinCode?: string | string[] }>();
  const pendingJoinCode = (() => {
    const raw = params.joinCode;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value?.trim().toUpperCase() || undefined;
  })();
  
  const {
    handleLogin,
    tryBiometricSessionRestore,
    isLoading,
    showOrgSelector,
    userOrgs,
    handleOrgSelect,
    setShowOrgSelector,
  } = useLoginLogic(pendingJoinCode);

  useEffect(() => {
    void tryBiometricSessionRestore();
  }, [tryBiometricSessionRestore]);

  // 2. Setup React Hook Form
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  // 3. Submit Handler
  const onSubmit = async (data: LoginFormValues) => {
    // You'll need to update handleLogin in useLoginLogic to accept (email, password)
    await handleLogin(data.email, data.password);
  };

  return (
    <AuthContentShell style={{ flex: 1 }}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ClayBackButton absolute variant="plain" onPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          
          <View style={styles.header}>
            <AppText variant="h1" style={{ marginBottom: 8 }}>
              {pendingJoinCode ? 'Sign in to join' : 'Welcome Back'}
            </AppText>
            <AppText style={{ color: colors.subtle }}>
              {pendingJoinCode
                ? 'Use your existing account, then we will add you to the organization.'
                : 'Sign in to continue to Omada'}
            </AppText>
          </View>

          <ClayView depth={8} puffy={12} color={colors.card} style={styles.formContainer}>
            
            {/* EMAIL CONTROLLER */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: 16 }}>
                  <IconInput
                    icon="mail"
                    placeholder="Email Address"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={errors.email ? { borderColor: colors.error, borderWidth: 1 } : {}}
                  />
                  {errors.email && (
                    <Text style={{ color: colors.error, fontSize: 12, marginTop: 4, marginLeft: 12 }}>
                      {errors.email.message}
                    </Text>
                  )}
                </View>
              )}
            />
            
            {/* PASSWORD CONTROLLER */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: 24 }}>
                  <IconInput
                    icon="lock"
                    placeholder="Password"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    secureTextEntry={!showPassword}
                    rightIcon={showPassword ? 'visibility-off' : 'visibility'}
                    onRightIconPress={() => setShowPassword((v) => !v)}
                    style={errors.password ? { borderColor: colors.error, borderWidth: 1 } : {}}
                  />
                  {errors.password && (
                    <Text style={{ color: colors.error, fontSize: 12, marginTop: 4, marginLeft: 12 }}>
                      {errors.password.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <TouchableOpacity 
              onPress={() => router.push('/(auth)/login-flow')}
              style={{ alignSelf: 'flex-end', marginBottom: 24 }}
            >
              <AppText variant="caption" style={{ color: colors.primary }}>Forgot Password?</AppText>
            </TouchableOpacity>

            <AppButton
              title={isSubmitting ? "Signing In..." : "Sign In"}
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              variant="primary"
              size="lg"
            />
          </ClayView>

          <View style={styles.footer}>
            <AppText style={{ color: colors.subtle, textAlign: 'center' }}>
              New to Omada?{' '}
            </AppText>
            <TouchableOpacity onPress={() => router.push('/register-flow')}>
              <AppText weight="bold" style={{ color: colors.primary, textAlign: 'center' }}>
                Create an organization
              </AppText>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      <SelectOrganization
        visible={showOrgSelector}
        organizations={userOrgs}
        onSelect={handleOrgSelect}
        onCancel={() => {
          setCompletingLoginOrgPick(false);
          setShowOrgSelector(false);
        }}
        isLoading={isSubmitting || isLoading}
        mode="postLogin"
        title="Select organization"
        subtitle="Choose which workspace you want to sign in to."
      />
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
    alignItems: 'center'
  },
  formContainer: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 32
  },
  footer: {
    alignItems: 'center',
    gap: 4
  }
});