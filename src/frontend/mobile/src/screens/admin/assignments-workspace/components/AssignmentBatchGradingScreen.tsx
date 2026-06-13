import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { PageContainer } from '@/src/components/layout/PageContainer';
import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import {
  AppButton,
  AppFormField,
  AppText,
  Icon,
  Skeleton,
  WidgetErrorState,
} from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { OptionPickerSheet } from '@/src/components/filters/OptionPickerSheet';
import { useThemeColors } from '@/src/hooks';
import {
  assignmentsBatchApi,
  type AssignmentBatchSubmissionDto,
} from '@/src/api/assignmentsBatchApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import {
  buildTaskUpdateFromDto,
  getTaskExtended,
  updateTaskExtended,
} from '@/src/api/tasksWorkApi';
import { alertAction } from '@/src/utils/confirmAction';
import { SearchBar } from '@/src/screens/widgets/dashboard/components/SearchBar';
import { toAbsoluteUrl } from '@/src/utils/toAbsoluteMediaUrl';

type SubmissionFilter = 'all' | 'on_time' | 'late' | 'missing' | 'graded' | 'not_graded';

function matchesFilter(row: AssignmentBatchSubmissionDto, filter: SubmissionFilter): boolean {
  switch (filter) {
    case 'on_time':
      return row.isCompleted && !row.isLate;
    case 'late':
      return row.isCompleted && row.isLate;
    case 'missing':
      return !row.isCompleted;
    case 'graded':
      return row.grade != null;
    case 'not_graded':
      return row.isCompleted && row.grade == null;
    default:
      return true;
  }
}

function statusLabel(row: AssignmentBatchSubmissionDto): string {
  if (row.grade != null) return `Graded · ${row.grade}`;
  if (!row.isCompleted) return 'Not turned in';
  return row.isLate ? 'Late' : 'On time';
}

function submissionSummary(row: AssignmentBatchSubmissionDto): string {
  const fileCount = row.submissionAttachments?.length ?? 0;
  if (row.submissionUrl && fileCount > 0) return `Link + ${fileCount} file${fileCount === 1 ? '' : 's'}`;
  if (row.submissionUrl) return 'Link submitted';
  if (fileCount > 0) return `${fileCount} file${fileCount === 1 ? '' : 's'}`;
  if (row.isCompleted) return 'Marked complete (no files)';
  return 'Nothing submitted';
}

export default function AssignmentBatchGradingScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const params = useLocalSearchParams<{
    batchId: string;
    title?: string;
    dueDate?: string;
    maxScore?: string;
  }>();
  const batchId = Array.isArray(params.batchId) ? params.batchId[0] : params.batchId ?? '';
  const batchTitle = params.title ?? 'Coursework';
  const maxScoreHint = params.maxScore ? ` / ${params.maxScore}` : '';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SubmissionFilter>('all');
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);
  const [gradingRow, setGradingRow] = useState<AssignmentBatchSubmissionDto | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  const cardStyle = useMemo(
    () => ({
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    }),
    [colors.border, colors.card],
  );

  const submissionsQuery = useQuery({
    queryKey: [...QUERY_KEYS.tasks.batches(orgId, 1, 50), 'submissions', batchId],
    queryFn: () => assignmentsBatchApi.getSubmissions(batchId),
    enabled: !!orgId && !!batchId,
  });

  const rows = submissionsQuery.data ?? [];

  const groupOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.cohortGroupId && row.cohortGroupName) {
        map.set(row.cohortGroupId, row.cohortGroupName);
      }
    }
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (!matchesFilter(row, filter)) return false;
      if (groupFilter && row.cohortGroupId !== groupFilter) return false;
      if (q && !row.studentName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, filter, groupFilter, search]);

  const gradeMutation = useMutation({
    mutationFn: async ({ taskId, grade, feedback }: { taskId: string; grade?: number; feedback?: string }) => {
      const task = await getTaskExtended(taskId);
      return updateTaskExtended(
        taskId,
        buildTaskUpdateFromDto(task, {
          grade,
          teacherFeedback: feedback,
        }),
      );
    },
    onSuccess: async () => {
      setGradingRow(null);
      setGradeInput('');
      setFeedbackInput('');
      await queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.tasks.batches(orgId, 1, 50), 'submissions', batchId],
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all(orgId) });
    },
    onError: (e: Error) => {
      void alertAction({ title: 'Could not save grade', message: e.message });
    },
  });

  const openGrade = (row: AssignmentBatchSubmissionDto) => {
    setGradingRow(row);
    setGradeInput(row.grade != null ? String(row.grade) : '');
    setFeedbackInput(row.teacherFeedback ?? '');
  };

  const saveGrade = () => {
    if (!gradingRow) return;
    const grade = gradeInput.trim() ? Number(gradeInput) : undefined;
    if (gradeInput.trim() && (grade == null || Number.isNaN(grade))) return;
    gradeMutation.mutate({
      taskId: gradingRow.taskId,
      grade,
      feedback: feedbackInput.trim() || undefined,
    });
  };

  const filterChips: { id: SubmissionFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'on_time', label: 'On time' },
    { id: 'late', label: 'Late' },
    { id: 'missing', label: 'Missing' },
    { id: 'not_graded', label: 'To grade' },
    { id: 'graded', label: 'Graded' },
  ];

  const groupLabel =
    groupOptions.find((g) => g.value === groupFilter)?.label ?? 'All groups';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageContainer>
          <ScreenHeader title="Grade students" onBack={() => router.back()} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 10 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={cardStyle}>
              <AppText variant="h3" weight="bold" numberOfLines={2}>
                {batchTitle}
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                {rows.length} students · {rows.filter((r) => r.isCompleted).length} turned in
                {params.dueDate ? ` · Due ${new Date(params.dueDate).toLocaleDateString()}` : ''}
              </AppText>
            </View>

            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name…"
              compact
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6 }}
            >
              {filterChips.map((chip) => {
                const active = filter === chip.id;
                return (
                  <PressClay key={chip.id} onPress={() => setFilter(chip.id)}>
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 8,
                        backgroundColor: active ? colors.primary : colors.card,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.border,
                      }}
                    >
                      <AppText
                        variant="caption"
                        weight="bold"
                        style={{ color: active ? '#FFF' : colors.text }}
                      >
                        {chip.label}
                      </AppText>
                    </View>
                  </PressClay>
                );
              })}
            </ScrollView>

            {groupOptions.length > 0 ? (
              <PressClay onPress={() => setGroupPickerOpen(true)}>
                <View
                  style={{
                    ...cardStyle,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 10,
                  }}
                >
                  <Icon name="groups" size={18} color={colors.secondary} />
                  <AppText variant="caption" weight="bold" style={{ flex: 1 }}>
                    {groupLabel}
                  </AppText>
                  <Icon name="expand-more" size={20} color={colors.subtle} />
                </View>
              </PressClay>
            ) : null}

            {submissionsQuery.isLoading ? (
              <View style={{ gap: 8 }}>
                <Skeleton height={52} borderRadius={12} />
                <Skeleton height={52} borderRadius={12} />
              </View>
            ) : submissionsQuery.isError ? (
              <WidgetErrorState
                message="Could not load students for this assignment."
                onRetry={() => void submissionsQuery.refetch()}
              />
            ) : filteredRows.length === 0 ? (
              <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'center', marginTop: 8 }}>
                No students match these filters.
              </AppText>
            ) : (
              <View style={{ gap: 6 }}>
                {filteredRows.map((row) => {
                  const isActive = gradingRow?.taskId === row.taskId;
                  const statusColor =
                    row.grade != null
                      ? colors.tertiary
                      : row.isCompleted
                        ? row.isLate
                          ? colors.error
                          : colors.secondary
                        : colors.subtle;

                  return (
                    <View key={row.taskId} style={{ gap: 6 }}>
                      <View
                        style={{
                          ...cardStyle,
                          paddingVertical: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          borderColor: isActive ? colors.primary : colors.border,
                          borderWidth: isActive ? 2 : 1,
                        }}
                      >
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <AppText variant="body" weight="bold" numberOfLines={1}>
                            {row.studentName}
                          </AppText>
                          <AppText variant="caption" style={{ color: statusColor }} numberOfLines={1}>
                            {statusLabel(row)}
                            {row.cohortGroupName ? ` · ${row.cohortGroupName}` : ''}
                          </AppText>
                          {row.isCompleted || row.submissionUrl || (row.submissionAttachments?.length ?? 0) > 0 ? (
                            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }} numberOfLines={1}>
                              {submissionSummary(row)}
                            </AppText>
                          ) : null}
                        </View>
                        <AppButton
                          title={isActive ? 'Close' : row.grade != null ? 'Edit' : 'Grade'}
                          size="sm"
                          variant={row.grade != null ? 'outline' : 'secondary'}
                          onPress={() => (isActive ? setGradingRow(null) : openGrade(row))}
                        />
                      </View>

                      {isActive && gradingRow ? (
                        <View
                          style={{
                            ...cardStyle,
                            borderColor: colors.primary,
                            gap: 12,
                            marginBottom: 4,
                          }}
                        >
                          <View
                            style={{
                              borderBottomWidth: 1,
                              borderBottomColor: colors.border,
                              paddingBottom: 12,
                            }}
                          >
                            <AppText variant="label" weight="bold" style={{ marginBottom: 8 }}>
                              Student submission
                            </AppText>

                            {!gradingRow.isCompleted &&
                            !gradingRow.submissionUrl &&
                            !(gradingRow.submissionAttachments?.length ?? 0) ? (
                              <AppText variant="body" style={{ color: colors.subtle }}>
                                No work turned in yet.
                              </AppText>
                            ) : (
                              <>
                                {gradingRow.submissionUrl ? (
                                  <AppButton
                                    title="Open submitted link"
                                    variant="outline"
                                    size="sm"
                                    icon="open-in-new"
                                    onPress={() =>
                                      void Linking.openURL(toAbsoluteUrl(gradingRow.submissionUrl!))
                                    }
                                    style={{ alignSelf: 'flex-start', marginBottom: 8 }}
                                  />
                                ) : null}

                                {(gradingRow.submissionAttachments?.length ?? 0) > 0 ? (
                                  <View style={{ gap: 6 }}>
                                    <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
                                      Attached files
                                    </AppText>
                                    {gradingRow.submissionAttachments!.map((file, idx) => (
                                      <PressClay
                                        key={`${file.url}-${idx}`}
                                        onPress={() => void Linking.openURL(toAbsoluteUrl(file.url))}
                                      >
                                        <View
                                          style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 8,
                                            paddingVertical: 8,
                                            paddingHorizontal: 10,
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            borderRadius: 8,
                                            backgroundColor: colors.background,
                                          }}
                                        >
                                          <Icon name="attach-file" size={18} color={colors.primary} />
                                          <AppText variant="body" numberOfLines={1} style={{ flex: 1 }}>
                                            {file.fileName?.trim() || file.url}
                                          </AppText>
                                          <Icon name="open-in-new" size={16} color={colors.subtle} />
                                        </View>
                                      </PressClay>
                                    ))}
                                  </View>
                                ) : gradingRow.isCompleted ? (
                                  <AppText variant="caption" style={{ color: colors.subtle }}>
                                    Marked complete without files or a link.
                                  </AppText>
                                ) : null}
                              </>
                            )}
                          </View>

                          <View>
                            <AppText variant="label" weight="bold" style={{ marginBottom: 8 }}>
                              Your grade{maxScoreHint}
                            </AppText>
                            <AppFormField
                              label="Score"
                              placeholder="e.g. 18"
                              value={gradeInput}
                              onChangeText={setGradeInput}
                              keyboardType="decimal-pad"
                            />
                            <AppFormField
                              label="Feedback (optional)"
                              placeholder="Comment for the student"
                              value={feedbackInput}
                              onChangeText={setFeedbackInput}
                              multiline
                              numberOfLines={3}
                            />
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <AppButton
                                title="Cancel"
                                variant="outline"
                                onPress={() => setGradingRow(null)}
                                style={{ flex: 1 }}
                              />
                              <AppButton
                                title={gradeMutation.isPending ? 'Saving…' : 'Save grade'}
                                onPress={saveGrade}
                                loading={gradeMutation.isPending}
                                style={{ flex: 1 }}
                              />
                            </View>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <OptionPickerSheet
            isVisible={groupPickerOpen}
            onClose={() => setGroupPickerOpen(false)}
            title="Filter by group"
            options={[{ value: '', label: 'All groups' }, ...groupOptions]}
            selected={groupFilter ?? ''}
            onSelect={(id) => setGroupFilter(id || null)}
            includeAllOption={false}
            height={360}
          />
        </PageContainer>
      </SafeAreaView>
    </View>
  );
}
