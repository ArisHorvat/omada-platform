import React, { useCallback } from 'react';
import { StyleSheet, View, ImageBackground, StyleProp, ViewStyle } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  withSpring, 
  withDelay, 
  withTiming, 
  useAnimatedStyle, 
  runOnJS 
} from 'react-native-reanimated';
import { Icon } from '../ui/Icon';
import * as Haptics from 'expo-haptics';

interface DoubleTapProps {
  children: React.ReactNode;
  onLike?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const DoubleTapHeart = ({ children, onLike, style }: DoubleTapProps) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const showHeart = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (onLike) onLike();

    // Reset
    scale.value = 0;
    opacity.value = 1;

    // Pop In
    scale.value = withSpring(1, { damping: 15 });
    
    // Fade Out after delay
    opacity.value = withDelay(500, withTiming(0, { duration: 300 }));
  }, [onLike]);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onStart(() => {
      runOnJS(showHeart)();
    });

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.max(scale.value, 0) }], // Avoid negative scale
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={doubleTap}>
      <View style={style}>
        {children}
        
        {/* Floating Heart Overlay */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
           <View style={styles.center}>
             <Animated.View style={[styles.heart, heartStyle]}>
               <Icon name="favorite" size={80} color="#fff" />
             </Animated.View>
           </View>
        </View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heart: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
});