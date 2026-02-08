import { createContext, useContext } from 'react';
import { SharedValue } from 'react-native-reanimated';

// This context will hold the "Pressed State" (0 = Not Pressed, 1 = Fully Pressed)
export const ClayPressContext = createContext<SharedValue<number> | null>(null);

export const useClayPress = () => useContext(ClayPressContext);