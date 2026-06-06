import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import { useEscapeKey, useThemeColors } from '@/src/hooks';

type Props = {
  visible: boolean;
  organizationName?: string | null;
  defaultEmail?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (email: string, password: string) => void;
};

export function SignInToJoinModal({
  visible,
  organizationName,
  defaultEmail = '',
  isSubmitting = false,
  onClose,
  onSubmit,
}: Props) {
  const colors = useThemeColors();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');

  useEscapeKey(visible, onClose);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} disabled={isSubmitting} />
        <ClayView depth={14} puffy={18} color={colors.card} style={styles.card}>
          <View style={styles.header}>
            <Icon name="login" size={28} color={colors.primary} />
            <AppText variant="h3" weight="bold" style={{ marginTop: 12, textAlign: 'center' }}>
              Sign in to join
            </AppText>
            <AppText style={{ color: colors.subtle, textAlign: 'center', marginTop: 8 }}>
              {organizationName
                ? `Use your Omada account to join ${organizationName}.`
                : 'Use your existing Omada account to accept this invite.'}
            </AppText>
          </View>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.subtle}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.subtle}
            secureTextEntry
            style={[
              styles.input,
              { marginTop: 12, borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
            ]}
          />

          <AppButton
            title={isSubmitting ? 'Signing in…' : 'Sign in'}
            onPress={() => onSubmit(email, password)}
            loading={isSubmitting}
            style={{ marginTop: 20 }}
            disabled={!email.trim() || !password}
          />
          <AppButton title="Cancel" variant="outline" onPress={onClose} disabled={isSubmitting} style={{ marginTop: 10 }} />
        </ClayView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
    ...Platform.select({
      web: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0 },
      default: {},
    }),
  },
  card: {
    borderRadius: 24,
    padding: 20,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  header: { alignItems: 'center', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14 },
});
