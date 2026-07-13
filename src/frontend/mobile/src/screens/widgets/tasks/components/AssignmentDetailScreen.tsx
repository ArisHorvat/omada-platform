import React, { useMemo } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import {
  AppButton,
  AppText,
  ClayView,
  Icon,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
  AppFormField,
} from '@/src/components/ui';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { ScreenTransition } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import { confirmAction } from '@/src/utils/confirmAction';

import { AssignmentStatusBadge } from './AssignmentStatusBadge';
import { useAssignmentDetailLogic } from '../hooks/useAssignmentDetailLogic';
import { createAssignmentDetailStyles } from '../styles/assignmentDetail.styles';
import { formatDueKicker, formatCountdown } from '../utils/taskUrgency';
import { formatWeightPercent } from '../utils/assignmentStatus';
import { TaskAttachmentsList } from './TaskAttachmentsList';
import { TaskAttachmentPicker } from './TaskAttachmentPicker';

export default function AssignmentDetailScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const styles = useMemo(() => createAssignmentDetailStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskId = Array.isArray(id) ? id[0] : id ?? '';

  const {
    task,
    isLoading,
    isError,
    refetch,
    isMutating,
    status,
    isClassWideOffering,
    showStudentActions,
    showGradingPanel,
    submissionUrl,
    setSubmissionUrl,
    submissionAttachments,
    setSubmissionAttachments,
    gradeInput,
    setGradeInput,
    feedbackInput,
    setFeedbackInput,
    saveSubmission,
    markSubmitted,
    saveGrade,
    reopenAssignment,
    undoTurnIn,
    canUndoTurnIn,
    deleteTask,
    isCreator,
  } = useAssignmentDetailLogic(taskId);

  const courseLabel = task?.offeringName ?? task?.groupName ?? 'Coursework';
  const weightLabel = formatWeightPercent(task?.weight);
  const effectiveWeightLabel = formatWeightPercent(task?.effectiveWeight);
  const categoryLabel = task?.gradeCategoryName;
  const dueLabel = task?.dueDate ? formatDueKicker(task) : 'NO DUE DATE';
  const countdown = task?.dueDate ? formatCountdown(new Date(task.dueDate)) : null;

  const handleDelete = () => {
    if (!task) return;
    void confirmAction({
      title: 'Delete assignment?',
      message: 'This cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => {
        deleteTask();
        router.back();
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenTransition>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <PageContainer>
            <ScreenHeader title="Coursework" />

            {isLoading ? (
              <View style={{ padding: 20, gap: 12 }}>
                <Skeleton height={140} borderRadius={24} />
                <Skeleton height={100} borderRadius={20} />
                <Skeleton height={160} borderRadius={20} />
              </View>
            ) : isError || !task ? (
              <WidgetErrorState message="Could not load this assignment." onRetry={refetch} />
            ) : (
              <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <ClayView depth={10} puffy={12} color={colors.card} style={styles.hero}>
                  <View style={styles.heroMeta}>
                    <AssignmentStatusBadge status={status} />
                    <ClayView depth={2} color={`${colors.primary}18`} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                      <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
                        {courseLabel}
                      </AppText>
                    </ClayView>
                  </View>

                  <AppText variant="h2" weight="bold" style={{ color: colors.text, marginBottom: 8 }}>
                    {task.title}
                  </AppText>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Icon name="event" size={18} color={status === 'overdue' ? colors.error : colors.subtle} />
                    <AppText
                      variant="caption"
                      weight="bold"
                      style={{ color: status === 'overdue' ? colors.error : colors.subtle }}
                    >
                      {dueLabel}
                      {countdown ? ` · ${countdown}` : ''}
                    </AppText>
                  </View>

                  {(task.maxScore != null || weightLabel || effectiveWeightLabel) && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                      {task.maxScore != null ? (
                        <AppText variant="caption" weight="bold" style={{ color: colors.secondary }}>
                          {task.maxScore} points
                        </AppText>
                      ) : null}
                      {categoryLabel ? (
                        <AppText variant="caption" weight="bold" style={{ color: colors.tertiary }}>
                          {categoryLabel}
                          {weightLabel ? ` · ${weightLabel} of category` : ''}
                        </AppText>
                      ) : weightLabel ? (
                        <AppText variant="caption" weight="bold" style={{ color: colors.tertiary }}>
                          Worth {weightLabel} of grade
                        </AppText>
                      ) : null}
                      {effectiveWeightLabel && categoryLabel ? (
                        <AppText variant="caption" style={{ color: colors.subtle }}>
                          ({effectiveWeightLabel} of final grade)
                        </AppText>
                      ) : null}
                    </View>
                  )}
                </ClayView>

                {isClassWideOffering ? (
                  <ClayView depth={3} color={colors.card} style={styles.notice}>
                    <AppText variant="body" weight="bold" style={{ marginBottom: 6 }}>
                      Class assignment
                    </AppText>
                    <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 20 }}>
                      This task is posted for your whole course. Follow the instructions below and submit through
                      the channel your instructor provided.
                    </AppText>
                  </ClayView>
                ) : null}

                {task.description ? (
                  <ClayView depth={5} puffy={10} color={colors.card} style={styles.section}>
                    <AppText variant="label" weight="bold" style={styles.sectionTitle}>
                      Instructions
                    </AppText>
                    <AppText variant="body" style={{ color: colors.text, lineHeight: 24 }}>
                      {task.description}
                    </AppText>
                  </ClayView>
                ) : null}

                {(task.referenceUrl || (task.materials?.length ?? 0) > 0) ? (
                  <ClayView depth={5} puffy={10} color={colors.card} style={styles.section}>
                    <TaskAttachmentsList
                      title="Materials"
                      attachments={task.materials ?? []}
                      emptyHint={
                        task.referenceUrl
                          ? undefined
                          : 'No attached files — use the link below if provided.'
                      }
                    />
                    {task.referenceUrl ? (
                      <AppButton
                        title="Open materials link"
                        icon="open-in-new"
                        variant="secondary"
                        onPress={() => void Linking.openURL(task.referenceUrl!)}
                        style={{ marginTop: task.materials?.length ? 8 : 0 }}
                      />
                    ) : null}
                  </ClayView>
                ) : null}

                {status === 'graded' || task.grade != null ? (
                  <ClayView
                    depth={8}
                    contentOverflow="visible"
                    color={`${colors.primary}14`}
                    style={styles.section}
                  >
                    <AppText variant="label" weight="bold" style={styles.sectionTitle}>
                      Your grade
                    </AppText>
                    <View style={styles.gradeDisplay}>
                      <AppText
                        variant="display"
                        weight="bold"
                        style={{ color: colors.primary, fontSize: 44, lineHeight: 52 }}
                      >
                        {task.grade}
                      </AppText>
                      {task.maxScore != null ? (
                        <AppText variant="h3" style={{ color: colors.subtle }}>
                          / {task.maxScore}
                        </AppText>
                      ) : null}
                    </View>
                    {task.teacherFeedback ? (
                      <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
                        {task.teacherFeedback}
                      </AppText>
                    ) : null}
                  </ClayView>
                ) : null}

                {showStudentActions && status === 'submitted' ? (
                  <ClayView depth={5} puffy={10} color={colors.card} style={styles.section}>
                    <AppText variant="label" weight="bold" style={styles.sectionTitle}>
                      Turned in
                    </AppText>
                    <TaskAttachmentsList
                      title="Your files"
                      attachments={task.submissionAttachments ?? []}
                      emptyHint={
                        task.submissionUrl
                          ? 'Primary link below — no attached files.'
                          : 'Marked complete with no attachments.'
                      }
                    />
                    {task.submissionUrl ? (
                      <AppButton
                        title="View submitted link"
                        variant="outline"
                        icon="open-in-new"
                        onPress={() => void Linking.openURL(task.submissionUrl!)}
                        style={{ marginTop: 8 }}
                      />
                    ) : null}
                    {canUndoTurnIn ? (
                      <AppButton
                        title="Undo turn in"
                        variant="secondary"
                        icon="undo"
                        onPress={undoTurnIn}
                        loading={isMutating}
                        style={{ marginTop: 12 }}
                      />
                    ) : null}
                  </ClayView>
                ) : null}

                {showStudentActions && status !== 'graded' && status !== 'submitted' ? (
                  <ClayView depth={5} puffy={10} color={colors.card} style={styles.section}>
                    <AppText variant="label" weight="bold" style={styles.sectionTitle}>
                      Your submission
                    </AppText>
                    <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
                      Attach your work (PDF, Word, etc.) and/or paste a link, then turn in.
                    </AppText>
                    <AppFormField
                      label="Primary submission link"
                      placeholder="https://…"
                      value={submissionUrl}
                      onChangeText={setSubmissionUrl}
                      autoCapitalize="none"
                      keyboardType="url"
                      icon="link"
                    />
                    <TaskAttachmentPicker
                      label="Attached files"
                      hint="Upload your work (PDF, Word, etc.)"
                      attachments={submissionAttachments}
                      onChange={setSubmissionAttachments}
                      attachmentKind="submission"
                    />
                    <View style={styles.stackedActions}>
                      <AppButton
                        title="Turn in"
                        icon="upload"
                        onPress={saveSubmission}
                        loading={isMutating}
                        style={styles.actionFull}
                      />
                      <AppButton
                        title="Mark done"
                        variant="secondary"
                        icon="check"
                        onPress={markSubmitted}
                        loading={isMutating}
                        style={styles.actionFull}
                      />
                    </View>
                  </ClayView>
                ) : null}

                {showGradingPanel ? (
                  <ClayView depth={5} puffy={10} color={colors.card} style={styles.section}>
                    <AppText variant="label" weight="bold" style={styles.sectionTitle}>
                      Grading
                    </AppText>
                    {task.submissionUrl || (task.submissionAttachments?.length ?? 0) > 0 ? (
                      <View style={{ marginBottom: 12 }}>
                        <TaskAttachmentsList
                          title="Student work"
                          attachments={task.submissionAttachments ?? []}
                        />
                        {task.submissionUrl ? (
                          <AppButton
                            title="View primary submission link"
                            variant="outline"
                            icon="open-in-new"
                            onPress={() => void Linking.openURL(task.submissionUrl!)}
                            style={{ marginTop: 8 }}
                          />
                        ) : null}
                      </View>
                    ) : null}
                    <AppFormField
                      label="Score"
                      placeholder={task.maxScore != null ? `Out of ${task.maxScore}` : 'Points'}
                      value={gradeInput}
                      onChangeText={setGradeInput}
                      keyboardType="numeric"
                      icon="grade"
                    />
                    <AppFormField
                      label="Feedback"
                      placeholder="Comments for the student"
                      value={feedbackInput}
                      onChangeText={setFeedbackInput}
                      multiline
                      numberOfLines={4}
                      icon="chat-bubble-outline"
                    />
                    <View style={task.isCompleted || task.grade != null ? styles.stackedActions : styles.rowActions}>
                      <AppButton
                        title="Save grade"
                        icon="save"
                        onPress={saveGrade}
                        loading={isMutating}
                        style={task.isCompleted || task.grade != null ? styles.actionFull : { flex: 1 }}
                      />
                      {task.isCompleted || task.grade != null ? (
                        <AppButton
                          title="Reopen"
                          variant="secondary"
                          onPress={reopenAssignment}
                          loading={isMutating}
                          style={styles.actionFull}
                        />
                      ) : null}
                    </View>
                  </ClayView>
                ) : null}

                {isCreator ? (
                  <AppButton
                    title="Delete assignment"
                    variant="outline"
                    icon="delete-outline"
                    onPress={handleDelete}
                    style={{ marginTop: 8 }}
                  />
                ) : null}
              </ScrollView>
            )}
          </PageContainer>
        </SafeAreaView>
      </ScreenTransition>
    </View>
  );
}
