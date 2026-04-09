import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Icon, AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { MAP_SNIPPET_REGION } from '../utils/scheduleMapConstants';

interface Props {
  onPress: () => void;
  overlayLabel: string;
}

export function ScheduleMapSnippet({ onPress, overlayLabel }: Props) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.mapWrap}>
      <MapView
        style={styles.map}
        pointerEvents="none"
        region={MAP_SNIPPET_REGION}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Marker
          coordinate={{ latitude: MAP_SNIPPET_REGION.latitude, longitude: MAP_SNIPPET_REGION.longitude }}
        />
      </MapView>
      <View style={[styles.mapOverlay, { backgroundColor: colors.card + 'EE' }]}>
        <Icon name="map" size={20} color={colors.primary} />
        <AppText variant="caption" style={{ color: colors.subtle, marginLeft: 8, flex: 1 }} numberOfLines={2}>
          {overlayLabel}
        </AppText>
        <Icon name="open-in-new" size={18} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    height: 140,
    position: 'relative',
  },
  map: { ...StyleSheet.absoluteFillObject },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
});
