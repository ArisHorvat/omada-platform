import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useThemeColors } from '@/src/hooks';

interface ChipGroupProps {
  options: string[];
  selected: string; // Or string[] if multi-select
  onSelect: (option: string) => void;
}

export const ChipGroup = ({ options, selected, onSelect }: ChipGroupProps) => {
  const colors = useThemeColors();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {options.map((option) => {
        const isActive = selected === option;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onSelect(option)}
            style={[
              styles.chip,
              { 
                backgroundColor: isActive ? colors.primary : colors.card,
                borderColor: isActive ? colors.primary : colors.border,
              }
            ]}
          >
            <AppText 
               variant="label" 
               style={{ color: isActive ? '#FFF' : colors.text }}
            >
              {option}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
});