import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  StyleProp, 
  TextStyle,
  View
} from 'react-native';
import { useThemeColors } from '@/src/hooks';
import { Icon, IconName } from './Icon';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;      
  icon?: IconName;        
  rightIcon?: IconName;   
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const AppButton = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false, 
  icon,
  rightIcon,
  style,
  textStyle 
}: AppButtonProps) => {
  const colors = useThemeColors();

  // 1. Base Styles
  const baseStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    opacity: disabled || loading ? 0.6 : 1,
  };

  // 2. Size Variants
  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 12 },
    md: { paddingVertical: 14, paddingHorizontal: 20 },
    lg: { paddingVertical: 18, paddingHorizontal: 24 },
  };

  // 3. Color Variants
  const getVariantStyle = () => {
    switch (variant) {
      case 'outline':
        return { 
          backgroundColor: 'transparent', 
          borderWidth: 1, 
          borderColor: colors.border 
        };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'secondary':
        return { backgroundColor: colors.card };
      case 'danger':
        return { backgroundColor: colors.error };
      case 'primary':
      default:
        return { backgroundColor: colors.primary };
    }
  };

  // 4. Text Color Logic
  const getTextColor = () => {
    if (variant === 'outline' || variant === 'ghost' || variant === 'secondary') {
      return colors.text;
    }
    return '#FFFFFF'; // Primary/Danger usually have white text
  };

  const textColor = getTextColor();
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled || loading} 
      style={[baseStyle, sizeStyles[size], getVariantStyle(), style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {/* Left Icon */}
          {icon && (
            <View style={{ marginRight: 8 }}>
              <Icon name={icon} size={20} color={textColor} />
            </View>
          )}

          <Text style={[{ color: textColor, fontWeight: '600', fontSize }, textStyle]}>
            {title}
          </Text>

          {/* Right Icon (Added for Wizard Layout) */}
          {rightIcon && (
            <View style={{ marginLeft: 8 }}>
              <Icon name={rightIcon} size={20} color={textColor} />
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};