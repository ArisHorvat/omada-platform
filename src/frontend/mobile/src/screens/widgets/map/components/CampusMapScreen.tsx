import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { AppText, AppButton } from '@/src/components/ui';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { useThemeColors } from '@/src/hooks';
import { ScreenTransition } from '@/src/components/animations';
import { createStyles } from '../styles/campus.styles';
import { fitCoordinatesFromBuildings, useCampusMap } from '../hooks/useCampusMap';
import type { BuildingDto } from '@/src/api/generatedClient';

const DEFAULT_REGION = {
  latitude: 46.7699,
  longitude: 23.6062,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

export default function CampusMapScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { buildingsQuery, buildings, navigateToFloorplan } = useCampusMap();
  const mapRef = useRef<MapView>(null);
  const [selected, setSelected] = useState<BuildingDto | null>(null);

  useEffect(() => {
    const coords = fitCoordinatesFromBuildings(buildings);
    if (coords.length === 0) return;
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 100, right: 48, bottom: 160, left: 48 },
        animated: true,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [buildings]);

  const isDarkMap = colors.isDark;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ClayBackButton absolute style={{ backgroundColor: colors.card, borderRadius: 22 }} />

      <ScreenTransition style={styles.container}>
        {buildingsQuery.isLoading && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {buildingsQuery.isError && (
          <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
            <AppText variant="body">Could not load buildings. Pull to refresh or try again later.</AppText>
          </View>
        )}

        {!buildingsQuery.isLoading && !buildingsQuery.isError && (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={DEFAULT_REGION}
            showsUserLocation
            showsMyLocationButton
            userInterfaceStyle={isDarkMap ? 'dark' : 'light'}
          >
            {buildings.map((b) => {
              if (b.latitude == null || b.longitude == null) return null;
              return (
                <Marker
                  key={b.id}
                  coordinate={{ latitude: b.latitude, longitude: b.longitude }}
                  anchor={{ x: 0.5, y: 1 }}
                  onPress={() => setSelected(b)}
                >
                  <View style={styles.markerBubble}>
                    <MaterialIcons name="apartment" size={28} color={colors.primary} />
                  </View>
                </Marker>
              );
            })}
          </MapView>
        )}
      </ScreenTransition>

      <BottomSheet isVisible={!!selected} onClose={() => setSelected(null)} height={280}>
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
  );
}
