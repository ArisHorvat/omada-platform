import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  Easing,
  runOnJS 
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const COLORS = ['#FFC700', '#FF0000', '#2E3192', '#41BBC7', '#7303C0'];

interface ParticleProps {
  index: number;
}

const Particle = ({ index }: ParticleProps) => {
  // Random start position and trajectory
  const randomX = Math.random() * 400 - 200; // -200 to 200
  const randomY = Math.random() * -500 - 200; // Shoot UP
  const randomRotate = Math.random() * 360;
  
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Physics simulation
    x.value = withTiming(randomX, { duration: 1500, easing: Easing.out(Easing.quad) });
    y.value = withTiming(randomY + 400, { duration: 1500, easing: Easing.out(Easing.quad) }); // Fall down eventually
    rotate.value = withTiming(randomRotate + 720, { duration: 1500 });
    opacity.value = withDelay(1000, withTiming(0, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rotate.value}deg` }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View 
      style={[
        styles.particle, 
        style, 
        { backgroundColor: COLORS[index % COLORS.length] }
      ]} 
    />
  );
};

export const ConfettiExplosion = ({ trigger }: { trigger: number }) => {
  if (trigger === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {[...Array(30)].map((_, i) => (
        <Particle key={`${trigger}-${i}`} index={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  particle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
  },
});