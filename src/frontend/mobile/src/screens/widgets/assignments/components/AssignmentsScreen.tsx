import React, { useState } from 'react';
import { View, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { WidgetPageShell } from '@/src/components/layout';
import { ScreenTransition, AnimatedItem, PressClay } from '@/src/components/animations';
import {
  AppButton,
  AppText,
  ClayView,
  Icon,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { ClayAnimations } from '@/src/constants/animations';
import { useThemeColors, useBreakpoint } from '@/src/hooks';
import type { GroupPickerItemDto, TaskItemDto } from '@/src/api/generatedClient';
import { CreateTaskBottomSheet } from '../../tasks/components/CreateTaskBottomSheet';
import { useAssignmentsScreenLogic, type AssignmentsListFilter } from '../hooks/useAssignmentsScreenLogic';
import { formatDueKicker } from '../utils/assignmentUrgency';
import { createStyles } from '../styles/assignments.styles';

const LIST_FILTERS: { id: AssignmentsListFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'week', label: 'This week' },
  { id: 'done', label: 'Done' },
];

export default function AssignmentsScreen() {
  const colors = useThemeColors();
  const { isWideShell } = useBreakpoint();
  const styles = createStyles(colors);

  const {
    assignments,
    loading,
    isError,
    refetch,
    listFilter,
    setListFilter,
    activeGroupId,
    setActiveGroupId,
    assignableGroups,
    subjectGroupId,
    setSubjectGroupId,
    newTitle,
    setNewTitle,
    selectedDate,
    setSelectedDate,
    showDatePicker,
    setShowDatePicker,
    editingTask,
    startEditing,
    cancelEditing,
    saveTask,
    toggleTask,
    deleteTask,
    canManage,
  } = useAssignmentsScreenLogic();

  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [showPickerInline, setShowPickerInline] = useState(false);

  const openCreate = () => {
    cancelEditing();
    setShowPickerInline(false);
    setIsSheetVisible(true);
  };

  const openEdit = (task: TaskItemDto) => {
    startEditing(task);
    setShowPickerInline(false);
    setIsSheetVisible(true);
  };

  const closeSheet = () => {
    cancelEditing();
    setShowPickerInline(false);
    setIsSheetVisible(false);
  };

  const onSave = () => {
    saveTask();
    setIsSheetVisible(false);
    setShowPickerInline(false);
  };

  const renderRow = (task: TaskItemDto, index: number) => {
    const overdue =
      task.dueDate &&
      !task.isCompleted &&
      new Date(task.dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
    const accent = overdue ? colors.error : colors.secondary;

    return (
      <AnimatedItem key={task.id} animation={ClayAnimations.SlideInFlow(index)}>
        <ClayView depth={5} puffy={10} color={colors.card} style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText variant="caption" weight="bold" style={{ color: accent }}>
              {task.groupName ?? 'Coursework'}
            </AppText>
            <AppText variant="caption" weight="bold" style={{ color: overdue ? colors.error : colors.tertiary }}>
              {task.dueDate ? formatDueKicker(task) : 'No due date'}
            </AppText>
          </View>

          <PressClay onPress={() => openEdit(task)}>
            <AppText
              variant="h3"
              weight="bold"
              style={[
                styles.title,
                { color: colors.text },
                task.isCompleted && { textDecorationLine: 'line-through', opacity: 0.55 },
              ]}
              numberOfLines={2}
            >
              {task.title}
            </AppText>
          </PressClay>

          {task.grade != null ? (
            <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: 10 }}>
              Grade: {task.grade}
              {task.maxScore != null ? ` / ${task.maxScore}` : ''}
            </AppText>
          ) : null}

          <View style={styles.actions}>
            {!task.isCompleted ? (
              <AppButton
                title="Mark submitted"
                variant="primary"
                size="sm"
                icon="check"
                onPress={() => toggleTask(task)}
                style={{ flex: 1, marginRight: task.referenceUrl ? 8 : 0 }}
              />
            ) : null}
            {task.referenceUrl ? (
              <AppButton
                title="Materials"
                variant="secondary"
                size="sm"
                icon="open-in-new"
                onPress={() => void Linking.openURL(task.referenceUrl!)}
                style={{ flex: task.isCompleted ? 1 : undefined }}
              />
            ) : null}
            {canManage ? (
              <PressClay onPress={() => deleteTask(task.id)} style={{ marginLeft: 8, padding: 8 }}>
                <Icon name="delete-outline" size={22} color={colors.subtle} />
              </PressClay>
            ) : null}
          </View>
        </ClayView>
      </AnimatedItem>
    );
  };

  return (
    <WidgetPageShell>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ClayBackButton absolute={!isWideShell} />

        <ScreenTransition style={{ flex: 1 }}>
          <SafeAreaView style={styles.container}>
            <View style={styles.headerRow}>
              <AppText variant="h2" weight="bold" style={{ color: colors.text, flex: 1 }}>
                Assignments
              </AppText>
              {canManage ? (
                <PressClay onPress={openCreate}>
                  <ClayView depth={5} puffy={10} color={colors.primary} style={styles.addBtn}>
                    <Icon name="add" size={22} color="#FFF" />
                  </ClayView>
                </PressClay>
              ) : null}
            </View>

            {assignableGroups && assignableGroups.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                <PressClay onPress={() => setActiveGroupId(null)}>
                  <ClayView
                    depth={activeGroupId === null ? 5 : 2}
                    color={activeGroupId === null ? colors.primary : colors.card}
                    style={styles.chip}
                  >
                    <AppText weight="bold" style={{ color: activeGroupId === null ? '#FFF' : colors.text }}>
                      All courses
                    </AppText>
                  </ClayView>
                </PressClay>
                {assignableGroups.map((g: GroupPickerItemDto) => (
                  <PressClay key={g.id} onPress={() => setActiveGroupId(g.id)}>
                    <ClayView
                      depth={activeGroupId === g.id ? 5 : 2}
                      color={activeGroupId === g.id ? colors.primary : colors.card}
                      style={styles.chip}
                    >
                      <AppText
                        weight="bold"
                        numberOfLines={1}
                        style={{ color: activeGroupId === g.id ? '#FFF' : colors.text, maxWidth: 140 }}
                      >
                        {g.name}
                      </AppText>
                    </ClayView>
                  </PressClay>
                ))}
              </ScrollView>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {LIST_FILTERS.map((f) => {
                const active = listFilter === f.id;
                return (
                  <PressClay key={f.id} onPress={() => setListFilter(f.id)}>
                    <ClayView
                      depth={active ? 6 : 2}
                      color={active ? colors.secondary : colors.card}
                      style={styles.chip}
                    >
                      <AppText weight="bold" style={{ color: active ? '#FFF' : colors.subtle }}>
                        {f.label}
                      </AppText>
                    </ClayView>
                  </PressClay>
                );
              })}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
              {loading && assignments.length === 0 ? (
                <View style={{ gap: 12, marginTop: 8 }}>
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} height={140} borderRadius={18} />
                  ))}
                </View>
              ) : isError ? (
                <WidgetErrorState message="Could not load assignments." onRetry={() => void refetch()} />
              ) : assignments.length > 0 ? (
                assignments.map(renderRow)
              ) : (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={{ marginTop: 32 }}>
                  <WidgetEmptyState
                    title={listFilter === 'done' ? 'No completed work' : 'No assignments here'}
                    description={
                      listFilter === 'all'
                        ? 'Coursework from your classes will show up here.'
                        : 'Try another filter or course.'
                    }
                    icon="assignment"
                  />
                </Animated.View>
              )}
            </ScrollView>
          </SafeAreaView>
        </ScreenTransition>

        <CreateTaskBottomSheet
          visible={isSheetVisible}
          onClose={closeSheet}
          editingTask={editingTask}
          newTaskTitle={newTitle}
          onChangeTitle={setNewTitle}
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
          showDatePicker={showDatePicker}
          onShowDatePicker={setShowDatePicker}
          showPickerInline={showPickerInline}
          onShowPickerInline={setShowPickerInline}
          onSave={onSave}
          assignableGroups={assignableGroups ?? []}
          subjectGroupId={subjectGroupId}
          onSubjectGroupIdChange={setSubjectGroupId}
        />
      </View>
    </WidgetPageShell>
  );
}
