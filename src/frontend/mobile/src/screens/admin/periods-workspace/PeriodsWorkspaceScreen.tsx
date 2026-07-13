import React, { useMemo } from 'react';

import { ActivityIndicator, RefreshControl, ScrollView, Switch, View } from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';



import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';

import { PageContainer } from '@/src/components/layout/PageContainer';

import { AppButton, AppText, ClayView, Icon, WidgetEmptyState } from '@/src/components/ui';

import { OrganizationType } from '@/src/api/generatedClient';

import { useThemeColors } from '@/src/hooks';

import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

import { AdminTextInput } from '@/src/screens/admin/components/AdminTextInput';

import { PeriodDateRangePicker } from './components/PeriodDateRangePicker';

import { PeriodListCard } from './components/PeriodListCard';

import { usePeriodsWorkspace } from './hooks/usePeriodsWorkspace';

import { createPeriodsWorkspaceStyles } from './styles/periods-workspace.styles';



export default function PeriodsWorkspaceScreen() {

  const colors = useThemeColors();

  const insets = useSafeAreaInsets();

  const router = useRouter();

  const styles = useMemo(() => createPeriodsWorkspaceStyles(colors), [colors]);

  const { organization } = useCurrentOrganization();

  const isUniversity = organization?.organizationType === OrganizationType.University;



  const {

    copy,

    periods,

    loading,

    newName,

    setNewName,

    startDate,

    setStartDate,

    endDate,

    setEndDate,

    markCurrent,

    setMarkCurrent,

    createPeriod,

    editingId,

    editName,

    setEditName,

    editStartDate,

    setEditStartDate,

    editEndDate,

    setEditEndDate,

    editMarkCurrent,

    setEditMarkCurrent,

    startEdit,

    cancelEdit,

    saveEdit,

    canSaveEdit,

    setAsCurrent,

    settingCurrentId,

    confirmDelete,

    canCreate,

    isSaving,

    refetch,

  } = usePeriodsWorkspace();

  const openTermCourses = (periodId: string) => {
    router.push(`/offerings-workspace?periodId=${periodId}` as never);
  };



  return (

    <View style={{ flex: 1, backgroundColor: colors.background }}>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        <PageContainer fullBleed>

          <ScreenHeader title={copy.screenTitle} subtitle={copy.screenSubtitle} />



          <ScrollView

            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}

            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.primary} />}

          >

            <ClayView depth={3} color={colors.card} style={styles.clayShell}>

              <View style={styles.clayInner}>

                <AppText variant="h3" weight="bold">

                  {copy.heroTitle}

                </AppText>

                <AppText variant="caption" style={styles.sectionHint}>

                  {copy.heroHint}

                </AppText>



                {isUniversity ? (

                  <AppText variant="caption" style={[styles.sectionHint, { marginBottom: 10 }]}>

                    Periods are date ranges only. Manage term courses, credits, and attendance rules in Course offerings. Build activities and publish in Timetables.

                  </AppText>

                ) : null}



                {isUniversity ? (

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>

                    <AppButton

                      title="Course offerings"

                      variant="outline"

                      onPress={() => router.push('/offerings-workspace')}

                      style={{ minWidth: 0 }}

                    />

                    <AppButton

                      title="Timetables"

                      variant="outline"

                      onPress={() => router.push('/timetables-workspace')}

                      style={{ minWidth: 0 }}

                    />

                  </View>

                ) : null}



                <AppText variant="label" style={styles.sectionLabel}>

                  NEW PERIOD

                </AppText>

                <AdminTextInput

                  value={newName}

                  onChangeText={setNewName}

                  placeholder={copy.namePlaceholder}

                  maxLength={120}

                />



                <AppText variant="label" style={styles.sectionLabel}>

                  {copy.dateRangeLabel}

                </AppText>

                <PeriodDateRangePicker

                  startDate={startDate}

                  endDate={endDate}

                  onStartChange={setStartDate}

                  onEndChange={setEndDate}

                />



                <View style={styles.currentRow}>

                  <AppText variant="body" style={{ color: colors.text, flex: 1 }}>

                    {copy.currentToggle}

                  </AppText>

                  <Switch value={markCurrent} onValueChange={setMarkCurrent} />

                </View>



                <AppButton

                  title={isSaving ? 'Saving…' : copy.addButton}

                  onPress={createPeriod}

                  disabled={isSaving || !canCreate}

                  style={{ alignSelf: 'flex-start', minWidth: 160 }}

                />

              </View>

            </ClayView>



            <AppText variant="label" style={styles.sectionLabel}>

              {copy.listLabel(periods.length)}

            </AppText>



            {loading && !periods.length ? (

              <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />

            ) : !periods.length ? (

              <WidgetEmptyState icon="date-range" title={copy.emptyTitle} description={copy.emptyMessage} />

            ) : (

              periods.map((period) => (

                <PeriodListCard

                  key={period.id}

                  period={period}

                  copy={copy}

                  isEditing={editingId === period.id}

                  editName={editName}

                  editStartDate={editStartDate}

                  editEndDate={editEndDate}

                  editMarkCurrent={editMarkCurrent}

                  isSaving={isSaving}

                  isSettingCurrent={settingCurrentId === period.id}

                  onEditNameChange={setEditName}

                  onEditStartChange={setEditStartDate}

                  onEditEndChange={setEditEndDate}

                  onEditMarkCurrentChange={setEditMarkCurrent}

                  onStartEdit={() => startEdit(period)}

                  onCancelEdit={cancelEdit}

                  onSaveEdit={saveEdit}

                  canSaveEdit={canSaveEdit}

                  onSetCurrent={() => setAsCurrent(period)}

                  onDelete={() => confirmDelete(period.id!, period.name ?? 'period')}

                  onManageCourses={isUniversity ? openTermCourses : undefined}

                />

              ))

            )}



            <ClayView depth={1} color={colors.card} style={styles.infoBox}>

              <View style={styles.infoRow}>

                <Icon name="info-outline" size={18} color={colors.primary} />

                <AppText variant="caption" style={{ color: colors.subtle, flex: 1, lineHeight: 18 }}>

                  {copy.infoNote}

                </AppText>

              </View>

            </ClayView>

          </ScrollView>

        </PageContainer>

      </SafeAreaView>

    </View>

  );

}


