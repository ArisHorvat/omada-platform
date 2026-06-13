import { useEffect } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import { Alert, Platform } from 'react-native';

export const useScreenshotWarning = () => {
  useEffect(() => {
    if (Platform.OS === 'web') return; // Not supported on web

    const subscription = ScreenCapture.addScreenshotListener(() => {
      Alert.alert(
        'Screenshot detected',
        'This pass is personal. Do not share screenshots of your Digital ID.',
      );
    });

    return () => {
      subscription.remove();
    };
  }, []);
};