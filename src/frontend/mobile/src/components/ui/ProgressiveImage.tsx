import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, ImageProps, ImageStyle, StyleProp, Platform } from 'react-native';

import { Icon } from '@/src/components/ui/Icon';

interface ProgressiveImageProps extends ImageProps {
  style?: StyleProp<ImageStyle>;
  thumbnailSource?: ImageProps['source'];
  /** Shown while loading and when the image fails to load. */
  fallback?: React.ReactNode;
  borderColor?: string;
  borderWidth?: number;
}

export const ProgressiveImage = ({
  thumbnailSource,
  source,
  style,
  fallback,
  borderColor,
  borderWidth = 0,
  onLoad,
  onError,
  ...props
}: ProgressiveImageProps) => {
  const [imageOpacity] = useState(new Animated.Value(0));
  const [error, setError] = useState(false);

  const uri =
    source && typeof source === 'object' && 'uri' in source && source.uri != null
      ? String(source.uri)
      : '';
  const isLocalAsset = typeof source === 'number';

  useEffect(() => {
    setError(false);
    imageOpacity.setValue(0);
  }, [uri, imageOpacity, isLocalAsset]);

  const onImageLoad = (e: Parameters<NonNullable<ImageProps['onLoad']>>[0]) => {
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    onLoad?.(e);
  };

  const handleError = (e: Parameters<NonNullable<ImageProps['onError']>>[0]) => {
    setError(true);
    onError?.(e);
  };

  const defaultFallback = (
    <View style={[styles.fallbackInner, StyleSheet.absoluteFill]}>
      <Icon name="image" size={28} color="rgba(128,128,128,0.85)" />
    </View>
  );

  const showImage = isLocalAsset ? !error : !error && uri.length > 0;

  return (
    <View
      style={[
        styles.container,
        style,
        borderWidth > 0 && borderColor
          ? { borderWidth, borderColor, borderRadius: (style as ImageStyle)?.borderRadius }
          : null,
      ]}
    >
      {thumbnailSource && showImage && (
        <Animated.Image
          {...props}
          source={thumbnailSource}
          style={[StyleSheet.absoluteFill, style]}
          blurRadius={2}
        />
      )}

      {showImage ? (
        <Animated.Image
          {...props}
          source={source}
          style={[
            styles.imageOverlay,
            style,
            { opacity: imageOpacity },
          ]}
          onLoad={onImageLoad}
          onError={handleError}
        />
      ) : (
        fallback ?? defaultFallback
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  fallbackInner: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
});
