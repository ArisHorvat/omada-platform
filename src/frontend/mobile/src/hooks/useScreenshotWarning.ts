import { useEffect } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import { Alert, Platform } from 'react-native';

export const useScreenshotWarning = () => {
  useEffect(() => {
    if (Platform.OS === 'web') return; // Not supported on web

    const subscription = ScreenCapture.addScreenshotListener(() => {
      Alert.alert(
        "Screenshot Detected", 
        "Please note that this digital ID is for personal use only."
      );
    });

    return () => {
      subscription.remove();
    };
  }, []);
};