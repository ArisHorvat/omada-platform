import { useEffect, useState } from 'react';
import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';

export const useCalendar = () => {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const createEvent = async (title: string, startDate: Date, endDate: Date, location?: string) => {
    if (!hasPermission) {
      Alert.alert("Permission Required", "Please allow calendar access to save your schedule.");
      return;
    }

    try {
      // Get default calendar source (iOS requires this specifically)
      const defaultCalendarSource = Platform.OS === 'ios'
        ? await getDefaultCalendarSource()
        : { isLocalAccount: true, name: 'Expo Calendar' };

      // Create a dedicated calendar if needed, or find existing one
      // For simplicity, we just look for the default one here
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(c => c.allowsModifications) || calendars[0];

      if (defaultCalendar) {
        await Calendar.createEventAsync(defaultCalendar.id, {
          title,
          startDate,
          endDate,
          location,
          timeZone: 'Europe/Bucharest', // Change to your timezone
        });
        Alert.alert("Success", "Event added to your calendar!");
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Could not save event.");
    }
  };

  return { createEvent, hasPermission };
};

// Helper for iOS
async function getDefaultCalendarSource() {
  const defaultCalendar = await Calendar.getDefaultCalendarAsync();
  return defaultCalendar.source;
}