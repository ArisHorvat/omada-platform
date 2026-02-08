import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { useThemeColors } from '@/src/hooks';
import { createStyles } from '../styles/campus.styles';
import { useCampusLogic } from '../hooks/useCampusLogic';
import { ScreenTransition } from '@/src/components/animations';


export default function CampusMapScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { initialRegion, buildings, handleNavigateToIndoor } = useCampusLogic();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ClayBackButton style={{ backgroundColor: colors.card, borderRadius: 22 }} />

      <ScreenTransition 
        style={styles.container} 
      >
        <MapView 
          style={styles.map} 
          initialRegion={initialRegion}
          showsUserLocation={true} 
          showsMyLocationButton={true}
          userInterfaceStyle={colors.background === '#101922' ? 'dark' : 'light'}
        >
          {buildings.map((building) => (
            <Marker
              key={building.id}
              coordinate={building.coordinate}
              title={building.title}
              description={building.description}
              pinColor={colors.primary} 
            >
              <Callout onPress={() => handleNavigateToIndoor(building.id)} tooltip>
                <View style={styles.calloutWrapper}>
                  <View style={styles.calloutHeader}>
                    <Text style={styles.calloutTitle}>{building.title}</Text>
                  </View>
                  <View style={styles.calloutBody}>
                    <Text style={styles.calloutDesc}>Tap to view floor plan</Text>
                    <MaterialIcons name="arrow-forward" size={14} color={colors.primary} />
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      </ScreenTransition>
    </View>
  );
}