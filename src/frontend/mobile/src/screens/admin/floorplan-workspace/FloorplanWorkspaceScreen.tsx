import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppButton, AppText, Icon } from '@/src/components/ui';
import { SplitPane, WidgetPageShell } from '@/src/components/layout';
import { SPLIT_PANE_LIST_WIDTH } from '@/src/constants/layout';
import { useBreakpoint } from '@/src/hooks';
import { FloorplanMapPanel } from '@/src/screens/admin/floorplan-workspace/components/FloorplanMapPanel';
import { FloorplanPinsTab } from '@/src/screens/admin/floorplan-workspace/components/FloorplanPinsTab';
import { FloorplanRoomsTab } from '@/src/screens/admin/floorplan-workspace/components/FloorplanRoomsTab';
import { FloorplanSegmentedTabs } from '@/src/screens/admin/floorplan-workspace/components/FloorplanSegmentedTabs';
import { FloorplanSetupTab } from '@/src/screens/admin/floorplan-workspace/components/FloorplanSetupTab';
import { FloorplanWorkspaceHeader } from '@/src/screens/admin/floorplan-workspace/components/FloorplanWorkspaceHeader';
import { LocationDetailPanel } from '@/src/screens/admin/floorplan-workspace/components/LocationDetailPanel';
import { LocationTreeList } from '@/src/screens/admin/floorplan-workspace/components/LocationTreeList';
import {
  type FloorplanWorkspaceModel,
  useFloorplanWorkspace,
} from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';
import { createFloorplanWorkspaceStyles } from '@/src/screens/admin/floorplan-workspace/styles/floorplanWorkspaceScreen.styles';
import { LOCATION_WORKSPACE_COPY } from '@/src/screens/admin/floorplan-workspace/utils/locationLabels';
import { locationsWorkspaceStyles as locStyles } from '@/src/screens/admin/floorplan-workspace/styles/locationsWorkspace.styles';

function FloorplanTabContent({ model }: { model: FloorplanWorkspaceModel }) {
  if (model.activeTab === 'setup') return <FloorplanSetupTab model={model} />;
  if (model.activeTab === 'rooms') return <FloorplanRoomsTab model={model} />;
  return <FloorplanPinsTab model={model} />;
}

function LocationsBrowseView({ model }: { model: FloorplanWorkspaceModel }) {
  const { colors, insets, goBackToLocations, startNewLocationForm } = model;
  const { isWideShell } = useBreakpoint();

  const treeSection = (
    <View style={locStyles.treeSection}>
      <AppText variant="label" style={{ color: colors.subtle, marginBottom: 8 }}>
        {LOCATION_WORKSPACE_COPY.treeLabel}
      </AppText>
      <LocationTreeList model={model} />
    </View>
  );

  return (
    <View style={[locStyles.root, { paddingTop: insets.top }]}>
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Pressable
            onPress={goBackToLocations}
            hitSlop={12}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
          >
            <Icon name="arrow-back" size={22} color={colors.text} />
            <AppText variant="h2" weight="bold" numberOfLines={1}>
              {LOCATION_WORKSPACE_COPY.screenTitle}
            </AppText>
          </Pressable>
          <AppButton
            title={LOCATION_WORKSPACE_COPY.newLocationButton}
            onPress={startNewLocationForm}
            style={{ paddingHorizontal: 12, minWidth: 0 }}
          />
        </View>
        <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 20 }}>
          {LOCATION_WORKSPACE_COPY.heroHint}
        </AppText>
      </View>

      {isWideShell ? (
        <SplitPane sidebarWidth={SPLIT_PANE_LIST_WIDTH} sidebar={treeSection} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <LocationDetailPanel model={model} />
          </ScrollView>
        </SplitPane>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {treeSection}
          <View style={{ marginTop: 16 }}>
            <LocationDetailPanel model={model} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function FloorplanEditorView({ model }: { model: FloorplanWorkspaceModel }) {
  const styles = createFloorplanWorkspaceStyles(model.colors);

  return (
    <View style={[styles.root, { paddingTop: model.insets.top }]}>
      <FloorplanWorkspaceHeader model={model} />
      <View style={{ flex: 1, minHeight: 0 }}>
        {!model.isWideLayout ? (
          <>
            <View style={{ height: '45%', paddingHorizontal: model.horizontalPad, marginBottom: model.splitGap }}>
              <FloorplanMapPanel model={model} compactChrome />
            </View>
            <View style={{ flex: 1, minHeight: 0, paddingHorizontal: model.horizontalPad }}>
              <FloorplanSegmentedTabs model={model} />
              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: model.insets.bottom + 24 }}
                showsVerticalScrollIndicator={false}
              >
                <FloorplanTabContent model={model} />
              </ScrollView>
            </View>
          </>
        ) : (
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              paddingHorizontal: model.horizontalPad,
              gap: model.splitGap,
              alignItems: 'stretch',
              minHeight: 0,
            }}
          >
            <View style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
              <FloorplanSegmentedTabs model={model} />
              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: model.insets.bottom + 24 }}
                showsVerticalScrollIndicator={false}
              >
                <FloorplanTabContent model={model} />
              </ScrollView>
            </View>
            <View style={{ width: model.mapColumnWidth, alignSelf: 'stretch', minHeight: 0 }}>
              <FloorplanMapPanel model={model} />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

export default function FloorplanWorkspaceScreen() {
  const model = useFloorplanWorkspace();

  return (
    <WidgetPageShell fullBleed>
      {model.workspaceIntent === 'browse' ? (
        <LocationsBrowseView model={model} />
      ) : (
        <FloorplanEditorView model={model} />
      )}
    </WidgetPageShell>
  );
}
