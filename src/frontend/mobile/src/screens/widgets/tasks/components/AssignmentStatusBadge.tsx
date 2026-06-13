import React from 'react';
import { View, StyleSheet } from 'react-native';

import { AppText, ClayView } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';

import {
  getAssignmentStatusLabel,
  type AssignmentStatus,
} from '../utils/assignmentStatus';

interface AssignmentStatusBadgeProps {
  status: AssignmentStatus;
  compact?: boolean;
}

export function AssignmentStatusBadge({ status, compact }: AssignmentStatusBadgeProps) {
  const colors = useThemeColors();

  const palette: Record<AssignmentStatus, { bg: string; text: string }> = {
    pending: { bg: `${colors.primary}22`, text: colors.primary },
    submitted: { bg: `${colors.secondary}22`, text: colors.secondary },
    graded: { bg: `${colors.tertiary}22`, text: colors.tertiary },
    overdue: { bg: `${colors.error}22`, text: colors.error },
  };

  const tone = palette[status];

  return (
    <ClayView
      depth={compact ? 2 : 4}
      color={tone.bg}
      style={[styles.badge, compact && styles.compact]}
    >
      <AppText variant="caption" weight="bold" style={{ color: tone.text }}>
        {getAssignmentStatusLabel(status)}
      </AppText>
    </ClayView>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  compact: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
