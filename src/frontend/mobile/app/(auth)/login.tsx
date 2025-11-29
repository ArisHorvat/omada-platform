import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useAuth } from '../../context/AuthContext';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../../config';

export default function LoginScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { setToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      Alert.alert('Login Failed', 'Please enter both email and password.');
      return;
    }

    console.log('[LoginScreen] Attempting login for:', email);
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed. Please check your credentials.');
      }

      const data = await response.json();
      console.log('[LoginScreen] Login successful.');
      await setToken(data.token);
    } 
    catch (error: any) {
        console.error('[LoginScreen] Login error:', error);
        let message = error.message || 'An unexpected error occurred.';
        if (message.includes('Network request') || message.includes('fetch') || message.includes('connection')) {
            message = 'Unable to connect to the server. Please check your internet connection.';
        }
        Alert.alert('Login Error', message);
     } 
    finally {
      setIsLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.subtle,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      marginBottom: 16,
    },
    button: {
      width: '100%',
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      marginTop: 8,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.card,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    footerText: {
        fontSize: 16,
        color: colors.subtle,
    },
    linkText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
        marginLeft: 4,
    }
  }), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor={colors.subtle}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                placeholderTextColor={colors.subtle}
                secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
                <Text style={styles.buttonText}>{isLoading ? 'Logging in...' : 'Login'}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account?</Text>
                <Link href="/register" asChild>
                    <TouchableOpacity>
                        <Text style={styles.linkText}>Register</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    </SafeAreaView>
  );
}
