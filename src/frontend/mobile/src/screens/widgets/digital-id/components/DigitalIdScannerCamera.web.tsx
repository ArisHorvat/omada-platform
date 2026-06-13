import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppButton, AppText, IconInput } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { DigitalIdClaySection } from './DigitalIdClaySection';

type Props = {
  onScanToken: (token: string) => void;
  disabled?: boolean;
};

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

export function DigitalIdScannerCamera({ onScanToken, disabled = false }: Props) {
  const colors = useThemeColors();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTokenRef = useRef<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [detectorSupported, setDetectorSupported] = useState(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    const Detector = (globalThis as { BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike })
      .BarcodeDetector;
    if (!Detector) {
      setDetectorSupported(false);
      return;
    }

    setDetectorSupported(true);
    const detector = new Detector({ formats: ['qr_code'] });
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const scan = async () => {
          if (cancelled || disabled || !video.videoWidth) {
            rafRef.current = requestAnimationFrame(() => void scan());
            return;
          }
          try {
            const codes = await detector.detect(video);
            const value = codes[0]?.rawValue?.trim();
            if (value && value !== lastTokenRef.current) {
              lastTokenRef.current = value;
              onScanToken(value);
            }
          } catch {
            // ignore frame errors
          }
          rafRef.current = requestAnimationFrame(() => void scan());
        };

        void scan();
      } catch {
        setCameraError('Could not access the camera on this browser.');
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [disabled, onScanToken, stopCamera]);

  if (detectorSupported && !cameraError) {
    return (
      <View style={styles.wrap}>
        <View style={styles.frame}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} style={styles.video as never} playsInline muted />
          <View style={styles.reticle} pointerEvents="none" />
        </View>
        <View style={styles.webHint}>
          <ActivityIndicator size="small" color={colors.primary} />
          <AppText variant="caption" style={{ color: colors.subtle, marginLeft: 8 }}>
            Point at the member&apos;s QR code
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <DigitalIdClaySection title="Verify code">
        <AppText variant="body" style={{ color: colors.subtle, lineHeight: 22, marginBottom: 14 }}>
          {cameraError
            ? cameraError
            : 'QR camera scanning is not supported in this browser. Paste the token from the member\u2019s pass.'}
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
          QR token
        </AppText>
        <IconInput
          value={manualToken}
          onChangeText={setManualToken}
          placeholder="Paste JWT from scanned QR"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </DigitalIdClaySection>
      <AppButton
        title="Verify pasted code"
        onPress={() => {
          if (manualToken.trim()) onScanToken(manualToken.trim());
        }}
        disabled={disabled || !manualToken.trim()}
        style={styles.verifyButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 12,
  },
  frame: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 360,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
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
  webHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButton: {
    marginTop: 2,
  },
});
