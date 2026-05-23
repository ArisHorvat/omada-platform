import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { AppText, ClayView } from '@/src/components/ui';
import { WidgetPageShell } from '@/src/components/layout';
import { useWebSpiderWorkspace } from './hooks/useWebSpiderWorkspace';
import { createWebSpiderWorkspaceStyles } from './styles/webSpiderWorkspace.styles';
import { WebSpiderWorkspaceHeader } from './components/WebSpiderWorkspaceHeader';
import { WebSpiderSegmentedTabs } from './components/WebSpiderSegmentedTabs';
import { WebSpiderScheduleTab } from './components/WebSpiderScheduleTab';
import { WebSpiderNewsTab } from './components/WebSpiderNewsTab';
import {
  SchedulePreviewFiltersSheet,
  type SchedulePreviewFilterState,
} from './components/SchedulePreviewFiltersSheet';
import type { ScrapedScheduleEvent } from './utils/schedulePreviewGrouping';

export default function WebSpiderWorkspaceScreen() {
  const model = useWebSpiderWorkspace();
  const {
    colors,
    insets,
    horizontalPad,
    loadingConfig,
    statusMessage,
    errorMessage,
    activeTab,
    schedulePreview,
    scheduleEvents,
  } = model;
  const styles = createWebSpiderWorkspaceStyles(colors);

  const [scheduleFilter, setScheduleFilter] = useState<SchedulePreviewFilterState>({
    viewMode: 'group',
    focusKey: null,
  });
  const [scheduleFiltersOpen, setScheduleFiltersOpen] = useState(false);

  useEffect(() => {
    setScheduleFilter({ viewMode: 'group', focusKey: null });
    setScheduleFiltersOpen(false);
  }, [schedulePreview?.sourceUrl]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <WidgetPageShell>
      <WebSpiderWorkspaceHeader model={model} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPad }]}
        keyboardShouldPersistTaps="handled"
      >
        {loadingConfig ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
        ) : (
          <>
            {errorMessage ? (
              <ClayView depth={1} color={colors.card} style={[styles.infoBanner, { borderWidth: 1, borderColor: colors.border }]}>
                <AppText variant="body" style={{ color: colors.text }}>
                  {errorMessage}
                </AppText>
              </ClayView>
            ) : null}
            {statusMessage ? (
              <AppText variant="caption" style={[styles.statusText, { color: colors.primary }]}>
                {statusMessage}
              </AppText>
            ) : null}

            <WebSpiderSegmentedTabs model={model} />
            {activeTab === 'schedule' ? (
              <WebSpiderScheduleTab
                model={model}
                scheduleFilter={scheduleFilter}
                onOpenScheduleFilters={() => setScheduleFiltersOpen(true)}
              />
            ) : (
              <WebSpiderNewsTab model={model} />
            )}
          </>
        )}
      </ScrollView>

      {activeTab === 'schedule' && scheduleEvents.length > 0 ? (
        <SchedulePreviewFiltersSheet
          visible={scheduleFiltersOpen}
          onClose={() => setScheduleFiltersOpen(false)}
          events={scheduleEvents as ScrapedScheduleEvent[]}
          value={scheduleFilter}
          onApply={setScheduleFilter}
        />
      ) : null}
      </WidgetPageShell>
    </View>
  );
}
