import React from 'react';
import { View, StyleSheet } from 'react-native';

import { AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { formatTenGrade, tenGradeTone } from '../utils/gradeScale';

interface GradesTenScaleRingProps {
  value: number | null;
  size?: number;
}

/** Ten-step ring — filled segments show standing on the 1–10 scale. */
export function GradesTenScaleRing({ value, size = 120 }: GradesTenScaleRingProps) {
  const colors = useThemeColors();
  const tone = tenGradeTone(value);
  const accent =
    tone === 'strong' ? colors.tertiary : tone === 'mid' ? colors.primary : tone === 'low' ? colors.error : colors.subtle;
  const filled = value != null ? Math.max(1, Math.min(10, Math.round(value))) : 0;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderColor: `${colors.subtle}33` }]}>
        {Array.from({ length: 10 }).map((_, index) => {
          const step = index + 1;
          const active = step <= filled;
          const angle = index * 36 - 90;
          const radius = size / 2 - 10;
          const x = size / 2 + radius * Math.cos((angle * Math.PI) / 180) - 5;
          const y = size / 2 + radius * Math.sin((angle * Math.PI) / 180) - 5;
          return (
            <View
              key={step}
              style={[
                styles.dot,
                {
                  left: x,
                  top: y,
                  backgroundColor: active ? accent : `${colors.subtle}33`,
                },
              ]}
            />
          );
        })}
        <View style={styles.center}>
          <AppText variant="display" weight="bold" style={{ color: colors.onSecondary, fontSize: 36, lineHeight: 40 }}>
            {formatTenGrade(value)}
          </AppText>
          <AppText variant="caption" style={{ color: colors.onSecondary, opacity: 0.75 }}>
            / 10
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
