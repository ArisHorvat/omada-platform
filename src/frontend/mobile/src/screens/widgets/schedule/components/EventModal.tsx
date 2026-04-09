import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  LayoutAnimation,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, ClayView, Icon, AppButton } from '@/src/components/ui';
import { ClayDatePicker } from '@/src/components/ui/ClayDatePicker';
import { ClayTimeSpinner } from '@/src/components/ui/ClayTimeSpinner';
import { useThemeColors, useTabContentBottomPadding } from '@/src/hooks';
import { RoomDto } from '@/src/api/generatedClient';
import { HostPickerSheet } from './HostPickerSheet';
import { formatRecurrenceLabel } from '../utils/recurrenceLabels';

const EVENT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const TOTAL_STEPS = 4;

type Panel = 'wizard' | 'recurrence';
type BuildingFilter = 'all' | 'none' | string;

export const EventModal = ({
  visible,
  onClose,
  form,
  isSaving,
  isEditing,
  editMode,
  onSave,
  onDelete,
  eventTypes,
  rooms,
  searchHosts,
}: any) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const tabBarPad = useTabContentBottomPadding(56);
  const [panel, setPanel] = useState<Panel>('wizard');
  const [step, setStep] = useState(1);
  const [buildingFilter, setBuildingFilter] = useState<BuildingFilter>('all');
  const [activePicker, setActivePicker] = useState<'none' | 'date' | 'start' | 'end'>('none');
  const [hostPickerOpen, setHostPickerOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setPanel('wizard');
      setStep(1);
      setBuildingFilter('all');
      setActivePicker('none');
      setHostPickerOpen(false);
    }
  }, [visible]);

  const isRoomAllowed = (room: RoomDto, currentTypeId: string) => {
    if (!currentTypeId) return true;
    if (!room.allowedEventTypes || room.allowedEventTypes.length === 0) return true;
    return room.allowedEventTypes.some((t: any) => t.id === currentTypeId);
  };

  /** Rooms compatible with the selected event type (Step 3 list is strictly filtered). */
  const allowedRooms = useMemo(() => {
    const list = (rooms || []) as RoomDto[];
    return list.filter((r) => isRoomAllowed(r, form.eventTypeId));
  }, [rooms, form.eventTypeId]);

  const buildingOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of allowedRooms) {
      if (!r.buildingId) continue;
      if (!map.has(r.buildingId)) {
        const loc = r.location?.trim();
        map.set(r.buildingId, loc && loc.length > 0 ? loc.split(',')[0]!.trim() : 'Building');
      }
    }
    return [...map.entries()].map(([id, label]) => ({ id, label }));
  }, [allowedRooms]);

  const hasUngroupedRooms = useMemo(() => allowedRooms.some((r) => !r.buildingId), [allowedRooms]);

  const filteredRooms = useMemo(() => {
    if (buildingFilter === 'all') return allowedRooms;
    if (buildingFilter === 'none') return allowedRooms.filter((r) => !r.buildingId);
    return allowedRooms.filter((r) => r.buildingId === buildingFilter);
  }, [allowedRooms, buildingFilter]);

  const togglePicker = (mode: typeof activePicker) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActivePicker((prev) => (prev === mode ? 'none' : mode));
  };

  const goNext = () => {
    if (step === 1) {
      if (!form.eventTypeId) {
        Alert.alert('Event type', 'Choose what kind of event this is.');
        return;
      }
      if (!form.title.trim()) {
        Alert.alert('Title', 'Add a title to continue.');
        return;
      }
    }
    if (step === 2) {
      if (+form.endDate <= +form.startDate) {
        Alert.alert('Time', 'End time must be after start time.');
        return;
      }
    }
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      setActivePicker('none');
    }
  };

  const stepDots = (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
        <View
          key={s}
          style={{
            width: s === step ? 20 : 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: s <= step ? colors.primary : colors.border,
          }}
        />
      ))}
    </View>
  );

  const wizardHeader = (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 8,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border + '18',
      }}
    >
      <AppButton title="Cancel" variant="outline" size="sm" onPress={onClose} />
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
        <AppText weight="bold" variant="h3" numberOfLines={1}>
          {isEditing ? 'Edit event' : 'New event'}
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }}>
          Step {step} of {TOTAL_STEPS}
        </AppText>
      </View>
      {isEditing ? (
        <TouchableOpacity onPress={onDelete} hitSlop={12}>
          <Icon name="delete-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 48 }} />
      )}
    </View>
  );

  const wizardFooter = (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 14 + Math.max(insets.bottom, 8),
        borderTopWidth: 1,
        borderTopColor: colors.border + '18',
        gap: 12,
        backgroundColor: colors.card,
      }}
    >
      {step > 1 ? (
        <View style={{ flex: 1 }}>
          <AppButton
            title="Back"
            variant="outline"
            onPress={() => {
              setStep((s) => s - 1);
              setActivePicker('none');
            }}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      {step < TOTAL_STEPS ? (
        <View style={{ flex: 1 }}>
          <AppButton title="Next" onPress={goNext} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <AppButton title={isSaving ? 'Saving…' : 'Save'} onPress={() => onSave()} disabled={isSaving} />
        </View>
      )}
    </View>
  );

  const stepScrollStyle = { padding: 20, paddingBottom: 36 + tabBarPad };

  /** Step 1 — What: event type, title, description. */
  const renderStep1 = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={stepScrollStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="h3" weight="bold" style={{ marginBottom: 4 }}>
        What
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 16 }}>
        Choose the event type, then name it. This drives which rooms you can book later.
      </AppText>

      <AppText weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
        Event type
      </AppText>
      <View style={{ gap: 10, marginBottom: 20 }}>
        {eventTypes.map((t: any) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => {
              form.setEventTypeId(t.id);
              if (form.roomId) {
                const currentRoom = (rooms || []).find((r: RoomDto) => r.id === form.roomId);
                if (currentRoom && !isRoomAllowed(currentRoom, t.id)) {
                  form.setRoomId(null);
                }
              }
            }}
            activeOpacity={0.85}
          >
            <ClayView
              depth={form.eventTypeId === t.id ? 6 : 3}
              color={form.eventTypeId === t.id ? t.color : colors.card}
              style={{ padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <AppText weight="bold" style={{ color: form.eventTypeId === t.id ? '#FFF' : colors.text }}>
                {t.name}
              </AppText>
              {form.eventTypeId === t.id ? <Icon name="check" size={22} color="#FFF" /> : null}
            </ClayView>
          </TouchableOpacity>
        ))}
      </View>

      <AppText weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
        Title
      </AppText>
      <ClayView depth={2} puffy={5} color={colors.background} style={{ borderRadius: 16, padding: 8, marginBottom: 16 }}>
        <TextInput
          style={{ fontSize: 20, fontWeight: 'bold', padding: 12, color: colors.text }}
          placeholder="What is this event?"
          placeholderTextColor={colors.subtle}
          value={form.title}
          onChangeText={form.setTitle}
        />
      </ClayView>

      <AppText weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
        Description
      </AppText>
      <ClayView depth={2} puffy={5} color={colors.background} style={{ borderRadius: 16, padding: 8, marginBottom: 16 }}>
        <TextInput
          style={{ fontSize: 16, padding: 12, color: colors.text, minHeight: 88 }}
          placeholder="Optional notes"
          placeholderTextColor={colors.subtle}
          multiline
          value={form.description}
          onChangeText={form.setDescription}
        />
      </ClayView>
    </ScrollView>
  );

  /** Step 2 — When: date, time, recurrence (unchanged UX from former step 3). */
  const renderStep2 = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={stepScrollStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="h3" weight="bold" style={{ marginBottom: 4 }}>
        When
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 16 }}>
        Date and times use 15-minute steps.
      </AppText>
      <ClayView depth={2} color={colors.background} style={{ borderRadius: 16, paddingHorizontal: 16, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={() => togglePicker('date')}
          style={{
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderColor: colors.border + '10',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <AppText>Date</AppText>
          <AppText weight="bold" style={{ color: colors.primary }}>
            {form.startDate.toLocaleDateString()}
          </AppText>
        </TouchableOpacity>
        {activePicker === 'date' ? (
          <View style={{ paddingBottom: 16 }}>
            <ClayDatePicker value={form.startDate} onChange={form.setStartDate} />
          </View>
        ) : null}

        <TouchableOpacity
          onPress={() => togglePicker('start')}
          style={{
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderColor: colors.border + '10',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <AppText>Starts</AppText>
          <AppText weight="bold">{form.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</AppText>
        </TouchableOpacity>
        {activePicker === 'start' ? (
          <ClayTimeSpinner minuteIncrement={15} value={form.startDate} onChange={form.setStartDate} />
        ) : null}

        <TouchableOpacity
          onPress={() => togglePicker('end')}
          style={{ paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between' }}
        >
          <AppText>Ends</AppText>
          <AppText weight="bold">{form.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</AppText>
        </TouchableOpacity>
        {activePicker === 'end' ? (
          <ClayTimeSpinner minuteIncrement={15} value={form.endDate} onChange={form.setEndDate} />
        ) : null}
      </ClayView>

      {editMode !== 'instance' ? (
        <>
          <AppText weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
            Recurrence
          </AppText>
          <TouchableOpacity onPress={() => setPanel('recurrence')} activeOpacity={0.85}>
            <ClayView depth={3} color={colors.card} style={{ padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <AppText weight="bold">{form.recLabel}</AppText>
                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                  Tap to set repeat rule and end date
                </AppText>
              </View>
              <Icon name="chevron-right" size={22} color={colors.subtle} />
            </ClayView>
          </TouchableOpacity>
        </>
      ) : (
        <AppText variant="caption" style={{ color: colors.subtle }}>
          Recurrence is fixed for this single occurrence.
        </AppText>
      )}
    </ScrollView>
  );

  /** Step 3 — Where: building + room (only rooms allowed for selected type). */
  const renderStep3 = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={stepScrollStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="h3" weight="bold" style={{ color: colors.text, marginBottom: 4 }}>
        Where
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 16 }}>
        Only spaces that support your event type are listed. You can skip the room.
      </AppText>

      <AppText weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
        Building / area
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setBuildingFilter('all')} style={{ marginRight: 4 }}>
          <ClayView
            depth={buildingFilter === 'all' ? 5 : 2}
            color={buildingFilter === 'all' ? colors.primary : colors.background}
            style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 }}
          >
            <AppText weight="bold" style={{ color: buildingFilter === 'all' ? '#FFF' : colors.text }}>
              All
            </AppText>
          </ClayView>
        </TouchableOpacity>
        {hasUngroupedRooms ? (
          <TouchableOpacity onPress={() => setBuildingFilter('none')} style={{ marginRight: 4 }}>
            <ClayView
              depth={buildingFilter === 'none' ? 5 : 2}
              color={buildingFilter === 'none' ? colors.primary : colors.background}
              style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 }}
            >
              <AppText weight="bold" style={{ color: buildingFilter === 'none' ? '#FFF' : colors.text }}>
                No building
              </AppText>
            </ClayView>
          </TouchableOpacity>
        ) : null}
        {buildingOptions.map((b) => (
          <TouchableOpacity key={b.id} onPress={() => setBuildingFilter(b.id)} style={{ marginRight: 4 }}>
            <ClayView
              depth={buildingFilter === b.id ? 5 : 2}
              color={buildingFilter === b.id ? colors.primary : colors.background}
              style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, maxWidth: 200 }}
            >
              <AppText weight="bold" numberOfLines={1} style={{ color: buildingFilter === b.id ? '#FFF' : colors.text }}>
                {b.label}
              </AppText>
            </ClayView>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <AppText weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
        Room
      </AppText>
      <TouchableOpacity onPress={() => form.setRoomId(null)} style={{ marginBottom: 10 }} activeOpacity={0.85}>
        <ClayView
          depth={!form.roomId ? 5 : 2}
          color={!form.roomId ? colors.primary + '33' : colors.background}
          style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border + '40' }}
        >
          <AppText weight="bold" style={{ color: !form.roomId ? colors.primary : colors.subtle }}>
            No room / TBD
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
            Continue without booking a space
          </AppText>
        </ClayView>
      </TouchableOpacity>

      {allowedRooms.length === 0 ? (
        <AppText style={{ color: colors.subtle, marginTop: 8 }}>
          No rooms support this event type. Go back to change the type, or continue without a room.
        </AppText>
      ) : filteredRooms.length === 0 ? (
        <AppText style={{ color: colors.subtle, marginTop: 8 }}>No rooms match this building filter.</AppText>
      ) : (
        filteredRooms.map((room: RoomDto) => {
          const selected = form.roomId === room.id;
          return (
            <TouchableOpacity
              key={room.id}
              onPress={() => form.setRoomId(room.id)}
              style={{ marginBottom: 10 }}
              activeOpacity={0.85}
            >
              <ClayView depth={selected ? 6 : 3} color={selected ? colors.primary : colors.card} style={{ padding: 14, borderRadius: 14 }}>
                <AppText weight="bold" style={{ color: selected ? '#FFF' : colors.text }}>
                  {room.name}
                </AppText>
                {room.location ? (
                  <AppText variant="caption" style={{ color: selected ? 'rgba(255,255,255,0.85)' : colors.subtle, marginTop: 4 }}>
                    {room.location}
                  </AppText>
                ) : null}
              </ClayView>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );

  /** Step 4 — Who & settings: host, color, capacity, org feed. */
  const renderStep4 = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={stepScrollStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="h3" weight="bold" style={{ marginBottom: 4 }}>
        Who & settings
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 16 }}>
        Host defaults to you; tap to pick someone else. Tune visibility below.
      </AppText>

      <AppText weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
        Host
      </AppText>
      <TouchableOpacity onPress={() => setHostPickerOpen(true)} activeOpacity={0.85} style={{ marginBottom: 20 }}>
        <ClayView depth={3} color={colors.card} style={{ padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText style={{ color: form.hostName ? colors.text : colors.subtle, flex: 1 }} numberOfLines={2}>
            {form.hostName || 'You (tap to change)'}
          </AppText>
          <Icon name="chevron-right" size={22} color={colors.subtle} />
        </ClayView>
      </TouchableOpacity>

      <AppText weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
        Color
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {EVENT_COLORS.map((c) => (
          <TouchableOpacity key={c} onPress={() => form.setColor(c)} style={{ marginRight: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: c,
                borderWidth: form.color === c ? 3 : 0,
                borderColor: colors.card,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {form.color === c ? <Icon name="check" size={20} color="#FFF" /> : null}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <AppText weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
        Max attendees (optional)
      </AppText>
      <ClayView depth={2} puffy={5} color={colors.background} style={{ borderRadius: 16, padding: 8, marginBottom: 16 }}>
        <TextInput
          style={{ fontSize: 16, padding: 12, color: colors.text }}
          placeholder="Leave empty for no limit"
          placeholderTextColor={colors.subtle}
          keyboardType="number-pad"
          value={form.maxCapacityText}
          onChangeText={form.setMaxCapacityText}
        />
      </ClayView>

      <TouchableOpacity onPress={() => form.setIsPublic(!form.isPublic)} activeOpacity={0.85} style={{ marginBottom: 8 }}>
        <ClayView depth={3} color={colors.card} style={{ padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <AppText weight="bold">Org-wide feed</AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
              Show on the public schedule feed (corporate)
            </AppText>
          </View>
          <ClayView
            depth={form.isPublic ? 2 : 6}
            color={form.isPublic ? colors.primary : colors.border}
            style={{ width: 52, height: 30, borderRadius: 16, justifyContent: 'center', paddingHorizontal: 4 }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#fff',
                alignSelf: form.isPublic ? 'flex-end' : 'flex-start',
              }}
            />
          </ClayView>
        </ClayView>
      </TouchableOpacity>

      <AppText variant="caption" style={{ color: colors.subtle, marginTop: 8 }}>
        Tap Save when ready. Use Back to change type, time, or location.
      </AppText>
    </ScrollView>
  );

  const renderRecurrencePanel = () => (
    <View style={{ flex: 1, minHeight: 0 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.border + '20',
          flexShrink: 0,
        }}
      >
        <TouchableOpacity onPress={() => setPanel('wizard')} style={{ paddingRight: 16 }}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold">
          Repeat
        </AppText>
        <AppButton
          title="Done"
          size="sm"
          onPress={() => {
            form.setRecLabel(formatRecurrenceLabel(form.recFreq, form.recInterval));
            setPanel('wizard');
          }}
        />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 + insets.bottom + tabBarPad }}
        keyboardShouldPersistTaps="handled"
      >
        <ClayView depth={2} color={colors.background} style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
          {['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].map((freq, i, arr) => (
            <TouchableOpacity
              key={freq}
              onPress={() => form.setRecFreq(freq as any)}
              style={{
                padding: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
                borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                borderBottomColor: colors.border + '10',
              }}
            >
              <AppText style={{ fontSize: 16, textTransform: 'capitalize' }}>{freq === 'NONE' ? 'Never' : freq.toLowerCase()}</AppText>
              {form.recFreq === freq ? <Icon name="check" size={20} color={colors.primary} /> : null}
            </TouchableOpacity>
          ))}
        </ClayView>

        {form.recFreq !== 'NONE' ? (
          <>
            <AppText weight="bold" style={{ marginBottom: 8, color: colors.subtle }}>
              Every
            </AppText>
            <ClayView depth={2} color={colors.background} style={{ borderRadius: 16, flexDirection: 'row', alignItems: 'center', padding: 8, marginBottom: 24 }}>
              <TouchableOpacity onPress={() => form.setRecInterval(Math.max(1, form.recInterval - 1))} style={{ padding: 12 }}>
                <Icon name="remove" size={24} color={colors.primary} />
              </TouchableOpacity>
              <AppText weight="bold" style={{ flex: 1, textAlign: 'center', fontSize: 18 }}>
                {formatRecurrenceLabel(form.recFreq, form.recInterval)}
              </AppText>
              <TouchableOpacity onPress={() => form.setRecInterval(form.recInterval + 1)} style={{ padding: 12 }}>
                <Icon name="add" size={24} color={colors.primary} />
              </TouchableOpacity>
            </ClayView>

            <AppText weight="bold" style={{ marginBottom: 8, color: colors.subtle }}>
              End repeat
            </AppText>
            <ClayView depth={2} color={colors.background} style={{ borderRadius: 16, overflow: 'hidden' }}>
              <TouchableOpacity
                onPress={() => form.setRecEndMode('never')}
                style={{
                  padding: 16,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border + '10',
                }}
              >
                <AppText style={{ fontSize: 16 }}>Never</AppText>
                {form.recEndMode === 'never' ? <Icon name="check" size={20} color={colors.primary} /> : null}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => form.setRecEndMode('date')}
                style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between' }}
              >
                <AppText style={{ fontSize: 16 }}>On date</AppText>
                {form.recEndMode === 'date' ? <Icon name="check" size={20} color={colors.primary} /> : null}
              </TouchableOpacity>
              {form.recEndMode === 'date' ? (
                <View style={{ borderTopWidth: 1, borderTopColor: colors.border + '10', padding: 8 }}>
                  <ClayDatePicker value={form.recEndDate} onChange={form.setRecEndDate} />
                </View>
              ) : null}
            </ClayView>
          </>
        ) : null}
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }} pointerEvents="box-none">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end' }}
          pointerEvents="box-none"
        >
          <Pressable
            style={[StyleSheet.absoluteFill, { zIndex: 0, backgroundColor: 'rgba(0,0,0,0.4)' }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />

          <View
            style={{
              width: '100%',
              height: '85%',
              zIndex: 1,
              backgroundColor: colors.card,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {panel === 'wizard' ? (
              <>
                <View style={{ flexShrink: 0 }}>
                  {wizardHeader}
                  {stepDots}
                </View>

                <View style={{ flex: 1, width: '100%', minHeight: 0 }}>
                  {step === 1 ? renderStep1() : null}
                  {step === 2 ? renderStep2() : null}
                  {step === 3 ? renderStep3() : null}
                  {step === 4 ? renderStep4() : null}
                </View>

                <View style={{ flexShrink: 0 }}>
                  {wizardFooter}
                </View>
              </>
            ) : null}

            {panel === 'recurrence' ? (
              <View style={{ flex: 1, width: '100%', minHeight: 0 }}>{renderRecurrencePanel()}</View>
            ) : null}
          </View>
        </KeyboardAvoidingView>

        <HostPickerSheet
          visible={hostPickerOpen && visible}
          onClose={() => setHostPickerOpen(false)}
          title="Assign host"
          searchPlaceholder="Search by name…"
          resultSubtitle="Directory"
          searchHosts={searchHosts}
          zIndexBase={520}
          onSelect={(h) => {
            form.setHostId(h.id);
            form.setHostName(h.fullName);
          }}
        />
      </View>
    </Modal>
  );
};
