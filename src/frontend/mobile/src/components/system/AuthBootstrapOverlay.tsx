import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

/** Full-screen overlay while fonts, auth, or navigation are not ready. Does not block the router Slot. */
export function AuthBootstrapOverlay() {
  return (
    <View style={styles.overlay} pointerEvents="auto">
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
