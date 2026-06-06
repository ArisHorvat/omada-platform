import React from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Keyboard,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated from 'react-native-reanimated';

import { AppText, AppButton, Icon, ClayView } from '@/src/components/ui';
import { WebAnchoredOverlay } from '@/src/components/layout/WebAnchoredOverlay';
import { AnimatedItem, PressClay } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';
import { useTheme } from '@react-navigation/native';
import { useUserPreferences } from '@/src/context/UserPreferencesContext';
import { TaskItemDto } from '@/src/api/generatedClient';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import type { AssignableGroup } from '@/src/hooks/useAssignableGroups';

export interface CreateTaskBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  editingTask: TaskItemDto | null;
  newTaskTitle: string;
  onChangeTitle: (text: string) => void;
  selectedDate: Date | null;
  onChangeDate: (date: Date | null) => void;
  showDatePicker: boolean;
  onShowDatePicker: (show: boolean) => void;
  showPickerInline: boolean;
  onShowPickerInline: (show: boolean) => void;
  onSave: () => void;
  assignableGroups?: AssignableGroup[];
  subjectGroupId: string | null;
  onSubjectGroupIdChange: (id: string | null) => void;
}

/**
 * Create / edit task sheet: Clay inputs, optional due date, matches Tasks design system.
 */
export function CreateTaskBottomSheet({
  visible,
  onClose,
  editingTask,
  newTaskTitle,
  onChangeTitle,
  selectedDate,
  onChangeDate,
  showDatePicker,
  onShowDatePicker,
  showPickerInline,
  onShowPickerInline,
  onSave,
  assignableGroups = [],
  subjectGroupId,
  onSubjectGroupIdChange,
}: CreateTaskBottomSheetProps) {
  const { colors } = useTheme();
  const { isDarkMode } = useUserPreferences();
  const [groupPickerOpen, setGroupPickerOpen] = React.useState(false);

  const groupOptions = React.useMemo(
    () =>
      assignableGroups.map((g) => ({
        value: g.id,
        label: g.name,
        subtitle: g.typeLabel,
      })),
    [assignableGroups],
  );

  const selectedGroupLabel =
    subjectGroupId != null
      ? groupOptions.find((o) => o.value === subjectGroupId)?.label ?? 'Linked group'
      : null;

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <WebAnchoredOverlay>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <TouchableOpacity
            style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' }}
            activeOpacity={1}
            onPress={onClose}
          />

          <AnimatedItem animation={null} layout={ClayAnimations.LayoutStable}>
            <ClayView
              depth={20}
              puffy={20}
              color={colors.card}
              style={{
                padding: 24,
                borderTopLeftRadius: 32,
                borderTopRightRadius: 32,
                paddingBottom: Platform.OS === 'ios' ? 40 : 24,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 24,
                }}
              >
                <AppButton title="Cancel" variant="outline" size="sm" onPress={onClose} />
                <AppText variant="h3" weight="bold">
                  {editingTask ? 'Edit task' : 'New task'}
                </AppText>
                <AppButton title="Save" size="sm" onPress={onSave} disabled={!newTaskTitle.trim()} />
              </View>

              <AppText weight="bold" style={{ marginBottom: 8, color: colors.subtle }}>
                What needs to be done?
              </AppText>
              <ClayView depth={2} puffy={5} color={colors.background} style={{ borderRadius: 16, padding: 4, marginBottom: 24, zIndex: 10 }}>
                <TextInput
                  style={{ fontSize: 18, padding: 16, color: colors.text }}
                  placeholder="e.g. Email professor"
                  placeholderTextColor={colors.subtle}
                  value={newTaskTitle}
                  onChangeText={onChangeTitle}
                  autoFocus={!editingTask}
                  onFocus={() => onShowPickerInline(false)}
                />
              </ClayView>

              {assignableGroups.length > 0 ? (
                <>
                  <AppText weight="bold" style={{ marginBottom: 8, color: colors.subtle }}>
                    Course / group (optional)
                  </AppText>
                  <PressClay onPress={() => setGroupPickerOpen(true)} style={{ marginBottom: 16 }}>
                    <ClayView
                      depth={2}
                      color={colors.background}
                      style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Icon name="groups" size={22} color={colors.primary} style={{ marginRight: 10 }} />
                      <AppText style={{ flex: 1, color: selectedGroupLabel ? colors.text : colors.subtle }}>
                        {selectedGroupLabel ?? 'Link to a class or team'}
                      </AppText>
                      <Icon name="chevron-right" size={20} color={colors.subtle} />
                    </ClayView>
                  </PressClay>
                </>
              ) : null}

              <AppText weight="bold" style={{ marginBottom: 8, color: colors.subtle }}>
                Deadline (optional)
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 5 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    backgroundColor: colors.background,
                    borderRadius: 16,
                    flex: 1,
                  }}
                  onPress={() => {
                    Keyboard.dismiss();
                    if (Platform.OS === 'android') onShowDatePicker(true);
                    else onShowPickerInline(!showPickerInline);
                  }}
                >
                  <Icon name="event" size={24} color={selectedDate ? colors.primary : colors.subtle} />
                  <AppText
                    weight="bold"
                    style={{
                      marginLeft: 12,
                      color: selectedDate ? colors.primary : colors.subtle,
                      fontSize: 16,
                    }}
                  >
                    {selectedDate
                      ? selectedDate.toLocaleDateString(undefined, {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Set a due date'}
                  </AppText>
                </TouchableOpacity>

                {selectedDate ? (
                  <AnimatedItem animation={ClayAnimations.FAB} layout={null}>
                    <PressClay onPress={() => onChangeDate(null)} style={{ marginLeft: 8 }}>
                      <ClayView depth={4} puffy={12} color={colors.background} style={{ borderRadius: 16, padding: 16 }}>
                        <Icon name="close" size={24} color={colors.error} />
                      </ClayView>
                    </PressClay>
                  </AnimatedItem>
                ) : null}
              </View>

              {Platform.OS === 'ios' && showPickerInline ? (
                <AnimatedItem animation={ClayAnimations.Header} exiting={ClayAnimations.ExitFade} layout={null} style={{ alignItems: 'center', marginTop: 16 }}>
                  <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display="inline"
                    themeVariant={isDarkMode ? 'dark' : 'light'}
                    accentColor={colors.primary}
                    textColor={colors.text}
                    onChange={(_e, date) => {
                      if (date) onChangeDate(date);
                    }}
                    style={{ width: '100%' }}
                  />
                </AnimatedItem>
              ) : null}
            </ClayView>
          </AnimatedItem>
        </KeyboardAvoidingView>
        </WebAnchoredOverlay>
      </Modal>

      <SearchableOptionPickerSheet
        isVisible={groupPickerOpen && visible}
        onClose={() => setGroupPickerOpen(false)}
        title="Link assignment to group"
        searchPlaceholder="Search groups…"
        options={groupOptions}
        selected={subjectGroupId}
        onSelect={onSubjectGroupIdChange}
        includeAllOption
        allLabel="No group"
        height={420}
        zIndexBase={400}
      />

      {showDatePicker && Platform.OS === 'android' ? (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={(e, date) => {
            onShowDatePicker(false);
            if (e.type === 'set' && date) onChangeDate(date);
          }}
        />
      ) : null}
    </>
  );
}
