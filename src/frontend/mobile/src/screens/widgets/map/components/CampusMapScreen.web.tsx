import React, { useCallback, useMemo, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { AppText, AppButton } from '@/src/components/ui';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { WidgetPageShell } from '@/src/components/layout';
import { useThemeColors } from '@/src/hooks';
import { createStyles } from '../styles/campus.styles';
import { useCampusMap } from '../hooks/useCampusMap';
import { useCampusMapPortalHost } from '../hooks/useCampusMapPortalHost.web';
import { useCampusMapRouteFocused } from '../hooks/useCampusMapRouteFocused.web';
import { useCampusMapWebLayout } from '../hooks/useCampusMapWebLayout.web';
import type { BuildingDto } from '@/src/api/generatedClient';
import { CampusMapLeaflet } from './CampusMapLeaflet.web';
import { MapWebHeader } from './MapWebHeader.web';

/**
 * Web campus map — isolated iframe + portaled chrome; sheet anchored to map pane only.
 */
export default function CampusMapScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { buildingsQuery, buildings, navigateToFloorplan } = useCampusMap();
  const [selected, setSelected] = useState<BuildingDto | null>(null);
  const focused = useCampusMapRouteFocused();
  const { headerRect, mapRect } = useCampusMapWebLayout();
  const portalHost = useCampusMapPortalHost(focused);

  useFocusEffect(
    useCallback(() => () => setSelected(null), []),
  );

  const showMap = focused && portalHost && !buildingsQuery.isLoading && !buildingsQuery.isError;

  return (
    <WidgetPageShell fullBleed>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {!focused ? <ScreenHeader overlay title="Campus map" /> : null}

        <View style={[styles.container, { minHeight: 0 }]}>
          {buildingsQuery.isLoading && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {buildingsQuery.isError && (
            <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
              <AppText variant="body">
                Could not load buildings. Pull to refresh or try again later.
              </AppText>
            </View>
          )}

          {showMap ? (
            <>
              <MapWebHeader portalHost={portalHost} headerRect={headerRect} title="Campus map" />
              <CampusMapLeaflet
                portalHost={portalHost}
                mapRect={mapRect}
                buildings={buildings}
                isDark={colors.isDark}
                primaryColor={colors.primary}
                onBuildingPress={setSelected}
              />
            </>
          ) : null}
        </View>

        <BottomSheet
          isVisible={!!selected && focused}
          onClose={() => setSelected(null)}
          height={280}
          zIndexBase={520}
          webAnchor={focused ? mapRect : null}
        >
          {selected && (
            <>
              <AppText variant="h3" weight="bold" style={{ marginBottom: 8 }}>
                {selected.name}
              </AppText>
              {selected.address ? (
                <AppText variant="body" style={{ color: colors.subtle, marginBottom: 16 }}>
                  {selected.address}
                </AppText>
              ) : (
                <View style={{ marginBottom: 16 }} />
              )}
              <AppButton
                title="View Floorplans"
                onPress={() => {
                  const id = selected.id;
                  setSelected(null);
                  navigateToFloorplan(id);
                }}
              />
            </>
          )}
        </BottomSheet>
      </View>
    </WidgetPageShell>
  );
}
