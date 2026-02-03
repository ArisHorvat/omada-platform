import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { useHaptics } from './useHaptics';

export const useClipboard = () => {
  const [hasCopied, setHasCopied] = useState(false);
  const { success } = useHaptics();

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    success(); // Haptic feedback
    setHasCopied(true);

    // Reset status after 2 seconds
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };

  return { copyToClipboard, hasCopied };
};