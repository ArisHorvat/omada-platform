import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { ClayView, Icon, AppText } from '@/src/components/ui';
import { useThemeColors, useTabContentBottomPadding } from '@/src/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleApi, unwrap } from '@/src/api';
import { ProposeMeetingTimeRequest, ScheduleItemDto, AttendanceStatus } from '@/src/api/generatedClient';
import { Alert } from 'react-native';
import type { ScheduleDictionary } from '../hooks/useScheduleDictionary';

interface Props {
  visible: boolean;
  onClose: () => void;
  event: ScheduleItemDto | null;
  dictionary: ScheduleDictionary;
  onRsvp: (event: ScheduleItemDto, status: AttendanceStatus) => Promise<void>;
}

export function MeetingBottomSheet({ visible, onClose, event, dictionary, onRsvp }: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const tabBarPad = useTabContentBottomPadding(72);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [proposedStart, setProposedStart] = useState(new Date());
  const [proposeMsg, setProposeMsg] = useState('');
  const [proposeLoading, setProposeLoading] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const start = event ? new Date(event.startTime) : new Date();
  const end = event ? new Date(event.endTime) : new Date();

  React.useEffect(() => {
    if (event && visible) {
      setProposedStart(new Date(event.startTime));
      setProposeMsg('');
    }
  }, [event, visible]);

  const capacityLabel = useMemo(() => {
    if (!event) return null;
    const cap = event.maxCapacity;
    const n = event.currentRSVPCount ?? 0;
    if (cap == null) return `${n} RSVP${n === 1 ? '' : 's'}`;
    return `${n} / ${cap} attending`;
  }, [event]);

  const submitPropose = async () => {
    if (!event) return;
    const dur = +new Date(event.endTime) - +new Date(event.startTime);
    const proposedEnd = new Date(+proposedStart + dur);
    const req = new ProposeMeetingTimeRequest();
    req.proposedStart = proposedStart;
    req.proposedEnd = proposedEnd;
    req.message = proposeMsg.trim() || undefined;
    setProposeLoading(true);
    try {
      await unwrap(scheduleApi.proposeMeetingTime(event.id, req));
      Alert.alert('Sent', 'Your proposed time was sent to the organizer.');
      setProposeOpen(false);
      onClose();
    } catch (e: any) {
      Alert.alert('Could not send', e?.message ?? 'Try again.');
    } finally {
      setProposeLoading(false);
    }
  };

  const rsvp = async (status: AttendanceStatus) => {
    if (!event) return;
    setRsvpLoading(true);
    try {
      await onRsvp(event, status);
      onClose();
    } catch {
      /* mutation surfaces */
    } finally {
      setRsvpLoading(false);
    }
  };

  if (!event) return null;

  return (
    <>
      <BottomSheet isVisible={visible} onClose={onClose} height={Dimensions.get('window').height * 0.78}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 28 + insets.bottom + tabBarPad }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
            Meeting details
          </AppText>
          <AppText variant="h3" weight="bold" style={{ color: colors.text, marginBottom: 8 }}>
            {event.title}
          </AppText>
          {event.subtitle ? (
            <AppText style={{ color: colors.subtle, marginBottom: 12 }} numberOfLines={4}>
              {event.subtitle}
            </AppText>
          ) : null}

          <ClayView depth={4} color={colors.card} style={{ padding: 14, borderRadius: 14, marginBottom: 16 }}>
            <View style={styles.row}>
              <Icon name="schedule" size={18} color={colors.primary} />
              <AppText style={{ color: colors.text, marginLeft: 8, flex: 1 }}>
                {start.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </AppText>
            </View>
            {event.roomName ? (
              <View style={[styles.row, { marginTop: 10 }]}>
                <Icon name="meeting-room" size={18} color={colors.primary} />
                <AppText style={{ color: colors.text, marginLeft: 8, flex: 1 }}>{event.roomName}</AppText>
              </View>
            ) : null}
            <View style={[styles.row, { marginTop: 10 }]}>
              <Icon name="category" size={18} color={colors.primary} />
              <AppText style={{ color: colors.text, marginLeft: 8 }}>{event.typeName}</AppText>
            </View>
          </ClayView>

          <AppText variant="caption" weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
            Organizer
          </AppText>
          <ClayView depth={3} color={colors.card} style={{ padding: 14, borderRadius: 14, marginBottom: 16 }}>
            <View style={styles.row}>
              <Icon name="person" size={20} color={colors.primary} />
              <AppText weight="bold" style={{ color: colors.text, marginLeft: 10, flex: 1 }}>
                {event.hostName ?? '—'}
              </AppText>
            </View>
          </ClayView>

          <AppText variant="caption" weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
            Attendees
          </AppText>
          <ClayView depth={3} color={colors.card} style={{ padding: 14, borderRadius: 14, marginBottom: 20 }}>
            <AppText style={{ color: colors.text }}>{capacityLabel ?? 'RSVP open'}</AppText>
            {event.isPublic ? (
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6 }}>
                Listed on the org-wide feed
              </AppText>
            ) : null}
          </ClayView>

          <AppText variant="caption" weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
            Your response
          </AppText>
          <View style={styles.rsvpRow}>
            <TouchableOpacity
              style={[styles.rsvpBtn, { backgroundColor: '#15803d', opacity: rsvpLoading ? 0.6 : 1 }]}
              disabled={rsvpLoading}
              onPress={() => rsvp(AttendanceStatus.Accepted)}
            >
              <AppText weight="bold" style={{ color: '#fff' }}>
                Accept
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rsvpBtn, { backgroundColor: colors.subtle + '99', opacity: rsvpLoading ? 0.6 : 1 }]}
              disabled={rsvpLoading}
              onPress={() => rsvp(AttendanceStatus.Tentative)}
            >
              <AppText weight="bold" style={{ color: '#fff' }}>
                Tentative
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rsvpBtn, { backgroundColor: colors.error, opacity: rsvpLoading ? 0.6 : 1 }]}
              disabled={rsvpLoading}
              onPress={() => rsvp(AttendanceStatus.Declined)}
            >
              <AppText weight="bold" style={{ color: '#fff' }}>
                Decline
              </AppText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.proposeBtn, { borderColor: colors.primary }]}
            onPress={() => setProposeOpen(true)}
            activeOpacity={0.85}
          >
            <Icon name="event-available" size={20} color={colors.primary} />
            <AppText weight="bold" style={{ color: colors.primary, marginLeft: 8 }}>
              Propose new time
            </AppText>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheet>

      <Modal visible={proposeOpen} transparent animationType="fade" onRequestClose={() => setProposeOpen(false)}>
        <View style={styles.modalRoot}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setProposeOpen(false)}
        />
        <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
          <AppText variant="h3" weight="bold" style={{ marginBottom: 12 }}>
            Propose a time
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
            Suggested start (duration matches this meeting)
          </AppText>
          <DateTimePicker
            value={proposedStart}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, d) => d && setProposedStart(d)}
          />
          <TextInput
            value={proposeMsg}
            onChangeText={setProposeMsg}
            placeholder="Optional message to organizer"
            placeholderTextColor={colors.subtle}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 12,
              color: colors.text,
              marginTop: 12,
            }}
            multiline
          />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity
              style={[styles.modalBtn, { flex: 1, borderColor: colors.border }]}
              onPress={() => setProposeOpen(false)}
            >
              <AppText weight="bold">Cancel</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { flex: 1, backgroundColor: colors.primary }]}
              onPress={submitPropose}
              disabled={proposeLoading}
            >
              {proposeLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <AppText weight="bold" style={{ color: '#fff' }}>
                  Send
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  rsvpRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  rsvpBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: '30%',
    flexGrow: 1,
    alignItems: 'center',
  },
  proposeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    marginHorizontal: 20,
    maxHeight: '72%',
    borderRadius: 16,
    padding: 16,
  },
  modalBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
