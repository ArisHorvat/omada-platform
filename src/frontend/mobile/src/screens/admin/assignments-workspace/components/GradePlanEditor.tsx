import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { AdminTextInput } from '@/src/screens/admin/components/AdminTextInput';
import { useThemeColors } from '@/src/hooks';
import { gradePlanApi, type OfferingGradeCategoryDto } from '@/src/api/gradePlanApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { parseWeightInput, formatWeightPercent } from '@/src/screens/widgets/tasks/utils/assignmentStatus';
import { alertAction, confirmAction } from '@/src/utils/confirmAction';
import { createAssignmentsWorkspaceStyles } from '../styles/assignments-workspace.styles';

type CategoryDraft = {
  key: string;
  id?: string;
  name: string;
  weightPercent: string;
  isBonus: boolean;
  sortOrder: number;
  assignedWeightSum?: number;
  tasks?: OfferingGradeCategoryDto['tasks'];
};

type Props = {
  periodId: string;
  offeringId: string;
  offeringLabel: string;
};

function toDraft(cat: OfferingGradeCategoryDto, idx: number): CategoryDraft {
  const pct = cat.weight <= 1 ? cat.weight * 100 : cat.weight;
  return {
    key: cat.id,
    id: cat.id,
    name: cat.name,
    weightPercent: String(Number.isInteger(pct) ? pct : pct.toFixed(1)),
    isBonus: cat.isBonus,
    sortOrder: cat.sortOrder ?? idx,
    assignedWeightSum: cat.assignedWeightSum,
    tasks: cat.tasks,
  };
}

function summarizeCategory(draft: CategoryDraft): string {
  const name = draft.name.trim() || 'New category';
  const pct = formatWeightPercent(parseWeightInput(draft.weightPercent) ?? 0) ?? '0%';
  return draft.isBonus ? `${name} · ${pct} bonus` : `${name} · ${pct}`;
}

export function GradePlanEditor({ periodId, offeringId, offeringLabel }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createAssignmentsWorkspaceStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const [drafts, setDrafts] = useState<CategoryDraft[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const planQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.gradePlan(orgId, periodId, offeringId),
    queryFn: () => gradePlanApi.get(periodId, offeringId),
    enabled: !!periodId && !!offeringId,
  });

  const canEdit = planQuery.data?.canEditGradePlan === true;

  useEffect(() => {
    if (planQuery.data?.categories) {
      setDrafts(planQuery.data.categories.map(toDraft));
      setExpandedKey(null);
    }
  }, [planQuery.data]);

  const coreSum = useMemo(() => {
    return drafts
      .filter((d) => !d.isBonus)
      .reduce((sum, d) => sum + (parseWeightInput(d.weightPercent) ?? 0), 0);
  }, [drafts]);

  const saveMutation = useMutation({
    mutationFn: () =>
      gradePlanApi.save(
        periodId,
        offeringId,
        drafts.map((d, idx) => ({
          id: d.id,
          name: d.name.trim(),
          weight: parseWeightInput(d.weightPercent) ?? 0,
          sortOrder: idx,
          isBonus: d.isBonus,
        })),
      ),
    onSuccess: async (plan) => {
      setDrafts(plan.categories.map(toDraft));
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.orgAdmin.gradePlan(orgId, periodId, offeringId),
      });
    },
    onError: (e: Error) => alertAction({ title: 'Could not save grade plan', message: e.message }),
  });

  const addCategory = () => {
    const key = `new-${Date.now()}`;
    setDrafts((prev) => [
      ...prev,
      { key, name: '', weightPercent: '10', isBonus: false, sortOrder: prev.length },
    ]);
    setExpandedKey(key);
  };

  const updateDraft = (key: string, patch: Partial<CategoryDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  };

  const removeDraft = (draft: CategoryDraft) => {
    const hasAssignments = (draft.tasks?.length ?? 0) > 0;
    const run = () => {
      setDrafts((prev) => prev.filter((d) => d.key !== draft.key));
      if (expandedKey === draft.key) setExpandedKey(null);
    };

    if (!hasAssignments) {
      run();
      return;
    }

    confirmAction({
      title: 'Remove category?',
      message: `"${draft.name.trim() || 'This category'}" has ${draft.tasks!.length} assignment(s). Remove it from the grade plan?`,
      confirmText: 'Remove',
      destructive: true,
      onConfirm: run,
    });
  };

  if (!offeringId) return null;

  return (
    <ClayView depth={4} puffy={12} color={colors.card} style={styles.section}>
      <AppText variant="h3" weight="bold" style={{ marginBottom: 4 }}>
        Grade breakdown
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12, lineHeight: 20 }}>
        Plan how the final grade is split (exam, colloquium, lab, seminar, bonus). Assignments posted below
        can sit inside a category and use a % of that bucket.
        {!canEdit && planQuery.data ? ' Only the course host can edit these categories.' : ''}
      </AppText>
      <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: 12 }}>
        {offeringLabel}
      </AppText>

      {planQuery.isLoading ? (
        <AppText variant="caption" style={{ color: colors.subtle }}>
          Loading plan…
        </AppText>
      ) : (
        <>
          {drafts.length === 0 ? (
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
              No categories yet. Add exam, lab, seminar, or bonus buckets.
            </AppText>
          ) : (
            drafts.map((draft) => {
              const expanded = expandedKey === draft.key;
              return (
                <View key={draft.key} style={styles.categoryShell}>
                  <ClayView depth={3} color={colors.background} contentOverflow="visible" style={styles.categoryCard}>
                    <View style={styles.categoryHeader}>
                      <ClayView depth={4} color={colors.secondary + '22'} style={styles.categoryIcon}>
                        <Icon name="pie-chart" size={20} color={colors.secondary} />
                      </ClayView>

                      <PressClay
                        onPress={() => setExpandedKey((k) => (k === draft.key ? null : draft.key))}
                        style={{ flex: 1, minWidth: 0 }}
                      >
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <AppText variant="body" weight="bold" numberOfLines={1}>
                            {summarizeCategory(draft)}
                          </AppText>
                          <View style={styles.categoryMetaRow}>
                            {draft.isBonus ? (
                              <View style={[styles.categoryMetaPill, { backgroundColor: colors.secondary + '18' }]}>
                                <AppText variant="caption" style={{ color: colors.secondary }}>
                                  Bonus
                                </AppText>
                              </View>
                            ) : null}
                            {draft.tasks && draft.tasks.length > 0 ? (
                              <View style={[styles.categoryMetaPill, { backgroundColor: colors.card }]}>
                                <AppText variant="caption" style={{ color: colors.subtle }}>
                                  {draft.tasks.length} assignment{draft.tasks.length === 1 ? '' : 's'}
                                </AppText>
                              </View>
                            ) : (
                              <AppText variant="caption" style={{ color: colors.subtle }}>
                                Tap to edit
                              </AppText>
                            )}
                          </View>
                        </View>
                      </PressClay>

                      <PressClay
                        onPress={() => canEdit && removeDraft(draft)}
                        accessibilityLabel="Remove category"
                      >
                        <ClayView depth={2} color={colors.card} style={styles.categoryIconBtn}>
                          <Icon name="delete-outline" size={18} color={colors.error} />
                        </ClayView>
                      </PressClay>

                      <PressClay
                        onPress={() => setExpandedKey((k) => (k === draft.key ? null : draft.key))}
                        accessibilityLabel={expanded ? 'Collapse' : 'Expand'}
                      >
                        <ClayView depth={2} color={colors.card} style={styles.categoryIconBtn}>
                          <Icon name={expanded ? 'expand-less' : 'expand-more'} size={20} color={colors.subtle} />
                        </ClayView>
                      </PressClay>
                    </View>

                    {expanded ? (
                      <View style={styles.categoryExpanded}>
                        <View style={[styles.categoryDivider, { backgroundColor: colors.border }]} />
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                          <View style={{ flex: 2 }}>
                            <AppText variant="caption" weight="bold" style={{ color: colors.subtle, marginBottom: 6 }}>
                              Name
                            </AppText>
                            <AdminTextInput
                              value={draft.name}
                              onChangeText={(v) => updateDraft(draft.key, { name: v })}
                              placeholder="Exam, Lab, Seminar…"
                              editable={canEdit}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <AppText variant="caption" weight="bold" style={{ color: colors.subtle, marginBottom: 6 }}>
                              Weight %
                            </AppText>
                            <AdminTextInput
                              value={draft.weightPercent}
                              onChangeText={(v) => updateDraft(draft.key, { weightPercent: v })}
                              placeholder="%"
                              keyboardType="decimal-pad"
                              editable={canEdit}
                            />
                          </View>
                        </View>

                        <PressClay
                          onPress={() => canEdit && updateDraft(draft.key, { isBonus: !draft.isBonus })}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Icon
                              name={draft.isBonus ? 'check-box' : 'check-box-outline-blank'}
                              size={20}
                              color={draft.isBonus ? colors.secondary : colors.subtle}
                            />
                            <AppText variant="caption" style={{ color: colors.subtle }}>
                              Bonus / extra credit (not in 100% core)
                            </AppText>
                          </View>
                        </PressClay>

                        {draft.tasks && draft.tasks.length > 0 ? (
                          <AppText variant="caption" style={{ color: colors.subtle }}>
                            {formatWeightPercent(draft.assignedWeightSum ?? 0) ?? '0%'} of this category assigned
                            across {draft.tasks.length} assignment{draft.tasks.length === 1 ? '' : 's'}.
                          </AppText>
                        ) : null}
                      </View>
                    ) : null}
                  </ClayView>
                </View>
              );
            })
          )}

          {canEdit ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <AppButton title="Add category" variant="outline" icon="add" onPress={addCategory} />
              <AppButton
                title={saveMutation.isPending ? 'Saving…' : 'Save grade plan'}
                onPress={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || coreSum > 1.0001}
              />
            </View>
          ) : null}

          <AppText
            variant="caption"
            style={{ color: coreSum > 1.0001 ? colors.error : colors.subtle }}
          >
            Core categories total: {formatWeightPercent(coreSum) ?? '0%'} (target 100%)
          </AppText>
        </>
      )}
    </ClayView>
  );
}
