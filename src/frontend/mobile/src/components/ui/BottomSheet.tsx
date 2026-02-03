import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Pressable, BackHandler } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS, 
  withTiming 
} from 'react-native-reanimated';
import { useThemeColors } from '@/src/hooks';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number; // Optional specific height
}

export const BottomSheet = ({ isVisible, onClose, children, height }: BottomSheetProps) => {
  const colors = useThemeColors();
  
  // Calculate height: Default to 50% of screen if not specified
  const activeHeight = height || SCREEN_HEIGHT * 0.5;
  const translateY = useSharedValue(SCREEN_HEIGHT);

  const scrollTo = useCallback((destination: number) => {
    'worklet';
    translateY.value = withSpring(destination, { damping: 15 });
  }, []);

  useEffect(() => {
    if (isVisible) {
      scrollTo(-activeHeight);
    } else {
      scrollTo(SCREEN_HEIGHT);
    }
  }, [isVisible]);

  // Handle hardware back button on Android
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isVisible) {
        onClose();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [isVisible]);

  const context = useSharedValue({ y: 0 });
  
  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      // Allow dragging down only (positive values relative to start)
      translateY.value = Math.max(event.translationY + context.value.y, -activeHeight);
    })
    .onEnd(() => {
      if (translateY.value > -activeHeight + 50) {
        // Dragged down enough? Close it.
        runOnJS(onClose)();
      } else {
        // Snap back up
        scrollTo(-activeHeight);
      }
    });

  const rBottomSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const rBackdropStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isVisible ? 0.5 : 0),
    pointerEvents: isVisible ? 'auto' : 'none',
  }));

  if (!isVisible && translateY.value === SCREEN_HEIGHT) return null;

  return (
    <>
      {/* Dark Backdrop */}
      <Animated.View style={[styles.backdrop, rBackdropStyle]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <GestureDetector gesture={gesture}>
        <Animated.View 
          style={[
            styles.sheet, 
            { backgroundColor: colors.card, height: activeHeight }, 
            rBottomSheetStyle
          ]}
        >
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.subtle || '#ccc' }]} />
          </View>
          <View style={{ flex: 1, padding: 20 }}>
             {children}
          </View>
        </Animated.View>
      </GestureDetector>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    zIndex: 100,
  },
  sheet: {
    position: 'absolute',
    top: SCREEN_HEIGHT,
    left: 0,
    right: 0,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    zIndex: 101,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  handleContainer: { alignItems: 'center', paddingVertical: 10 },
  handle: { width: 40, height: 5, borderRadius: 2.5 },
});