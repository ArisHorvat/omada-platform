import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Platform,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { PressClay } from '@/src/components/animations';
import { AppText } from './AppText';
import { useThemeColors } from '@/src/hooks';

interface ClayTimeSpinnerProps {
  value: Date;
  onChange: (date: Date) => void;
  /** 15 = only 00, 15, 30, 45 (schedule / room booking). Default 1 = every minute. */
  minuteIncrement?: 1 | 15;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 3;
const LOOPS = 3;
const MIDDLE_LOOP_INDEX = 1;
const IS_WEB = Platform.OS === 'web';
const WEB_SCROLL_END_MS = 120;

export const ClayTimeSpinner: React.FC<ClayTimeSpinnerProps> = ({ value, onChange, minuteIncrement = 1 }) => {
  const colors = useThemeColors();

  const minuteChoices = useMemo(
    () => (minuteIncrement === 15 ? ([0, 15, 30, 45] as const) : (Array.from({ length: 60 }, (_, i) => i) as number[])),
    [minuteIncrement],
  );

  const hoursData = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minLen = minuteChoices.length;

  const hourScrollRef = useRef<ScrollView>(null);
  const minScrollRef = useRef<ScrollView>(null);
  const hourFinalizeGen = useRef(0);
  const minFinalizeGen = useRef(0);
  const hourScrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minScrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closestQuarter = (m: number) => {
    const q = [0, 15, 30, 45];
    return q.reduce((prev, cur) => (Math.abs(cur - m) < Math.abs(prev - m) ? cur : prev));
  };

  const [selectedHour, setSelectedHour] = useState(value.getHours());
  const [selectedMinute, setSelectedMinute] = useState(
    minuteIncrement === 15 ? closestQuarter(value.getMinutes()) : value.getMinutes(),
  );

  useEffect(() => {
    const h = value.getHours();
    const m = minuteIncrement === 15 ? closestQuarter(value.getMinutes()) : value.getMinutes();
    setSelectedHour(h);
    setSelectedMinute(m);
  }, [value.getTime(), minuteIncrement]);

  const hourOffsetFor = useCallback((hour: number) => (24 * MIDDLE_LOOP_INDEX + hour) * ITEM_HEIGHT, []);
  const minuteOffsetFor = useCallback(
    (minute: number) => {
      const minuteIndex = (minuteChoices as readonly number[]).indexOf(minute);
      const mi = minuteIndex >= 0 ? minuteIndex : 0;
      return (minLen * MIDDLE_LOOP_INDEX + mi) * ITEM_HEIGHT;
    },
    [minLen, minuteChoices],
  );

  useEffect(() => {
    const h = value.getHours();
    const m = minuteIncrement === 15 ? closestQuarter(value.getMinutes()) : value.getMinutes();
    const t = requestAnimationFrame(() => {
      hourScrollRef.current?.scrollTo({ y: hourOffsetFor(h), animated: false });
      minScrollRef.current?.scrollTo({ y: minuteOffsetFor(m), animated: false });
    });
    return () => cancelAnimationFrame(t);
  }, [value.getTime(), minuteIncrement, hourOffsetFor, minuteOffsetFor]);

  useEffect(
    () => () => {
      if (hourScrollEndTimer.current) clearTimeout(hourScrollEndTimer.current);
      if (minScrollEndTimer.current) clearTimeout(minScrollEndTimer.current);
    },
    [],
  );

  const recenterIfNeeded = useCallback((scrollY: number, dataLength: number, ref: React.RefObject<ScrollView | null>) => {
    const singleSetHeight = dataLength * ITEM_HEIGHT;
    const middleSetStart = singleSetHeight * MIDDLE_LOOP_INDEX;
    const middleSetEnd = middleSetStart + singleSetHeight;
    if (scrollY < middleSetStart - ITEM_HEIGHT * 4 || scrollY > middleSetEnd + ITEM_HEIGHT * 4) {
      const index = Math.round(scrollY / ITEM_HEIGHT);
      const realValue = ((index % dataLength) + dataLength) % dataLength;
      const newOffset = middleSetStart + realValue * ITEM_HEIGHT;
      ref.current?.scrollTo({ y: newOffset, animated: false });
      return newOffset;
    }
    return scrollY;
  }, []);

  const snapOffset = useCallback((scrollY: number) => Math.round(scrollY / ITEM_HEIGHT) * ITEM_HEIGHT, []);

  const applyHour = useCallback(
    (hour: number) => {
      if (selectedHour === hour) return;
      setSelectedHour(hour);
      const newDate = new Date(value);
      newDate.setHours(hour);
      newDate.setMinutes(selectedMinute);
      onChange(newDate);
    },
    [onChange, selectedHour, selectedMinute, value],
  );

  const applyMinute = useCallback(
    (minute: number) => {
      if (selectedMinute === minute) return;
      setSelectedMinute(minute);
      const newDate = new Date(value);
      newDate.setMinutes(minute);
      onChange(newDate);
    },
    [onChange, selectedMinute, value],
  );

  const finalizeHourFromOffset = useCallback(
    (scrollY: number) => {
      const snapped = snapOffset(scrollY);
      if (Math.abs(snapped - scrollY) > 0.5) {
        hourScrollRef.current?.scrollTo({ y: snapped, animated: !IS_WEB });
      }
      const offsetY = recenterIfNeeded(snapped, 24, hourScrollRef);
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const normalizedValue = ((index % 24) + 24) % 24;
      applyHour(normalizedValue);
    },
    [applyHour, recenterIfNeeded, snapOffset],
  );

  const finalizeMinuteFromOffset = useCallback(
    (scrollY: number) => {
      const snapped = snapOffset(scrollY);
      if (Math.abs(snapped - scrollY) > 0.5) {
        minScrollRef.current?.scrollTo({ y: snapped, animated: !IS_WEB });
      }
      const offsetY = recenterIfNeeded(snapped, minLen, minScrollRef);
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const normalizedValue = ((index % minLen) + minLen) % minLen;
      applyMinute(minuteChoices[normalizedValue]!);
    },
    [applyMinute, minLen, minuteChoices, recenterIfNeeded, snapOffset],
  );

  const queueFinalizeHour = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = e.nativeEvent.contentOffset.y;
      const gen = ++hourFinalizeGen.current;
      requestAnimationFrame(() => {
        if (gen !== hourFinalizeGen.current) return;
        finalizeHourFromOffset(scrollY);
      });
    },
    [finalizeHourFromOffset],
  );

  const queueFinalizeMinute = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = e.nativeEvent.contentOffset.y;
      const gen = ++minFinalizeGen.current;
      requestAnimationFrame(() => {
        if (gen !== minFinalizeGen.current) return;
        finalizeMinuteFromOffset(scrollY);
      });
    },
    [finalizeMinuteFromOffset],
  );

  const handleHourScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!IS_WEB) return;
      const scrollY = e.nativeEvent.contentOffset.y;
      if (hourScrollEndTimer.current) clearTimeout(hourScrollEndTimer.current);
      hourScrollEndTimer.current = setTimeout(() => finalizeHourFromOffset(scrollY), WEB_SCROLL_END_MS);
    },
    [finalizeHourFromOffset],
  );

  const handleMinuteScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!IS_WEB) return;
      const scrollY = e.nativeEvent.contentOffset.y;
      if (minScrollEndTimer.current) clearTimeout(minScrollEndTimer.current);
      minScrollEndTimer.current = setTimeout(() => finalizeMinuteFromOffset(scrollY), WEB_SCROLL_END_MS);
    },
    [finalizeMinuteFromOffset],
  );

  const jumpToHour = useCallback(
    (hour: number) => {
      applyHour(hour);
      hourScrollRef.current?.scrollTo({ y: hourOffsetFor(hour), animated: true });
    },
    [applyHour, hourOffsetFor],
  );

  const jumpToMinute = useCallback(
    (minute: number) => {
      applyMinute(minute);
      minScrollRef.current?.scrollTo({ y: minuteOffsetFor(minute), animated: true });
    },
    [applyMinute, minuteOffsetFor],
  );

  const Spacer = () => <View style={{ height: ITEM_HEIGHT }} />;

  const webScrollStyle = IS_WEB
    ? ({
        scrollSnapType: 'y mandatory',
        overflowY: 'scroll',
      } as const)
    : undefined;

  const webItemSnapStyle = IS_WEB
    ? ({
        scrollSnapAlign: 'center',
      } as const)
    : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.column}>
          <View style={styles.spinnerWrapper}>
            <View style={[styles.highlight, { backgroundColor: colors.background, borderColor: colors.border + '40' }]} />

            <ScrollView
              ref={hourScrollRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              snapToAlignment="start"
              decelerationRate="fast"
              scrollEventThrottle={16}
              nestedScrollEnabled
              style={webScrollStyle}
              onScroll={handleHourScroll}
              onScrollEndDrag={queueFinalizeHour}
              onMomentumScrollEnd={queueFinalizeHour}
            >
              <Spacer />
              {Array.from({ length: LOOPS }).map((_, loopIndex) => (
                <View key={`h-${loopIndex}`}>
                  {hoursData.map((h) => (
                    <PressClay key={`${loopIndex}-${h}`} onPress={() => jumpToHour(h)}>
                      <View style={[styles.itemContainer, webItemSnapStyle]}>
                        <AppText
                          weight={selectedHour === h ? 'bold' : 'regular'}
                          style={{
                            fontSize: selectedHour === h ? 20 : 17,
                            color: selectedHour === h ? colors.primary : colors.text,
                            opacity: selectedHour === h ? 1 : 0.4,
                          }}
                        >
                          {h.toString().padStart(2, '0')}
                        </AppText>
                      </View>
                    </PressClay>
                  ))}
                </View>
              ))}
              <Spacer />
            </ScrollView>
          </View>
        </View>

        <AppText weight="bold" style={{ fontSize: 20, color: colors.subtle, top: 2 }}>
          :
        </AppText>

        <View style={styles.column}>
          <View style={styles.spinnerWrapper}>
            <View style={[styles.highlight, { backgroundColor: colors.background, borderColor: colors.border + '40' }]} />
            <ScrollView
              ref={minScrollRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              snapToAlignment="start"
              decelerationRate="fast"
              scrollEventThrottle={16}
              nestedScrollEnabled
              style={webScrollStyle}
              onScroll={handleMinuteScroll}
              onScrollEndDrag={queueFinalizeMinute}
              onMomentumScrollEnd={queueFinalizeMinute}
            >
              <Spacer />
              {Array.from({ length: LOOPS }).map((_, loopIndex) => (
                <View key={`m-${loopIndex}`}>
                  {minuteChoices.map((m) => (
                    <PressClay key={`${loopIndex}-${m}`} onPress={() => jumpToMinute(m)}>
                      <View style={[styles.itemContainer, webItemSnapStyle]}>
                        <AppText
                          weight={selectedMinute === m ? 'bold' : 'regular'}
                          style={{
                            fontSize: selectedMinute === m ? 20 : 17,
                            color: selectedMinute === m ? colors.primary : colors.text,
                            opacity: selectedMinute === m ? 1 : 0.4,
                          }}
                        >
                          {m.toString().padStart(2, '0')}
                        </AppText>
                      </View>
                    </PressClay>
                  ))}
                </View>
              ))}
              <Spacer />
            </ScrollView>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 200, alignSelf: 'center', paddingVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 },
  column: { width: 60, alignItems: 'center' },
  spinnerWrapper: { height: ITEM_HEIGHT * VISIBLE_ITEMS, width: '100%', overflow: 'hidden' },
  itemContainer: { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: -1,
  },
});
