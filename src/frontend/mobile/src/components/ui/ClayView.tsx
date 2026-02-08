import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { 
  Canvas, 
  RoundedRect, 
  LinearGradient, 
  vec,
  Group
} from '@shopify/react-native-skia';
import { useDerivedValue, interpolate } from 'react-native-reanimated';
import { useThemeColors } from '@/src/hooks';
import { useClayPress } from '@/src/context/ClayPressContext';

interface ClayViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  color?: string;
  depth?: number;
  puffy?: number;
}

export const ClayView = ({ 
  children, 
  style, 
  color,
  depth = 15,
  puffy = 20
}: ClayViewProps) => {
  const colors = useThemeColors();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const pressProgress = useClayPress(); // <--- Get press state
  
  const baseColor = color || colors.card;

  // ------------------------------------------------------------------
  // 1. ANIMATION LOGIC
  // ------------------------------------------------------------------
  // If pressProgress exists (we are inside PressClay), animate. Otherwise use static.
  
  // Puffy: Flattens from 100% -> 60% when pressed
  const animatedPuffy = useDerivedValue(() => {
    if (!pressProgress) return puffy;
    return interpolate(pressProgress.value, [0, 1], [puffy, puffy * 0.6]);
  });

  // Opacity Calcs (Derived from Puffy)
  const highlightOp = useDerivedValue(() => Math.min(animatedPuffy.value / 50, 0.6));
  const shadowOp = useDerivedValue(() => Math.min(animatedPuffy.value / 60, 0.3));

  // ------------------------------------------------------------------
  // 2. STYLE EXTRACTION
  // ------------------------------------------------------------------
  const flatStyle = StyleSheet.flatten(style || {}) as ViewStyle;
  const { 
      // Extract layout props for INNER
      padding, paddingHorizontal, paddingVertical, 
      paddingTop, paddingBottom, paddingLeft, paddingRight,
      justifyContent, alignItems, flexDirection, gap,
      
      // Extract visual props to prevent "Square Corners"
      backgroundColor, shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation,

      borderRadius,
      
      // Keep rest for OUTER
      ...containerStyle 
  } = flatStyle;

  const requestedRadius = typeof borderRadius === 'number' ? borderRadius : 32;

  const radius = layout.height > 0 
    ? Math.min(requestedRadius, layout.height / 2, layout.width / 2) 
    : requestedRadius;

  const innerStyle = { 
      padding, paddingHorizontal, paddingVertical, 
      paddingTop, paddingBottom, paddingLeft, paddingRight,
      justifyContent, alignItems, flexDirection, gap 
  };

  return (
    <View 
      style={[
        styles.container, 
        containerStyle,
        {
            borderRadius: radius,
            backgroundColor: baseColor,
            // STATIC NATIVE SHADOW (Prevents Glitching)
            shadowColor: "#000",
            shadowOffset: { width: 0, height: depth * 0.6 },
            shadowOpacity: 0.05 + (depth * 0.01),
            shadowRadius: depth * 0.8,
            elevation: depth,
        }
      ]} 
      onLayout={(e) => setLayout(e.nativeEvent.layout)}
    >
      {/* SKIA LAYER */}
      {layout.width > 0 && (
        <Canvas style={StyleSheet.absoluteFill}>
          
            {/* LAYER 1: HIGHLIGHTS (Top-Left) */}
            {/* FIX: Wrap in Group to apply Opacity */}
            <Group opacity={highlightOp}>
                <RoundedRect x={0} y={0} width={layout.width} height={layout.height} r={radius}>
                    <LinearGradient
                        start={vec(0, 0)}
                        end={vec(layout.width * 0.6, layout.height * 0.6)}
                        colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
                    />
                </RoundedRect>
            </Group>

            {/* LAYER 2: INNER SHADOW (Bottom-Right) */}
            {/* FIX: Wrap in Group to apply Opacity */}
            <Group opacity={shadowOp}>
                <RoundedRect x={0} y={0} width={layout.width} height={layout.height} r={radius}>
                    <LinearGradient
                        start={vec(layout.width * 0.4, layout.height * 0.4)}
                        end={vec(layout.width, layout.height)}
                        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.2)']}
                    />
                </RoundedRect>
            </Group>

            {/* LAYER 3: RIM STROKE */}
            <RoundedRect
                x={1} y={1} width={layout.width - 2} height={layout.height - 2} r={radius}
                color="rgba(255,255,255,0.3)" style="stroke" strokeWidth={1.5}
            />
            
        </Canvas>
      )}

      {/* CONTENT LAYER */}
      <View style={[styles.content, innerStyle, { borderRadius: radius }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  content: {
    flex: 1, 
    zIndex: 1,
    overflow: 'hidden',
  }
});