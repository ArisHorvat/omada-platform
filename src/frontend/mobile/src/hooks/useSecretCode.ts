import { useState, useEffect } from 'react';
import { useHaptics } from './useHaptics';
import { Alert } from 'react-native';

export const useSecretCode = (secretClicks = 7) => {
  const [count, setCount] = useState(0);
  const [isGodMode, setIsGodMode] = useState(false);
  const { success, light } = useHaptics();

  useEffect(() => {
    if (count > 0) {
      // Reset count if user stops tapping for 1 second
      const timer = setTimeout(() => setCount(0), 1000);
      return () => clearTimeout(timer);
    }
  }, [count]);

  const tap = () => {
    const newCount = count + 1;
    setCount(newCount);
    light(); // Small haptic on every tap

    if (newCount === secretClicks) {
      setIsGodMode(true);
      success(); // Big haptic on unlock
      Alert.alert("🕵️‍♂️ GOD MODE ENABLED", "You are now a developer.");
      setCount(0);
    } else if (newCount > secretClicks - 3) {
      // Tease the user: "3 more steps..."
      console.log(`You are ${secretClicks - newCount} steps away from developer mode.`);
    }
  };

  return { tap, isGodMode };
};