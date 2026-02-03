import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassView, Icon } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';

export const SearchBar = ({ onPress }: { onPress: () => void }) => {
  const colors = useThemeColors();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <GlassView intensity={50} style={[styles.container, { backgroundColor: colors.card + '80', borderColor: colors.border }]}>
        <Icon name="search" size={20} color={colors.subtle} style={styles.icon} />
        <View style={styles.placeholderContainer}>
          <TextInput 
            placeholder="Search apps, grades, people..." 
            placeholderTextColor={colors.subtle}
            style={[styles.input, { color: colors.text }]}
            editable={false} // Make it act like a button that opens a modal
            pointerEvents="none" 
          />
        </View>
        <View style={[styles.kbd, { backgroundColor: colors.border }]}>
          <Icon name="keyboard-command-key" size={12} color={colors.subtle} />
          <Icon name="keyboard" size={12} color={colors.subtle} style={{ marginLeft: 2 }} />
        </View>
      </GlassView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 10,
    borderWidth: 1,
  },
  icon: { marginRight: 10 },
  placeholderContainer: { flex: 1 },
  input: { fontSize: 15, fontFamily: 'Body' },
  kbd: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    opacity: 0.7
  }
});