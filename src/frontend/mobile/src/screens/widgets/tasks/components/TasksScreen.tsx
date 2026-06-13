import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { AppButton, Skeleton, WidgetEmptyState, WidgetErrorState } from '@/src/components/ui';
import { useTasksScreenLogic } from '../hooks/useTasksLogic';
import { ScreenTransition } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';
import { TaskItemDto } from '@/src/api/generatedClient';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { usePermission } from '@/src/context/PermissionContext';
import { useTabContentBottomPadding, useThemeColors } from '@/src/hooks';
import { canTeachCoursework } from '@/src/utils/courseworkTeachingAccess';
import { TaskListRow } from './TaskListRow';
import { CourseworkSummaryHero } from './CourseworkSummaryHero';
import { TasksInboxFilters } from './TasksInboxFilters';
import { getEmptyStateCopy, getTasksScreenTitle } from '../utils/taskLabels';
import { openAssignmentDetail } from '../utils/assignmentNavigation';
import { createTasksInboxStyles } from '../styles/tasksInbox.styles';

export default function TasksScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { can } = usePermission();
  const tabBottomPad = useTabContentBottomPadding(32);
  const inboxStyles = useMemo(() => createTasksInboxStyles(colors), [colors]);

  const {
    loading,
    isError,
    refetchTasks,
    allTasks,
    listMode,
    setListMode,
    timeFilter,
    setTimeFilter,
    canSubmitCoursework,
    toggleTask,
    tasks,
    activeScopeKey,
    setActiveScopeKey,
    scopeOptions,
    inboxMode,
    isCourseworkInbox,
  } = useTasksScreenLogic();

  const showTeachCoursework = isCourseworkInbox && canTeachCoursework(can);
  const screenTitle = getTasksScreenTitle(inboxMode);
  const emptyCopy = getEmptyStateCopy(listMode, inboxMode);

  const openCoursework = (task: TaskItemDto) => {
    openAssignmentDetail(router, task);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenTransition>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <PageContainer>
            <Animated.View entering={ClayAnimations.Header}>
              <ScreenHeader title={screenTitle} />
              {showTeachCoursework ? (
                <AppButton
                  title="Teach coursework"
                  icon="school"
                  variant="secondary"
                  onPress={() => router.push('/coursework-teaching' as never)}
                  style={{ marginBottom: 12 }}
                />
              ) : null}
            </Animated.View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={[
                inboxStyles.listContent,
                { paddingBottom: tabBottomPad },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {isCourseworkInbox ? (
                <CourseworkSummaryHero
                  tasks={allTasks}
                  loading={loading}
                  onNextPress={(task) => openAssignmentDetail(router, task)}
                />
              ) : null}

              <TasksInboxFilters
                inboxMode={inboxMode}
                scopeOptions={scopeOptions}
                activeScopeKey={activeScopeKey}
                onScopeChange={setActiveScopeKey}
                listMode={listMode}
                onListModeChange={setListMode}
                timeFilter={timeFilter}
                onTimeFilterChange={setTimeFilter}
              />

              {loading ? (
                <View style={{ marginTop: 8, gap: 16 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} height={88} borderRadius={24} />
                  ))}
                </View>
              ) : isError ? (
                <WidgetErrorState message="Could not load tasks." onRetry={() => void refetchTasks()} />
              ) : tasks.length > 0 ? (
                <View style={{ marginTop: 4 }}>
                  {tasks.map((task, index) => (
                    <TaskListRow
                      key={task.id}
                      task={task}
                      index={index}
                      isUniversity={isCourseworkInbox}
                      canSubmitCoursework={canSubmitCoursework}
                      onToggle={toggleTask}
                      onPress={isCourseworkInbox ? openCoursework : undefined}
                    />
                  ))}
                </View>
              ) : (
                <View style={inboxStyles.emptyWrap}>
                  <WidgetEmptyState
                    title={emptyCopy.title}
                    description={emptyCopy.description}
                    icon="done-all"
                  />
                </View>
              )}
            </ScrollView>
          </PageContainer>
        </SafeAreaView>
      </ScreenTransition>
    </View>
  );
}
