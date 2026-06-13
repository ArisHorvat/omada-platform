import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { AppButton, AppText, ClayView } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { adminWorkspaceScrollContent } from '@/src/screens/admin/styles/adminWorkspaceLayout';
import { useRoomsAdminWorkspace } from './hooks/useRoomsAdminWorkspace';

export default function RoomsWorkspaceScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const inputStyle = useMemo(
    () => ({
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.text,
      backgroundColor: colors.background,
      marginBottom: 10,
    }),
    [colors],
  );

  const {
    rooms,
    totalCount,
    loading,
    search,
    setSearch,
    name,
    setName,
    capacity,
    setCapacity,
    location,
    setLocation,
    createRoom,
    deleteRoom,
    isSaving,
  } = useRoomsAdminWorkspace();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageContainer fullBleed>
          <ScreenHeader title="Rooms management" />

          <ScrollView contentContainerStyle={[adminWorkspaceScrollContent, { paddingBottom: insets.bottom + 24 }]}>
            <ClayView depth={3} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
                ADD ROOM
              </AppText>
              <TextInput value={name} onChangeText={setName} placeholder="Room name" placeholderTextColor={colors.subtle} style={inputStyle} />
              <TextInput value={capacity} onChangeText={setCapacity} placeholder="Capacity" placeholderTextColor={colors.subtle} keyboardType="number-pad" style={inputStyle} />
              <TextInput value={location} onChangeText={setLocation} placeholder="Location / building" placeholderTextColor={colors.subtle} style={inputStyle} />
              <AppButton title={isSaving ? 'Saving…' : 'Add room'} onPress={createRoom} disabled={isSaving || !name.trim()} />
            </ClayView>

            <TextInput value={search} onChangeText={setSearch} placeholder="Search rooms" placeholderTextColor={colors.subtle} style={inputStyle} />

            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10 }}>
              {totalCount} room{totalCount === 1 ? '' : 's'}
            </AppText>

            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              rooms.map((room) => (
                <ClayView key={room.id} depth={2} color={colors.card} style={{ borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <AppText weight="bold">{room.name}</AppText>
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    {room.location ?? 'No location'} · capacity {room.capacity ?? '—'}
                  </AppText>
                  <AppButton
                    title="Delete"
                    variant="outline"
                    onPress={() => room.id && room.name && deleteRoom(room.id, room.name)}
                    style={{ marginTop: 8, alignSelf: 'flex-start' }}
                  />
                </ClayView>
              ))
            )}
          </ScrollView>
        </PageContainer>
      </SafeAreaView>
    </View>
  );
}
