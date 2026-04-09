import * as LocalAuthentication from 'expo-local-authentication';

export type LocalAuthPromptOptions = {
  promptMessage: string;
  /** Shown on iOS when biometric fails (device passcode). */
  fallbackLabel?: string;
  cancelLabel?: string;
  /**
   * When true, uses iOS {@link LAPolicyDeviceOwnerAuthenticationWithBiometrics} so Face ID / Touch ID
   * is required first (not the device passcode sheet alone). Prefer this for sensitive screens like grades.
   */
  biometricsOnly?: boolean;
};

/**
 * Runs the native Face ID / Touch ID sheet when available; allows device passcode as fallback.
 * Returns false if hardware missing, not enrolled, user cancels, or prompt fails.
 */
export async function promptLocalAuthentication(
  options: LocalAuthPromptOptions
): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return false;

    const fallbackLabel =
      options.biometricsOnly === true ? '' : options.fallbackLabel ?? 'Use device passcode';

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: options.promptMessage,
      fallbackLabel,
      cancelLabel: options.cancelLabel ?? 'Cancel',
      // Avoid the "biometrics-only" policy that can cause immediate failure on iOS.
      // Empty fallbackLabel hides the "Use Passcode" button, while Face ID is still attempted first.
      disableDeviceFallback: options.biometricsOnly ?? false,
    });

    return result.success === true;
  } catch {
    return false;
  }
}
