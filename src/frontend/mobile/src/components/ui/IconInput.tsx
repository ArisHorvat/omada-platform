import React, { useState } from 'react';
import { View, TextInput, TextInputProps, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { useThemeColors } from '@/src/hooks';
import { Icon, IconName } from './Icon';

interface IconInputProps extends Omit<TextInputProps, 'style'> {
  icon?: IconName; // Left icon
  rightIcon?: IconName; // Right icon (e.g. 'close' or 'visibility')
  onRightIconPress?: () => void;
  error?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const IconInput = ({ icon, rightIcon, onRightIconPress, error, style, ...props }: IconInputProps) => {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.card, // Or a slightly lighter/darker background 
        borderColor: error ? 'red' : (isFocused ? colors.primary : colors.border),
      },
      style
    ]}>
      {icon && (
        <View style={styles.leftIcon}>
          <Icon name={icon} size={20} color={colors.subtle || '#888'} />
        </View>
      )}
      
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholderTextColor={colors.subtle || '#999'}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />

      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
          <Icon name={rightIcon} size={20} color={colors.subtle || '#888'} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter-Regular', // Use your custom font
    fontSize: 16,
  },
  leftIcon: { marginRight: 10 },
  rightIcon: { marginLeft: 10 },
});