import React from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { AUTH_WIZARD_MAX_WIDTH } from '@/src/constants/layout';
import { useThemeColors } from '@/src/hooks';
import { AppText, AppButton, StepIndicator, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { AuthContentShell } from './AuthContentShell';

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
  
  const stepLabels = ['Org', 'Admin', 'Brand', 'Roles', 'Widgets', 'Users'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthContentShell maxWidth={AUTH_WIZARD_MAX_WIDTH} style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          
          <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  {onBack && (
                      <PressClay onPress={onBack} style={{ marginRight: 12, padding: 4 }}>
                          <Icon name="arrow-back" size={24} color={colors.text} />
                      </PressClay>
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

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            style={{ flex: 1 }}
          >
            <Animated.View 
                style={{ flex: 1, paddingHorizontal: 20 }} 
                entering={FadeInRight.duration(400)} 
                exiting={FadeOutLeft.duration(400)}
            >
                <ClayView
                  depth={8}
                  puffy={0}
                  color={colors.card}
                  style={{
                    flex: 1,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: colors.border + '30',
                    borderBottomWidth: 0,
                  }}
                >
                  <ScrollView
                    contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {children}
                  </ScrollView>
                </ClayView>
            </Animated.View>
          </KeyboardAvoidingView>

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
      </AuthContentShell>
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
