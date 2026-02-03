import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useThemeColors } from '@/src/hooks';
import { AppText, AppButton, StepIndicator, GlassView, Icon } from '@/src/components/ui';

interface WizardLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
}

export const WizardLayout = ({ 
  step, 
  totalSteps, 
  title, 
  subtitle,
  children, 
  onBack, 
  onNext, 
  nextLabel = "Next",
  isNextDisabled = false,
  isNextLoading = false
}: WizardLayoutProps) => {
  const colors = useThemeColors();
  
  // 0-indexed labels
  const stepLabels = ['Org', 'Admin', 'Brand', 'Roles', 'Widgets', 'Users'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        
        {/* 1. Header & Steps (Fixed at Top) */}
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                {onBack && (
                    <TouchableOpacity onPress={onBack} style={{ marginRight: 12, padding: 4 }}>
                        <Icon name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                )}
                <View>
                    <AppText variant="h2">{title}</AppText>
                    {subtitle && <AppText variant="caption" style={{ color: colors.subtle }}>{subtitle}</AppText>}
                </View>
            </View>

            <StepIndicator 
                currentStep={step} 
                steps={stepLabels} 
            />
        </View>

        {/* 2. Main Content (Scrollable & Keyboard Avoiding) */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={{ flex: 1 }}
        >
          <Animated.View 
              style={{ flex: 1, paddingHorizontal: 20 }} 
              entering={FadeInRight.duration(400)} 
              exiting={FadeOutLeft.duration(400)}
          >
              <GlassView intensity={15} style={{ flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.border + '30', borderBottomWidth: 0 }}>
                  <ScrollView 
                      contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                  >
                      {children}
                  </ScrollView>
              </GlassView>
          </Animated.View>
        </KeyboardAvoidingView>

        {/* 3. Footer Area (Fixed at Bottom, Outside KeyboardView) */}
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <AppButton 
                title={nextLabel} 
                onPress={onNext || (() => {})} 
                disabled={isNextDisabled}
                loading={isNextLoading}
                style={{ width: '100%' }}
                size="lg"
            />
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    footer: {
        padding: 20,
        borderTopWidth: 1,
        elevation: 10,
        zIndex: 10,
    }
});