import React from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
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
  contentPaddingBottom?: number;
}

export const WizardLayout = ({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = 'Next',
  isNextDisabled = false,
  isNextLoading = false,
  contentPaddingBottom = 160,
}: WizardLayoutProps) => {
  const colors = useThemeColors();

  const stepLabels =
    totalSteps <= 3
      ? ['Org', 'Admin', 'Branding']
      : ['Org', 'Admin', 'Branding', 'Roles', 'Widgets', 'Users'].slice(0, totalSteps);

  return (
    <AuthContentShell maxWidth={AUTH_WIZARD_MAX_WIDTH} style={{ flex: 1 }}>
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            {onBack && (
              <PressClay onPress={onBack} style={{ marginRight: 12, padding: 4 }}>
                <Icon name="arrow-back" size={24} color={colors.text} />
              </PressClay>
            )}
            <View style={{ flex: 1 }}>
              <AppText variant="h2">{title}</AppText>
              {subtitle && (
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  {subtitle}
                </AppText>
              )}
            </View>
          </View>

          <StepIndicator currentStep={step} steps={stepLabels} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.body}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <Animated.View
            style={styles.animatedBody}
            entering={FadeInRight.duration(400)}
            exiting={FadeOutLeft.duration(400)}
          >
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              bounces
            >
              <ClayView
                depth={8}
                puffy={0}
                color={colors.card}
                style={{
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  borderWidth: 1,
                  borderColor: colors.border + '30',
                  padding: 24,
                }}
              >
                {children}
              </ClayView>
            </ScrollView>
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
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  animatedBody: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 20,
  },
  scroll: {
    flex: 1,
    ...(Platform.OS === 'web' ? { overflow: 'scroll' as const } : null),
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    elevation: 10,
    zIndex: 10,
  },
});
