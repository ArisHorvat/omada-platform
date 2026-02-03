import React, { useState } from 'react';
import { View, StyleSheet, TextInputProps, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { AppText } from './AppText';
import { IconInput } from './IconInput';
import { useThemeColors } from '@/src/hooks';
import { IconName } from './Icon'; // Ensure this matches your Icon component export

interface AppFormFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  description?: string;
  error?: string; 
  icon?: IconName; 
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
}

export const AppFormField = ({ 
  label, 
  description, 
  error, 
  secureTextEntry, 
  style,
  inputStyle,
  ...props 
}: AppFormFieldProps) => {
  const colors = useThemeColors();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // If it's a password field, we handle the toggle logic here automatically
  const isPassword = secureTextEntry;
  
  return (
    <View style={[styles.container, style]}>
      {/* 1. Label */}
      {label && (
        <AppText variant="label" style={{ marginBottom: 6, color: colors.text }}>
          {label}
        </AppText>
      )}

      {/* 2. The Input Box (Using your new IconInput) */}
      <IconInput
        {...props}
        style={inputStyle}
        secureTextEntry={isPassword && !isPasswordVisible}
        // Auto-add the eye icon logic if it's a password field
        rightIcon={isPassword ? (isPasswordVisible ? 'visibility' : 'visibility-off') : undefined}
        onRightIconPress={isPassword ? () => setIsPasswordVisible(!isPasswordVisible) : undefined}
        // If there is an error string, flag the input as error
        error={!!error}
      />

      {/* 3. Error Message or Description */}
      {error ? (
        <AppText variant="caption" style={{ color: colors.error, marginTop: 4 }}>
          {error}
        </AppText>
      ) : description ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
          {description}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
});