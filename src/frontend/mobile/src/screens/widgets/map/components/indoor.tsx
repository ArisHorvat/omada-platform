import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';
import { useThemeColors } from '@/src/hooks';
import { createStyles } from '../styles/indoor.styles';
import { useIndoorLogic } from '../hooks/useIndoorLogic';

export default function IndoorMapScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { buildingId, currentFloor, setCurrentFloor, handleRoomPress, getRoomColor } = useIndoorLogic();

  // Helper component for the Floor Button
  const FloorButton = ({ level }: { level: number }) => (
    <TouchableOpacity 
      style={[styles.floorButton, currentFloor === level && styles.activeFloorButton]} 
      onPress={() => setCurrentFloor(level)}
    >
      <Text style={[styles.floorText, currentFloor === level && styles.activeFloorText]}>
        Level {level}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{buildingId === 'fsega' ? 'FSEGA' : 'Central Building'}</Text>
        <Text style={styles.subtitle}>Navigate classrooms and labs</Text>
      </View>

      {/* 1. THE FLOOR SWITCHER */}
      <View style={styles.floorSwitcher}>
        <FloorButton level={1} />
        <FloorButton level={2} />
        <FloorButton level={3} />
      </View>

      <ScrollView style={styles.scrollView} maximumZoomScale={3.0} contentContainerStyle={styles.scrollContent}>
        <ScrollView horizontal contentContainerStyle={styles.scrollContent}>
          <Svg width={800} height={600} viewBox="0 0 800 600">
            {/* Building Outline (Same for all floors usually) */}
            <Rect x="50" y="50" width="700" height="500" fill="none" stroke={colors.text} strokeWidth="4" />
            <Rect x="52" y="52" width="696" height="496" fill={colors.card} opacity={0.1} />

            {/* 2. CONDITIONAL FLOOR RENDERING */}
            
            {/* FLOOR 1 LAYOUT */}
            {currentFloor === 1 && (
              <>
                 <G onPress={() => handleRoomPress('101')}>
                    <Rect x="100" y="100" width="200" height="150" fill={getRoomColor('101')} stroke={colors.text} strokeWidth="2" opacity={0.8} />
                    <SvgText x="200" y="175" fill="white" fontSize="20" fontWeight="bold" textAnchor="middle">101</SvgText>
                 </G>
                 {/* More rooms for Floor 1... */}
              </>
            )}

            {/* FLOOR 2 LAYOUT */}
            {currentFloor === 2 && (
              <>
                 <G onPress={() => handleRoomPress('201')}>
                    {/* Notice coordinate change: different layout */}
                    <Rect x="100" y="300" width="200" height="150" fill={getRoomColor('201')} stroke={colors.text} strokeWidth="2" opacity={0.8} />
                    <SvgText x="200" y="375" fill="white" fontSize="20" fontWeight="bold" textAnchor="middle">201</SvgText>
                 </G>
              </>
            )}

             {/* FLOOR 3 LAYOUT */}
             {currentFloor === 3 && (
              <>
                 <G onPress={() => handleRoomPress('301')}>
                    <Rect x="100" y="100" width="200" height="150" fill={getRoomColor('301')} stroke={colors.text} strokeWidth="2" opacity={0.8} />
                    <SvgText x="200" y="175" fill="white" fontSize="20" fontWeight="bold" textAnchor="middle">301</SvgText>
                 </G>
                 <G onPress={() => handleRoomPress('302')}>
                    <Rect x="350" y="100" width="200" height="150" fill={getRoomColor('302')} stroke={colors.text} strokeWidth="2" opacity={0.8} />
                    <SvgText x="450" y="175" fill="white" fontSize="20" fontWeight="bold" textAnchor="middle">302</SvgText>
                 </G>
              </>
            )}

          </Svg>
        </ScrollView>
      </ScrollView>

      {/* Keep Legend logic same as before... */}
      <View style={styles.legend}>
         {/* ... */}
      </View>
    </View>
  );
}