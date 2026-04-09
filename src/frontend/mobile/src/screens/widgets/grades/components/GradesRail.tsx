import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Icon, Skeleton } from '@/src/components/ui';
import { AnimatedItem } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';
import { useGradesLogic } from '../hooks/useGradesLogic';

interface GradesRailProps {
  accentColor: string;
}

/**
 * Rail: analytics-style icon (PDF).
 */
export const GradesRail: React.FC<GradesRailProps> = ({ accentColor }) => {
  const { currentGpa, isLoading } = useGradesLogic();

  if (isLoading) {
    return (
      <AnimatedItem animation={ClayAnimations.List(0)}>
        <Skeleton width={28} height={28} borderRadius={14} />
      </AnimatedItem>
    );
  }

  return (
    <AnimatedItem animation={ClayAnimations.List(0)}>
      <View style={styles.wrap}>
        <Icon name="analytics" size={26} color={accentColor} />
        {currentGpa > 0 ? (
          <View style={[styles.badge, { backgroundColor: accentColor }]}>
            <AppText variant="caption" weight="bold" style={styles.badgeText}>
              {currentGpa.toFixed(1)}
            </AppText>
          </View>
        ) : null}
      </View>
    </AnimatedItem>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    minWidth: 22,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, lineHeight: 12 },
});
