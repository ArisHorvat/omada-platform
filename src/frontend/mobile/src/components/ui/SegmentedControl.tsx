import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { AppText } from './AppText';
import { useThemeColors } from '@/src/hooks';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export const SegmentedControl = ({ options, selectedIndex, onChange }: SegmentedControlProps) => {
  const colors = useThemeColors();
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate width dynamically
  const segmentWidth = containerWidth > 0 ? (containerWidth - 4) / options.length : 0;
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (segmentWidth > 0) {
      // CHANGED: Switched from withSpring to withTiming for a cleaner slide
      translateX.value = withTiming(selectedIndex * segmentWidth, {
        duration: 200, // Fast (200ms)
        easing: Easing.out(Easing.quad), // Smooth deceleration
      });
    }
  }, [selectedIndex, segmentWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View 
      style={[styles.container, { backgroundColor: colors.border, width: '100%' }]}
      onLayout={(e: LayoutChangeEvent) => {
        setContainerWidth(e.nativeEvent.layout.width);
      }}
    >
      {containerWidth > 0 && (
        <>
          <Animated.View
            style={[
              styles.activeBox,
              { 
                width: segmentWidth, 
                backgroundColor: colors.card,
              },
              animatedStyle,
            ]}
          />
          {options.map((option, index) => (
            <TouchableOpacity
              key={option}
              style={[styles.option, { width: segmentWidth }]}
              onPress={() => onChange(index)}
              activeOpacity={0.7}
            >
              <AppText 
                variant="label" 
                style={{ 
                  // Animate the text color too for a premium feel
                  color: selectedIndex === index ? colors.text : colors.subtle,
                  textAlign: 'center',
                  fontSize: 12
                }}
                numberOfLines={1}
              >
                {option}
              </AppText>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    borderRadius: 12,
    flexDirection: 'row',
    padding: 2,
    alignItems: 'center',
  },
  activeBox: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 2,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  option: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});