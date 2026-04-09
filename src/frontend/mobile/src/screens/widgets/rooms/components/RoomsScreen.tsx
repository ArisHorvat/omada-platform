import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks';
import { AppText, ClayView, Icon, AppButton } from '@/src/components/ui';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { ClayDatePicker } from '@/src/components/ui/ClayDatePicker';
import { AnimatedItem, PressClay } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';
import { useRoomsLogic } from '../hooks/useRoomsLogic';
import { RoomBookingModal } from './RoomBookingModal';
import { RoomsFilterSheet } from './RoomsFilterSheet';
import { RoomDayTimeline } from '@/src/screens/widgets/schedule/components/RoomDayTimeline';
import { roomAmenityChips } from '../utils/roomAmenityTags';

function filtersActiveCount(f: {
  searchTerm: string;
  minCapacity?: number;
  buildingIds: string[];
  amenityKeys: string[];
  eventTypeId?: string;
}): number {
  let n = 0;
  if (f.searchTerm.trim()) n++;
  if (f.minCapacity != null) n++;
  if (f.buildingIds.length > 0) n++;
  if (f.amenityKeys.length > 0) n++;
  if (f.eventTypeId) n++;
  return n;
}

export default function RoomsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    rooms,
    availableNowRooms,
    buildings,
    loading,
    filters,
    page,
    setPage,
    totalPages,
    commitFilters,
    resetFilters,
    isModalVisible,
    startBooking,
    confirmBooking,
    closeModal,
    form,
    isSaving,
    searchHosts,
    selectedRoomId,
    selectedRoom,
    selectRoom,
    roomTimeline,
    roomTimelineLoading,
    timelineDate,
    setTimelineDate,
    bookingRoom,
    eventTypes,
    refreshNow,
  } = useRoomsLogic();

  const [showFilterModal, setShowFilterModal] = React.useState(false);
  const activeFilterCount = useMemo(() => filtersActiveCount(filters), [filters]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <ClayBackButton />
          <View style={{ marginLeft: 16, flex: 1 }}>
            <AppText variant="h2" weight="bold">
              Rooms
            </AppText>
            <AppText style={{ color: colors.subtle, fontSize: 12 }}>Find and book a space</AppText>
            {activeFilterCount > 0 ? (
              <AppText variant="caption" style={{ color: colors.primary, marginTop: 4 }}>
                {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} active · list updates when you tap Done in filters
              </AppText>
            ) : (
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                Tap the filter button to search and narrow by building, amenities, and time.
              </AppText>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowFilterModal(true)} style={{ marginLeft: 8 }}>
          <ClayView depth={5} color={colors.card} style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="tune" size={24} color={colors.primary} />
            {activeFilterCount > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <AppText style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{activeFilterCount}</AppText>
              </View>
            ) : null}
          </ClayView>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        {loading && (
          <View style={{ marginBottom: 12 }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        <ClayView depth={4} color={colors.card} style={{ borderRadius: 18, padding: 14, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText variant="h3" weight="bold">
              Available now
            </AppText>
            <TouchableOpacity onPress={refreshNow}>
              <Icon name="refresh" size={18} color={colors.subtle} />
            </TouchableOpacity>
          </View>
          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2, marginBottom: 12 }}>
            Spaces free for the next 30 minutes (updates every minute)
          </AppText>
          {availableNowRooms.slice(0, 5).map((room) => (
            <TouchableOpacity key={`available-${room.id}`} onPress={() => selectRoom(room.id)} activeOpacity={0.85} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 8 }} />
                <AppText style={{ flex: 1 }}>{room.name}</AppText>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  {room.capacity} seats
                </AppText>
              </View>
            </TouchableOpacity>
          ))}
          {availableNowRooms.length === 0 && <AppText style={{ color: colors.subtle }}>No room is currently free.</AppText>}
        </ClayView>

        {rooms.map((room, index) => {
          const amenityChips = roomAmenityChips(room);
          return (
            <AnimatedItem key={room.id} animation={ClayAnimations.SlideInFlow(index)} style={{ marginBottom: 16 }}>
              <ClayView depth={selectedRoomId === room.id ? 2 : 5} color={colors.card} style={{ borderRadius: 20, padding: 16 }}>
                <TouchableOpacity onPress={() => selectRoom(room.id)} activeOpacity={0.92}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <AppText variant="h3" weight="bold">
                        {room.name}
                      </AppText>
                      <AppText style={{ color: colors.subtle }}>{room.location || 'Main Building'}</AppText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, padding: 6, borderRadius: 8 }}>
                      <Icon name="group" size={14} color={colors.subtle} style={{ marginRight: 4 }} />
                      <AppText style={{ fontSize: 12, fontWeight: 'bold' }}>{room.capacity}</AppText>
                    </View>
                  </View>
                  {amenityChips.length > 0 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                      {amenityChips.map((chip) => (
                        <View
                          key={chip.id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 12,
                            backgroundColor: colors.background,
                            borderWidth: 1,
                            borderColor: colors.border + '66',
                            maxWidth: '100%',
                          }}
                        >
                          <Icon name={chip.icon} size={16} color={colors.primary} style={{ marginRight: 6 }} />
                          <AppText variant="caption" numberOfLines={2} style={{ color: colors.text, flexShrink: 1 }}>
                            {chip.label}
                          </AppText>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <View style={{ height: 1, backgroundColor: colors.border + '20', marginTop: 12 }} />
                  <View style={{ paddingTop: 12, flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: room.isBusy ? '#ef4444' : '#10b981',
                        marginRight: 8,
                      }}
                    />
                    <AppText style={{ color: room.isBusy ? '#ef4444' : '#10b981', fontWeight: '600', fontSize: 13 }}>
                      {room.isBusy ? 'Busy now' : 'Free now'}
                    </AppText>
                  </View>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                  <PressClay onPress={() => startBooking(room.id)}>
                    <ClayView depth={3} color={colors.primary} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
                      <AppText weight="bold" style={{ color: '#FFF', fontSize: 13 }}>
                        Book
                      </AppText>
                    </ClayView>
                  </PressClay>
                </View>
              </ClayView>
            </AnimatedItem>
          );
        })}

        {selectedRoom && (
          <ClayView depth={3} color={colors.card} style={{ borderRadius: 16, padding: 14, marginBottom: 16 }}>
            <AppText weight="bold" style={{ marginBottom: 4 }}>
              {selectedRoom.name}
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
              See when this room is free or busy for any day. Times are shown in 15-minute steps (same as booking).
            </AppText>

            <AppText variant="caption" weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
              Pick a day
            </AppText>
            <ClayView depth={2} color={colors.background} style={{ borderRadius: 14, padding: 8, marginBottom: 14 }}>
              <ClayDatePicker value={timelineDate} onChange={setTimelineDate} />
            </ClayView>

            {roomTimelineLoading ? (
              <AppText style={{ color: colors.subtle }}>Loading schedule…</AppText>
            ) : (
              <RoomDayTimeline day={timelineDate} events={roomTimeline} selection={null} roomName={selectedRoom.name} />
            )}

            <TouchableOpacity
              onPress={() => router.push('/(app)/(tabs)/schedule')}
              style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 }}
              activeOpacity={0.85}
            >
              <Icon name="calendar-today" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <AppText weight="bold" style={{ color: colors.primary }}>
                Open full Schedule tab
              </AppText>
              <Icon name="chevron-right" size={20} color={colors.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'center', marginTop: 4 }}>
              See your meetings and org-wide events in one place
            </AppText>
          </ClayView>
        )}

        {totalPages > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, gap: 20 }}>
            <AppButton title="Prev" size="sm" variant="outline" onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} />
            <AppText style={{ color: colors.subtle }}>
              Page {page} of {totalPages}
            </AppText>
            <AppButton title="Next" size="sm" variant="outline" onPress={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
          </View>
        )}
      </ScrollView>

      <RoomsFilterSheet
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        applied={filters}
        onApply={commitFilters}
        onReset={resetFilters}
        buildings={buildings}
        eventTypes={eventTypes}
      />

      <RoomBookingModal
        visible={isModalVisible && !!bookingRoom}
        onClose={closeModal}
        room={bookingRoom}
        form={form}
        isSaving={isSaving}
        onSave={confirmBooking}
        eventTypes={eventTypes}
        searchHosts={searchHosts}
      />
    </View>
  );
}
