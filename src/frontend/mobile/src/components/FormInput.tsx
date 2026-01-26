import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/hooks/use-theme-color';

interface FormInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  styles: any;
  description?: string | null;
  placeholderTextColor?: string;
  autoCapitalize?: TextInputProps['autoCapitalize'];
}

export const FormInput = ({ label, placeholder, value, onChangeText, secureTextEntry = false, styles: propStyles, description = null, placeholderTextColor, autoCapitalize }: FormInputProps) => {
  const colors = useThemeColors();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const styles = StyleSheet.create({
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
    },
    input: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    description: { fontSize: 12, color: colors.subtle, marginTop: 4 },
  });

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input} 
          placeholder={placeholder} 
          value={value} 
          onChangeText={onChangeText} 
          secureTextEntry={secureTextEntry && !isPasswordVisible} 
          placeholderTextColor={colors.subtle} 
          autoCapitalize={autoCapitalize}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <MaterialIcons name={isPasswordVisible ? "visibility" : "visibility-off"} size={20} color={colors.subtle} />
          </TouchableOpacity>
        )}
      </View>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
};
