import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useAuth } from '../../context/AuthContext';

export default function RegistrationSuccessScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { role } = useAuth();

  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: '#22c55e', // Green for success
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 18,
      color: colors.subtle,
      textAlign: 'center',
      marginBottom: 48,
    },
    button: {
      width: '100%',
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.card,
    },
  }), [colors]);

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
            router.replace('/login');
          }
        }}>
          <Text style={styles.buttonText}>{role === 'SuperAdmin' ? 'Done' : 'Go to Login'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
