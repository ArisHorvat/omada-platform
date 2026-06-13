import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { AdminTextInput } from '@/src/screens/admin/components/AdminTextInput';
import { useThemeColors } from '@/src/hooks';
import { confirmAction } from '@/src/utils/confirmAction';
import type { PackageItemDraft } from '../hooks/useOfferingsWorkspace';
import { useGroupStaffPicker } from '../hooks/useGroupStaffPicker';
import { StaffMultiSelectField } from './StaffMultiSelectField';
import { StaffSelectField } from './StaffSelectField';
import { summarizeWeeklyPlan, type OfferingWeeklySession } from '../utils/offeringSessionPlan';
import { WeeklySessionPlanEditor } from './WeeklySessionPlanEditor';
import { createOfferingsWorkspaceStyles } from '../styles/offerings-workspace.styles';

type Props = {
  item: PackageItemDraft;
  index: number;
  programLabel?: string;
  onUpdate: (key: string, patch: Partial<PackageItemDraft>) => void;
  onRemove: (key: string) => void;
};

export function PackageCourseRow({ item, index, programLabel, onUpdate, onRemove }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createOfferingsWorkspaceStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(false);
  const { allStaffOptions } = useGroupStaffPicker(null);

  const hostLabel = item.hostUserId
    ? allStaffOptions.find((o) => o.value === item.hostUserId)?.label
    : undefined;
  const displayName = item.name.trim() || `Course ${index + 1}`;

  const confirmRemove = () => {
    confirmAction({
      title: 'Remove course',
      message: `Remove "${displayName}" from this package?`,
      confirmText: 'Remove',
      destructive: true,
      onConfirm: () => onRemove(item.key),
    });
  };

  return (
    <View style={styles.courseShell}>
      <ClayView depth={3} color={colors.background} contentOverflow="visible" style={styles.courseCard}>
        <View style={styles.courseHeader}>
          <ClayView depth={4} color={colors.primary + '22'} style={styles.courseIcon}>
            <Icon name="menu-book" size={22} color={colors.primary} />
          </ClayView>

          <PressClay onPress={() => setExpanded((v) => !v)} style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText variant="body" weight="bold" numberOfLines={1}>
                {displayName}
              </AppText>
              <View style={styles.courseMetaRow}>
                {item.code.trim() ? (
                  <View style={[styles.courseMetaPill, { backgroundColor: colors.card }]}>
                    <AppText variant="caption" style={{ color: colors.text }}>
                      {item.code.trim()}
                    </AppText>
                  </View>
                ) : null}
                {hostLabel ? (
                  <View style={[styles.courseMetaPill, { backgroundColor: colors.primary + '18' }]}>
                    <Icon name="person" size={12} color={colors.primary} />
                    <AppText variant="caption" style={{ color: colors.primary, marginLeft: 4 }} numberOfLines={1}>
                      {hostLabel}
                    </AppText>
                  </View>
                ) : null}
                {item.teamUserIds.length > 0 ? (
                  <View style={[styles.courseMetaPill, { backgroundColor: colors.card }]}>
                    <AppText variant="caption" style={{ color: colors.subtle }}>
                      +{item.teamUserIds.length} co-instructor{item.teamUserIds.length === 1 ? '' : 's'}
                    </AppText>
                  </View>
                ) : null}
                {item.weeklySessions.length > 0 ? (
                  <View style={[styles.courseMetaPill, { backgroundColor: colors.secondary + '18' }]}>
                    <AppText variant="caption" style={{ color: colors.secondary }} numberOfLines={1}>
                      {summarizeWeeklyPlan(item.weeklySessions)}
                    </AppText>
                  </View>
                ) : null}
                {!item.code.trim() && !hostLabel && !item.teamUserIds.length ? (
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    Tap to add details
                  </AppText>
                ) : null}
              </View>
            </View>
          </PressClay>

          <PressClay onPress={confirmRemove} accessibilityLabel="Remove course">
            <ClayView depth={2} color={colors.card} style={styles.courseIconBtn}>
              <Icon name="delete-outline" size={18} color={colors.error} />
            </ClayView>
          </PressClay>

          <PressClay onPress={() => setExpanded((v) => !v)} accessibilityLabel={expanded ? 'Collapse' : 'Expand'}>
            <ClayView depth={2} color={colors.card} style={styles.courseIconBtn}>
              <Icon name={expanded ? 'expand-less' : 'expand-more'} size={20} color={colors.subtle} />
            </ClayView>
          </PressClay>
        </View>

        {expanded ? (
          <View style={styles.courseExpanded}>
            <View style={[styles.courseDivider, { backgroundColor: colors.border }]} />
            {programLabel ? (
              <View style={[styles.courseProgramBanner, { backgroundColor: colors.primary + '12' }]}>
                <Icon name="school" size={16} color={colors.primary} />
                <AppText variant="caption" style={{ color: colors.primary, marginLeft: 8, flex: 1 }}>
                  Program: {programLabel}
                </AppText>
              </View>
            ) : null}
            <AdminTextInput
              value={item.name}
              onChangeText={(v) => onUpdate(item.key, { name: v })}
              placeholder="Course name (e.g. Linear Algebra)"
              style={{ marginBottom: 10 }}
            />
            <AdminTextInput
              value={item.code}
              onChangeText={(v) => onUpdate(item.key, { code: v })}
              placeholder="Code (optional)"
              style={{ marginBottom: 10 }}
            />
            <StaffSelectField
              label="Lead instructor (host)"
              selectedId={item.hostUserId}
              onChange={(id) =>
                onUpdate(item.key, {
                  hostUserId: id,
                  teamUserIds: item.teamUserIds.filter((uid) => uid !== id),
                })
              }
              pickerTitle="Lead instructor"
              placeholder="Select host"
            />
            <StaffMultiSelectField
              label="Teaching team"
              hint="Co-instructors who share this offering."
              selectedIds={item.teamUserIds}
              onChange={(ids) => onUpdate(item.key, { teamUserIds: ids })}
              excludeIds={item.hostUserId ? [item.hostUserId] : []}
              pickerTitle="Teaching team"
              placeholder="Add co-instructors"
            />
            <WeeklySessionPlanEditor
              sessions={item.weeklySessions}
              onChange={(weeklySessions) => onUpdate(item.key, { weeklySessions })}
            />
            <PressClay
              onPress={() => onUpdate(item.key, { applyToTerm: !item.applyToTerm })}
              style={{ marginTop: 12 }}
            >
              <ClayView
                depth={2}
                color={item.applyToTerm ? colors.primary + '18' : colors.card}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 12,
                  gap: 10,
                }}
              >
                <Icon
                  name={item.applyToTerm ? 'check-box' : 'check-box-outline-blank'}
                  size={22}
                  color={item.applyToTerm ? colors.primary : colors.subtle}
                />
                <View style={{ flex: 1 }}>
                  <AppText variant="body" weight="bold">
                    Apply to term
                  </AppText>
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    Include this course when you apply the package to a period.
                  </AppText>
                </View>
              </ClayView>
            </PressClay>
          </View>
        ) : null}
      </ClayView>
    </View>
  );
}
