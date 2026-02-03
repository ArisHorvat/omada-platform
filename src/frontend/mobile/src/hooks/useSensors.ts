import { useState, useEffect } from 'react';
import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';

export const useSensors = (onShake?: () => void) => {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (Platform.OS === 'web' || Platform.OS === 'windows') return;

    Accelerometer.setUpdateInterval(100); // Check every 100ms

    const subscription = Accelerometer.addListener(accelerometerData => {
      setData(accelerometerData);
      
      // Basic Shake Detection Logic
      const { x, y, z } = accelerometerData;
      const totalForce = Math.abs(x) + Math.abs(y) + Math.abs(z);
      
      // If force > 1.78 (roughly 2G of force), consider it a shake
      if (totalForce > 1.78 && onShake) {
        onShake();
      }
    });

    return () => subscription && subscription.remove();
  }, [onShake]);

  return { data };
};