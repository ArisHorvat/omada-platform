import React, { useMemo, useState } from 'react';
import { View, ActivityIndicator, ScrollView, Pressable, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { AppText, AppButton } from '@/src/components/ui';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { useThemeColors } from '@/src/hooks';
import { ScreenTransition } from '@/src/components/animations';
import { createStyles } from '../styles/campus.styles';
import { useCampusMap } from '../hooks/useCampusMap';
import type { BuildingDto } from '@/src/api/generatedClient';

/**
 * Web: react-native-maps is native-only. Offer a list + external maps links;
 * floorplan navigation matches native via the bottom sheet.
 */
export default function CampusMapScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { buildingsQuery, buildings, navigateToFloorplan } = useCampusMap();
  const [selected, setSelected] = useState<BuildingDto | null>(null);

  const openExternalMaps = (b: BuildingDto) => {
    if (b.latitude == null || b.longitude == null) return;
    const q = `${b.latitude},${b.longitude}`;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`);
  };

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
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
              Campus map on web shows a building list. Use the mobile app for the interactive map.
            </AppText>
            {buildings.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => setSelected(b)}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    marginBottom: 10,
                    borderRadius: 14,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <View style={styles.markerBubble}>
                  <MaterialIcons name="apartment" size={28} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <AppText variant="body" weight="bold" numberOfLines={2}>
                    {b.name}
                  </AppText>
                  {b.address ? (
                    <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }} numberOfLines={2}>
                      {b.address}
                    </AppText>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
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
            {selected.latitude != null && selected.longitude != null ? (
              <AppButton
                title="Open in Google Maps"
                variant="outline"
                onPress={() => openExternalMaps(selected)}
                style={{ marginBottom: 12 }}
              />
            ) : null}
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
