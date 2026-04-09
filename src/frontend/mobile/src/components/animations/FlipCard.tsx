import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolate,
  Easing,
} from 'react-native-reanimated';

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
}

export const FlipCard = ({ front, back }: FlipCardProps) => {
  const rotate = useSharedValue(0); // 0 = Front, 1 = Back

  const handlePress = () => {
    rotate.value = withTiming(rotate.value >= 0.5 ? 0 : 1, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  };

  const frontStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(rotate.value, [0, 1], [0, 180]);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateValue}deg` }
      ],
      opacity: rotate.value < 0.5 ? 1 : 0, // Hide when flipped
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(rotate.value, [0, 1], [180, 360]);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateValue}deg` }
      ],
      opacity: rotate.value > 0.5 ? 1 : 0, // Show when flipped
    };
  });

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <Animated.View style={[styles.card, frontStyle]}>
        {front}
      </Animated.View>
      <Animated.View style={[styles.card, styles.cardBack, backStyle]}>
        {back}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220, // Standard ID card height
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden', // Critical for 3D effect
  },
  cardBack: {
    // Back starts rotated
    transform: [{ rotateY: '180deg' }], 
  },
});