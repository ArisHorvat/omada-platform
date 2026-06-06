import React from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';

export type ClayHorizontalScrollProps = ScrollViewProps;

/** Native / mobile: standard horizontal ScrollView. */
export function ClayHorizontalScroll({
  style,
  contentContainerStyle,
  showsHorizontalScrollIndicator,
  showsVerticalScrollIndicator,
  ...rest
}: ClayHorizontalScrollProps) {
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator ?? false}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator ?? false}
      style={style}
      contentContainerStyle={contentContainerStyle}
      {...rest}
    />
  );
}

