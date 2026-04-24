import React from 'react';
import { ScrollView, View } from 'react-native';
import { FloorplanMapPanel } from '@/src/screens/admin/floorplan-workspace/components/FloorplanMapPanel';
import { FloorplanPinsTab } from '@/src/screens/admin/floorplan-workspace/components/FloorplanPinsTab';
import { FloorplanRoomsTab } from '@/src/screens/admin/floorplan-workspace/components/FloorplanRoomsTab';
import { FloorplanSegmentedTabs } from '@/src/screens/admin/floorplan-workspace/components/FloorplanSegmentedTabs';
import { FloorplanSetupTab } from '@/src/screens/admin/floorplan-workspace/components/FloorplanSetupTab';
import { FloorplanWorkspaceGate } from '@/src/screens/admin/floorplan-workspace/components/FloorplanWorkspaceGate';
import { FloorplanWorkspaceHeader } from '@/src/screens/admin/floorplan-workspace/components/FloorplanWorkspaceHeader';
import {
  type FloorplanWorkspaceModel,
  useFloorplanWorkspace,
} from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';
import { createFloorplanWorkspaceStyles } from '@/src/screens/admin/floorplan-workspace/styles/floorplanWorkspaceScreen.styles';

function FloorplanTabContent({ model }: { model: FloorplanWorkspaceModel }) {
  if (model.activeTab === 'setup') return <FloorplanSetupTab model={model} />;
  if (model.activeTab === 'rooms') return <FloorplanRoomsTab model={model} />;
  return <FloorplanPinsTab model={model} />;
}

export default function FloorplanWorkspaceScreen() {
  const model = useFloorplanWorkspace();
  const styles = createFloorplanWorkspaceStyles(model.colors);

  if (model.workspaceIntent === 'unset') {
    return <FloorplanWorkspaceGate model={model} />;
  }

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
