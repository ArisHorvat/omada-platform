import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { AppText, ClayView, Icon } from '@/src/components/ui';
import type { FloorplanWorkspaceModel } from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';
import { LOCATION_WORKSPACE_COPY } from '@/src/screens/admin/floorplan-workspace/utils/locationLabels';
import { locationsWorkspaceStyles as s } from '@/src/screens/admin/floorplan-workspace/styles/locationsWorkspace.styles';

type Props = {
  model: FloorplanWorkspaceModel;
};

export function LocationTreeList({ model }: Props) {
  const {
    colors,
    buildingsQuery,
    buildings,
    floorsQuery,
    floors,
    selectedBuildingId,
    selectedFloorId,
    expandedBuildingIds,
    toggleBuildingExpanded,
    selectBuildingInTree,
    selectFloorInTree,
  } = model;

  if (buildingsQuery.isLoading) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />;
  }

  if (!buildings.length) {
    return (
      <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 20, marginTop: 8 }}>
        {LOCATION_WORKSPACE_COPY.emptyTree}
      </AppText>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {buildings.map((building) => {
        const buildingId = building.id!;
        const expanded = expandedBuildingIds.has(buildingId);
        const buildingSelected = selectedBuildingId === buildingId && !selectedFloorId;
        const showFloors = expanded && selectedBuildingId === buildingId;

        return (
          <View key={buildingId} style={{ marginBottom: 4 }}>
            <Pressable
              onPress={() => selectBuildingInTree(buildingId)}
              style={[
                s.treeRow,
                {
                  backgroundColor: buildingSelected ? `${colors.primary}22` : 'transparent',
                },
              ]}
            >
              <Pressable
                onPress={() => toggleBuildingExpanded(buildingId)}
                hitSlop={8}
                style={{ padding: 2 }}
              >
                <Icon name={expanded ? 'expand-more' : 'chevron-right'} size={20} color={colors.subtle} />
              </Pressable>
              <Icon name="location-city" size={18} color={buildingSelected ? colors.primary : colors.text} />
              <AppText
                weight={buildingSelected ? 'bold' : 'regular'}
                style={{ flex: 1, color: buildingSelected ? colors.primary : colors.text }}
                numberOfLines={1}
              >
                {building.name}
              </AppText>
            </Pressable>

            {showFloors ? (
              floorsQuery.isLoading ? (
                <ActivityIndicator color={colors.primary} style={{ marginLeft: 32, marginVertical: 8 }} />
              ) : floors.length === 0 ? (
                <AppText variant="caption" style={{ color: colors.subtle, marginLeft: 36, marginBottom: 8 }}>
                  No levels yet
                </AppText>
              ) : (
                [...floors]
                  .sort((a, b) => a.levelNumber - b.levelNumber)
                  .map((floor) => {
                    const floorSelected = selectedFloorId === floor.id;
                    const hasMap = !!(floor.floorplanImageUrl || floor.floorplanId);
                    return (
                      <Pressable
                        key={floor.id}
                        onPress={() => selectFloorInTree(buildingId, floor.id!)}
                        style={[
                          s.floorRow,
                          {
                            backgroundColor: floorSelected ? `${colors.primary}18` : 'transparent',
                          },
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Icon
                            name={hasMap ? 'map' : 'layers'}
                            size={16}
                            color={floorSelected ? colors.primary : colors.subtle}
                          />
                          <AppText
                            style={{ flex: 1, color: floorSelected ? colors.primary : colors.text }}
                            weight={floorSelected ? 'bold' : 'regular'}
                          >
                            Level {floor.levelNumber}
                          </AppText>
                          {!hasMap ? (
                            <ClayView
                              depth={1}
                              color={colors.background}
                              style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}
                            >
                              <AppText variant="caption" style={{ color: colors.subtle, fontSize: 10 }}>
                                List
                              </AppText>
                            </ClayView>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })
              )
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}
