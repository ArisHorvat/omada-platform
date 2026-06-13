import React from 'react';
import { StyleProp, TextInputProps, ViewStyle } from 'react-native';
import { AppFormField } from './AppFormField';

/** Admin workspace text field — uses IconInput wrapper so web focus keeps visible text. */
export function AdminTextField({
  containerStyle,
  ...props
}: TextInputProps & { containerStyle?: StyleProp<ViewStyle> }) {
  return <AppFormField {...props} style={containerStyle} inputStyle={{ marginBottom: 0 }} />;
}

/** Compact single-line field without label (e.g. level number). */
export function AdminCompactField({
  style,
  ...props
}: TextInputProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <AppFormField
      {...props}
      style={[{ marginBottom: 0 }, style]}
      inputStyle={{ minHeight: 44 }}
    />
  );
}
