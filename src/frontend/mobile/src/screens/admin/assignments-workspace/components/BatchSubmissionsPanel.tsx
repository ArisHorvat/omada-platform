import React from 'react';
import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { AppButton, AppText, ClayView, Icon, Skeleton } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import { assignmentsBatchApi } from '@/src/api/assignmentsBatchApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { TaskAttachmentsList } from '@/src/screens/widgets/tasks/components/TaskAttachmentsList';

type Props = {
  batchId: string;
  expanded: boolean;
  onToggle: () => void;
};

export function BatchSubmissionsPanel({ batchId, expanded, onToggle }: Props) {
  const colors = useThemeColors();
  const router = useRouter();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const submissionsQuery = useQuery({
    queryKey: [...QUERY_KEYS.tasks.batches(orgId, 1, 50), 'submissions', batchId],
    queryFn: () => assignmentsBatchApi.getSubmissions(batchId),
    enabled: expanded && !!orgId && !!batchId,
    staleTime: 1000 * 30,
  });

  const rows = submissionsQuery.data ?? [];

  return (
    <View style={{ marginTop: 12 }}>
      <PressClay onPress={onToggle}>
        <ClayView depth={2} color={colors.background} style={{ padding: 10, borderRadius: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name={expanded ? 'expand-less' : 'expand-more'} size={22} color={colors.primary} />
            <AppText variant="body" weight="bold" style={{ flex: 1 }}>
              Student submissions
            </AppText>
            {!expanded && rows.length > 0 ? (
              <AppText variant="caption" style={{ color: colors.subtle }}>
                {rows.filter((r) => r.isCompleted).length}/{rows.length} turned in
              </AppText>
            ) : null}
          </View>
        </ClayView>
      </PressClay>

      {expanded ? (
        <View style={{ marginTop: 8, gap: 8 }}>
          {submissionsQuery.isLoading ? (
            <>
              <Skeleton height={72} borderRadius={12} />
              <Skeleton height={72} borderRadius={12} />
            </>
          ) : submissionsQuery.isError ? (
            <AppText variant="caption" style={{ color: colors.error, paddingHorizontal: 4 }}>
              Could not load submissions.
            </AppText>
          ) : rows.length === 0 ? (
            <AppText variant="caption" style={{ color: colors.subtle, paddingHorizontal: 4 }}>
              No students assigned.
            </AppText>
          ) : (
            rows.map((row) => {
              const statusLabel = row.grade != null ? 'Graded' : row.isCompleted ? 'Turned in' : 'Not submitted';
              const statusColor =
                row.grade != null ? colors.tertiary : row.isCompleted ? colors.secondary : colors.subtle;

              return (
                <ClayView key={row.taskId} depth={3} color={colors.background} style={{ padding: 12, borderRadius: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <AppText variant="body" weight="bold" style={{ flex: 1 }}>
                      {row.studentName}
                    </AppText>
                    <AppText variant="caption" weight="bold" style={{ color: statusColor }}>
                      {statusLabel}
                      {row.grade != null ? ` · ${row.grade}` : ''}
                    </AppText>
                  </View>

                  {row.isCompleted || row.submissionUrl || (row.submissionAttachments?.length ?? 0) > 0 ? (
                    <TaskAttachmentsList
                      title="Submitted work"
                      attachments={row.submissionAttachments ?? []}
                      emptyHint={row.submissionUrl ? undefined : 'No files attached'}
                    />
                  ) : (
                    <AppText variant="caption" style={{ color: colors.subtle }}>
                      No submission yet.
                    </AppText>
                  )}

                  {row.submissionUrl ? (
                    <AppButton
                      title="Open submission link"
                      variant="outline"
                      size="sm"
                      icon="open-in-new"
                      onPress={() => void Linking.openURL(row.submissionUrl!)}
                      style={{ marginTop: 8, alignSelf: 'flex-start' }}
                    />
                  ) : null}

                  <AppButton
                    title="Open to grade"
                    variant="secondary"
                    size="sm"
                    icon="rate-review"
                    onPress={() => router.push(`/assignment/${row.taskId}` as never)}
                    style={{ marginTop: 8, alignSelf: 'flex-start' }}
                  />
                </ClayView>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
}
