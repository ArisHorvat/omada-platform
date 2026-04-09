import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useThemeColors } from '@/src/hooks';
import { AppText, IconInput, AppButton, ClayView } from '@/src/components/ui';
import { useLoginLogic } from '../hooks/useLoginLogic';
import SelectOrganization from './select-organization';

// 1. Define the Validation Schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  
  const {
    handleLogin,
    tryBiometricSessionRestore,
    showOrgSelector,
    userOrgs,
    handleOrgSelect,
    setShowOrgSelector,
  } = useLoginLogic();

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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          
          <View style={styles.header}>
            <AppText variant="h1" style={{ marginBottom: 8 }}>Welcome Back</AppText>
            <AppText style={{ color: colors.subtle }}>Sign in to continue to Omada</AppText>
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
                    secureTextEntry
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
            <AppText style={{ color: colors.subtle }}>Don't have an organization?</AppText>
            <TouchableOpacity onPress={() => router.push('/(auth)/register-flow')}>
              <AppText weight="bold" style={{ color: colors.primary, marginTop: 4 }}>
                Create New Organization
              </AppText>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      <SelectOrganization 
        visible={showOrgSelector}
        organizations={userOrgs}
        onSelect={handleOrgSelect}
        onCancel={() => setShowOrgSelector(false)}
        isLoading={isSubmitting} // Use RHF submitting state
      />
    </KeyboardAvoidingView>
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