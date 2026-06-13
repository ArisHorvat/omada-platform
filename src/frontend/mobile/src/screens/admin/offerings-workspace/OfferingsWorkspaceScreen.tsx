import React, { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

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
import { TermOfferingSessionCard } from './components/TermOfferingSessionCard';
import { ProgramSelectField } from './components/ProgramSelectField';
import { useOfferingsWorkspace } from './hooks/useOfferingsWorkspace';
import { createOfferingsWorkspaceStyles } from './styles/offerings-workspace.styles';

export default function OfferingsWorkspaceScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = useMemo(() => createOfferingsWorkspaceStyles(colors), [colors]);
  const { organization } = useCurrentOrganization();
  const isUniversity = organization?.organizationType === OrganizationType.University;
  const { options: programOptions } = useProgramGroupOptions();
  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);
  const [packageSearch, setPackageSearch] = useState('');
  const [packageProgramFilterId, setPackageProgramFilterId] = useState('');

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
            subtitle="Curriculum packages, instructors, and term apply"
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
                  Pick one program for the whole package. Need the same course for another program? Duplicate the
                  package or add the course again in a separate package.
                </AppText>
                <AppButton
                  title="Open periods workspace"
                  variant="outline"
                  onPress={() => router.push('/periods-workspace')}
                  style={{ alignSelf: 'flex-start', marginBottom: 12 }}
                />
              </View>
            </ClayView>

            <AppText variant="label" style={styles.sectionLabel}>
              PACKAGES ({filteredPackages.length}{hasPackageFilters ? ` of ${packages.length}` : ''})
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
                description="Create your first curriculum package below."
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
              filteredPackages.map((pkg) => (
                <PressClay key={pkg.id} onPress={() => loadPackageIntoEditor(pkg)}>
                  <ClayView
                    depth={selectedPackage?.id === pkg.id ? 4 : 2}
                    color={selectedPackage?.id === pkg.id ? colors.primary + '18' : colors.card}
                    style={styles.packageCard}
                  >
                    <AppText variant="body" weight="bold">
                      {pkg.name}
                    </AppText>
                    <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                      {pkg.items.length} course{pkg.items.length === 1 ? '' : 's'}
                      {pkg.programGroupNames.length ? ` · ${pkg.programGroupNames.join(', ')}` : ''}
                    </AppText>
                  </ClayView>
                </PressClay>
              ))
            )}

            <ClayView depth={3} color={colors.card} style={styles.clayShell}>
              <View style={styles.clayInner}>
                <View style={styles.editorHeader}>
                  <AppText variant="h3" weight="bold" style={{ flex: 1 }}>
                    {selectedPackage ? 'Edit package' : 'New package'}
                  </AppText>
                  {selectedPackage ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <PressClay onPress={clearEditor}>
                        <AppText variant="caption" style={{ color: colors.primary }}>
                          New
                        </AppText>
                      </PressClay>
                      <PressClay onPress={() => confirmDeletePackage(selectedPackage)}>
                        <ClayView depth={2} color={colors.card} style={styles.iconBtn}>
                          <Icon name="delete-outline" size={20} color={colors.error} />
                        </ClayView>
                      </PressClay>
                    </View>
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
                    title={isSaving ? 'Saving…' : 'Save package details'}
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
                      COURSES ({itemDrafts.length})
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
                      Only courses with “Apply to term” checked are created. New offerings enroll linked
                      student groups; existing offerings in the term are left unchanged.
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
                          OFFERINGS FROM THIS PACKAGE IN TERM
                        </AppText>
                        {periodOfferingsLoading ? (
                          <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
                        ) : periodOfferings.length === 0 ? (
                          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
                            No offerings from this package in the selected term yet.
                          </AppText>
                        ) : (
                          periodOfferings.map((offering) => (
                            <TermOfferingSessionCard
                              key={offering.id}
                              periodId={applyPeriodId}
                              offering={offering}
                            />
                          ))
                        )}
                      </>
                    ) : null}
                  </>
                ) : null}
              </View>
            </ClayView>
          </ScrollView>

          <SearchableOptionPickerSheet
            isVisible={periodPickerOpen}
            onClose={() => setPeriodPickerOpen(false)}
            title="Choose period"
            searchPlaceholder="Search periods…"
            options={periodOptions}
            selected={applyPeriodId || null}
            onSelect={(id) => setApplyPeriodId(id ?? '')}
            allLabel="No period"
            height={480}
            zIndexBase={300}
          />
        </PageContainer>
      </SafeAreaView>
    </View>
  );
}
