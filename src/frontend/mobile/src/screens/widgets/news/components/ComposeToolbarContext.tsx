import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { NewsComposeToolbar } from './NewsComposeToolbar';

export type ComposeToolbarHandlers = {
  onText: () => void;
  onH1: () => void;
  onH2: () => void;
  onBullet: () => void;
  onNumbered: () => void;
  onQuote: () => void;
  onDivider: () => void;
  onBold: () => void;
  onItalic: () => void;
  onLink: () => void;
  onImage: () => void;
};

/** `body` = article block editor; hide chrome for headline, link sheet, etc. */
export type EditorChromeMode = 'body' | 'headline' | 'modal';

type ComposeToolbarContextValue = {
  keyboardInset: number;
  focusedBlockId: string | null;
  setFocusedBlockId: (id: string | null) => void;
  editorChromeMode: EditorChromeMode;
  setEditorChromeMode: (mode: EditorChromeMode) => void;
  setToolbarHandlers: (h: ComposeToolbarHandlers | null) => void;
};

const ComposeToolbarContext = createContext<ComposeToolbarContextValue | null>(null);

function useDebouncedKeyboardHeight(debounceMs: number) {
  const [height, setHeight] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<number | null>(null);

  useEffect(() => {
    const flush = () => {
      if (pending.current === null) return;
      setHeight(pending.current);
      pending.current = null;
    };

    const onShow = (e: { endCoordinates: { height: number } }) => {
      const h = e.endCoordinates.height;
      pending.current = h;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, debounceMs);
    };
    const onHide = () => {
      pending.current = 0;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, debounceMs);
    };

    const s = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      onShow,
    );
    const h = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      onHide,
    );
    return () => {
      s.remove();
      h.remove();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [debounceMs]);

  return height;
}

export function ComposeToolbarProvider({ children }: { children: React.ReactNode }) {
  const keyboardInset = useDebouncedKeyboardHeight(80);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [handlers, setHandlers] = useState<ComposeToolbarHandlers | null>(null);
  const [editorChromeMode, setEditorChromeMode] = useState<EditorChromeMode>('body');

  const setToolbarHandlers = useCallback((h: ComposeToolbarHandlers | null) => {
    setHandlers(h);
  }, []);

  const value = useMemo(
    () => ({
      keyboardInset,
      focusedBlockId,
      setFocusedBlockId,
      editorChromeMode,
      setEditorChromeMode,
      setToolbarHandlers,
    }),
    [keyboardInset, focusedBlockId, editorChromeMode, setToolbarHandlers],
  );

  return (
    <ComposeToolbarContext.Provider value={value}>
      <View style={{ flex: 1, position: 'relative' }}>
        {children}
        <ComposeToolbarOverlayInner handlers={handlers} />
      </View>
    </ComposeToolbarContext.Provider>
  );
}

function ComposeToolbarOverlayInner({ handlers }: { handlers: ComposeToolbarHandlers | null }) {
  const ctx = useContext(ComposeToolbarContext);
  const open = useSharedValue(0);

  if (!ctx) return null;
  const { keyboardInset, focusedBlockId, editorChromeMode } = ctx;
  const visible =
    keyboardInset > 0 && !!focusedBlockId && !!handlers && editorChromeMode === 'body';

  useEffect(() => {
    open.value = withTiming(visible ? 1 : 0, { duration: visible ? 220 : 180 });
  }, [visible]);

  const barAnimated = useAnimatedStyle(() => ({
    opacity: open.value,
    transform: [{ translateY: (1 - open.value) * 16 }],
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]}
      collapsable={false}
    >
      <Animated.View
        style={[
          { paddingBottom: keyboardInset },
          barAnimated,
          !visible && { pointerEvents: 'none' as const },
        ]}
        pointerEvents="box-none"
      >
        <NewsComposeToolbar
          visible={visible}
          onText={() => handlers?.onText()}
          onH1={() => handlers?.onH1()}
          onH2={() => handlers?.onH2()}
          onBullet={() => handlers?.onBullet()}
          onNumbered={() => handlers?.onNumbered()}
          onQuote={() => handlers?.onQuote()}
          onDivider={() => handlers?.onDivider()}
          onBold={() => handlers?.onBold()}
          onItalic={() => handlers?.onItalic()}
          onLink={() => handlers?.onLink()}
          onImage={() => handlers?.onImage()}
        />
      </Animated.View>
    </View>
  );
}

export function useOptionalComposeToolbar(): ComposeToolbarContextValue | null {
  return useContext(ComposeToolbarContext);
}
