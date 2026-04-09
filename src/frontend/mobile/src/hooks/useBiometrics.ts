import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { promptLocalAuthentication } from '@/src/utils/promptLocalAuthentication';

export const useBiometrics = () => {
  const [isCompatible, setIsCompatible] = useState(false);
  const [biometryType, setBiometryType] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsCompatible(compatible);
      
      if (compatible) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        // Determine if it's FaceID (2) or TouchID (1)
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometryType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometryType('Touch ID');
        }
      }
    })();
  }, []);

  const authenticate = async (): Promise<boolean> => {
    return promptLocalAuthentication({
      promptMessage: 'Unlock Omada',
      fallbackLabel: 'Use device passcode',
      cancelLabel: 'Cancel',
    });
  };

  return { isCompatible, biometryType, authenticate };
};