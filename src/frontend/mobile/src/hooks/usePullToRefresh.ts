import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';

export const usePullToRefresh = (callback?: () => Promise<void>) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    // 1. Start Haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRefreshing(true);

    try {
      // 2. Run the actual data fetching (if provided)
      if (callback) {
        await callback();
      } else {
        // Mock delay if no callback provided
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } finally {
      // 3. Success Haptic & Reset
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRefreshing(false);
    }
  }, [callback]);

  return { refreshing, onRefresh };
};