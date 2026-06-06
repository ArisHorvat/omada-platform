import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { AuthContentShell } from '@/src/components/layout';
import { useThemeColors } from '@/src/hooks';
import { PressScale } from '@/src/components/animations';
import { AppText, AppButton, ClayView, Icon } from '@/src/components/ui';

export default function LandingScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const titleSize = compact ? 40 : 48;

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
          <Icon name="school" size={compact ? 52 : 60} color={colors.primary} />
        </ClayView>

        <AppText
          variant="display"
          weight="extra"
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: titleSize,
              lineHeight: Math.round(titleSize * 1.2),
            },
          ]}
        >
          Omada
        </AppText>

        <AppText variant="body" style={[styles.subtitle, { color: colors.subtle }]}>
          Your all-in-one platform for university and company management.
        </AppText>

        <View style={styles.buttonContainer}>
          <AppButton
            title="Create organization"
            onPress={() => router.push('/register-flow')}
            variant="primary"
            size="lg"
            rightIcon="arrow-forward"
            style={styles.fullWidthButton}
          />
          <AppButton
            title="Sign in"
            onPress={() => router.push('/login-flow')}
            variant="outline"
            size="lg"
            style={styles.fullWidthButton}
          />
        </View>

        <PressScale onPress={() => router.push('/join')} style={styles.joinPress}>
          <AppText variant="body" style={[styles.joinText, { color: colors.subtle }]}>
            Joining an existing team?{' '}
            <AppText variant="body" weight="bold" style={{ color: colors.primary }}>
              Use your invite code
            </AppText>
          </AppText>
        </PressScale>
      </View>
    </AuthContentShell>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    paddingHorizontal: 28,
    alignItems: 'center',
    paddingVertical: 24,
  },
  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
    alignSelf: 'stretch',
    includeFontPadding: false,
  },
  subtitle: {
    textAlign: 'center',
    alignSelf: 'stretch',
    marginBottom: 36,
    maxWidth: 320,
    lineHeight: 24,
    paddingHorizontal: 4,
  },
  buttonContainer: {
    width: '100%',
    alignSelf: 'stretch',
    gap: 12,
  },
  fullWidthButton: {
    width: '100%',
    alignSelf: 'stretch',
  },
  joinPress: {
    marginTop: 28,
    paddingHorizontal: 8,
    alignSelf: 'stretch',
  },
  joinText: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
