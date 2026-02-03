import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const useHaptics = () => {
  const isWeb = Platform.OS === 'web' || Platform.OS === 'windows' || Platform.OS === 'macos';

  const light = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const medium = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const success = () => {
    if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const error = () => {
    if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const selection = () => {
    if (!isWeb) Haptics.selectionAsync();
  };

  return { light, medium, success, error, selection };
};