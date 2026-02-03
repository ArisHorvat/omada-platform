import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    // Check initial state
    Network.getNetworkStateAsync().then((state) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? true);
    });
    
    // Note: Expo doesn't have a live listener hook out of the box without 'NetInfo' library.
    // If you need live updates, install: npx expo install @react-native-community/netinfo
    // For now, this checks on mount.
  }, []);

  return { isConnected, isInternetReachable };
};