import React from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks';
import { AppText, IconInput, AppButton, GlassView } from '@/src/components/ui';
import { useLoginLogic } from '../hooks/useLoginLogic';
import SelectOrganization from './select-organization';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  
  const { 
    email, setEmail, 
    password, setPassword, 
    isLoading, 
    handleLogin,
    // Org Selection Props
    showOrgSelector,
    userOrgs,
    handleOrgSelect,
    setShowOrgSelector
  } = useLoginLogic();

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          
          {/* Header Section */}
          <View style={styles.header}>
            <AppText variant="h1" style={{ marginBottom: 8 }}>Welcome Back</AppText>
            <AppText style={{ color: colors.subtle }}>Sign in to continue to Omada</AppText>
          </View>

          {/* Form Section */}
          <GlassView intensity={15} style={styles.formContainer}>
            <IconInput
              icon="mail"
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ marginBottom: 16 }}
            />
            
            <IconInput
              icon="lock"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={{ marginBottom: 24 }}
            />

            <TouchableOpacity 
              onPress={() => router.push('/(auth)/login-flow')}
              style={{ alignSelf: 'flex-end', marginBottom: 24 }}
            >
              <AppText variant="caption" style={{ color: colors.primary }}>Forgot Password?</AppText>
            </TouchableOpacity>

            <AppButton
              title={isLoading ? "Signing In..." : "Sign In"}
              onPress={handleLogin}
              loading={isLoading}
              variant="primary"
              size="lg"
            />
          </GlassView>

          {/* Footer */}
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

      {/* Organization Selector Modal */}
      <SelectOrganization 
        visible={showOrgSelector}
        organizations={userOrgs}
        onSelect={handleOrgSelect}
        onCancel={() => setShowOrgSelector(false)}
        isLoading={isLoading}
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