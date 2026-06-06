import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  BackHandler,
  Platform,
  Modal,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useWebMainPaneAnchor } from '@/src/context/WebMainPaneContext';
import { useEscapeKey, useThemeColors } from '@/src/hooks';
import type { WebOverlayAnchor } from '@/src/hooks/usePaneOverlayAnchor';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number; // Optional specific height
  /** Raise when stacking sheets (e.g. picker over filter). Default 100. */
  zIndexBase?: number;
  /** Extra bottom padding (e.g. floating tab bar) in addition to safe area. */
  contentInsetBottom?: number;
  /** On web, limit backdrop + sheet to this pane (e.g. schedule main column). */
  webAnchor?: WebOverlayAnchor | null;
  /** Inner content padding (default 20). Use a smaller value for dense filter sheets. */
  contentPadding?: number;
}

export const BottomSheet = ({
  isVisible,
  onClose,
  children,
  height,
  zIndexBase = 100,
  contentInsetBottom = 0,
  webAnchor = null,
  contentPadding = 20,
}: BottomSheetProps) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const defaultWebAnchor = useWebMainPaneAnchor();
  const resolvedWebAnchor = webAnchor ?? defaultWebAnchor;

  useEscapeKey(isVisible, onClose);

  const activeHeight = height || SCREEN_HEIGHT * 0.5;
  const translateY = useSharedValue(isVisible ? 0 : activeHeight);
  const activeHeightShared = useSharedValue(activeHeight);

  const scrollTo = useCallback((destination: number) => {
    'worklet';
    translateY.value = withTiming(destination, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  useEffect(() => {
    activeHeightShared.value = activeHeight;
    if (IS_WEB) return;
    if (isVisible) {
      scrollTo(0);
    } else {
      scrollTo(activeHeight);
    }
  }, [isVisible, activeHeight, scrollTo, activeHeightShared]);

  useEffect(() => {
    if (!IS_WEB || typeof document === 'undefined') return;
    if (!isVisible || resolvedWebAnchor) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isVisible, resolvedWebAnchor]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isVisible) {
        onClose();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [isVisible, onClose]);

  const context = useSharedValue({ y: 0 });

  const gesture = Gesture.Pan()
    .enabled(!IS_WEB)
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      const h = activeHeightShared.value;
      const next = event.translationY + context.value.y;
      translateY.value = Math.min(Math.max(next, 0), h);
    })
    .onEnd(() => {
      const h = activeHeightShared.value;
      const threshold = Math.min(56, h * 0.22);
      if (translateY.value > threshold) {
        runOnJS(onClose)();
      } else {
        scrollTo(0);
      }
    });

  const rBottomSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: IS_WEB ? 0 : translateY.value }],
  }));

  const rBackdropStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isVisible ? 0.5 : 0, { duration: IS_WEB ? 150 : 300 }),
    pointerEvents: isVisible ? 'auto' : 'none',
  }));

  const webPaneHostStyle =
    IS_WEB && resolvedWebAnchor
      ? ({
          position: 'fixed' as const,
          left: resolvedWebAnchor.left,
          top: resolvedWebAnchor.top,
          width: resolvedWebAnchor.width,
          height: resolvedWebAnchor.height,
          zIndex: zIndexBase,
        } satisfies ViewStyle)
      : undefined;

  const sheetHeight = resolvedWebAnchor
    ? Math.min(activeHeight, resolvedWebAnchor.height * 0.92)
    : activeHeight;

  const sheetBody = (
    <>
      <View style={styles.handleContainer}>
        <View style={[styles.handle, { backgroundColor: colors.subtle || '#ccc' }]} />
      </View>
      <View
        style={{
          flex: 1,
          minHeight: 0,
          padding: contentPadding,
          paddingBottom: contentPadding + insets.bottom + contentInsetBottom,
        }}
      >
        {children}
      </View>
    </>
  );

  const overlay = (
    <View
      style={webPaneHostStyle ?? (IS_WEB ? styles.webHost : undefined)}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.backdrop,
          webPaneHostStyle ? StyleSheet.absoluteFillObject : IS_WEB && styles.webFixed,
          rBackdropStyle,
          {
            zIndex: webPaneHostStyle ? 0 : zIndexBase,
            elevation: Platform.OS === 'android' ? 20 : 0,
          },
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" />
      </Animated.View>

      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.sheet,
            webPaneHostStyle ? null : IS_WEB && styles.webFixedSheet,
            {
              backgroundColor: colors.card,
              height: sheetHeight,
              zIndex: webPaneHostStyle ? 1 : zIndexBase + 1,
              elevation: Platform.OS === 'android' ? 28 : 12,
            },
            rBottomSheetStyle,
          ]}
        >
          {sheetBody}
        </Animated.View>
      </GestureDetector>
    </View>
  );

  if (IS_WEB) {
    return (
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        {overlay}
      </Modal>
    );
  }

  return overlay;
};

const webFixedBase = {
  position: 'fixed' as const,
  left: 0,
  right: 0,
} satisfies ViewStyle;

const styles = StyleSheet.create({
  webHost: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  webFixed: {
    ...webFixedBase,
    top: 0,
    bottom: 0,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  webFixedSheet: {
    ...webFixedBase,
    bottom: 0,
    maxHeight: '92vh',
  },
  handleContainer: { alignItems: 'center', paddingVertical: 10 },
  handle: { width: 40, height: 5, borderRadius: 2.5 },
});
