import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { MaterialIcons } from '@expo/vector-icons';

interface WizardLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
}

export function WizardLayout({ step, totalSteps, title, children, onBack, onNext, nextLabel = 'Next', isNextDisabled = false }: WizardLayoutProps) {
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderColor: colors.border },
    progressContainer: { flexDirection: 'row', marginBottom: 12, gap: 4 },
    progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
    progressActive: { backgroundColor: colors.primary },
    title: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    content: { flex: 1 },
    footer: { padding: 20, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.card, flexDirection: 'row', gap: 12 },
    backButton: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    backText: { fontSize: 16, fontWeight: '600', color: colors.text },
    nextButton: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    nextButtonDisabled: { opacity: 0.5 },
    nextText: { fontSize: 16, fontWeight: 'bold', color: colors.onPrimary },
  }), [colors]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View key={i} style={[styles.progressSegment, i < step && styles.progressActive]} />
          ))}
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          {children}
        </View>


      <View style={styles.footer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.nextButton, isNextDisabled && styles.nextButtonDisabled]} 
            onPress={onNext}
            disabled={isNextDisabled}
          >
            <Text style={styles.nextText}>{nextLabel}</Text>
            <MaterialIcons name="arrow-forward" size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
