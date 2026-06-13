import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { PageContainer } from '@/src/components/layout/PageContainer';
import { WidgetPageShell } from '@/src/components/layout';
import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import {
  AppButton,
  AppFormField,
  AppText,
  ClayView,
  Icon,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { ClayDatePicker } from '@/src/components/ui/ClayDatePicker';
import { PressClay } from '@/src/components/animations';
import { ScreenTransition } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { formatWeightPercent } from '@/src/screens/widgets/tasks/utils/assignmentStatus';
import { isUniversityOrg } from '@/src/screens/widgets/tasks/utils/taskLabels';

import { useAssignmentsWorkspace } from './hooks/useAssignmentsWorkspace';
import { createAssignmentsWorkspaceStyles } from './styles/assignments-workspace.styles';
import { GradePlanEditor } from './components/GradePlanEditor';
import { TaskAttachmentPicker } from '@/src/screens/widgets/tasks/components/TaskAttachmentPicker';

type Props = {
  /** Admin console shows full term catalog; member route scopes to teaching team. */
  mode?: 'admin' | 'member';
};

export default function AssignmentsWorkspaceScreen({ mode = 'admin' }: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = useMemo(() => createAssignmentsWorkspaceStyles(colors), [colors]);
  const { organization, isLoading: orgLoading } = useCurrentOrganization();
  const isKnownCorporate =
    !!organization && !isUniversityOrg(organization.organizationType);

  const [offeringPickerOpen, setOfferingPickerOpen] = useState(false);
  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const model = useAssignmentsWorkspace();
  const {
    batches,
    loading,
    isError,
    batchesError,
    offeringsEmpty,
    offeringsLoading,
    noPeriodConfigured,
    canUseFullCatalog,
    periodId,
    setPeriodId,
    periodOptions,
    refetch,
    title,
    setTitle,
    description,
    setDescription,
    dueDate,
    setDueDate,
    maxScore,
    setMaxScore,
    weight,
    setWeight,
    referenceUrl,
    setReferenceUrl,
    materials,
    setMaterials,
    gradeCategoryId,
    setGradeCategoryId,
    gradeCategoryOptions,
    selectedOffering,
    audienceScope,
    setAudienceScope,
    offeringId,
    setOfferingId,
    groupId,
    setGroupId,
    offeringOptions,
    groupOptions,
    publishAssignment,
    confirmDeleteBatch,
    isSaving,
  } = model;

  const periodLabel =
    periodOptions.find((p) => p.value === periodId)?.label ?? 'Select term';
  const offeringLabel =
    offeringOptions.find((o) => o.value === offeringId)?.label ?? 'Select course offering';
  const categoryLabel =
    gradeCategoryOptions.find((c) => c.value === gradeCategoryId)?.label ?? 'None (weight = final grade %)';
  const weightLabel = gradeCategoryId ? 'Weight % within category' : 'Weight % of final grade';
  const groupLabel = groupOptions.find((g) => g.id === groupId)?.label ?? 'Select group';

  if (isKnownCorporate) {
    return (
      <WidgetPageShell fullBleed>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <ScreenHeader title="Coursework" onBack={() => router.back()} />
            <WidgetEmptyState
              title="University feature"
              description="Post coursework to enrolled students from the Tasks feature. Corporate orgs use personal tasks only."
              icon="school"
            />
          </SafeAreaView>
        </View>
      </WidgetPageShell>
    );
  }

  if (orgLoading && !organization) {
    return (
      <WidgetPageShell fullBleed>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <ScreenHeader
              title={mode === 'admin' ? 'Coursework' : 'Teach coursework'}
              onBack={() => router.back()}
            />
            <View style={{ padding: 16, gap: 12 }}>
              <Skeleton height={120} borderRadius={18} />
              <Skeleton height={200} borderRadius={18} />
            </View>
          </SafeAreaView>
        </View>
      </WidgetPageShell>
    );
  }

  return (
    <WidgetPageShell fullBleed>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScreenTransition>
            <PageContainer fullBleed>
              <ScreenHeader
                title={mode === 'admin' ? 'Coursework' : 'Teach coursework'}
                onBack={() => router.back()}
              />

              <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
              >
                {noPeriodConfigured ? (
                  <ClayView depth={4} puffy={12} color={colors.card} style={[styles.section, { marginBottom: 12 }]}>
                    <AppText variant="body" weight="bold" style={{ marginBottom: 6 }}>
                      No current term
                    </AppText>
                    <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 20 }}>
                      Open Periods in the admin console, create a term, and mark one as current — then
                      course offerings will appear here.
                    </AppText>
                  </ClayView>
                ) : null}

                {offeringsEmpty && !offeringsLoading && audienceScope === 'offering' && !noPeriodConfigured ? (
                  <ClayView depth={4} puffy={12} color={colors.card} style={[styles.section, { marginBottom: 12 }]}>
                    <AppText variant="body" weight="bold" style={{ marginBottom: 6 }}>
                      {canUseFullCatalog ? 'No courses in this term' : 'No courses to teach yet'}
                    </AppText>
                    <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 20 }}>
                      {canUseFullCatalog
                        ? 'Apply a curriculum package or create offerings for this term, then pick a course below.'
                        : 'Ask an admin to add you as host or on the teaching team for a course offering. Your role needs Tasks set to Edit.'}
                    </AppText>
                  </ClayView>
                ) : null}

                <ClayView depth={8} puffy={12} color={colors.card} style={styles.section}>
                  <AppText variant="h3" weight="bold" style={{ marginBottom: 6 }}>
                    Course context
                  </AppText>
                  <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 16, lineHeight: 20 }}>
                    Choose the term and course offering — grade breakdown and posting both use this selection.
                  </AppText>

                  {periodOptions.length > 0 ? (
                    <PressClay onPress={() => setPeriodPickerOpen(true)} style={{ marginBottom: 12 }}>
                      <ClayView
                        depth={2}
                        color={colors.background}
                        style={{
                          borderRadius: 16,
                          padding: 16,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Icon name="date-range" size={22} color={colors.tertiary} style={{ marginRight: 10 }} />
                        <AppText style={{ flex: 1, color: periodId ? colors.text : colors.subtle }}>
                          {periodLabel}
                        </AppText>
                        <Icon name="chevron-right" size={20} color={colors.subtle} />
                      </ClayView>
                    </PressClay>
                  ) : null}

                  <AppText variant="label" weight="bold" style={{ marginBottom: 8 }}>
                    Audience
                  </AppText>
                  <View style={styles.audienceRow}>
                    <PressClay onPress={() => setAudienceScope('offering')}>
                      <ClayView
                        depth={audienceScope === 'offering' ? 6 : 2}
                        color={audienceScope === 'offering' ? colors.primary : colors.background}
                        style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 }}
                      >
                        <AppText
                          weight="bold"
                          style={{ color: audienceScope === 'offering' ? '#FFF' : colors.text }}
                        >
                          Whole course
                        </AppText>
                      </ClayView>
                    </PressClay>
                    <PressClay onPress={() => setAudienceScope('group')}>
                      <ClayView
                        depth={audienceScope === 'group' ? 6 : 2}
                        color={audienceScope === 'group' ? colors.secondary : colors.background}
                        style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 }}
                      >
                        <AppText
                          weight="bold"
                          style={{ color: audienceScope === 'group' ? '#FFF' : colors.text }}
                        >
                          Group / lab / class
                        </AppText>
                      </ClayView>
                    </PressClay>
                  </View>

                  {audienceScope === 'offering' ? (
                    <PressClay onPress={() => setOfferingPickerOpen(true)} style={{ marginBottom: 0 }}>
                      <ClayView
                        depth={2}
                        color={colors.background}
                        style={{
                          borderRadius: 16,
                          padding: 16,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Icon name="school" size={22} color={colors.primary} style={{ marginRight: 10 }} />
                        <AppText style={{ flex: 1, color: offeringId ? colors.text : colors.subtle }}>
                          {offeringLabel}
                        </AppText>
                        <Icon name="chevron-right" size={20} color={colors.subtle} />
                      </ClayView>
                    </PressClay>
                  ) : (
                    <PressClay onPress={() => setGroupPickerOpen(true)} style={{ marginBottom: 0 }}>
                      <ClayView
                        depth={2}
                        color={colors.background}
                        style={{
                          borderRadius: 16,
                          padding: 16,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Icon name="groups" size={22} color={colors.secondary} style={{ marginRight: 10 }} />
                        <AppText style={{ flex: 1, color: groupId ? colors.text : colors.subtle }}>
                          {groupLabel}
                        </AppText>
                        <Icon name="chevron-right" size={20} color={colors.subtle} />
                      </ClayView>
                    </PressClay>
                  )}
                </ClayView>

                {audienceScope === 'offering' && offeringId && selectedOffering?.periodId ? (
                  <GradePlanEditor
                    periodId={selectedOffering.periodId}
                    offeringId={offeringId}
                    offeringLabel={offeringLabel}
                  />
                ) : audienceScope === 'offering' ? (
                  <ClayView depth={4} puffy={12} color={colors.card} style={styles.section}>
                    <AppText variant="h3" weight="bold" style={{ marginBottom: 6 }}>
                      Grade breakdown
                    </AppText>
                    <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 20 }}>
                      Select a course offering above to define exam, lab, seminar, and bonus weights for
                      the final grade.
                    </AppText>
                  </ClayView>
                ) : null}

                <ClayView depth={8} puffy={12} color={colors.card} style={styles.section}>
                  <AppText variant="h3" weight="bold" style={{ marginBottom: 6 }}>
                    Post coursework
                  </AppText>
                  <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 16, lineHeight: 20 }}>
                    Each student gets their own task — submit grades and track completion individually
                    (like Canvas or Moodle).
                  </AppText>

                  <AppFormField
                    label="Title"
                    placeholder="e.g. Homework 3 — Binary trees"
                    value={title}
                    onChangeText={setTitle}
                  />
                  <AppFormField
                    label="Instructions"
                    placeholder="What should students submit? Format, rubric, file types…"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                  />

                  <AppText variant="label" weight="bold" style={{ marginBottom: 8 }}>
                    Due date
                  </AppText>
                  <ClayDatePicker
                    compact
                    mode="single"
                    value={dueDate ?? new Date()}
                    onChange={(d) => setDueDate(d)}
                  />
                  {dueDate ? (
                    <AppButton
                      title="Clear due date"
                      variant="outline"
                      size="sm"
                      onPress={() => setDueDate(null)}
                      style={{ alignSelf: 'flex-start', marginTop: 8, marginBottom: 8 }}
                    />
                  ) : null}

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <AppFormField
                        label="Points"
                        placeholder="100"
                        value={maxScore}
                        onChangeText={setMaxScore}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppFormField
                        label={weightLabel}
                        placeholder="20"
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  {audienceScope === 'offering' && gradeCategoryOptions.length > 0 ? (
                    <PressClay onPress={() => setCategoryPickerOpen(true)} style={{ marginBottom: 12 }}>
                      <ClayView
                        depth={2}
                        color={colors.background}
                        style={{
                          borderRadius: 16,
                          padding: 16,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Icon name="pie-chart" size={22} color={colors.secondary} style={{ marginRight: 10 }} />
                        <View style={{ flex: 1 }}>
                          <AppText variant="caption" style={{ color: colors.subtle }}>
                            Grade category
                          </AppText>
                          <AppText style={{ color: gradeCategoryId ? colors.text : colors.subtle }}>
                            {categoryLabel}
                          </AppText>
                        </View>
                        <Icon name="chevron-right" size={20} color={colors.subtle} />
                      </ClayView>
                    </PressClay>
                  ) : null}

                  <TaskAttachmentPicker
                    label="Attached documents"
                    hint="PDF, Word, slides, etc. (max 15 MB each)"
                    attachments={materials}
                    onChange={setMaterials}
                    attachmentKind="material"
                  />

                  <AppFormField
                    label="Materials link"
                    placeholder="Rubric, brief, starter files (URL)"
                    value={referenceUrl}
                    onChangeText={setReferenceUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                  />

                  <AppButton
                    title="Post to students"
                    icon="send"
                    onPress={publishAssignment}
                    loading={isSaving}
                    disabled={!title.trim()}
                  />
                </ClayView>

                <View>
                  <AppText variant="h3" weight="bold" style={{ marginBottom: 12, paddingHorizontal: 4 }}>
                    Posted coursework
                  </AppText>

                  {loading ? (
                    <View style={{ gap: 12 }}>
                      {[0, 1, 2].map((i) => (
                        <Skeleton key={i} height={120} borderRadius={18} />
                      ))}
                    </View>
                  ) : isError ? (
                    <WidgetErrorState
                      message={
                        batchesError instanceof Error &&
                        (batchesError.message.includes('403') ||
                          batchesError.message.toLowerCase().includes('permission'))
                          ? 'Could not load posted coursework. Your role needs Tasks set to Edit — ask an admin to update your role, then sign in again.'
                          : 'Could not load coursework.'
                      }
                      onRetry={() => void refetch()}
                    />
                  ) : batches.length === 0 ? (
                    <WidgetEmptyState
                      title="No coursework posted yet"
                      description="Post your first assignment above. Students will see it under Tasks → Coursework."
                      icon="assignment"
                    />
                  ) : (
                    batches.map((batch) => {
                      const submitPct =
                        batch.totalAssigned > 0
                          ? Math.round((batch.submittedCount / batch.totalAssigned) * 100)
                          : 0;
                      const audience =
                        batch.offeringName ??
                        batch.groupName ??
                        (batch.distributionScope === 'OfferingEnrolled' ||
                        batch.distributionScope === 1
                          ? 'Course offering'
                          : 'Group');

                      return (
                        <ClayView
                          key={batch.batchId}
                          depth={5}
                          puffy={10}
                          color={colors.card}
                          style={styles.batchCard}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              gap: 8,
                              marginBottom: 6,
                            }}
                          >
                            <AppText variant="caption" weight="bold" style={{ color: colors.primary, flex: 1 }}>
                              {audience}
                            </AppText>
                            <AppText variant="caption" style={{ color: colors.subtle }}>
                              {new Date(batch.createdAt).toLocaleDateString()}
                            </AppText>
                          </View>
                          <AppText variant="h3" weight="bold" numberOfLines={2} style={{ marginBottom: 8 }}>
                            {batch.title}
                          </AppText>
                          <View style={styles.statRow}>
                            <View>
                              <AppText variant="caption" weight="bold">
                                {batch.totalAssigned} assigned
                              </AppText>
                            </View>
                            <View>
                              <AppText variant="caption" weight="bold" style={{ color: colors.secondary }}>
                                {batch.submittedCount} submitted
                              </AppText>
                            </View>
                            <View>
                              <AppText variant="caption" weight="bold" style={{ color: colors.tertiary }}>
                                {batch.gradedCount} graded
                              </AppText>
                            </View>
                            {batch.maxScore != null ? (
                              <AppText variant="caption" style={{ color: colors.subtle }}>
                                {batch.maxScore} pts
                                {formatWeightPercent(batch.weight)
                                  ? ` · ${formatWeightPercent(batch.weight)}`
                                  : ''}
                              </AppText>
                            ) : null}
                          </View>
                          <View style={styles.progressTrack}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${submitPct}%`,
                                  backgroundColor: colors.secondary,
                                },
                              ]}
                            />
                          </View>
                          <AppButton
                            title="Grade students"
                            variant="secondary"
                            size="sm"
                            icon="rate-review"
                            onPress={() =>
                              router.push({
                                pathname: '/coursework-batch/[batchId]',
                                params: {
                                  batchId: batch.batchId,
                                  title: batch.title,
                                  dueDate: batch.dueDate ?? '',
                                  maxScore: batch.maxScore != null ? String(batch.maxScore) : '',
                                },
                              } as never)
                            }
                            style={{ marginTop: 12, alignSelf: 'flex-start' }}
                          />
                          <AppButton
                            title="Delete batch"
                            variant="outline"
                            size="sm"
                            icon="delete-outline"
                            onPress={() => confirmDeleteBatch(batch)}
                            style={{ marginTop: 12, alignSelf: 'flex-start' }}
                          />
                        </ClayView>
                      );
                    })
                  )}
                </View>
              </ScrollView>

              <SearchableOptionPickerSheet
                isVisible={periodPickerOpen}
                onClose={() => setPeriodPickerOpen(false)}
                title="Term"
                searchPlaceholder="Search terms…"
                options={periodOptions.map((p) => ({
                  value: p.value,
                  label: p.label,
                  subtitle: p.subtitle,
                }))}
                selected={periodId || null}
                onSelect={(id) => setPeriodId(id ?? '')}
                includeAllOption={false}
                height={360}
              />

              <SearchableOptionPickerSheet
                isVisible={offeringPickerOpen}
                onClose={() => setOfferingPickerOpen(false)}
                title="Course offering"
                searchPlaceholder="Search courses…"
                options={offeringOptions.map((o) => ({
                  value: o.value,
                  label: o.label,
                  subtitle: o.subtitle,
                }))}
                selected={offeringId || null}
                onSelect={(id) => setOfferingId(id ?? '')}
                includeAllOption={false}
                height={420}
              />

              <SearchableOptionPickerSheet
                isVisible={groupPickerOpen}
                onClose={() => setGroupPickerOpen(false)}
                title="Group / lab / class"
                searchPlaceholder="Search groups…"
                options={groupOptions.map((g) => ({
                  value: g.id,
                  label: g.label,
                  subtitle: g.subtitle,
                }))}
                selected={groupId || null}
                onSelect={(id) => setGroupId(id ?? '')}
                includeAllOption={false}
                height={420}
              />

              <SearchableOptionPickerSheet
                isVisible={categoryPickerOpen}
                onClose={() => setCategoryPickerOpen(false)}
                title="Grade category"
                searchPlaceholder="Search categories…"
                options={[
                  { value: '', label: 'None', subtitle: 'Weight applies to final grade directly' },
                  ...gradeCategoryOptions.map((c) => ({
                    value: c.value,
                    label: c.label,
                    subtitle: c.subtitle,
                  })),
                ]}
                selected={gradeCategoryId || null}
                onSelect={(id) => setGradeCategoryId(id ?? '')}
                includeAllOption={false}
                height={400}
              />
            </PageContainer>
          </ScreenTransition>
        </SafeAreaView>
      </View>
    </WidgetPageShell>
  );
}
