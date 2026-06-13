import React, { useMemo } from 'react';
import { Linking, View } from 'react-native';

import {
  AppButton,
  AppText,
  ClayView,
  Icon,
} from '@/src/components/ui';
import { AnimatedItem, PressClay } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';
import type { TaskItemDto } from '@/src/api/generatedClient';
import { useThemeColors } from '@/src/hooks';

import { AssignmentStatusBadge } from './AssignmentStatusBadge';
import { getAssignmentStatus, formatWeightPercent } from '../utils/assignmentStatus';
import { formatDueKicker } from '../utils/taskUrgency';

interface TaskListRowProps {
  task: TaskItemDto;
  index: number;
  isUniversity?: boolean;
  canSubmitCoursework: boolean;
  onToggle: (task: TaskItemDto) => void;
  onPress?: (task: TaskItemDto) => void;
}

export function TaskListRow({
  task,
  index,
  isUniversity,
  canSubmitCoursework,
  onToggle,
  onPress,
}: TaskListRowProps) {
  const colors = useThemeColors();
  const status = useMemo(() => getAssignmentStatus(task), [task]);
  const isOverdue = status === 'overdue';
  const courseLabel = task.offeringName ?? task.groupName;
  const weightLabel = formatWeightPercent(task.weight);

  if (isUniversity) {
    const accent = isOverdue ? colors.error : colors.secondary;

    return (
      <AnimatedItem key={task.id} animation={ClayAnimations.SlideInFlow(index)}>
        <PressClay onPress={() => onPress?.(task)}>
          <ClayView
            depth={5}
            puffy={10}
            color={colors.card}
            style={{
              padding: 16,
              borderRadius: 18,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: `${colors.subtle}33`,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <AssignmentStatusBadge status={status} compact />
                {courseLabel ? (
                  <AppText variant="caption" weight="bold" style={{ color: accent, flex: 1 }} numberOfLines={1}>
                    {courseLabel}
                  </AppText>
                ) : null}
              </View>
              <AppText variant="caption" weight="bold" style={{ color: isOverdue ? colors.error : colors.tertiary }}>
                {task.dueDate ? formatDueKicker(task) : 'No due date'}
              </AppText>
            </View>

            <AppText
              variant="h3"
              weight="bold"
              style={[
                { marginBottom: 8, color: colors.text },
                task.isCompleted && { textDecorationLine: 'line-through', opacity: 0.55 },
              ]}
              numberOfLines={2}
            >
              {task.title}
            </AppText>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
              {task.maxScore != null ? (
                <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
                  {task.maxScore} pts
                </AppText>
              ) : null}
              {weightLabel ? (
                <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
                  {weightLabel} of grade
                </AppText>
              ) : null}
              {task.grade != null ? (
                <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
                  Grade {task.grade}
                  {task.maxScore != null ? ` / ${task.maxScore}` : ''}
                </AppText>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {!task.isCompleted && canSubmitCoursework ? (
                <AppButton
                  title="Turn in"
                  variant="primary"
                  size="sm"
                  icon="upload"
                  onPress={() => onPress?.(task)}
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

              <Icon name="chevron-right" size={22} color={colors.subtle} style={{ marginLeft: 4 }} />
            </View>
          </ClayView>
        </PressClay>
      </AnimatedItem>
    );
  }

  const accentColor = isOverdue ? colors.error : colors.primary;

  return (
    <AnimatedItem key={task.id} animation={ClayAnimations.SlideInFlow(index)}>
      <ClayView
        depth={5}
        puffy={10}
        color={colors.card}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, marginBottom: 16 }}
      >
        <PressClay onPress={() => onToggle(task)} style={{ marginRight: 16 }}>
          <View
            style={[
              {
                width: 28,
                height: 28,
                borderRadius: 8,
                borderWidth: 2,
                alignItems: 'center',
                justifyContent: 'center',
              },
              task.isCompleted && { backgroundColor: accentColor, borderColor: accentColor },
              !task.isCompleted && { borderColor: accentColor },
            ]}
          >
            {task.isCompleted ? <Icon name="check" size={16} color="#FFF" /> : null}
          </View>
        </PressClay>

        <View style={{ flex: 1, paddingRight: 12 }}>
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
        </View>

      </ClayView>
    </AnimatedItem>
  );
}
