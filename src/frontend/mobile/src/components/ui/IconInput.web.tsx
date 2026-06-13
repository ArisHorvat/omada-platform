import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  TextStyle,
} from 'react-native';
import { useThemeColors } from '@/src/hooks';
import { inputTextStyle } from '@/src/styles/typography';
import { Icon, IconName } from './Icon';

interface IconInputProps extends Omit<TextInputProps, 'style'> {
  icon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  error?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const IconInput = ({
  icon,
  rightIcon,
  onRightIconPress,
  error,
  style,
  onFocus,
  onBlur,
  ...props
}: IconInputProps) => {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      className="omada-icon-input"
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: error ? colors.error : isFocused ? colors.primary : colors.border,
          borderWidth: isFocused || error ? 2 : 1,
        },
        style,
      ]}
    >
      {icon ? (
        <View style={styles.leftIcon}>
          <Icon name={icon} size={20} color={colors.subtle || '#888'} />
        </View>
      ) : null}

      <TextInput
        className="omada-icon-input__field"
        style={[styles.input, inputTextStyle(), { color: colors.text }, webInputStyle]}
        placeholderTextColor={colors.subtle || '#999'}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />

      {rightIcon ? (
        <TouchableOpacity
          onPress={onRightIconPress}
          style={styles.rightIcon}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Icon name={rightIcon} size={20} color={colors.subtle || '#888'} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const webInputStyle = {
  borderWidth: 0,
  borderColor: 'transparent',
  outlineStyle: 'none',
  outlineWidth: 0,
  backgroundColor: 'transparent',
  boxShadow: 'none',
} as unknown as TextStyle;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 0,
    margin: 0,
  },
  leftIcon: { marginRight: 10 },
  rightIcon: { marginLeft: 10 },
});
