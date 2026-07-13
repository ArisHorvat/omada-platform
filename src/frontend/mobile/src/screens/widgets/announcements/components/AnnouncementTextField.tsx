import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleProp, ViewStyle } from 'react-native';

import { ClayView } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { inputTextStyle } from '@/src/styles/typography';

interface AnnouncementTextFieldProps extends Omit<TextInputProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  minHeight?: number;
}

export function AnnouncementTextField({
  style,
  minHeight = 48,
  onFocus,
  onBlur,
  multiline,
  ...props
}: AnnouncementTextFieldProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);

  return (
    <ClayView
      depth={focused ? 6 : 4}
      puffy={0}
      color={colors.card}
      style={[
        {
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 10 : 0,
          borderWidth: focused ? 2 : 1,
          borderColor: focused ? colors.primary : colors.border,
        },
        style,
      ]}
    >
      <TextInput
        style={[
          inputTextStyle(),
          {
            color: colors.text,
            minHeight: multiline ? minHeight : 44,
            maxHeight: multiline ? 160 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
            paddingVertical: multiline ? 4 : 10,
            width: '100%',
          },
        ]}
        placeholderTextColor={colors.subtle}
        multiline={multiline}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />
    </ClayView>
  );
}
