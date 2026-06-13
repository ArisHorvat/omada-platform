import React, { useMemo } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { AppButton, AppText, ClayView, Icon, WidgetEmptyState } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { EventTypeColorPicker } from './components/EventTypeColorPicker';
import { EventTypeListCard } from './components/EventTypeListCard';
import { EventTypeUsagePreview } from './components/EventTypeUsagePreview';
import { useEventTypesWorkspace } from './hooks/useEventTypesWorkspace';
import { createEventTypesWorkspaceStyles } from './styles/event-types-workspace.styles';

export default function EventTypesWorkspaceScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createEventTypesWorkspaceStyles(colors), [colors]);
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
    refetch,
  } = useEventTypesWorkspace();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageContainer fullBleed>
          <ScreenHeader title="Event types" />

          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.primary} />}
          >
            <ClayView depth={3} color={colors.card} style={styles.clayShell}>
              <View style={styles.clayInner}>
                <AppText variant="h3" weight="bold">
                  Categories for schedule & rooms
                </AppText>
                <AppText variant="caption" style={styles.sectionHint}>
                  Event types drive the colored cards in the schedule and the selectable pills when booking a room.
                  Rooms only appear for types they support.
                </AppText>

                <AppText variant="label" style={styles.sectionLabel}>
                  NEW TYPE
                </AppText>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Name (e.g. Laboratory, Client meeting)"
                  placeholderTextColor={colors.subtle}
                  style={styles.input}
                  maxLength={50}
                />

                <AppText variant="label" style={[styles.sectionLabel, { marginBottom: 8 }]}>
                  COLOR
                </AppText>
                <EventTypeColorPicker value={newColor} onChange={setNewColor} />
                <EventTypeUsagePreview name={newName} color={newColor} />

                <AppButton
                  title={isSaving ? 'Saving…' : 'Add event type'}
                  onPress={createType}
                  disabled={isSaving || !newName.trim()}
                  style={{ alignSelf: 'flex-start', minWidth: 180 }}
                />
              </View>
            </ClayView>

            <AppText variant="label" style={styles.sectionLabel}>
              YOUR TYPES ({types.length})
            </AppText>

            {loading && !types.length ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
            ) : !types.length ? (
              <WidgetEmptyState
                icon="event"
                title="No event types yet"
                message="Add your first type above. Members will pick from these when creating events or booking rooms."
              />
            ) : (
              types.map((type) => (
                <EventTypeListCard
                  key={type.id}
                  type={type}
                  isEditing={editingId === type.id}
                  editName={editName}
                  editColor={editColor}
                  isSaving={isSaving}
                  onEditNameChange={setEditName}
                  onEditColorChange={setEditColor}
                  onStartEdit={() => startEdit(type.id!, type.name ?? '', type.color)}
                  onCancelEdit={cancelEdit}
                  onSaveEdit={saveEdit}
                  onDelete={() => confirmDelete(type.id!, type.name ?? 'type')}
                />
              ))
            )}

            <ClayView depth={1} color={colors.card} style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Icon name="info-outline" size={18} color={colors.primary} />
                <AppText variant="caption" style={{ color: colors.subtle, flex: 1, lineHeight: 18 }}>
                  Schedule edit access can create and update types. Deleting requires schedule admin permission and
                  only succeeds when no events or room allow-lists reference the type.
                </AppText>
              </View>
            </ClayView>
          </ScrollView>
        </PageContainer>
      </SafeAreaView>
    </View>
  );
}
