import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useThemeColors } from '@/src/hooks';
import { Icon } from './Icon';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number; // 0-based index
}

export const StepIndicator = ({ steps, currentStep }: StepIndicatorProps) => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isActive = index <= currentStep;
        const isLast = index === steps.length - 1;

        return (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'center', flex: isLast ? 0 : 1 }}>
            {/* Circle */}
            <View style={{ alignItems: 'center' }}>
              <View style={[
                styles.circle, 
                { backgroundColor: isActive ? colors.primary : colors.border }
              ]}>
                {index < currentStep ? (
                  <Icon name="check" size={12} color="#FFF" />
                ) : (
                  <AppText style={{ color: isActive ? '#FFF' : colors.subtle, fontSize: 10 }}>
                    {index + 1}
                  </AppText>
                )}
              </View>
              <AppText variant="caption" style={{ position: 'absolute', top: 24, width: 60, textAlign: 'center' }}>
                {step}
              </AppText>
            </View>

            {/* Line */}
            {!isLast && (
              <View style={[
                styles.line, 
                { backgroundColor: index < currentStep ? colors.primary : colors.border }
              ]} />
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 10 },
  circle: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  line: { flex: 1, height: 2, marginHorizontal: 4 },
});