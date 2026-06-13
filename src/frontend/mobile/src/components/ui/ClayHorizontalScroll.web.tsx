import React, { useCallback, useRef } from 'react';
import { StyleSheet, View, type ScrollViewProps, type ViewStyle } from 'react-native';

export type ClayHorizontalScrollProps = ScrollViewProps;

/**
 * Web: native overflow scroll (no custom scrollbar). Wheel over the strip scrolls horizontally.
 */
export function ClayHorizontalScroll({
  children,
  style,
  contentContainerStyle,
}: ClayHorizontalScrollProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const flattenedContent = StyleSheet.flatten(contentContainerStyle) as ViewStyle | undefined;

  const onWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 1) return;

    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

    if (delta === 0) return;

    const next = el.scrollLeft + delta;
    const clamped = Math.max(0, Math.min(maxScroll, next));
    if (clamped === el.scrollLeft) return;

    el.scrollLeft = clamped;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    <div
      ref={scrollerRef}
      className="omada-h-scroll-hidden"
      onWheel={onWheel}
      style={{
        width: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        ...(StyleSheet.flatten(style) as React.CSSProperties),
      }}
    >
      <View style={[{ flexDirection: 'row', alignItems: 'stretch' }, flattenedContent]}>
        {children}
      </View>
    </div>
  );
}
