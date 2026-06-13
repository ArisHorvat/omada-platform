import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  type ImageResizeMode,
  type ImageStyle,
  type StyleProp,
} from 'react-native';
import { Image, type ImageProps as ExpoImageProps, type ImageContentFit } from 'expo-image';

import { Icon } from '@/src/components/ui/Icon';

interface ProgressiveImageProps extends Omit<ExpoImageProps, 'source' | 'style' | 'placeholder'> {
  source?: ExpoImageProps['source'];
  style?: StyleProp<ImageStyle>;
  thumbnailSource?: ExpoImageProps['source'];
  /** Shown while loading and when the image fails to load. */
  fallback?: React.ReactNode;
  borderColor?: string;
  borderWidth?: number;
  resizeMode?: ImageResizeMode;
}

function resizeModeToContentFit(mode?: ImageResizeMode | string): ImageContentFit {
  switch (mode) {
    case 'contain':
      return 'contain';
    case 'stretch':
      return 'fill';
    case 'center':
      return 'none';
    default:
      return 'cover';
  }
}

const webSharpImageStyle = Platform.select<ImageStyle>({
  web: { imageRendering: 'auto' },
  default: {},
});

export const ProgressiveImage = ({
  thumbnailSource,
  source,
  style,
  fallback,
  borderColor,
  borderWidth = 0,
  resizeMode = 'cover',
  onLoad,
  onError,
  ...imageProps
}: ProgressiveImageProps) => {
  const [error, setError] = useState(false);
  const contentFit = resizeModeToContentFit(resizeMode);

  const uri =
    source && typeof source === 'object' && !Array.isArray(source) && 'uri' in source && source.uri != null
      ? String(source.uri)
      : '';
  const isLocalAsset = typeof source === 'number';

  useEffect(() => {
    setError(false);
  }, [uri, isLocalAsset]);

  const showImage = isLocalAsset ? !error : !error && uri.length > 0;

  const flatStyle = StyleSheet.flatten(style) as ImageStyle | undefined;
  const borderStyle =
    borderWidth > 0 && borderColor
      ? { borderWidth, borderColor, borderRadius: flatStyle?.borderRadius }
      : null;

  const defaultFallback = (
    <View style={[styles.fallbackInner, StyleSheet.absoluteFill]}>
      <Icon name="image" size={28} color="rgba(128,128,128,0.85)" />
    </View>
  );

  return (
    <View style={[styles.container, style, borderStyle]}>
      {showImage ? (
        <Image
          {...imageProps}
          source={source ?? null}
          placeholder={thumbnailSource ?? undefined}
          placeholderContentFit={contentFit}
          style={[styles.fill, webSharpImageStyle]}
          contentFit={contentFit}
          transition={300}
          cachePolicy="memory-disk"
          onLoad={onLoad}
          onError={(event) => {
            setError(true);
            onError?.(event);
          }}
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
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  fallbackInner: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
});
