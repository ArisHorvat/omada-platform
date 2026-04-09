import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

type Props = { children: React.ReactNode };

type JailMonkeyApi = {
  isJailBroken: () => boolean;
  hookDetected: () => boolean;
};

function getJailMonkey(): JailMonkeyApi | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('jail-monkey').default as JailMonkeyApi;
  } catch {
    return null;
  }
}

function isDeviceCompromised(): boolean {
  if (__DEV__) return false;
  const JM = getJailMonkey();
  if (!JM) return false;
  try {
    return JM.isJailBroken() || JM.hookDetected();
  } catch {
    return false;
  }
}

export function JailbreakGuard({ children }: Props) {
  const blocked = useMemo(() => isDeviceCompromised(), []);

  if (blocked) {
    return (
      <View style={styles.screen} accessibilityRole="alert">
        <Text style={styles.title}>Security violation</Text>
        <Text style={styles.body}>
          This app cannot run on modified or jailbroken devices. Please use an unmodified device to
          continue.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#cbd5e1',
    textAlign: 'center',
    maxWidth: 360,
  },
});
