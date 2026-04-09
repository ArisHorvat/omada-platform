import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon, AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';

interface Props {
  onPress: () => void;
  overlayLabel: string;
}

/** Web: react-native-maps is native-only; show the same tap target with a static preview. */
export function ScheduleMapSnippet({ onPress, overlayLabel }: Props) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.mapWrap}>
      <View style={[styles.mapPlaceholder, { backgroundColor: colors.card + 'CC' }]}>
        <Icon name="map" size={48} color={colors.primary + '55'} />
      </View>
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
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
