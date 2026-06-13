import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';

import { AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';

type Props = {
  onScanToken: (token: string) => void;
  disabled?: boolean;
};

export function DigitalIdScannerCamera({ onScanToken, disabled = false }: Props) {
  const colors = useThemeColors();
  const [permission, requestPermission] = useCameraPermissions();
  const lastTokenRef = useRef<string | null>(null);
  const cooldownRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      void requestPermission();
    }
  }, [permission?.granted, requestPermission]);

  const handleBarcode = useCallback(
    (result: BarcodeScanningResult) => {
      if (disabled || cooldownRef.current) return;
      const value = result.data?.trim();
      if (!value || value === lastTokenRef.current) return;
      lastTokenRef.current = value;
      cooldownRef.current = true;
      onScanToken(value);
      setTimeout(() => {
        cooldownRef.current = false;
      }, 2500);
    },
    [disabled, onScanToken],
  );

  if (!permission) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.card }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.card }]}>
        <AppText variant="body" style={{ color: colors.text, textAlign: 'center', paddingHorizontal: 20 }}>
          Camera access is required to scan Digital IDs.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.frame}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcode}
        onCameraReady={() => setReady(true)}
      />
      {!ready ? (
        <View style={styles.overlayCenter}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}
      <View style={styles.reticle} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 360,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  centered: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 360,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  reticle: {
    position: 'absolute',
    top: '18%',
    left: '14%',
    right: '14%',
    bottom: '18%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
  },
});
