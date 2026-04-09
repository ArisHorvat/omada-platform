import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { useThemeColors } from '@/src/hooks'; 
import { PressScale } from '@/src/components/animations';
import { AppText, AppButton, ClayView, Icon } from '@/src/components/ui';

const { width } = Dimensions.get('window');

export default function LandingScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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

        {/* Primary Action */}
        <View style={styles.buttonContainer}>
          <AppButton 
            title="Create Organization" 
            onPress={() => router.push('/register-flow')}
            variant="primary"
            size="lg"
            rightIcon="arrow-forward"
            style={{ width: '100%' }}
          />
        </View>

        {/* Secondary Action (Login) */}
        <View style={styles.secondaryContainer}>
          <AppText variant="caption" style={{ color: colors.subtle }}>
            Already have an account?
          </AppText>
          <PressScale onPress={() => router.push('/login-flow')}>
            <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginLeft: 6 }}>
              Login
            </AppText>
          </PressScale>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  secondaryContainer: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  }
});