import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { AuthContentShell } from '@/src/components/layout';
import { useThemeColors } from '@/src/hooks'; 
import { PressScale } from '@/src/components/animations';
import { AppText, AppButton, ClayView, Icon } from '@/src/components/ui';

export default function LandingScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <AuthContentShell centered style={{ backgroundColor: colors.background }}>
      <StatusBar style={colors.text === '#111827' ? 'dark' : 'light'} />

      <View style={styles.contentContainer}>
        
        <ClayView
          depth={8}
          puffy={20}
          color={colors.card}
          style={[styles.iconContainer, { borderColor: colors.border + '40', borderWidth: 2 }]}
        >
          <Icon name="school" size={60} color={colors.primary} />
        </ClayView>
        
        {/* Title with LineHeight fix */}
        <AppText variant="h1" style={[styles.title, { color: colors.text }]}>
          Omada
        </AppText>
        
        <AppText variant="body" style={[styles.subtitle, { color: colors.subtle }]}>
          Your all-in-one platform for university and company management.
        </AppText>

        <View style={styles.buttonContainer}>
          <AppButton
            title="Create Organization"
            onPress={() => router.push('/register-flow')}
            variant="primary"
            size="lg"
            rightIcon="arrow-forward"
            style={{ width: '100%' }}
          />
          <AppButton
            title="Sign In"
            onPress={() => router.push('/login-flow')}
            variant="outline"
            size="lg"
            style={{ width: '100%', marginTop: 12 }}
          />
        </View>

      </View>

      {/* Footer Link */}
      <View style={styles.footer}>
        <PressScale onPress={() => router.push('/design-system')}>
          <AppText variant="caption" style={{ color: colors.subtle, textDecorationLine: 'underline' }}>
            Design System
          </AppText>
        </PressScale>
      </View>
    </AuthContentShell>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    width: '100%',
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    borderWidth: 1,
  },
  title: {
    fontSize: 52,
    lineHeight: 60, // Prevents clipping
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 48,
    maxWidth: 300,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 340,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  }
});