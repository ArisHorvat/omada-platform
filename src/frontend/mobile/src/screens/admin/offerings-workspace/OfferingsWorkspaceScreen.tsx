import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { PageContainer } from '@/src/components/layout/PageContainer';
import { AppButton, AppFormField, AppText, ClayView, Icon, WidgetEmptyState } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { OrganizationType } from '@/src/api/generatedClient';
import { useThemeColors } from '@/src/hooks';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { AdminTextInput } from '@/src/screens/admin/components/AdminTextInput';
import { useProgramGroupOptions } from '@/src/screens/admin/periods-workspace/hooks/useProgramGroupOptions';
import { PackageCourseRow } from './components/PackageCourseRow';
import { TermCoursesSection } from './components/TermCoursesSection';
import { ProgramSelectField } from './components/ProgramSelectField';
import { useOfferingsWorkspace } from './hooks/useOfferingsWorkspace';
import { createOfferingsWorkspaceStyles } from './styles/offerings-workspace.styles';

export default function OfferingsWorkspaceScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { periodId: periodIdParam } = useLocalSearchParams<{ periodId?: string }>();
  const styles = useMemo(() => createOfferingsWorkspaceStyles(colors), [colors]);
  const { organization } = useCurrentOrganization();
  const isUniversity = organization?.organizationType === OrganizationType.University;
  const { options: programOptions } = useProgramGroupOptions();
  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);
  const [packageSearch, setPackageSearch] = useState('');
  const [packageProgramFilterId, setPackageProgramFilterId] = useState('');
  const [termPeriodId, setTermPeriodId] = useState<string | null>(null);

  const programPickerOptions = useMemo(
    () => programOptions.map((o) => ({ value: o.value, label: o.label })),
    [programOptions],
  );

  const model = useOfferingsWorkspace();
  const {
    packages,
    loading,
    selectedPackage,
    loadPackageIntoEditor,
    clearEditor,
    newPackageName,
    setNewPackageName,
    newPackageDescription,
    setNewPackageDescription,
    packageProgramId,
    setPackageProgramId,
    itemDrafts,
    addItemDraft,
    updateItemDraft,
    removeItemDraft,
    createPackage,
    savePackage,
    saveItems,
    applyPeriodId,
    setApplyPeriodId,
    periodOptions,
    periodOfferings,
    periodOfferingsLoading,
    applyToPeriod,
    confirmRevertFromPeriod,
    confirmDeletePackage,
    isSaving,
    refetch,
  } = model;

  useEffect(() => {
    if (typeof periodIdParam === 'string' && periodIdParam) {
      setTermPeriodId(periodIdParam);
      setApplyPeriodId(periodIdParam);
    }
  }, [periodIdParam, setApplyPeriodId]);

  useEffect(() => {
    if (termPeriodId || periodIdParam || !periodOptions.length) return;
    const current =
      periodOptions.find((p) => p.subtitle?.toLowerCase().includes('current')) ?? periodOptions[0];
    if (current?.value) {
      setTermPeriodId(current.value);
      setApplyPeriodId(current.value);
    }
  }, [termPeriodId, periodIdParam, periodOptions, setApplyPeriodId]);

  const handleTermPeriodChange = (id: string | null) => {
    setTermPeriodId(id);
    if (id) setApplyPeriodId(id);
  };

  const applyPeriodLabel =
    periodOptions.find((o) => o.value === applyPeriodId)?.label ?? 'Select academic period';

  const packageProgramLabel =
    programPickerOptions.find((o) => o.value === packageProgramId)?.label ?? '';

  const filteredPackages = useMemo(() => {
    let list = packages;

    if (packageProgramFilterId) {
      list = list.filter((pkg) => pkg.programGroupIds.includes(packageProgramFilterId));
    }

    const q = packageSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(q) ||
          (pkg.description?.toLowerCase().includes(q) ?? false) ||
          pkg.programGroupNames.some((n) => n.toLowerCase().includes(q)) ||
          pkg.items.some((i) => i.name.toLowerCase().includes(q) || (i.code?.toLowerCase().includes(q) ?? false)),
      );
    }

    return list;
  }, [packageProgramFilterId, packageSearch, packages]);

  const hasPackageFilters = !!packageSearch.trim() || !!packageProgramFilterId;

  const packageProgramFilterLabel =
    programPickerOptions.find((o) => o.value === packageProgramFilterId)?.label ?? '';

  const startNewPackage = () => {
    clearEditor();
  };

  if (!isUniversity) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <PageContainer fullBleed>
            <ScreenHeader title="Course offerings" />
            <ClayView depth={2} color={colors.card} style={{ margin: 16, padding: 18, borderRadius: 16 }}>
              <AppText variant="body" style={{ color: colors.subtle }}>
                Offering packages are for university organizations. Corporate orgs use periods for grades only.
              </AppText>
            </ClayView>
          </PageContainer>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageContainer fullBleed>
          <ScreenHeader
            title="Course offerings"
            subtitle="Create packages, apply to terms, configure courses"
          />

          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.primary} />}
          >
            <ClayView depth={3} color={colors.card} style={styles.clayShell}>
              <View style={styles.clayInner}>
                <AppText variant="h3" weight="bold">
                  Curriculum packages
                </AppText>
                <AppText variant="caption" style={styles.sectionHint}>
                  Build reusable course templates for a program. Create or select a package, add courses, then apply
                  to a term. Set credits and per-activity attendance in each package course; publish schedules in Timetables.
                </AppText>
                <View style={styles.rowActions}>
                  <AppButton title="New package" icon="add" onPress={startNewPackage} style={{ minWidth: 0 }} />
                  <AppButton
                    title="Periods"
                    variant="outline"
                    onPress={() => router.push('/periods-workspace')}
                    style={{ minWidth: 0 }}
                  />
                </View>
              </View>
            </ClayView>

            <AppText variant="label" style={styles.sectionLabel}>
              YOUR PACKAGES ({filteredPackages.length}
              {hasPackageFilters ? ` of ${packages.length}` : ''})
            </AppText>

            {packages.length > 0 ? (
              <View style={styles.packageFilterBlock}>
                <AppFormField
                  value={packageSearch}
                  onChangeText={setPackageSearch}
                  placeholder="Search packages, programs, courses…"
                  icon="search"
                  style={{ marginBottom: 0 }}
                />
                <ProgramSelectField
                  label="FILTER BY PROGRAM"
                  options={programPickerOptions}
                  selectedId={packageProgramFilterId}
                  onChange={setPackageProgramFilterId}
                  pickerTitle="Filter by program"
                  placeholder="All programs"
                  includeAllOption
                  allLabel="All programs"
                />
              </View>
            ) : null}

            {loading && !packages.length ? (
              <ActivityIndicator color={colors.primary} />
            ) : !packages.length ? (
              <WidgetEmptyState
                icon="school"
                title="No packages yet"
                description="Tap New package below to create your first curriculum template."
              />
            ) : filteredPackages.length === 0 ? (
              <ClayView depth={1} color={colors.card} style={{ borderRadius: 12, padding: 14 }}>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  {hasPackageFilters
                    ? `No packages match${packageProgramFilterLabel ? ` program “${packageProgramFilterLabel}”` : ''}${packageSearch.trim() ? `${packageProgramFilterLabel ? ' and' : ''} “${packageSearch.trim()}”` : ''}.`
                    : 'No packages found.'}
                </AppText>
              </ClayView>
            ) : (
              filteredPackages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id;
                return (
                  <ClayView
                    key={pkg.id}
                    depth={isSelected ? 4 : 2}
                    contentOverflow="visible"
                    color={isSelected ? colors.primary + '18' : colors.card}
                    style={styles.packageCard}
                  >
                    <AppText variant="body" weight="bold">
                      {pkg.name}
                    </AppText>
                    {pkg.description ? (
                      <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }} numberOfLines={2}>
                        {pkg.description}
                      </AppText>
                    ) : null}
                    <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                      {pkg.items.length} course{pkg.items.length === 1 ? '' : 's'}
                      {pkg.programGroupNames.length ? ` · ${pkg.programGroupNames.join(', ')}` : ''}
                    </AppText>
                    <View style={[styles.rowActions, { marginTop: 10, marginBottom: 0 }]}>
                      <AppButton
                        title={isSelected ? 'Editing' : 'Edit'}
                        size="sm"
                        variant={isSelected ? 'primary' : 'outline'}
                        onPress={() => loadPackageIntoEditor(pkg)}
                        style={{ minWidth: 0 }}
                      />
                      <AppButton
                        title="Delete"
                        size="sm"
                        variant="outline"
                        onPress={() => confirmDeletePackage(pkg)}
                        style={{ minWidth: 0 }}
                      />
                    </View>
                  </ClayView>
                );
              })
            )}

            <ClayView depth={3} color={colors.card} style={styles.clayShell}>
              <View style={styles.clayInner}>
                <View style={styles.editorHeader}>
                  <AppText variant="h3" weight="bold" style={{ flex: 1 }}>
                    {selectedPackage ? `Edit — ${selectedPackage.name}` : 'New package'}
                  </AppText>
                  {selectedPackage ? (
                    <PressClay onPress={startNewPackage}>
                      <AppText variant="caption" style={{ color: colors.primary }}>
                        New instead
                      </AppText>
                    </PressClay>
                  ) : null}
                </View>

                <AppText variant="label" style={styles.sectionLabel}>
                  NAME
                </AppText>
                <AdminTextInput
                  value={newPackageName}
                  onChangeText={setNewPackageName}
                  placeholder="e.g. Year 1 Fall core"
                  style={{ marginBottom: 12 }}
                />

                <AppText variant="label" style={styles.sectionLabel}>
                  DESCRIPTION
                </AppText>
                <AdminTextInput
                  value={newPackageDescription}
                  onChangeText={setNewPackageDescription}
                  placeholder="Optional notes for admins"
                  style={{ marginBottom: 12 }}
                />

                <ProgramSelectField
                  label="PROGRAM"
                  hint="All courses in this package use this program."
                  options={programPickerOptions}
                  selectedId={packageProgramId}
                  onChange={setPackageProgramId}
                  pickerTitle="Package program"
                  placeholder="Select degree program"
                  includeAllOption={false}
                />

                {selectedPackage ? (
                  <AppButton
                    title={isSaving ? 'Saving…' : 'Save details'}
                    variant="outline"
                    onPress={savePackage}
                    disabled={isSaving || !newPackageName.trim() || !packageProgramId}
                    style={{ alignSelf: 'flex-start', marginBottom: 16 }}
                  />
                ) : (
                  <AppButton
                    title={isSaving ? 'Creating…' : 'Create package'}
                    onPress={createPackage}
                    disabled={isSaving || !newPackageName.trim() || !packageProgramId}
                    style={{ alignSelf: 'flex-start', marginBottom: 16 }}
                  />
                )}

                {selectedPackage ? (
                  <>
                    <AppText variant="label" style={styles.sectionLabel}>
                      COURSES IN PACKAGE ({itemDrafts.length})
                    </AppText>
                    {itemDrafts.map((item, idx) => (
                      <PackageCourseRow
                        key={item.key}
                        item={item}
                        index={idx}
                        programLabel={packageProgramLabel || undefined}
                        onUpdate={updateItemDraft}
                        onRemove={removeItemDraft}
                      />
                    ))}
                    <View style={styles.rowActions}>
                      <AppButton title="Add course" variant="outline" onPress={addItemDraft} style={{ minWidth: 0 }} />
                      <AppButton
                        title={isSaving ? 'Saving…' : 'Save courses'}
                        onPress={saveItems}
                        disabled={isSaving}
                        style={{ minWidth: 0 }}
                      />
                    </View>

                    <AppText variant="label" style={[styles.sectionLabel, { marginTop: 8 }]}>
                      APPLY TO TERM
                    </AppText>
                    <AppText variant="caption" style={styles.sectionHint}>
                      Creates offerings for checked courses. New offerings enroll linked student groups; existing
                      offerings in the term are left unchanged.
                    </AppText>
                    <PressClay onPress={() => setPeriodPickerOpen(true)}>
                      <ClayView depth={2} color={colors.background} style={styles.selectField}>
                        <Icon name="date-range" size={20} color={colors.primary} style={{ marginRight: 10 }} />
                        <AppText variant="body" style={{ flex: 1, color: applyPeriodId ? colors.text : colors.subtle }}>
                          {applyPeriodLabel}
                        </AppText>
                        <Icon name="expand-more" size={22} color={colors.subtle} />
                      </ClayView>
                    </PressClay>

                    <View style={styles.rowActions}>
                      <AppButton
                        title={isSaving ? 'Applying…' : 'Apply to period'}
                        onPress={applyToPeriod}
                        disabled={isSaving || !applyPeriodId || !packageProgramId}
                        style={{ minWidth: 0 }}
                      />
                      {applyPeriodId && periodOfferings.length > 0 ? (
                        <AppButton
                          title="Undo on term"
                          variant="outline"
                          onPress={confirmRevertFromPeriod}
                          disabled={isSaving}
                          style={{ minWidth: 0 }}
                        />
                      ) : null}
                    </View>

                    {applyPeriodId ? (
                      <>
                        <AppText variant="label" style={styles.sectionLabel}>
                          IN THIS TERM FROM PACKAGE ({periodOfferings.length})
                        </AppText>
                        {periodOfferingsLoading ? (
                          <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
                        ) : periodOfferings.length === 0 ? (
                          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
                            Not applied to this term yet — use Apply to period above.
                          </AppText>
                        ) : (
                          periodOfferings.map((offering) => (
                            <ClayView
                              key={offering.id}
                              depth={1}
                              contentOverflow="visible"
                              color={colors.background}
                              style={{ padding: 12, borderRadius: 12, marginBottom: 8 }}
                            >
                              <AppText variant="body" weight="bold">
                                {offering.name}
                              </AppText>
                              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                                {offering.enrollmentCount} enrolled
                              </AppText>
                            </ClayView>
                          ))
                        )}
                      </>
                    ) : null}
                  </>
                ) : (
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    After creating the package you can add courses and apply them to a term.
                  </AppText>
                )}
              </View>
            </ClayView>

            <TermCoursesSection
              periodId={termPeriodId}
              periodOptions={periodOptions}
              onPeriodChange={handleTermPeriodChange}
            />
          </ScrollView>

          <SearchableOptionPickerSheet
            isVisible={periodPickerOpen}
            onClose={() => setPeriodPickerOpen(false)}
            title="Choose period"
            searchPlaceholder="Search periods…"
            options={periodOptions}
            selected={applyPeriodId || null}
            onSelect={(id) => {
              const next = id ?? '';
              setApplyPeriodId(next);
              if (next) setTermPeriodId(next);
            }}
            allLabel="No period"
            height={480}
            zIndexBase={300}
          />
        </PageContainer>
      </SafeAreaView>
    </View>
  );
}
