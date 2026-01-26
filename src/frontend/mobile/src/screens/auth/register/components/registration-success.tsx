import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { useAuth } from '@/src/context/AuthContext';
import { createStyles } from '@/src/screens/auth/register/styles/registration-success.styles';

export default function RegistrationSuccessScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { role } = useAuth();

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="check" size={60} color="#fff" />
        </View>
        <Text style={styles.title}>Registration Successful!</Text>
        <Text style={styles.subtitle}>
          Your organization has been created. You can now log in with your admin credentials.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => {
          if (role === 'SuperAdmin') {
            router.replace('/admin-dashboard');
          } else {
            router.replace('/login-flow');
          }
        }}>
          <Text style={styles.buttonText}>{role === 'SuperAdmin' ? 'Done' : 'Go to Login'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
