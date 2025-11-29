import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Link } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-color';

export default function LandingScreen() {
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    main: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      maxWidth: 400,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
    },
    title: {
      fontSize: 60,
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
      marginBottom: 16,
    },
    buttonPrimary: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    buttonTextPrimary: {
      color: colors.onPrimary,
    },
    secondaryActionContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
    },
    secondaryActionText: {
      fontSize: 16,
      color: colors.subtle,
    },
    secondaryActionLink: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
      marginLeft: 4,
    }
  }), [colors]);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
        <View style={styles.container}>
            <View style={styles.main}>
                <View style={styles.iconContainer}>
                    <MaterialIcons name="school" size={60} color={colors.card} />
                </View>
                <Text style={styles.title}>Omada</Text>
                <Text style={styles.subtitle}>
                    Your all-in-one platform for university and company management.
                </Text>
                
                <Link href="/register" asChild>
                    <TouchableOpacity style={[styles.button, styles.buttonPrimary]}>
                    <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Create Organization</Text>
                    </TouchableOpacity>
                </Link>
                <View style={styles.secondaryActionContainer}>
                    <Text style={styles.secondaryActionText}>Already have an account?</Text>
                    <Link href="/login" asChild>
                        <TouchableOpacity>
                            <Text style={styles.secondaryActionLink}>Login</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </View>
    </SafeAreaView>
  );
}
