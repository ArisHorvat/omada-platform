import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { WidgetPageShell } from '@/src/components/layout';
import { AppText, ClayView } from '@/src/components/ui';
import { OrganizationType } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { isUniversityOrg } from '@/src/screens/widgets/tasks/utils/taskLabels';

import { useTimetablesWorkspace } from './hooks/useTimetablesWorkspace';
import { useWebSpiderWorkspace } from '@/src/screens/admin/web-spider-workspace/hooks/useWebSpiderWorkspace';
import { createTimetablesWorkspaceStyles } from './styles/timetables-workspace.styles';
import { TimetablesScopeTrigger } from './components/TimetablesScopeTrigger';
import { TimetablesSegmentedTabs } from './components/TimetablesSegmentedTabs';
import { TimetablesViewTab } from './components/TimetablesViewTab';
import { TimetablesBuildTab } from './components/TimetablesBuildTab';
import { TimetablesImportTab } from './components/TimetablesImportTab';

export default function TimetablesWorkspaceScreen() {
  const router = useRouter();
  const { tab, periodId: periodIdParam, offeringId: offeringIdParam } = useLocalSearchParams<{
    tab?: string;
    periodId?: string;
    offeringId?: string;
  }>();
  const model = useTimetablesWorkspace();
  const spider = useWebSpiderWorkspace();
  const { colors, insets, horizontalPad, activeTab, setActiveTab, periodsLoading, refetch, viewDisplayMode, previewRefreshing, selectPeriod, setOfferingId, periods } = model;
  const styles = useMemo(() => createTimetablesWorkspaceStyles(colors), [colors]);
  const { organization } = useCurrentOrganization();
  const isUniversity = isUniversityOrg(organization?.organizationType ?? OrganizationType.University);

  useEffect(() => {
    if (tab === 'import') setActiveTab('import');
    else if (tab === 'build') setActiveTab('build');
    else if (tab === 'view') setActiveTab('view');
  }, [tab, setActiveTab]);

  useEffect(() => {
    if (typeof periodIdParam !== 'string' || !periodIdParam || !periods.length) return;
    if (periods.some((p) => p.id === periodIdParam)) {
      selectPeriod(periodIdParam);
    }
  }, [periodIdParam, periods, selectPeriod]);

  useEffect(() => {
    if (typeof offeringIdParam === 'string' && offeringIdParam) {
      setOfferingId(offeringIdParam);
    }
  }, [offeringIdParam, setOfferingId]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <WidgetPageShell fullBleed>
        <ScreenHeader title="Timetables" onBack={() => router.back()} />
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalPad, paddingBottom: viewDisplayMode === 'grid' ? 48 : 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={activeTab === 'view' && previewRefreshing}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        >
          {!isUniversity ? (
            <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <AppText variant="body" style={{ color: colors.text }}>
                Native timetable publishing is built for university orgs. You can still import legacy schedules from the
                web tab.
              </AppText>
            </ClayView>
          ) : null}

          {periodsLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
          ) : (
            <>
              <TimetablesScopeTrigger model={model} />
              <TimetablesSegmentedTabs model={model} />
              {activeTab === 'view' ? <TimetablesViewTab model={model} /> : null}
              {activeTab === 'build' && isUniversity ? <TimetablesBuildTab model={model} /> : null}
              {activeTab === 'build' && !isUniversity ? (
                <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14 }}>
                  <AppText variant="body" style={{ color: colors.subtle }}>
                    Build & publish is available for university organizations.
                  </AppText>
                </ClayView>
              ) : null}
              <View style={{ display: activeTab === 'import' ? 'flex' : 'none' }}>
                <TimetablesImportTab model={model} spider={spider} />
              </View>
            </>
          )}
        </ScrollView>
      </WidgetPageShell>
    </View>
  );
}
