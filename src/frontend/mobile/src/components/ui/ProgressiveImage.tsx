import React, { useState } from 'react';
import { View, StyleSheet, Animated, ImageProps, ImageStyle, StyleProp } from 'react-native';
import { useThemeColors } from '@/src/hooks';

interface ProgressiveImageProps extends ImageProps {
  style?: StyleProp<ImageStyle>;
  thumbnailSource?: ImageProps['source']; // Optional low-res image
}

export const ProgressiveImage = ({ 
  thumbnailSource, 
  source, 
  style, 
  ...props 
}: ProgressiveImageProps) => {
  const colors = useThemeColors();
  const [imageAnimated] = useState(new Animated.Value(0));

  const onImageLoad = () => {
    Animated.timing(imageAnimated, {
      toValue: 1,
      duration: 500, // Fade in over 500ms
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.border }, style]}>
      {/* 1. Thumbnail (or Placeholder) */}
      {/* If provided, this stays visible behind the main image until opacity covers it */}
      {thumbnailSource && (
        <Animated.Image
          {...props}
          source={thumbnailSource}
          style={[StyleSheet.absoluteFill, style]}
          blurRadius={2} // Blur the thumbnail for a cool effect
        />
      )}

      {/* 2. Main High-Res Image */}
      <Animated.Image
        {...props}
        source={source}
        style={[styles.imageOverlay, style, { opacity: imageAnimated }]}
        onLoad={onImageLoad}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});