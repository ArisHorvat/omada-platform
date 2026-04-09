import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
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

export const ClayTimeSpinner: React.FC<ClayTimeSpinnerProps> = ({ value, onChange, minuteIncrement = 1 }) => {
  const colors = useThemeColors();

  const minuteChoices = useMemo(
    () => (minuteIncrement === 15 ? ([0, 15, 30, 45] as const) : (Array.from({ length: 60 }, (_, i) => i) as number[])),
    [minuteIncrement],
  );

  const hoursData = Array.from({ length: 24 }, (_, i) => i);
  const minLen = minuteChoices.length;

  const hourScrollRef = useRef<ScrollView>(null);
  const minScrollRef = useRef<ScrollView>(null);
  const hourFinalizeGen = useRef(0);
  const minFinalizeGen = useRef(0);

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

  useEffect(() => {
    const h = value.getHours();
    const m = minuteIncrement === 15 ? closestQuarter(value.getMinutes()) : value.getMinutes();
    const minuteIndex = (minuteChoices as readonly number[]).indexOf(m);
    const mi = minuteIndex >= 0 ? minuteIndex : 0;
    const t = requestAnimationFrame(() => {
      const initialHourOffset = (24 * MIDDLE_LOOP_INDEX + h) * ITEM_HEIGHT;
      const initialMinOffset = (minLen * MIDDLE_LOOP_INDEX + mi) * ITEM_HEIGHT;
      hourScrollRef.current?.scrollTo({ y: initialHourOffset, animated: false });
      minScrollRef.current?.scrollTo({ y: initialMinOffset, animated: false });
    });
    return () => cancelAnimationFrame(t);
  }, [value.getTime(), minuteIncrement, minLen, minuteChoices]);

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

  /** Read scroll Y synchronously — RN nullifies `nativeEvent` after the event callback returns. */
  const finalizeHourFromOffset = useCallback(
    (scrollY: number) => {
      const offsetY = recenterIfNeeded(scrollY, 24, hourScrollRef);
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const normalizedValue = ((index % 24) + 24) % 24;
      if (selectedHour !== normalizedValue) {
        setSelectedHour(normalizedValue);
        const newDate = new Date(value);
        newDate.setHours(normalizedValue);
        onChange(newDate);
      }
    },
    [onChange, recenterIfNeeded, selectedHour, value],
  );

  const finalizeMinuteFromOffset = useCallback(
    (scrollY: number) => {
      const offsetY = recenterIfNeeded(scrollY, minLen, minScrollRef);
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const normalizedValue = ((index % minLen) + minLen) % minLen;
      const minuteVal = minuteChoices[normalizedValue]!;
      if (selectedMinute !== minuteVal) {
        setSelectedMinute(minuteVal);
        const newDate = new Date(value);
        newDate.setMinutes(minuteVal);
        onChange(newDate);
      }
    },
    [minuteChoices, minLen, onChange, recenterIfNeeded, selectedMinute, value],
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

  const Spacer = () => <View style={{ height: ITEM_HEIGHT }} />;

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
              onScrollEndDrag={queueFinalizeHour}
              onMomentumScrollEnd={queueFinalizeHour}
            >
              <Spacer />
              {Array.from({ length: LOOPS }).map((_, loopIndex) => (
                <View key={`h-${loopIndex}`}>
                  {hoursData.map((h) => (
                    <View key={`${loopIndex}-${h}`} style={styles.itemContainer}>
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
              onScrollEndDrag={queueFinalizeMinute}
              onMomentumScrollEnd={queueFinalizeMinute}
            >
              <Spacer />
              {Array.from({ length: LOOPS }).map((_, loopIndex) => (
                <View key={`m-${loopIndex}`}>
                  {minuteChoices.map((m) => (
                    <View key={`${loopIndex}-${m}`} style={styles.itemContainer}>
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
