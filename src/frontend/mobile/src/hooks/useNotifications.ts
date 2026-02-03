import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications look when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true, 
  }),
});

export const useNotifications = () => {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions missing!');
      }
    })();
  }, []);

  const scheduleReminder = async (title: string, body: string, secondsDelay: number) => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { 
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsDelay,
        repeats: false
      },
    });
  };

  return { scheduleReminder };
};