import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { useEventTypesWorkspace } from './hooks/useEventTypesWorkspace';

export default function EventTypesWorkspaceScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const {
    types,
    loading,
    newName,
    setNewName,
    newColor,
    setNewColor,
    editingId,
    editName,
    setEditName,
    editColor,
    setEditColor,
    startEdit,
    cancelEdit,
    createType,
    saveEdit,
    confirmDelete,
    isSaving,
  } = useEventTypesWorkspace();

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageContainer>
          <ScreenHeader title="Event types" />

          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
            <ClayView depth={3} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10, lineHeight: 20 }}>
                Define schedule event categories (lecture, lab, meeting, etc.) with colors used across the calendar
                and room booking flows.
              </AppText>
              <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
                NEW TYPE
              </AppText>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Name (e.g. Laboratory)"
                placeholderTextColor={colors.subtle}
                style={inputStyle}
              />
              <TextInput
                value={newColor}
                onChangeText={setNewColor}
                placeholder="#3b82f6"
                placeholderTextColor={colors.subtle}
                autoCapitalize="none"
                style={inputStyle}
              />
              <AppButton
                title={isSaving ? 'Saving…' : 'Add event type'}
                onPress={createType}
                disabled={isSaving || !newName.trim()}
                style={{ alignSelf: 'flex-start', minWidth: 160 }}
              />
            </ClayView>

            <AppText variant="label" style={{ color: colors.subtle, marginBottom: 10 }}>
              EXISTING TYPES
            </AppText>

            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : !types.length ? (
              <AppText variant="body" style={{ color: colors.subtle }}>
                No event types yet. Add one above to get started.
              </AppText>
            ) : (
              types.map((type) => {
                const isEditing = editingId === type.id;
                return (
                  <ClayView
                    key={type.id}
                    depth={2}
                    color={colors.card}
                    style={{ borderRadius: 12, padding: 14, marginBottom: 10 }}
                  >
                    {isEditing ? (
                      <>
                        <TextInput
                          value={editName}
                          onChangeText={setEditName}
                          placeholder="Name"
                          placeholderTextColor={colors.subtle}
                          style={inputStyle}
                        />
                        <TextInput
                          value={editColor}
                          onChangeText={setEditColor}
                          placeholder="#3b82f6"
                          placeholderTextColor={colors.subtle}
                          autoCapitalize="none"
                          style={inputStyle}
                        />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <AppButton title="Save" onPress={saveEdit} disabled={isSaving} style={{ minWidth: 90 }} />
                          <AppButton title="Cancel" variant="outline" onPress={cancelEdit} style={{ minWidth: 90 }} />
                        </View>
                      </>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <View
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 8,
                              backgroundColor: type.color ?? colors.primary,
                            }}
                          />
                          <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                            {type.name}
                          </AppText>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <AppButton
                            title="Edit"
                            variant="outline"
                            onPress={() => startEdit(type.id!, type.name ?? '', type.color)}
                            style={{ minWidth: 72 }}
                          />
                          <AppButton
                            title="Delete"
                            variant="outline"
                            onPress={() => confirmDelete(type.id!, type.name ?? 'type')}
                            style={{ minWidth: 72 }}
                          />
                        </View>
                      </View>
                    )}
                  </ClayView>
                );
              })
            )}

            <ClayView depth={1} color={colors.card} style={{ borderRadius: 12, padding: 12, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                <Icon name="info-outline" size={18} color={colors.primary} />
                <AppText variant="caption" style={{ color: colors.subtle, flex: 1, lineHeight: 18 }}>
                  Deleting a type requires schedule admin permission. Members with schedule edit access can create and
                  update types.
                </AppText>
              </View>
            </ClayView>
          </ScrollView>
        </PageContainer>
      </SafeAreaView>
    </View>
  );
}
