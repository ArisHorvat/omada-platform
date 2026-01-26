import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { FormInput } from '@/src/components/FormInput';
import { createStyles } from '../styles/login.styles';
import { useLoginLogic } from '../hooks/useLoginLogic';

export default function LoginScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { email, setEmail, password, setPassword, isLoading, handleLogin } = useLoginLogic();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            <FormInput label="Email" placeholder="Email" value={email} onChangeText={setEmail} placeholderTextColor={colors.subtle} autoCapitalize="none" styles={styles} />
            <FormInput label="Password" placeholder="Password" value={password} onChangeText={setPassword} placeholderTextColor={colors.subtle} secureTextEntry={true} styles={styles} />

            <View style={{ height: 16 }} />

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
                <Text style={styles.buttonText}>{isLoading ? 'Logging in...' : 'Login'}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account?</Text>
                <Link href="/register-flow" asChild>
                    <TouchableOpacity><Text style={styles.linkText}>Register</Text></TouchableOpacity>
                </Link>
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
