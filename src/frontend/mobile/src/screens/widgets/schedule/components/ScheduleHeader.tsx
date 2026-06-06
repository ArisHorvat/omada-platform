import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { startOfDay } from 'date-fns';
import { AppText, ClayView, Icon } from '@/src/components/ui';
import { ClayDatePicker } from '@/src/components/ui/ClayDatePicker';
import { DateStrip } from '@/src/components/ui/DateStrip';
import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { useEscapeKey, useThemeColors } from '@/src/hooks';

interface Props {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  /** Hidden on wide tab shell (sidebar nav is primary). */
  showBackButton?: boolean;
}

export const ScheduleHeader: React.FC<Props> = ({
  selectedDate,
  onDateSelect,
  showBackButton = true,
}) => {
  const colors = useThemeColors();
  const [showCalendar, setShowCalendar] = useState(false);

  const closeCalendar = () => setShowCalendar(false);
  const openCalendar = () => setShowCalendar(true);

  useEscapeKey(showCalendar, closeCalendar);

  const handleDatePick = (date: Date) => {
    onDateSelect(startOfDay(date));
    closeCalendar();
  };

  const monthLabel = selectedDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={{ backgroundColor: colors.background, zIndex: 10 }}>
      <ScreenHeader
        title="Schedule"
        showBack={showBackButton}
        right={
          <TouchableOpacity
            onPress={() => onDateSelect(startOfDay(new Date()))}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border + '20' }]}
            accessibilityLabel="Go to today"
          >
            <Icon name="calendar-today" size={20} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <View style={styles.monthRowWrap}>
        <TouchableOpacity
          onPress={openCalendar}
          style={styles.monthRow}
          accessibilityLabel="Open calendar"
          accessibilityState={{ expanded: showCalendar }}
        >
          <Icon name="event" size={18} color={colors.primary} />
          <AppText weight="bold" style={[styles.monthLabel, { color: colors.text }]} numberOfLines={1}>
            {monthLabel}
          </AppText>
          <Icon name="keyboard-arrow-down" size={20} color={colors.subtle} />
        </TouchableOpacity>
      </View>

      <DateStrip selectedDate={selectedDate} onSelectDate={onDateSelect} />

      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={closeCalendar}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeCalendar} accessibilityLabel="Close calendar" />
          <View style={styles.modalSlot} pointerEvents="box-none">
            <ClayView depth={10} puffy={14} color={colors.card} style={styles.calendarCard}>
              <View style={styles.cardInner}>
                <View style={styles.cardTopRow}>
                  <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
                    Pick a date
                  </AppText>
                  <View style={styles.cardTopSpacer} />
                  <TouchableOpacity
                    onPress={closeCalendar}
                    hitSlop={10}
                    style={[styles.closeBtn, { backgroundColor: colors.background }]}
                    accessibilityLabel="Close calendar"
                  >
                    <Icon name="close" size={18} color={colors.subtle} />
                  </TouchableOpacity>
                </View>

                <ClayDatePicker compact value={selectedDate} onChange={handleDatePick} />
              </View>
            </ClayView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  monthRowWrap: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  monthLabel: {
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    ...Platform.select({
      web: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
      },
      default: {},
    }),
  },
  modalSlot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    ...Platform.select({
      web: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      default: {},
    }),
  },
  calendarCard: {
    width: '100%',
    maxWidth: 328,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  cardInner: {
    width: '100%',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTopSpacer: {
    flex: 1,
    minWidth: 16,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
