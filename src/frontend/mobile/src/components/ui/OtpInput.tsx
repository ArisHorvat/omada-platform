import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { useThemeColors } from '@/src/hooks';

interface OtpInputProps {
  length?: number;
  onCodeFilled: (code: string) => void;
}

export const OtpInput = ({ length = 4, onCodeFilled }: OtpInputProps) => {
  const colors = useThemeColors();
  const [code, setCode] = useState<string[]>(new Array(length).fill(''));
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input if text is added
    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    // If complete, trigger callback
    if (newCode.every(char => char !== '')) {
      onCodeFilled(newCode.join(''));
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      // If the current box is empty, and we are not on the first box
      if (!code[index] && index > 0) {
        const newCode = [...code];
        
        // --- THE FIX: Clear the PREVIOUS box value ---
        newCode[index - 1] = ''; 
        setCode(newCode);
        
        // Then move focus back
        inputs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={styles.container}>
      {code.map((_, index) => (
        <TextInput
          key={index}
          ref={ref => {inputs.current[index] = ref}}
          style={[
            styles.box, 
            { 
              borderColor: code[index] ? colors.primary : colors.border,
              backgroundColor: colors.card,
              color: colors.text
            }
          ]}
          keyboardType="number-pad"
          maxLength={1}
          value={code[index]}
          onChangeText={text => handleChange(text, index)}
          onKeyPress={e => handleKeyPress(e, index)}
          textAlign="center"
          // Important: Prevents font scaling from breaking layout
          allowFontScaling={false} 
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  box: {
    width: 50,
    height: 60,
    borderWidth: 1.5,
    borderRadius: 12,
    fontSize: 24,
    // Ensure you have this font or change to 'fontWeight: "bold"'
    // fontFamily: 'Inter-Bold', 
    fontWeight: 'bold', 
  },
});