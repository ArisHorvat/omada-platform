import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import { AppButton, AppText, Icon } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { promptLocalAuthentication } from '@/src/utils/promptLocalAuthentication';

interface GradesBiometricGateProps {
  children: React.ReactNode;
}

/**
 * Requires Face ID / Touch ID (or device passcode fallback) to view sensitive academic data.
 * If biometrics are unavailable or not enrolled, content is shown without prompting.
 */
export function GradesBiometricGate({ children }: GradesBiometricGateProps) {
  const colors = useThemeColors();
  const [phase, setPhase] = useState<'checking' | 'locked' | 'unlocked'>('checking');
  const [errorText, setErrorText] = useState<string | null>(null);

  const tryUnlock = useCallback(async () => {
    setErrorText(null);
    setPhase('checking');
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) {
      setPhase('unlocked');
      return;
    }

    const ok = await promptLocalAuthentication({
      promptMessage: 'Authenticate to view your grades',
      fallbackLabel: 'Use device passcode',
      cancelLabel: 'Cancel',
      biometricsOnly: true,
    });
    if (ok) {
      setPhase('unlocked');
      return;
    }

    setErrorText('Authentication failed. Please try again.');
    setPhase('locked');
  }, []);

  useEffect(() => {
    void tryUnlock();
  }, [tryUnlock]);

  if (phase === 'checking') {
    return (
      <View
        style={{
          flex: 1,
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (phase === 'locked') {
    return (
      <View
        style={{
          flex: 1,
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: colors.background,
          padding: 24,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 520,
            backgroundColor: colors.card,
            borderRadius: 24,
            paddingVertical: 26,
            paddingHorizontal: 16,
            alignItems: 'center',
          }}
        >
          <Icon name="lock" size={48} color={colors.primary} />
          <AppText variant="h3" weight="bold" style={{ marginTop: 16, textAlign: 'center' }}>
            Grades are protected
          </AppText>
          <AppText variant="body" style={{ marginTop: 8, textAlign: 'center', color: colors.subtle }}>
            Use Face ID, Touch ID, or your passcode to continue.
          </AppText>

          {errorText ? (
            <AppText
              variant="caption"
              style={{ marginTop: 12, textAlign: 'center', color: colors.error, paddingHorizontal: 6 }}
            >
              {errorText}
            </AppText>
          ) : null}

          <AppButton
            title="Try again"
            onPress={() => void tryUnlock()}
            style={{ marginTop: 20, alignSelf: 'stretch' }}
          />
        </View>
      </View>
    );
  }

  return <>{children}</>;
}
