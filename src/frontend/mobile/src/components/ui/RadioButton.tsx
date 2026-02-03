import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useThemeColors } from '@/src/hooks';

interface RadioButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export const RadioButton = ({ label, selected, onPress }: RadioButtonProps) => {
  const colors = useThemeColors();

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={[
        styles.circle, 
        { borderColor: selected ? colors.primary : colors.subtle }
      ]}>
        {selected && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
      </View>
      <AppText style={{ marginLeft: 10 }}>{label}</AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  circle: {
    height: 20, width: 20, borderRadius: 10, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  dot: { height: 10, width: 10, borderRadius: 5 },
});