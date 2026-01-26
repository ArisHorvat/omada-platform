import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { createStyles } from '../styles/landing.styles';

export default function LandingScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
                
                <Link href="/register-flow" asChild>
                    <TouchableOpacity style={[styles.button, styles.buttonPrimary]}>
                    <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Create Organization</Text>
                    </TouchableOpacity>
                </Link>

                <View style={styles.secondaryActionContainer}>
                    <Text style={styles.secondaryActionText}>Already have an account?</Text>
                    <Link href="/login-flow" asChild>
                        <TouchableOpacity>
                            <Text style={styles.secondaryActionLink}>Login</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>

            <Link href="/status-project" asChild>
                <TouchableOpacity style={styles.tutorialButton}>
                    <Text style={[styles.buttonText, { color: colors.subtle, fontSize: 16, textDecorationLine: 'underline' }]}>Status Project</Text>
                </TouchableOpacity>
            </Link>
        </View>
    </SafeAreaView>
  );
}
