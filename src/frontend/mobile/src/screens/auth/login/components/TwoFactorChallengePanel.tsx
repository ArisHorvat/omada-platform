import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

import { useThemeColors } from '@/src/hooks';
import { AppText, IconInput, AppButton, ClayView } from '@/src/components/ui';
import type { TwoFactorChallenge } from '../hooks/useLoginLogic';

type Props = {
  challenge: TwoFactorChallenge;
  code: string;
  onCodeChange: (value: string) => void;
  error: string | null;
  info: string | null;
  isLoading: boolean;
  resendBusy: boolean;
  onVerify: () => void;
  onResend: () => void;
  onBack: () => void;
};

export default function TwoFactorChallengePanel({
  challenge,
  code,
  onCodeChange,
  error,
  info,
  isLoading,
  resendBusy,
  onVerify,
  onResend,
  onBack,
}: Props) {
  const colors = useThemeColors();
  const [showCode, setShowCode] = useState(false);

  return (
    <ClayView depth={8} puffy={12} color={colors.card} style={styles.formContainer}>
      {error ? (
        <View
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 12,
            backgroundColor: `${colors.error}18`,
            borderWidth: 1,
            borderColor: colors.error,
          }}
        >
          <AppText variant="body" style={{ color: colors.error }}>
            {error}
          </AppText>
        </View>
      ) : null}

      {info ? (
        <View
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 12,
            backgroundColor: `${colors.primary}14`,
            borderWidth: 1,
            borderColor: colors.primary,
          }}
        >
          <AppText variant="body" style={{ color: colors.text }}>
            {info}
          </AppText>
        </View>
      ) : null}

      <AppText variant="caption" style={{ marginBottom: 8, color: colors.subtle }}>
        Code sent to {challenge.email}
      </AppText>

      <IconInput
        icon="security"
        placeholder="6-digit code"
        value={code}
        onChangeText={(text) => onCodeChange(text.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        secureTextEntry={!showCode}
        rightIcon={showCode ? 'visibility-off' : 'visibility'}
        onRightIconPress={() => setShowCode((v) => !v)}
        style={{ marginBottom: 16 }}
      />

      <AppButton
        title={isLoading ? 'Verifying…' : 'Verify and sign in'}
        onPress={onVerify}
        loading={isLoading}
        disabled={isLoading}
        variant="primary"
        size="lg"
        style={{ marginBottom: 12 }}
      />

      <AppButton
        title={resendBusy ? 'Sending…' : 'Resend code'}
        onPress={onResend}
        loading={resendBusy}
        disabled={resendBusy || isLoading}
        variant="secondary"
        size="lg"
        style={{ marginBottom: 12 }}
      />

      <TouchableOpacity onPress={onBack} style={{ alignSelf: 'center', paddingVertical: 8 }}>
        <AppText variant="caption" style={{ color: colors.primary }}>
          Back to password
        </AppText>
      </TouchableOpacity>
    </ClayView>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 32,
  },
});
