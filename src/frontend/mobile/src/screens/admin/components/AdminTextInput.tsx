import React from 'react';
import { StyleProp, StyleSheet, TextInputProps, ViewStyle } from 'react-native';

import { IconInput } from '@/src/components/ui/IconInput';
import type { IconName } from '@/src/components/ui/Icon';

type Props = Omit<TextInputProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  icon?: IconName;
};

/** Admin text field — same focus border behavior as groups workspace (IconInput / AppFormField). */
export function AdminTextInput({ style, ...props }: Props) {
  return <IconInput {...props} style={[styles.field, style]} />;
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 14,
  },
});
