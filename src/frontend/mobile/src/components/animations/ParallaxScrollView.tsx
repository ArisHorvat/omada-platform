import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { 
  useAnimatedRef, 
  useAnimatedStyle, 
  useScrollViewOffset, 
  interpolate 
} from 'react-native-reanimated';

interface ParallaxScrollViewProps {
  children: React.ReactNode;
  headerImage: React.ReactNode; // The Image component
  headerHeight?: number;
}

export const ParallaxScrollView = ({ children, headerImage, headerHeight = 250 }: ParallaxScrollViewProps) => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-headerHeight, 0, headerHeight],
            [-headerHeight / 2, 0, headerHeight * 0.75]
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-headerHeight, 0, headerHeight],
            [2, 1, 1]
          ),
        },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.ScrollView ref={scrollRef} scrollEventThrottle={16}>
        <Animated.View style={[styles.header, { height: headerHeight }, headerAnimatedStyle]}>
          {headerImage}
        </Animated.View>
        <View style={styles.content}>
          {children}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { width: '100%', overflow: 'hidden' },
  content: { flex: 1, backgroundColor: '#fff' }, // Ensure background covers the image when scrolling up
});