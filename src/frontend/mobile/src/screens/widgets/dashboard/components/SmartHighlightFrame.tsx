import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColors } from '@/src/hooks';

interface SmartHighlightFrameProps {
  children: React.ReactNode;
  /** First card in the strip gets the emphasis treatment */
  emphasized?: boolean;
}

/**
 * Wraps a highlight card with a subtle gradient ring + shadow so priority feels intentional
 * (not just a larger tile).
 */
export function SmartHighlightFrame({ children, emphasized }: SmartHighlightFrameProps) {
  const colors = useThemeColors();

  if (!emphasized) {
    return <>{children}</>;
  }

  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={[`${colors.primary}55`, `${colors.secondary}33`, `${colors.primary}22`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientRing}
      >
        <View style={[styles.innerPad, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.innerStroke,
              {
                borderColor: `${colors.primary}66`,
                shadowColor: colors.primary,
              },
            ]}
          >
            {children}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginRight: 12,
    borderRadius: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  gradientRing: {
    borderRadius: 36,
    padding: 2,
  },
  innerPad: {
    borderRadius: 34,
    overflow: 'hidden',
    alignItems: 'center',
  },
  innerStroke: {
    borderRadius: 34,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 2,
  },
});
