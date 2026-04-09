import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Icon } from '@/src/components/ui';
import { styles } from '../styles/mapWidget.styles';
import { BaseWidgetProps } from '@/src/constants/widgets.registry';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useQuery } from '@tanstack/react-query';
import { mapsApi, unwrap } from '@/src/api';
import { useLocation } from '@/src/hooks/useLocation';

export const MapWidget: React.FC<BaseWidgetProps> = ({ variant, color }) => {
  const router = useRouter();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;
  const { location } = useLocation();
  const buildingsQuery = useQuery({
    queryKey: ['map-widget-buildings', orgId],
    queryFn: async () => unwrap(mapsApi.getBuildingsForOrganization(orgId!)),
    enabled: !!orgId,
  });

  const nearest = getNearestBuilding(
    buildingsQuery.data ?? [],
    location?.coords?.latitude,
    location?.coords?.longitude,
  );

  if (variant === 'card') {
    return (
      <View style={styles.cardContainer}>
        <AppText variant="h3" weight="bold" style={{ marginBottom: 10, color }}>Quick actions</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {[
            { id: 'food', label: 'Find Food', icon: 'restaurant' as const },
            { id: 'library', label: 'Find Library', icon: 'local-library' as const },
            { id: 'atm', label: 'Find ATM', icon: 'local-atm' as const },
          ].map((a) => (
            <TouchableOpacity
              key={a.id}
              onPress={() => {
                router.push('/map');
                Alert.alert(a.label, 'Opening map...');
              }}
              style={{ minWidth: 88 }}
            >
              <View style={[styles.mapPlaceholder, { backgroundColor: color + '12', height: 68, marginBottom: 6 }]}>
                <Icon name={a.icon} size={22} color={color} />
              </View>
              <AppText variant="caption" style={{ textAlign: 'center' }}>{a.label}</AppText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }
  
  if (variant === 'bento') {
    return (
      <TouchableOpacity style={styles.bentoContainer} onPress={() => router.push('/map')}>
        <Icon name="place" size={26} color={color} />
        <AppText variant="caption" style={{ marginTop: 6, color: '#6b7280' }}>Nearest Building</AppText>
        <AppText weight="bold" style={{ textAlign: 'center' }}>{nearest.name}</AppText>
        <AppText variant="caption" style={{ color: '#6b7280' }}>{nearest.distanceLabel}</AppText>
      </TouchableOpacity>
    );
  }
  return null;
};

function getNearestBuilding(
  buildings: { name?: string; latitude?: number; longitude?: number }[],
  lat?: number,
  lon?: number,
) {
  if (!buildings.length) return { name: 'No building data', distanceLabel: '—' };
  if (lat == null || lon == null) return { name: buildings[0].name ?? 'Nearest building', distanceLabel: 'Enable location' };
  let best = buildings[0];
  let dist = Number.POSITIVE_INFINITY;
  for (const b of buildings) {
    if (b.latitude == null || b.longitude == null) continue;
    const d = haversineKm(lat, lon, b.latitude, b.longitude);
    if (d < dist) {
      best = b;
      dist = d;
    }
  }
  return {
    name: best.name ?? 'Nearest building',
    distanceLabel: `${Math.round(dist * 1000)} m walk`,
  };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}