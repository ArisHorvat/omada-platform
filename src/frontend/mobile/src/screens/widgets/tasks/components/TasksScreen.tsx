import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import {
  AppText,
  Icon,
  ClayView,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { useTasksScreenLogic } from '../hooks/useTasksLogic';
import { ScreenTransition, AnimatedItem, PressClay } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';
import { TaskItemDto, type GroupPickerItemDto } from '@/src/api/generatedClient';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { useTabContentBottomPadding } from '@/src/hooks';
import { CreateTaskBottomSheet } from './CreateTaskBottomSheet';

export default function TasksScreen() {
  const { colors } = useTheme();
  const tabBottomPad = useTabContentBottomPadding(32);

  const {
    loading,
    isError,
    refetchTasks,
    newTaskTitle,
    setNewTaskTitle,
    showCompleted,
    setShowCompleted,
    activeList,
    setActiveList,
    showDatePicker,
    setShowDatePicker,
    selectedDate,
    setSelectedDate,
    handleAddTask,
    toggleTask,
    deleteTask,
    tasks,
    editingTask,
    startEditing,
    cancelEditing,
    activeGroupId,
    setActiveGroupId,
    assignableGroups,
    subjectGroupId,
    setSubjectGroupId,
    canCreateTasks,
  } = useTasksScreenLogic();

  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [showPickerInline, setShowPickerInline] = useState(false);
  const lists = ['All', 'Overdue', 'Today', 'Tomorrow', 'Upcoming'];

  const openCreateSheet = () => {
    cancelEditing();
    setShowPickerInline(false);
    setIsSheetVisible(true);
  };

  const openEditSheet = (task: TaskItemDto) => {
    startEditing(task);
    setShowPickerInline(false);
    setIsSheetVisible(true);
  };

  const closeSheet = () => {
    cancelEditing();
    setShowPickerInline(false);
    setIsSheetVisible(false);
  };

  const onSaveTask = () => {
    handleAddTask();
    setIsSheetVisible(false);
    setShowPickerInline(false);
  };

  const renderTask = (task: TaskItemDto, index: number) => {
    const isOverdue =
      task.dueDate &&
      new Date(task.dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0) &&
      !task.isCompleted;
    const accentColor = isOverdue ? colors.error : colors.primary;

    return (
      <AnimatedItem key={task.id} animation={ClayAnimations.SlideInFlow(index)}>
        <ClayView
          depth={5}
          puffy={10}
          color={colors.card}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, marginBottom: 16 }}
        >
          <PressClay onPress={() => toggleTask(task)} style={{ marginRight: 16 }}>
            <View
              style={[
                { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
                task.isCompleted && { backgroundColor: accentColor, borderColor: accentColor },
                !task.isCompleted && { borderColor: accentColor },
              ]}
            >
              {task.isCompleted ? <Icon name="check" size={16} color="#FFF" /> : null}
            </View>
          </PressClay>

          <PressClay onPress={() => openEditSheet(task)} style={{ flex: 1, paddingRight: 12 }}>
            <AppText
              weight={task.isCompleted ? 'regular' : 'bold'}
              style={[
                { fontSize: 16, color: colors.text },
                task.isCompleted && { textDecorationLine: 'line-through', opacity: 0.5 },
              ]}
            >
              {task.title}
            </AppText>

            {task.groupName ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Icon name="groups" size={14} color={colors.subtle} />
                <AppText variant="caption" style={{ color: colors.subtle, marginLeft: 6 }}>
                  {task.groupName}
                </AppText>
              </View>
            ) : null}

            {task.dueDate ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <Icon name="event" size={14} color={isOverdue && !task.isCompleted ? colors.error : colors.subtle} />
                <AppText
                  variant="caption"
                  weight="bold"
                  style={{
                    color: isOverdue && !task.isCompleted ? colors.error : colors.subtle,
                    marginLeft: 6,
                  }}
                >
                  {isOverdue && !task.isCompleted ? 'OVERDUE • ' : 'Due: '}
                  {new Date(task.dueDate).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </AppText>
              </View>
            ) : null}
          </PressClay>

          <PressClay onPress={() => deleteTask(task.id)}>
            <Icon name="delete-outline" size={24} color={colors.subtle} />
          </PressClay>
        </ClayView>
      </AnimatedItem>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenTransition>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <PageContainer>
          <Animated.View entering={ClayAnimations.Header}>
            <ScreenHeader
              title="Tasks"
              right={
                <PressClay onPress={() => setShowCompleted(!showCompleted)}>
                  <ClayView
                    depth={5}
                    puffy={10}
                    color={showCompleted ? colors.primary : colors.card}
                    style={{ padding: 10, borderRadius: 16 }}
                  >
                    <Icon
                      name={showCompleted ? 'task-alt' : 'format-list-bulleted'}
                      size={24}
                      color={showCompleted ? '#FFF' : colors.primary}
                    />
                  </ClayView>
                </PressClay>
              }
            />
          </Animated.View>

          {assignableGroups && assignableGroups.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 10 }}
            >
              <PressClay onPress={() => setActiveGroupId(null)}>
                <ClayView
                  depth={activeGroupId === null ? 5 : 2}
                  color={activeGroupId === null ? colors.primary : colors.card}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 }}
                >
                  <AppText weight="bold" style={{ color: activeGroupId === null ? '#FFF' : colors.text }}>
                    All groups
                  </AppText>
                </ClayView>
              </PressClay>
              {assignableGroups.map((g: GroupPickerItemDto) => (
                <PressClay key={g.id} onPress={() => setActiveGroupId(g.id)}>
                  <ClayView
                    depth={activeGroupId === g.id ? 5 : 2}
                    color={activeGroupId === g.id ? colors.primary : colors.card}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 }}
                  >
                    <AppText
                      weight="bold"
                      numberOfLines={1}
                      style={{ color: activeGroupId === g.id ? '#FFF' : colors.text, maxWidth: 160 }}
                    >
                      {g.name}
                    </AppText>
                  </ClayView>
                </PressClay>
              ))}
            </ScrollView>
          ) : null}

          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 16 }}
            >
              {lists.map((list, index) => {
                const isActive = activeList === list;
                return (
                  <Animated.View key={list} entering={ClayAnimations.Chip(index)}>
                    <PressClay onPress={() => setActiveList(list)}>
                      <ClayView
                        depth={isActive ? 8 : 2}
                        puffy={isActive ? 15 : 5}
                        color={isActive ? colors.primary : colors.card}
                        style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
                      >
                        <AppText weight="bold" style={{ color: isActive ? '#FFF' : colors.subtle }}>
                          {list}
                        </AppText>
                      </ClayView>
                    </PressClay>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: tabBottomPad }}
          >
            {loading ? (
              <View style={{ marginTop: 16, gap: 16 }}>
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} height={88} borderRadius={24} />
                ))}
              </View>
            ) : isError ? (
              <WidgetErrorState message="Could not load tasks." onRetry={() => void refetchTasks()} />
            ) : tasks.length > 0 ? (
              tasks.map(renderTask)
            ) : (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={{ marginTop: 24 }}>
                <WidgetEmptyState
                  title="All clear"
                  description="You have no tasks in this view."
                  icon="done-all"
                />
              </Animated.View>
            )}
          </ScrollView>

          <Animated.View
            entering={ClayAnimations.FAB}
            style={{ position: 'absolute', bottom: tabBottomPad + 16, right: 20 }}
          >
            <PressClay onPress={openCreateSheet}>
              <ClayView
                depth={15}
                puffy={20}
                color={colors.primary}
                style={{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="add" size={30} color="#FFF" />
              </ClayView>
            </PressClay>
          </Animated.View>

          <CreateTaskBottomSheet
            visible={isSheetVisible}
            onClose={closeSheet}
            editingTask={editingTask}
            newTaskTitle={newTaskTitle}
            onChangeTitle={setNewTaskTitle}
            selectedDate={selectedDate}
            onChangeDate={setSelectedDate}
            showDatePicker={showDatePicker}
            onShowDatePicker={setShowDatePicker}
            showPickerInline={showPickerInline}
            onShowPickerInline={setShowPickerInline}
            onSave={onSaveTask}
            assignableGroups={assignableGroups ?? []}
            subjectGroupId={subjectGroupId}
            onSubjectGroupIdChange={setSubjectGroupId}
          />
          </PageContainer>
        </SafeAreaView>
      </ScreenTransition>
    </View>
  );
}
