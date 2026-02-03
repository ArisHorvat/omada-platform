import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { useThemeColors } from '@/src/hooks';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock = ({ code, language }: CodeBlockProps) => {
  const colors = useThemeColors();

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    // In a real app, trigger your Toast here
    alert('Copied to clipboard!'); 
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <AppText variant="label" style={{ color: colors.subtle }}>{language || 'CODE'}</AppText>
        <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
          <Icon name="content-copy" size={16} color={colors.primary} />
          <AppText variant="label" style={{ color: colors.primary, marginLeft: 4 }}>COPY</AppText>
        </TouchableOpacity>
      </View>
      <View style={styles.body}>
        <AppText style={{ fontFamily: 'monospace', color: colors.text }}>{code}</AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { borderRadius: 8, borderWidth: 1, overflow: 'hidden', marginVertical: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 8, borderBottomWidth: 1, backgroundColor: 'rgba(0,0,0,0.02)' },
  copyBtn: { flexDirection: 'row', alignItems: 'center' },
  body: { padding: 12 },
});